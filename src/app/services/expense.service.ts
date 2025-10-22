import { Injectable } from '@angular/core';
import { BehaviorSubject, from, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Expense } from '../models/expense.model';
import { environment } from '../../environments/environments';
import { AuthService } from './auth.service';



export interface ExpenseGroup {
  date: string;
  isCurrentMonth?: boolean;
  items: Expense[];
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {

 public supabase: SupabaseClient;
   constructor(private authService: AuthService) {
     this.supabase = createClient(
      environment.supabaseUrl, environment.supabaseKey
     );
   }
  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  expenses$ = this.expensesSubject.asObservable();

private subscription: any;
  // Fetch all expenses for a user
  fetchExpenses(userId: string): Observable<Expense[]> {
  console.log('Fetching expenses for user:', userId);

  const query = this.supabase
    .from('expense_management')
    .select(`
    id,
    amount,
    description,
    occurred_at,
    category_id,
    payment_method,
    categories!expense_management_category_id_fkey  (id,category_name)
  `)
    .eq('family_id', this.authService.familyId)
    .order('occurred_at', { ascending: false });

  return from(query).pipe(
    map((res: any) => {
      if (res.error) {
        console.error('Error fetching expenses:', res.error);
        return [];
      }
      return (res.data || []).map((e: any) => ({
        ...e,
        category: e.categories?.category_name || 'Unknown'
      }));
    })
  );
}
  // Get grouped expenses by day
  getGroupedExpenses(): Observable<ExpenseGroup[]> {
    console.log('Fetching grouped expenses for user:', this.authService.userId);
    if (!this.authService.userId) {
      throw new Error('No user_id found');
    }
    return this.fetchExpenses(this.authService.userId).pipe(
      map(expenses => {
        const grouped: { [key: string]: Expense[] } = {};
        expenses.forEach(e => {
          
            e.icon = "assets/icons/category/default_category_Icon.png";// + (e.category?.toLowerCase().replace(/\s+/g, '_') || 'default_category_Icon') + ".png";
          const dateKey = new Date(e.occurred_at).toDateString();
          if (!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push(e);
        });
        console.log('Grouped expenses:', grouped);
        return Object.keys(grouped).map(date => {
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
            const expenseDate = new Date(date);
            const todayStr = today.toDateString();
            const yesterdayStr = yesterday.toDateString();
            let label: string;

  if (expenseDate.toDateString() === todayStr) {
    label = 'Today';
  } else if (expenseDate.toDateString() === yesterdayStr) {
    label = 'Yesterday';
  } else {
    label = date;
  }

  return {
    date: label,
    isCurrentMonth: expenseDate.getMonth() === today.getMonth() && expenseDate.getFullYear() === today.getFullYear(),
    items: grouped[date]
  };
});
      })
    );
  }

  // Get remaining amount: sum(amount) logic
  getRemainingAmount(): Observable<any> {
    // return from(this.supabase
    //   .from('remaining_amounts_view')
    //   .select('remaining_amount')
    //   .eq('family_id', this.authService.userId) // adjust filter as per schema
    // ).pipe(
    //   map(res => res.data?.[0]?.remaining_amount ?? 0)
    // );

    return from(
    this.supabase
      .from('current_month_remaining')
      .select('allotted_amount, spent_amount, remaining_amount, grocery_remaining_amount, dining_remaining_amount')
      .eq('family_id', this.authService.familyId)
      .single()
  ).pipe(
    map(res => ({
      totalRemaining: res.data?.remaining_amount ?? 0,
      groceryRemaining: res.data?.grocery_remaining_amount ?? 0,
      diningRemaining: res.data?.dining_remaining_amount ?? 0

    }))
  );
  }

  // Add a new expense
  addExpense(expense: Expense): Observable<Expense> {
      if (!this.authService.familyId) {
      throw new Error('No family_id found');
    }
    if (!this.authService.userId) {
      throw new Error('No user_id found');
    }
    console.log('Adding expense:', { ...expense, user_id: this.authService.userId});
    const insertPromise = this.supabase
    .from('expense_management')
    .insert([
      { 
        ...expense,
        user_id: this.authService.userId,
        family_id: this.authService.familyId
      }
    ])
    .select();

   return from(insertPromise).pipe(
    map((res: any) => {
      if (res.error) {
        console.error('Error inserting expense:', res.error);
        throw res.error;
      }
      return res.data[0]; // first inserted record
    })
  );
  }

  // Update existing expense
  updateExpense(expense: Expense): Observable<Expense> {
  if (!expense.id) throw new Error('Expense ID required for update');
  console.log('Updating expense:', expense);

  return from(
    this.supabase
      .from('expense_management')
      .update(expense)
      .eq('id', expense.id)
      .select()
  ).pipe(
    map((res: any) => {
      if (res.error) {
        console.error('Update failed:', res.error);
        throw res.error;
      }
      return res.data?.[0] || null;
    })
  );
}
  getCategories(): Observable<{ id: string, category_name: string }[]> {
  if (!this.authService.familyId) {
    throw new Error('No family_id found');
  }

  const promise = this.supabase
    .from('categories')
    .select('id, category_name')
    .eq('family_id', this.authService.familyId)
    .eq('category_type', 'expense')
    .eq('status', true);

  return from(promise).pipe(
    map((res: any) => {
      if (res.error) {
        console.error('Supabase error fetching categories:', res.error);
        return [];
      }
      return res.data || [];
    })
  );
}

 // Public method to subscribe to realtime expense changes for current family
  public subscribeToExpenses(callback: (payload: any) => void) {
  const familyId = this.authService.familyId;
  if (!familyId) return null;

  // Remove existing subscription if it exists
  if (this.subscription) {
    this.supabase.removeChannel(this.subscription).catch(() => {
      // Ignore errors
    });
    this.subscription = null;
  }

  // Create new channel subscription
  this.subscription = this.supabase
    .channel(`public:expense_management:family_id=eq.${familyId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'expense_management',
        filter: `family_id=eq.${familyId}`
      },
      payload => {
        console.log('Realtime payload received:', payload);
        callback(payload)
      } 
    )
    .on('system', { event: 'error' }, (err) => console.error('Realtime error:', err))
  .on('system', { event: 'close' }, () => console.warn('Realtime closed'))
      .subscribe((status) => console.log('Subscription status:', status));
      console.log('Subscription status:', this.subscription);

  return this.subscription;
}

    public removeSubscription(channel: any) {
      if (channel) {
        this.supabase.removeChannel(channel);
      }
    }

    deleteExpense(expenseId: string): Observable<any> {
      console.log('Deleting expense with ID:', expenseId);
    return from(
      this.supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
    ).pipe(map(res => res.data));
  }
}
