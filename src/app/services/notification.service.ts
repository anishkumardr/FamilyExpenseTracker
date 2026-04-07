import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { AllotmentService } from './allotment.service';
import { CategoryService } from './category.service';
import { Expense } from '../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private missingCategories = [
    'Bills',
    'Chittu',
    'Church',
    'Help',
    'Home Loan',
    'Land Loan',
    'Mom',
    'Rent',
    'SSA'
  ];

  private lastDailySummaryKey = 'notification_last_daily_summary';
  private lastWeeklySummaryKey = 'notification_last_weekly_summary';
  private lastMissingReminderKey = 'notification_last_missing_reminder';

  constructor(
    private authService: AuthService,
    private allotmentService: AllotmentService,
    private categoryService: CategoryService
  ) {}

  initNotifications(): void {
    if (!this.isNotificationSupported()) {
      console.warn('Notifications are not supported in this browser.');
      return;
    }

    void this.requestPermission();
    this.scheduleDailySummary();
    this.scheduleWeeklySummary();
    this.scheduleMissingEntryReminder();
    this.runMissedJobs();
  }

  async requestPermission(): Promise<void> {
    if (!this.isNotificationSupported()) return;
    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (err) {
        console.error('Notification permission request failed:', err);
      }
    }
  }

  isNotificationSupported(): boolean {
    return typeof Notification !== 'undefined' && 'Notification' in window;
  }

  isPermissionGranted(): boolean {
    return this.isNotificationSupported() && Notification.permission === 'granted';
  }

  showNotification(title: string, body: string, tag?: string): void {
    if (!this.isPermissionGranted()) {
      return;
    }

    try {
      const options: NotificationOptions = {
        body,
        icon: '/assets/icons/category/default_category_Icon.png',
        tag: tag ?? 'family-expense-tracker'
      };
      new Notification(title, options);
    } catch (err) {
      console.error('Unable to display notification:', err);
    }
  }

  async handleNewExpense(expense: Expense): Promise<void> {
    const userName = this.authService.getUserName();
    const categoryName = await this.resolveCategoryName(expense);
    const amount = expense.amount ?? 0;

    if (categoryName.toLowerCase() === 'dining' || categoryName.toLowerCase() === 'grocery') {
      await this.sendBudgetThresholdAlert(categoryName, amount, userName);
    }

    if (expense.payment_method?.toLowerCase() === 'cc' || expense.payment_method?.toLowerCase() === 'credit') {
      this.showNotification(
        'Credit Card Transaction',
        `${userName} added a Credit Card transaction of ₹${amount}.`,
        'credit-card-transaction'
      );
    }
  }

  private async resolveCategoryName(expense: Expense): Promise<string> {
    if (expense.category && expense.category.trim()) {
      return expense.category.trim();
    }

    if (!expense.category_id) {
      return 'Unknown';
    }

    try {
      const categories = await this.categoryService.getCategories();
      const matched = categories.find(c => c.id === expense.category_id);
      return matched?.category_name ?? 'Unknown';
    } catch (err) {
      console.error('Failed to resolve category name:', err);
      return 'Unknown';
    }
  }

  private async sendBudgetThresholdAlert(categoryName: string, amount: number, userName: string): Promise<void> {
    const lowerName = categoryName.toLowerCase();
    if (lowerName !== 'dining' && lowerName !== 'grocery') {
      return;
    }

    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const allotments = await this.allotmentService.getAllotments(month, year);
      const categoryAllotment = allotments.find(allot => allot.category?.toLowerCase() === lowerName);

      if (!categoryAllotment || categoryAllotment.amountAllotted <= 0) {
        return;
      }

      const percent = Math.round((categoryAllotment.amountSpent / categoryAllotment.amountAllotted) * 100);
      if (percent >= 80) {
        this.showNotification(
          `${categoryName} Budget Alert`,
          `${userName} added a ${categoryName} expense. ${categoryName} is now ${percent}% of its monthly budget.`,
          `${lowerName}-budget-alert`
        );
      }
    } catch (err) {
      console.error('Error sending budget threshold alert:', err);
    }
  }

  private scheduleDailySummary(): void {
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(8, 0, 0, 0);
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const delay = nextRun.getTime() - now.getTime();
    setTimeout(async () => {
      await this.sendDailySummary();
      this.scheduleDailySummary();
    }, delay);
  }

  private scheduleWeeklySummary(): void {
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(20, 0, 0, 0);
    const dayOfWeek = nextRun.getDay();
    const daysUntilSunday = (7 - dayOfWeek) % 7;
    if (daysUntilSunday === 0 && nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 7);
    } else {
      nextRun.setDate(nextRun.getDate() + daysUntilSunday);
    }

    const delay = nextRun.getTime() - now.getTime();
    setTimeout(async () => {
      await this.sendWeeklySummary();
      this.scheduleWeeklySummary();
    }, delay);
  }

  private scheduleMissingEntryReminder(): void {
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(7, 0, 0, 0);
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const delay = nextRun.getTime() - now.getTime();
    setTimeout(async () => {
      await this.sendMissingEntryReminder();
      this.scheduleMissingEntryReminder();
    }, delay);
  }

  private runMissedJobs(): void {
    const now = new Date();
    this.maybeRunDailySummary(now);
    this.maybeRunWeeklySummary(now);
    this.maybeRunMissingEntryReminder(now);
  }

  private maybeRunDailySummary(now: Date): void {
    const lastSent = localStorage.getItem(this.lastDailySummaryKey);
    const today = now.toISOString().split('T')[0];
    const scheduledTime = new Date(now);
    scheduledTime.setHours(8, 0, 0, 0);

    if (now >= scheduledTime && lastSent !== today) {
      void this.sendDailySummary();
    }
  }

  private maybeRunWeeklySummary(now: Date): void {
    const lastSent = localStorage.getItem(this.lastWeeklySummaryKey);
    const today = now.toISOString().split('T')[0];
    const scheduledTime = new Date(now);
    scheduledTime.setHours(20, 0, 0, 0);
    const isSunday = now.getDay() === 0;

    if (isSunday && now >= scheduledTime && lastSent !== today) {
      void this.sendWeeklySummary();
    }
  }

  private maybeRunMissingEntryReminder(now: Date): void {
    const lastSent = localStorage.getItem(this.lastMissingReminderKey);
    const today = now.toISOString().split('T')[0];
    const scheduledTime = new Date(now);
    scheduledTime.setHours(7, 0, 0, 0);

    if (now >= scheduledTime && now.getDate() >= 6 && lastSent !== today) {
      void this.sendMissingEntryReminder();
    }
  }

  private async sendDailySummary(): Promise<void> {
    try {
      const userName = this.authService.getUserName();
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const allotments = await this.allotmentService.getAllotments(month, year);
      const grocery = allotments.find(a => a.category?.toLowerCase() === 'grocery');
      const dining = allotments.find(a => a.category?.toLowerCase() === 'dining');
      const creditCardAmount = await this.fetchCreditCardAmount(month, year);

      const groceryLabel = this.buildSummaryLabel(grocery);
      const diningLabel = this.buildSummaryLabel(dining);
      const creditLabel = `₹${creditCardAmount} (red)`;

      const body = `Daily Summary: Grocery ${groceryLabel}, Dining ${diningLabel}, Credit Card ${creditLabel}.`;
      this.showNotification('Daily Spend Summary', body, 'daily-summary');
      localStorage.setItem(this.lastDailySummaryKey, now.toISOString().split('T')[0]);
    } catch (err) {
      console.error('Failed to send daily summary:', err);
    }
  }

  private async sendWeeklySummary(): Promise<void> {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const allotments = await this.allotmentService.getAllotments(month, year);
      const grocery = allotments.find(a => a.category?.toLowerCase() === 'grocery');
      const dining = allotments.find(a => a.category?.toLowerCase() === 'dining');

      const groceryPercent = this.buildPercentLabel(grocery);
      const diningPercent = this.buildPercentLabel(dining);
      const groceryRemaining = this.buildRemainingLabel(grocery);
      const diningRemaining = this.buildRemainingLabel(dining);

      const body = `Weekly Summary: Dining ${diningPercent}, Grocery ${groceryPercent}. Remaining: Dining ${diningRemaining}, Grocery ${groceryRemaining}.`;
      this.showNotification('Weekly Budget Summary', body, 'weekly-summary');
      localStorage.setItem(this.lastWeeklySummaryKey, now.toISOString().split('T')[0]);
    } catch (err) {
      console.error('Failed to send weekly summary:', err);
    }
  }

  private async sendMissingEntryReminder(): Promise<void> {
    try {
      const now = new Date();
      if (now.getDate() < 6) {
        return;
      }

      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const missing: string[] = [];

      for (const categoryName of this.missingCategories) {
        try {
          const category = await this.categoryService.getSingleCategory(categoryName);
          if (!category?.id) {
            continue;
          }
          const expenses = await this.allotmentService.getExpensesByCategory(category.id, month, year);
          if (!expenses?.length) {
            missing.push(categoryName);
          }
        } catch (categoryError) {
          // If category does not exist, ignore it for now.
        }
      }

      if (missing.length === 0) {
        return;
      }

      const userName = this.authService.getUserName();
      const body = `Reminder: ${userName} missed these transactions for the month: ${missing.join(', ')}.`;
      this.showNotification('Missing Transaction Reminder', body, 'missing-entry-reminder');
      localStorage.setItem(this.lastMissingReminderKey, now.toISOString().split('T')[0]);
    } catch (err) {
      console.error('Failed to send missing entry reminder:', err);
    }
  }

  private buildSummaryLabel(allotment?: { amountAllotted: number; amountSpent: number }): string {
    if (!allotment || allotment.amountAllotted <= 0) {
      return 'No budget set';
    }
    const percent = Math.round((allotment.amountSpent / allotment.amountAllotted) * 100);
    if (percent >= 80) {
      return `${percent}% (red)`;
    }
    return `${percent}%`;
  }

  private buildPercentLabel(allotment?: { amountAllotted: number; amountSpent: number }): string {
    if (!allotment || allotment.amountAllotted <= 0) {
      return 'No budget set';
    }
    const percent = Math.round((allotment.amountSpent / allotment.amountAllotted) * 100);
    return `${percent}%`;
  }

  private buildRemainingLabel(allotment?: { amountAllotted: number; amountSpent: number }): string {
    if (!allotment || allotment.amountAllotted <= 0) {
      return 'N/A';
    }
    const remaining = Math.max(allotment.amountAllotted - allotment.amountSpent, 0);
    const percent = Math.round((remaining / allotment.amountAllotted) * 100);
    return `${percent}%`;
  }

  private async fetchCreditCardAmount(month: number, year: number): Promise<number> {
    try {
      const category = await this.categoryService.getSingleCategory('Credit Card');
      if (!category?.id) {
        return 0;
      }
      const expenses = await this.allotmentService.getExpensesByCategory(category.id, month, year);
      return expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    } catch (err) {
      console.error('Failed to fetch Credit Card amount:', err);
      return 0;
    }
  }
}
