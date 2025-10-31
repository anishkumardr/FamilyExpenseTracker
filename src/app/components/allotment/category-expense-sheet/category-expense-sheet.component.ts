import { Component, Inject, Input, input, OnInit } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { AllotmentService } from '../../../services/allotment.service';
import { CommonModule } from '@angular/common';
import { Expense } from '../../../models/expense.model';

@Component({
  selector: 'app-category-expense-sheet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-expense-sheet.component.html',
  styleUrls: ['./category-expense-sheet.component.scss']
})
export class CategoryExpenseSheetComponent implements OnInit {

  expenses: Expense[] = [];
  totalAllotted = 0;
  totalSpent = 0;
  remaining = 0;
  selectedDate: Date = new Date();

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { categoryId: string, categoryName: string, month : number,year : number, amountAllotted : number, amountSpent :number },
    private _bottomSheetRef: MatBottomSheetRef<CategoryExpenseSheetComponent>,
    private allotmentService: AllotmentService
  ) { }

  ngOnInit(): void {
    this.loadExpenses();
  }

  async loadExpenses() {
    this.selectedDate = new Date(this.data.year, this.data.month - 1, 1);
    console.log('Selected date set to:', this.selectedDate);
    console.log('Loading expenses for category:', this.data.categoryId, 'for date:', new Date(this.data.year, this.data.month - 1));
    this.expenses = await this.allotmentService.getExpensesByCategory(this.data.categoryId, this.data.month,this.data.year);
    this.calculateSummary();
  }

  calculateSummary() {
    this.totalSpent = this.data.amountSpent;
    this.totalAllotted = this.data.amountAllotted; // TODO: Replace with actual allotted value (from API or parent)
    this.remaining = this.totalAllotted - this.totalSpent;
  }

  closeSheet(): void {
    this._bottomSheetRef.dismiss();
  }
}
