import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private defaultConfig: MatSnackBarConfig = {
    duration: 3000, // 3 seconds for success messages
    horizontalPosition: 'center',
    verticalPosition: 'bottom',
    panelClass: ['custom-toast']
  };

  constructor(private snackBar: MatSnackBar) {}

  showSuccess(message: string, duration: number = 3000) {
    const config = { ...this.defaultConfig, duration, panelClass: ['custom-toast', 'success-toast'] };
    this.snackBar.open(message, '✕', config);
  }

  showError(message: string) {
    const config = { ...this.defaultConfig, duration: 0, panelClass: ['custom-toast', 'error-toast'] };
    this.snackBar.open(message, '✕', config);
  }

  showInfo(message: string, duration: number = 3000) {
    const config = { ...this.defaultConfig, duration, panelClass: ['custom-toast', 'info-toast'] };
    this.snackBar.open(message, '✕', config);
  }

  showWarning(message: string, duration: number = 4000) {
    const config = { ...this.defaultConfig, duration, panelClass: ['custom-toast', 'warning-toast'] };
    this.snackBar.open(message, '✕', config);
  }

  // Specific methods for expense operations
  expenseAdded() {
    this.showSuccess('Expense added successfully!');
  }

  expenseUpdated() {
    this.showSuccess('Expense updated successfully!');
  }

  expenseDeleted() {
    this.showSuccess('Expense deleted successfully!');
  }

  expenseError(message: string = 'Failed to save expense. Please try again.') {
    this.showError(message);
  }

  // Specific methods for savings operations
  savingsAdded() {
    this.showSuccess('Savings added successfully!');
  }

  savingsUpdated() {
    this.showSuccess('Savings updated successfully!');
  }

  savingsDeleted() {
    this.showSuccess('Savings deleted successfully!');
  }

  savingsError(message: string = 'Failed to save savings. Please try again.') {
    this.showError(message);
  }

  // Generic validation error
  validationError(message: string) {
    this.showError(message);
  }
}