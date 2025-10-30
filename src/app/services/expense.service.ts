import { Injectable } from '@angular/core';
import { BehaviorSubject, from, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Expense } from '../models/expense.model';
import { environment } from '../../environments/environments';
import { AuthService } from './auth.service';
import { CategoryService } from './category.service';



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
   constructor(private authService: AuthService,private categoryService:CategoryService) {
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
  async addExpense(expense: Expense): Promise<Expense> {
      if (!this.authService.familyId) {
      throw new Error('No family_id found');
    }
    if (!this.authService.userId) {
      throw new Error('No user_id found');
    }
    console.log('Adding expense:', { ...expense, user_id: this.authService.userId});
    const { data, error }  = await this.supabase
    .from('expense_management')
    .insert([
      { 
        ...expense,
        user_id: this.authService.userId,
        family_id: this.authService.familyId
      }
    ])
    .select();

      if (expense.payment_method?.toLowerCase() === 'cc') {
        this.categoryService.getSingleCategory('Credit Card').then(async (creditCardCategory) => {
          if (creditCardCategory) {
            console.log('Updating credit card allotment for added expense with category:', creditCardCategory);
            await this.updateAllotmentForCategory(this.authService.familyId, creditCardCategory.id, +expense.amount,'Credit Card' ,
              new Date(expense.occurred_at || new Date()).getMonth() + 1,
              new Date(expense.occurred_at || new Date()).getFullYear());
          }
        }).catch(err => {
          console.error('Error fetching Credit Card category:', err);
        });
      }

      if (expense.payment_method?.toLowerCase() === 'credit') {
        this.categoryService.getSingleCategory('Credit').then(async (creditCategory) => {
          if (creditCategory) {
            console.log('Updating credit allotment for added expense with category:', creditCategory);
            await this.updateAllotmentForCategory(this.authService.familyId, creditCategory.id, +expense.amount,'Credit' ,
              new Date(expense.occurred_at || new Date()).getMonth() + 1,
              new Date(expense.occurred_at || new Date()).getFullYear());
          }
        }).catch(err => {
          console.error('Error fetching Credit Card category:', err);
        });
      }

   return data?.[0] as Expense;
  }

  // Update existing expense
 async updateExpense(expense: Expense): Promise<Expense> {
  if (!expense.id) throw new Error('Expense ID required for update');
  console.log('Updating expense:', expense);

  // Fetch existing expense
  const { data: existing, error: fetchErr } = await this.supabase
    .from('expense_management')
    .select('*')
    .eq('id', expense.id)
    .maybeSingle();

  if (fetchErr) {
    console.error('Error fetching existing expense', fetchErr);
    throw fetchErr;
  }

  if (!existing) {
    throw new Error('Existing expense not found');
  }

  // Perform update
  const { data, error: updateErr } = await this.supabase
    .from('expense_management')
    .update({
      category_id: expense.category_id,
      amount: expense.amount,
      payment_method: expense.payment_method,
      description: expense.description,
      // add other fields if needed
    })
    .eq('id', expense.id)
    .select()
    .single();

  if (updateErr) {
    console.error('Error updating expense', updateErr);
    throw updateErr;
  }
console.log('Expense updated:', data);
  // Adjust allotment logic
  const oldMode = existing.payment_method?.toLowerCase();
  const newMode = expense.payment_method?.toLowerCase();

  const oldAmount = existing.amount;
  const newAmount = expense.amount;
console.log('Old payment method:', oldMode, 'New payment method:', newMode);
  try {
    if(oldMode === 'cc'  || newMode === 'cc') {
    
    const creditCardCategory = await this.categoryService.getSingleCategory('Credit Card');
    console.log('Fetched Credit Card category for allotment adjustment:', creditCardCategory);
    if (creditCardCategory) {
      console.log('Payment method changed from', oldMode, 'to', newMode);
      // Credit → Non-credit
      if (oldMode === 'cc' && newMode !== 'cc') {
        console.log('Adjusting allotment for cc → non-cc change');

        await this.updateAllotmentForCategory(
          existing.family_id,
          creditCardCategory.id,
          -existing.amount,
          'Credit Card',
          new Date(expense.occurred_at).getMonth() + 1,
          new Date(expense.occurred_at).getFullYear()
        );
      }

      // Non-credit → Credit
      if (oldMode !== 'cc' && newMode === 'cc') {
        await this.updateAllotmentForCategory(
          this.authService.familyId,
          creditCardCategory.id,
          expense.amount,
          'Credit Card',
          new Date(expense.occurred_at).getMonth() + 1,
          new Date(expense.occurred_at).getFullYear()
        );
      }
      if (oldMode === 'cc' && newMode === 'cc') {
        console.log('Adjusting allotment for cc → cc amount change');
        let updatedamount = newAmount - oldAmount;
        await this.updateAllotmentForCategory(
          this.authService.familyId,
          creditCardCategory.id,
          updatedamount,
          'Credit Card',
          new Date(expense.occurred_at).getMonth() + 1,
          new Date(expense.occurred_at).getFullYear()
        );
      }
    }
    }
    if(oldMode === 'credit' || newMode === 'credit') {
    
    const creditCategory = await this.categoryService.getSingleCategory('Credit');
console.log('Fetched Credit category for allotment adjustment:', creditCategory);
    if (creditCategory) {
      console.log('Payment method changed from', oldMode, 'to', newMode);
      // Credit → Non-credit
      if (oldMode === 'credit' && newMode !== 'credit') {
        console.log('Adjusting allotment for credit → non-credit change');

        await this.updateAllotmentForCategory(
          existing.family_id,
          creditCategory.id,
          -existing.amount,
          'Credit',
          new Date(expense.occurred_at).getMonth() + 1,
          new Date(expense.occurred_at).getFullYear()
        );
      }

      // Non-credit → Credit
      if (oldMode !== 'credit' && newMode === 'credit') {
        await this.updateAllotmentForCategory(
          this.authService.familyId,
          creditCategory.id,
          expense.amount,
          'Credit',
          new Date(expense.occurred_at).getMonth() + 1,
          new Date(expense.occurred_at).getFullYear()
        );
      }
      if (oldMode === 'credit' && newMode === 'credit') {
        console.log('Adjusting allotment for credit → credit amount change');
        let updatedamount = newAmount - oldAmount;
        await this.updateAllotmentForCategory(
          this.authService.familyId,
          creditCategory.id,
          updatedamount,
          'Credit',
          new Date(expense.occurred_at).getMonth() + 1,
          new Date(expense.occurred_at).getFullYear()
        );
      }
    }
  }
  } catch (err) {
    console.error('Error fetching Credit Card category:', err);
  }

  return data as Expense;
}
getCategories(): Observable<{ id: string; category_name: string; category_type: string }[]> {
  if (!this.authService.familyId) {
    throw new Error('No family_id found');
  }

  // Supabase call always returns a Promise<{ data, error }>
  const promise = this.supabase
    .from('categories')
    .select('id, category_name, category_type')
    .eq('family_id', this.authService.familyId)
    .eq('category_type', 'expense')
    .eq('status', true);

  // Convert promise to observable properly
  return from(promise).pipe(
    map((res) => {
      if (res.error) {
        console.error('Supabase error fetching categories:', res.error);
        return [];
      }

      // res.data can be null or an array, so handle safely
      return (res.data ?? []) as { id: string; category_name: string; category_type: string }[];
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

    async deleteExpense(expense: Expense): Promise<any> {
      const { error } = await this.supabase.from('expense_management').delete().eq('id', expense.id);
      if (error) throw error;
console.log('Deleted expense:', expense.id,expense.payment_method);

      if (expense.payment_method?.toLowerCase() === 'credit') {
        console.log('Updating credit card allotment for deleted expense');
         this.categoryService.getSingleCategory('Credit').then(async (creditCardCategory) => {
          if (creditCardCategory) {
            console.log('Updating credit card allotment for deleted expense with category:', creditCardCategory);
            await this.updateAllotmentForCategory(this.authService.familyId, creditCardCategory.id, -expense.amount,'Credit' ,
              new Date(expense.occurred_at || new Date()).getMonth() + 1,
              new Date(expense.occurred_at || new Date()).getFullYear());
          }
        }).catch(err => {
          console.error('Error fetching Credit Card category:', err);
        }
        );
      }

      if (expense.payment_method?.toLowerCase() === 'cc') {
        console.log('Updating credit card allotment for deleted expense');
         this.categoryService.getSingleCategory('Credit Card').then(async (creditCardCategory) => {
          if (creditCardCategory) {
            console.log('Updating credit card allotment for deleted expense with category:', creditCardCategory);
            await this.updateAllotmentForCategory(this.authService.familyId, creditCardCategory.id, -expense.amount,'credit Card',
              new Date(expense.occurred_at || new Date()).getMonth() + 1,
              new Date(expense.occurred_at || new Date()).getFullYear());
          }
        }).catch(err => {
          console.error('Error fetching Credit Card category:', err);
        }
        );
      }
  }

  // utils inside expense.service.ts

/** Computes next month and year from given month/year (1-12 months) */
private nextMonthYear(month: number, year: number): { month: number; year: number } {
  if (month === 12) return { month: 1, year: year + 1 };
  return { month: month + 1, year };
}

private async updateAllotmentForCategory(
  familyId: string,
  creditcardCategoryId : string,
  amountChange: number,
  searchCategoryName: string,
  month: number,
  year: number
): Promise<void> {
  const { month: nextMonth, year: nextYear } = this.nextMonthYear(month, year);
console.log(`Updating ${searchCategoryName} allotment for family ${familyId} for ${nextMonth}/${nextYear} by amount: ${amountChange}`);
  // Fetch existing allotment
  const { data: existing, error: fetchError } = await this.supabase
    .from('allotments')
    .select(`*,categories!inner (
      id,
      category_name,
      category_type
    )`)
    .eq('family_id', familyId)
    .eq('categories.category_type', 'expense')
    .ilike('categories.category_name', searchCategoryName)
    .eq('month', nextMonth)
    .eq('year', nextYear)
    .maybeSingle();
console.log('Existing allotment fetch result:', existing, 'Error:', fetchError);
  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
console.log('Existing allotment fetched for update:', existing);
  if (existing) {
    const newAmount = existing.amount_allotted + amountChange;
console.log('Calculated new allotment amount:', newAmount);
    if (newAmount <= 0) {
      // Remove if fully adjusted
      await this.supabase.from('allotments').delete().eq('id', existing.id);
    } else {
      // Update with new amount
      const {data: updated, error: fetchError} = await this.supabase.from('allotments').update({ amount_allotted: newAmount }).eq('id', existing.id);
      if (fetchError) throw fetchError;
      console.log('Allotment updated:', updated);
    }
  } else if (amountChange > 0) {
    // Create new allotment only for positive values
    await this.supabase.from('allotments').insert({
      family_id: this.authService.familyId,
        category_id: creditcardCategoryId,
        month: nextMonth,
        year: nextYear,
        amount_allotted: amountChange
    });
  }
}

}
