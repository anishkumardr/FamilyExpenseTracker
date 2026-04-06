import { Component, Input, HostListener, ViewChild, ElementRef } from '@angular/core';
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

// Advanced filter interface
interface AdvancedFilter {
  // Date filter
  dateTab: {
    preset: 'all' | 'current-month' | 'last-month' | null;
    customStart: string | null;
    customEnd: string | null;
  };
  // Type filter
  typeTab: {
    expenseTypes: { expense: boolean; saving: boolean };
    categories: string[];
    paymentMethods: string[];
    notesSearch: string;
  };
}

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
  filteredTransactionsGrouped: any[] = []; // Filtered based on advanced filter

  // Actual applied filters
  advancedFilter: AdvancedFilter = {
    dateTab: {
      preset: 'current-month',
      customStart: null,
      customEnd: null
    },
    typeTab: {
      expenseTypes: { expense: true, saving: true },
      categories: [],
      paymentMethods: [],
      notesSearch: ''
    }
  };

  // Working filter state (temporary, before Apply is clicked)
  workingFilter: AdvancedFilter = {
    dateTab: {
      preset: 'current-month',
      customStart: null,
      customEnd: null
    },
    typeTab: {
      expenseTypes: { expense: true, saving: true },
      categories: [],
      paymentMethods: [],
      notesSearch: ''
    }
  };

  activeTab: 'date' | 'type' = 'date';
  showAdvancedFilter = false;
  showCategoryDropdown = false;
  showPaymentDropdown = false;
  selectedPaymentMethod: string | null = null;

  @ViewChild('filterButtonWrapper', { static: false }) filterButtonWrapper?: ElementRef;

  totalRemaining = 0;
  groceryAmount = 0;
  diningAmount = 0;
  allottedAmount: number = 0;
  remainingAmountPercent: number = 100;
  categories: { id: string, category_name: string,category_type : string }[] = [];
  savingsCategories: { id: string, category_name: string }[] = [];
  allCategoryNames: string[] = []; // All unique category names for filter
  showPopup = false;
  editingExpense: Expense | null = null;
  currentMonth = new Date().getMonth() + 1;
   paymentMethods = ['upi', 'credit','cc', 'cash'];
  frequentCategories: any[] = [];
  frequentSavingsCategories: any[] = [];
   private realtimeSubscription: any;
  selectedFilter: 'all' | 'current-month' | 'last-month' = 'current-month';

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Check if click is outside filter wrapper (panel and button)
    if (this.filterButtonWrapper && !this.filterButtonWrapper.nativeElement.contains(target)) {
      // Close filter panel if clicking outside
      if (this.showAdvancedFilter) {
        this.toggleFilterPanel();
      }
    } else {
      // Click is inside filter wrapper - close dropdowns if clicking outside them
      // Check if click is outside category dropdown
      const categoryDropdown = (this.filterButtonWrapper?.nativeElement as HTMLElement)?.querySelector('.dropdown-wrapper:has(.dropdown-list)');
      if (this.showCategoryDropdown && categoryDropdown && !categoryDropdown.contains(target)) {
        this.showCategoryDropdown = false;
      }

      // Check if click is outside payment dropdown
      const paymentDropdowns = (this.filterButtonWrapper?.nativeElement as HTMLElement)?.querySelectorAll('.dropdown-wrapper');
      if (this.showPaymentDropdown && paymentDropdowns) {
        let isOutsidePayment = true;
        paymentDropdowns.forEach((dropdown: any) => {
          if (dropdown.contains(target)) {
            isOutsidePayment = false;
          }
        });
        if (isOutsidePayment) {
          this.showPaymentDropdown = false;
        }
      }
    }
  }

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

    // Extract all unique category names for filter dropdown
    const categorySet = new Set<string>();
    allTransactions.forEach(transaction => {
      if (transaction.category || transaction.category_name) {
        categorySet.add(transaction.category || transaction.category_name);
      }
    });
    this.allCategoryNames = Array.from(categorySet).sort();

    console.log('Merged transactions:', this.transactionsGrouped);

    // Apply advanced filter
    this.applyAdvancedFilter();
  }

  applyAdvancedFilter() {
    const today = new Date();
    const filter = this.advancedFilter;

    // Helper function to check if transaction passes date filter
    const passesDateFilter = (groupDate: string): boolean => {
      const dateObj = new Date(groupDate);
      const dateMonth = dateObj.getMonth();
      const dateYear = dateObj.getFullYear();
      const todayMonth = today.getMonth();
      const todayYear = today.getFullYear();

      // If custom date range is set, use it; otherwise use preset
      if (filter.dateTab.customStart || filter.dateTab.customEnd) {
        // Custom date filter
        let startDate: Date | null = null;
        let endDate: Date | null = null;

        if (filter.dateTab.customStart) {
          startDate = new Date(filter.dateTab.customStart);
          startDate.setHours(0, 0, 0, 0);
        }

        if (filter.dateTab.customEnd) {
          endDate = new Date(filter.dateTab.customEnd);
          endDate.setHours(23, 59, 59, 999);
        } else {
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
        }

        dateObj.setHours(0, 0, 0, 0);

        if (startDate && dateObj < startDate) return false;
        if (endDate && dateObj > endDate) return false;
        return true;
      }

      // Preset filter
      switch (filter.dateTab.preset) {
        case 'current-month':
          return dateMonth === todayMonth && dateYear === todayYear;
        case 'last-month':
          let lastMonthDate = new Date(todayYear, todayMonth - 1, 1);
          if (todayMonth === 0) {
            lastMonthDate = new Date(todayYear - 1, 11, 1);
          }
          const lastMonth = lastMonthDate.getMonth();
          const lastYear = lastMonthDate.getFullYear();
          return dateMonth === lastMonth && dateYear === lastYear;
        case 'all':
        default:
          return true;
      }
    };

    // Helper function to check if transaction passes type filter
    const passesTypeFilter = (transaction: any): boolean => {
      // Check expense type filter
      if (transaction.type === 'expense' && !filter.typeTab.expenseTypes.expense) return false;
      if (transaction.type === 'saving' && !filter.typeTab.expenseTypes.saving) return false;

      // Check category filter (only if categories are selected)
      if (filter.typeTab.categories.length > 0) {
        const txCategory = transaction.category || transaction.category_name;
        if (!filter.typeTab.categories.includes(txCategory)) return false;
      }

      // Check payment method filter (only if methods are selected)
      if (filter.typeTab.paymentMethods.length > 0) {
        if (!filter.typeTab.paymentMethods.includes(transaction.payment_method)) return false;
      }

      // Check notes search filter (case-insensitive contains)
      if (filter.typeTab.notesSearch.trim()) {
        const description = (transaction.description || '').toLowerCase();
        const searchTerm = filter.typeTab.notesSearch.toLowerCase();
        if (!description.includes(searchTerm)) return false;
      }

      return true;
    };

    // Apply filters to all transactions
    this.filteredTransactionsGrouped = this.transactionsGrouped
      .map(group => ({
        ...group,
        items: group.items.filter((transaction: any) => passesDateFilter(group.date) && passesTypeFilter(transaction))
      }))
      .filter(group => group.items.length > 0); // Remove empty groups

    console.log('Filtered transactions:', this.filteredTransactionsGrouped);
  }

  applyFilter() {
    // Legacy method - kept for backwards compatibility
    this.applyAdvancedFilter();
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
      this.loadSavings();
      this.loadRemainingAmount();
    }
  }

  editExpense(expense: Expense) {
    console.log('Editing expense:', expense);
    this.openPopup(expense);
  }

  // Advanced filter methods
  toggleFilterPanel() {
    if (this.showAdvancedFilter) {
      // Reset working to applied when closing
      this.workingFilter = JSON.parse(JSON.stringify(this.advancedFilter));
    } else {
      // When opening, sync working with applied
      this.workingFilter = JSON.parse(JSON.stringify(this.advancedFilter));
      this.updateSelectedPaymentMethod();
    }
    this.showAdvancedFilter = !this.showAdvancedFilter;
    this.showCategoryDropdown = false;
    this.showPaymentDropdown = false;
  }

  switchTab(tab: 'date' | 'type') {
    this.activeTab = tab;
  }

  selectDatePreset(preset: 'all' | 'current-month' | 'last-month') {
    this.workingFilter.dateTab.preset = preset;
    this.workingFilter.dateTab.customStart = null;
    this.workingFilter.dateTab.customEnd = null;
  }

  setCustomDates(startDate: string, endDate: string) {
    this.workingFilter.dateTab.customStart = startDate || null;
    this.workingFilter.dateTab.customEnd = endDate || null;
    this.workingFilter.dateTab.preset = null;
  }

  toggleExpenseType(type: 'expense' | 'saving') {
    this.workingFilter.typeTab.expenseTypes[type] = !this.workingFilter.typeTab.expenseTypes[type];
  }

  toggleCategory(category: string) {
    const index = this.workingFilter.typeTab.categories.indexOf(category);
    if (index > -1) {
      this.workingFilter.typeTab.categories.splice(index, 1);
    } else {
      this.workingFilter.typeTab.categories.push(category);
    }
  }

  togglePaymentMethod(method: string) {
    // Single select for payment method
    if (this.workingFilter.typeTab.paymentMethods.includes(method)) {
      this.workingFilter.typeTab.paymentMethods = [];
    } else {
      this.workingFilter.typeTab.paymentMethods = [method];
    }
    this.updateSelectedPaymentMethod();
    // Close dropdown after selection
    this.showPaymentDropdown = false;
  }

  updateSelectedPaymentMethod() {
    this.selectedPaymentMethod = this.workingFilter.typeTab.paymentMethods.length > 0
      ? this.workingFilter.typeTab.paymentMethods[0]
      : null;
  }

  updateNotesSearch(search: string) {
    this.workingFilter.typeTab.notesSearch = search;
  }

  // Apply filters and close panel
  applyFilters() {
    this.advancedFilter = JSON.parse(JSON.stringify(this.workingFilter));
    this.applyAdvancedFilter();
    this.closeFilterPanel();
  }

  // Reset filters and apply defaults
  resetFilter() {
    this.workingFilter = {
      dateTab: {
        preset: 'all',
        customStart: null,
        customEnd: null
      },
      typeTab: {
        expenseTypes: { expense: true, saving: true },
        categories: [],
        paymentMethods: [],
        notesSearch: ''
      }
    };
    this.advancedFilter = JSON.parse(JSON.stringify(this.workingFilter));
    this.applyAdvancedFilter();
    this.closeFilterPanel();
  }

  // Close filter panel
  closeFilterPanel() {
    this.showAdvancedFilter = false;
    this.showCategoryDropdown = false;
    this.showPaymentDropdown = false;
  }

  getHeaderText(): string {
    const filter = this.advancedFilter;

    // Check if any filters are applied
    const hasDateFilter = filter.dateTab.preset !== 'all' || filter.dateTab.customStart || filter.dateTab.customEnd;
    const hasTypeFilter = !filter.typeTab.expenseTypes.expense || !filter.typeTab.expenseTypes.saving ||
                          filter.typeTab.categories.length > 0 || filter.typeTab.paymentMethods.length > 0 ||
                          filter.typeTab.notesSearch.trim() !== '';

    if (!hasDateFilter && !hasTypeFilter) {
      return 'All Transactions';
    }

    let headerParts: string[] = [];

    if (filter.dateTab.preset === 'current-month') {
      headerParts.push('Current Month');
    } else if (filter.dateTab.preset === 'last-month') {
      headerParts.push('Last Month');
    } else if (filter.dateTab.customStart || filter.dateTab.customEnd) {
      headerParts.push('Custom Date Range');
    }

    if (hasTypeFilter) {
      headerParts.push('Filtered');
    }

    return headerParts.length > 0 ? headerParts.join(' - ') : 'All Transactions';
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
