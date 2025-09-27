import { Component, Input } from '@angular/core';
import { ExpenseService, ExpenseGroup } from '../../services/expense.service';
import { Observable } from 'rxjs';
import { ExpensePopupComponent } from "./expense-popup/expense-popup.component";
import { CommonModule } from '@angular/common';
import { Expense } from '../../models/expense.model';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogComponent } from './expense-popup/confirm-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-expense-management',
  standalone: true,
  templateUrl: './expense-management.component.html',
  styleUrls: ['./expense-management.component.scss'],
  imports: [ExpensePopupComponent,CommonModule,FormsModule]
})
export class ExpenseManagementComponent {
  expensesGrouped: ExpenseGroup[] = [];
  remainingAmount: number = 0;
  allottedAmount: number = 0;
  remainingAmountPercent: number = 100;
categories: { id: string, category_name: string }[] = [];
  showPopup = false;
  editingExpense: Expense | null = null;
  currentMonth = new Date().getMonth() + 1;
   private realtimeSubscription: any;
  constructor(private expenseService: ExpenseService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.loadExpenses();
    this.loadRemainingAmount();
    this.expenseService.getCategories().subscribe(cats => {
      console.log('Fetched categories:', cats);
      this.categories = cats;
    });
    // Subscribe via service
    this.realtimeSubscription = this.expenseService.subscribeToExpenses(payload => {
      console.log('Realtime event:', payload);
      this.loadExpenses();
      this.loadRemainingAmount();
    });
  }

  loadExpenses() {
    this.expenseService.getGroupedExpenses().subscribe(groups => {
      this.expensesGrouped = groups;
    });
  }

  loadRemainingAmount() {
    this.expenseService.getRemainingAmount().subscribe(res => {
      this.remainingAmount = res.remaining_amount;
    this.allottedAmount = res.allotted_amount;

    // calculate percentage
    this.remainingAmountPercent = this.allottedAmount
      ? (this.remainingAmount / this.allottedAmount) * 100
      : 100;
    });
  }

  openPopup(expense?: Expense) {
    this.editingExpense = expense || null;
   console.log('Opening popup. Editing expense:', this.editingExpense);
    this.showPopup = true;
  }

  closePopup(refresh: boolean = true) {
    this.showPopup = false;
    this.editingExpense = null;
    if (refresh) {
      this.loadExpenses();
      this.loadRemainingAmount();
    }
  }

  editExpense(expense: Expense) {
    console.log('Editing expense:', expense);
    this.openPopup(expense);
  }
  ngOnDestroy() {
  this.expenseService.removeSubscription(this.realtimeSubscription);
}

onDeleteExpense(expenseId: string) {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    this.expenseService.deleteExpense(expenseId).subscribe({
      next: () => {
        this.loadExpenses();
        this.loadRemainingAmount();
        this.snackBar.open('Expense deleted successfully', 'Close', { duration: 2000 });
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Failed to delete expense', 'Close', { duration: 2000 });
      }
    });
  }
}
