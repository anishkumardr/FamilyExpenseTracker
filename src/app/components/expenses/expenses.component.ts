import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { supabase } from '../../supabase.client';
import { Subscription } from 'rxjs';
import { AddExpenseComponent } from './add-expense/add-expense.component';
import { SupabaseService } from '../../services/supabase.service';
import { FormsModule } from '@angular/forms';

interface Expense {
  id: string;
  user_id: string;
  family_id: string;
  amount: number;
  currency: string;
  occurred_at: string;
  category: string;
  merchant: string;
  description: string;
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule,AddExpenseComponent,FormsModule],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit, OnDestroy {
  expenses: Expense[] = [];
  private subscription: any;
  private profile: any;
  editingExpense: any = null; // holds expense being edited

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {

    try {
      console.log('Fetching user profile in ExpensesComponent...');
      this.profile = await this.supabaseService.getAppUserProfile();
      if (!this.profile) {
        console.warn('Profile not found. Make sure user is logged in.');
      } else {
        // initial load
        console.log('Check from expense NgOnInit User profile:', this.profile);
        this.expenses = await this.supabaseService.getExpensesForFamily(this.profile.family_id);
      }
    } catch (err) {
      console.error('Failed to load initial expenses', err);
    }
   

// 2. Start realtime subscription
    this.startSubscription();
   
  }
  startSubscription() {
    // make sure any previous subscription removed
    if (this.subscription) {
      try {
        supabase.removeChannel(this.subscription);
      } catch (e) { /* ignore */ }
    }
    console.log('list of expense0:', this.expenses);
     // 2. Subscribe to realtime updates
    this.subscription = supabase
      .channel('expenses')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        (payload) => {
          console.log('Realtime update:', payload);

          if (payload.eventType === 'INSERT') {
            this.expenses.unshift(payload.new as Expense);
            console.log('list of expense:', this.expenses);
          } else if (payload.eventType === 'UPDATE') {
              this.expenses = this.expenses.map(exp =>
                exp.id === (payload.new as any)['id'] ? (payload.new as Expense) : exp
              );
            }
             else if (payload.eventType === 'DELETE') {
                const index = this.expenses.findIndex(exp => exp['id'] === payload.old['id']);
                if (index > -1) {
                  this.expenses.splice(index, 1);
                }
              }

            }
      ).on('system', { event: 'error' }, (err) => console.error('Realtime error:', err))
  .on('system', { event: 'close' }, () => console.warn('Realtime closed'))
      .subscribe((status) => console.log('Subscription status:', status));
      console.log('Subscription status:', this.subscription);

  }
// called when AddExpenseComponent emits `added`
  onExpenseAdded(expense: Expense) {
    // If realtime already pushes the new row, this will create a duplicate.
    // To avoid duplicates we can check if the id exists first:
    const exists = this.expenses.some(e => e.id === expense.id);
    //if (!exists) this.expenses.unshift(expense);
  }
startEdit(expense: any) {
    this.editingExpense = { ...expense }; // copy for editing
    console.log('Editing expense:', this.editingExpense);
  }

  cancelEdit() {
    this.editingExpense = null;
  }
async saveEdit() {
    if (this.editingExpense) {
      await this.supabaseService.updateExpense(this.editingExpense.id, {
        category: this.editingExpense.category,
        merchant: this.editingExpense.merchant,
        description: this.editingExpense.description,
        amount: this.editingExpense.amount
      });
      this.editingExpense = null;
      //await this.loadExpenses();
    }
  }
  async editExpense(expense: any) {
  const updated = { 
    ...expense, 
    description: prompt("Update description", expense.description) || expense.description 
  };

  const { data, error } = await this.supabaseService.updateExpense(expense.id, updated);

  if (error) {
    console.error("Update failed:", error);
  } else {
    console.log("Expense updated:", data);
  }
}

async deleteExpense(expenseId: string) {
  if (!confirm("Are you sure you want to delete this expense?")) return;

  const { error } = await this.supabaseService.deleteExpense(expenseId);

  if (error) {
    console.error("Delete failed:", error);
  } else {
    console.log("Expense deleted:", expenseId);
  }
}
  ngOnDestroy() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
    }
  }
}
