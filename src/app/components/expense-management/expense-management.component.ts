import { Component, Input } from '@angular/core';
import { ExpenseService, ExpenseGroup } from '../../services/expense.service';
import { SavingService } from '../../services/savings.service';
import { Observable } from 'rxjs';
import { ExpensePopupComponent } from "./expense-popup/expense-popup.component";
import { CommonModule } from '@angular/common';
import { Expense } from '../../models/expense.model';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogComponent } from './expense-popup/confirm-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FrequencyService } from '../../services/frequency.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-expense-management',
  standalone: true,
  templateUrl: './expense-management.component.html',
  styleUrls: ['./expense-management.component.scss'],
  imports: [ExpensePopupComponent,CommonModule,FormsModule,MatMenuModule,MatButtonModule]
})
export class ExpenseManagementComponent {
  expensesGrouped: ExpenseGroup[] = [];
  savingsGrouped: any[] = []; // Store savings separately
  transactionsGrouped: any[] = []; // Merged expenses and savings (all)
  filteredTransactionsGrouped: any[] = []; // Filtered based on selected filter

  totalRemaining = 0;
  groceryAmount = 0;
  diningAmount = 0;
  allottedAmount: number = 0;
  remainingAmountPercent: number = 100;
  categories: { id: string, category_name: string,category_type : string }[] = [];
  savingsCategories: { id: string, category_name: string }[] = [];
  showPopup = false;
  editingExpense: Expense | null = null;
  currentMonth = new Date().getMonth() + 1;
   paymentMethods = ['upi', 'credit','cc', 'cash'];
  frequentCategories: any[] = [];
  frequentSavingsCategories: any[] = [];
   private realtimeSubscription: any;
  selectedFilter: 'all' | 'current-month' | 'last-month' = 'all';
  constructor(
    private expenseService: ExpenseService,
    private frequencyService: FrequencyService,
    private savingService: SavingService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadExpenses();
    this.loadSavings();
    this.loadRemainingAmount();
    this.loadFrequentData();
    this.expenseService.getCategories().subscribe(cats => {
      console.log('Fetched categories:', cats);
      this.categories = cats;

    });
    this.savingService.getCategories().subscribe(saveCats => {
      console.log('Fetched savings categories:', saveCats);
      this.savingsCategories = saveCats;
    });
    // Subscribe via service
    this.realtimeSubscription = this.expenseService.subscribeToExpenses(payload => {
      console.log('Realtime event:', payload);
      this.loadExpenses();
      this.loadSavings();
      this.loadRemainingAmount();
      this.loadFrequentData();
    });

  }

  async loadFrequentData() {
    this.frequentCategories = await this.frequencyService.getFrequentCategories(3);
    console.log('Frequent categories loaded:', this.frequentCategories);
  }

  loadExpenses() {
    this.expenseService.getGroupedExpenses().subscribe(groups => {
      this.expensesGrouped = groups;
      this.mergeTransactions();
    });
  }

  loadSavings() {
    this.savingService.getGroupedSavings().subscribe((savingsGrouped: any) => {
      console.log('Savings grouped:', savingsGrouped);
      this.savingsGrouped = savingsGrouped;
      this.mergeTransactions();
    });
  }

  mergeTransactions() {
    // Merge expenses and savings, then sort by date (latest first)
    const allTransactions: any[] = [];

    // Add expenses
    if (this.expensesGrouped) {
      this.expensesGrouped.forEach(group => {
        group.items?.forEach((expense: any) => {
          allTransactions.push({
            ...expense,
            type: 'expense',
            date: group.date,
            isCurrentMonth: group.isCurrentMonth
          });
        });
      });
    }

    // Add savings
    if (this.savingsGrouped) {
      this.savingsGrouped.forEach(group => {
        group.items?.forEach((saving: any) => {
          allTransactions.push({
            ...saving,
            type: 'saving',
            date: group.date,
            amount: saving.amount, // Already in correct format
            category: saving.category_name,
            description: saving.comments,
            isCurrentMonth: group.isCurrentMonth
          });
        });
      });
    }

    // Group by date
    const groupedByDate: { [key: string]: any[] } = {};
    allTransactions.forEach(transaction => {
      if (!groupedByDate[transaction.date]) {
        groupedByDate[transaction.date] = [];
      }
      groupedByDate[transaction.date].push(transaction);
    });

    // Convert to array and sort by date (latest first)
    this.transactionsGrouped = Object.keys(groupedByDate)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(date => ({
        date: date,
        items: groupedByDate[date],
        isCurrentMonth: groupedByDate[date][0]?.isCurrentMonth || false
      }));

    console.log('Merged transactions:', this.transactionsGrouped);

    // Apply filter
    this.applyFilter();
  }

  applyFilter() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Calculate last month
    let lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    if (currentMonth === 0) {
      lastMonthDate = new Date(currentYear - 1, 11, 1);
    }
    const lastMonth = lastMonthDate.getMonth();
    const lastYear = lastMonthDate.getFullYear();

    this.filteredTransactionsGrouped = this.transactionsGrouped.filter(group => {
      const groupDate = new Date(group.date);
      const groupMonth = groupDate.getMonth();
      const groupYear = groupDate.getFullYear();

      switch (this.selectedFilter) {
        case 'current-month':
          return groupMonth === currentMonth && groupYear === currentYear;
        case 'last-month':
          return groupMonth === lastMonth && groupYear === lastYear;
        case 'all':
        default:
          return true;
      }
    });

    console.log('Filtered transactions for filter:', this.selectedFilter, this.filteredTransactionsGrouped);
  }

  loadRemainingAmount() {
    this.expenseService.getRemainingAmount().subscribe(res => {
      this.totalRemaining = res.totalRemaining;
      this.groceryAmount = res.groceryRemaining;
      this.diningAmount = res.diningRemaining;
    this.allottedAmount = res.allotted_amount;

    // calculate percentage
    this.remainingAmountPercent = this.allottedAmount
      ? (this.totalRemaining / this.allottedAmount) * 100
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

  selectFilter(filter: 'all' | 'current-month' | 'last-month') {
    this.selectedFilter = filter;
    this.applyFilter();
  }

  getHeaderText(): string {
    switch (this.selectedFilter) {
      case 'current-month':
        return 'Current Month';
      case 'last-month':
        return 'Last Month';
      default:
        return 'All Transactions';
    }
  }

  async onDeleteTransaction(transaction: any) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      console.log('Deleting transaction:', transaction);
      if (transaction.type === 'expense') {
        await this.expenseService.deleteExpense(transaction);
      } else {
        await this.savingService.deleteSaving(transaction.id).toPromise();
      }

      // Refresh data after delete
      await this.loadExpenses();
      await this.loadSavings();
      await this.loadRemainingAmount();

      this.snackBar.open('Transaction deleted successfully', 'Close', { duration: 2000 });
    } catch (err) {
      console.error('Delete failed:', err);
      this.snackBar.open('Failed to delete transaction', 'Close', { duration: 2000 });
    }
  }
}
