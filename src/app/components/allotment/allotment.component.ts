import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { AllotmentService } from '../../services/allotment.service';
import { AuthService } from '../../services/auth.service';
import { Allotment } from '../../models/allotment.model';
import { Category } from '../../models/category.model';
import { IncomeService } from '../../services/income.service';
import { MatIconModule } from "@angular/material/icon";


interface AllotmentRow {
  id: string;
  category: string;
  amountAllotted: number;
  amountSpent: number;
}


@Component({
  selector: 'app-allotment',
  standalone: true,
  imports: [FormsModule, CommonModule, MatIconModule],
  templateUrl: './allotment.component.html',
  styleUrls: ['./allotment.component.scss']
})
export class AllotmentComponent {
  currentMonth = new Date().getMonth() + 1; // 1-12
  currentYear = new Date().getFullYear();
  canEdit = true;
  currentMonthShortName = this.getMonthShortName(this.currentMonth);
  hasPrev = true;
  hasNext = true;

 allotments: Allotment[] = [];
  categories: Category[] = [];
  loading = false;
  editId: string | null = null;
  tempAmount: number = 0;
  // popup state
   showAddPopup  = false;
  popupAllotments: { [key: string]: number } = {};
  errorMessage: string = '';
  toastMessage = '';
  toastVisible = false;
  availableIncome = 0;   // total income fetched from DB
  hasAllotmentData = true; // whether any allotment data exists for the month

  addForm = new FormGroup({
    category_id: new FormControl<string | null>(null, Validators.required),
    amountAllotted: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    month: new FormControl<number | null>(null, Validators.required),
    year: new FormControl<number | null>(null, Validators.required)
  });
  
 constructor(private allotmentService: AllotmentService, private incomeService : IncomeService,private authService: AuthService) {}

  ngOnInit() {
     this.loadCategories();
    this.loadAllotments(this.currentMonth, this.currentYear);
  }
  get familyId ()
  {
    return this.authService.familyId; 
  }
  

   async loadCategories() {
    try {
      this.categories = await this.allotmentService.getCategories();
      console.log('Categories loaded:', this.categories);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }
  goPrev() {
    console.log('Go to previous month'+this.currentMonth, this.currentYear);
  if (this.currentMonth === 1) {
    this.currentMonth = 12;
    this.currentYear--;
  } else {
    this.currentMonth--;
  }
  this.currentMonthShortName = this.getMonthShortName(this.currentMonth);
  console.log('test'+this.currentMonthShortName);
  console.log('New month/year:', this.currentMonth, this.currentYear);
  this.loadAllotments(this.currentMonth, this.currentYear);
  
}
goNext() {
  console.log('Go to next month'+this.currentMonth, this.currentYear);
  if (this.currentMonth === 12) {
    this.currentMonth = 1;
    this.currentYear++;
  } else {
    this.currentMonth++;
  }
  this.currentMonthShortName = this.getMonthShortName(this.currentMonth);
  console.log('New month/year:', this.currentMonth, this.currentYear);
  this.loadAllotments(this.currentMonth, this.currentYear);
}

  /** Load allotments */
  async loadAllotments(month?: number, year?: number) {
    console.log('Loading allotments for', month, year);
    this.loading = true;
    try {
      this.availableIncome = await this.incomeService.getTotalIncome(month!, year!);
      console.log('Available income for', month, year, ':', this.availableIncome);
      const now = new Date();
      this.allotments = await this.allotmentService.getAllotments(
        month ?? now.getMonth() + 1,
        year ?? now.getFullYear()
      );

      this.canEdit = !(this.currentMonth < (new Date().getMonth() + 1) && this.currentYear <= new Date().getFullYear());
      
    } catch (err) {
      console.error('Error loading allotments:', err);
    } finally {
      this.loading = false;
    }
  }

   startEdit(allotment: Allotment) {
    console.log('Editing allotment:', allotment);
    this.editId = allotment.id;
    this.tempAmount = Number(allotment.amountAllotted) || 0;
    // this.addForm.setValue({
    //   category_id: allotment.category_id,
    //   amountAllotted: allotment.amountAllotted,
    //   // tempAmount : allotment.amountAllotted,
    //   month: allotment.month,
    //   year: allotment.year
    // });
    this.showAddPopup = false;
  }
  isAllowedToEdit() {
    return this.canEdit && this.editId !== null;
  }
  get totalAllottedExisting(): number {
    return this.allotments.reduce((s, a) => s + (Number(a.amountAllotted) || 0), 0);
  }

  /** popup total (what user typed in add popup) */
  get popupTotal(): number {
    return Object.values(this.popupAllotments).reduce((s, v) => s + (Number(v) || 0), 0);
  }
   get remainingIncome(): number {
    if (this.editId) {
      const sumExclEdited = this.allotments
        .filter(a => a.id !== this.editId)
        .reduce((s, a) => s + (Number(a.amountAllotted) || 0), 0);
      return this.availableIncome - (sumExclEdited + (Number(this.tempAmount) || 0));
    } else if (this.showAddPopup) {
      return (this.availableIncome - this.totalAllotted) - this.popupTotal;
    } else {
      return this.availableIncome - this.totalAllottedExisting;
    }
  }
  
 onEditAmountChange(value: number | string) {
    this.tempAmount = Number(value) || 0;
    // remainingIncome getter will reflect this automatically
  }
  async saveEdit(val: Allotment) {
    console.log('Save edit called with:',this.addForm, val,this.editId,this.tempAmount);
    if (!this.editId) return;
console.log('Saving edit for allotment:', this.editId, val);
    try {

      if (this.remainingIncome < 0) {
      this.errorMessage = `Allotments exceed available income (Remaining: ₹${this.remainingIncome})`;
      return;
    }
    val.amountAllotted = this.tempAmount;
      const updated = await this.allotmentService.updateAllotment(this.editId, val);
      this.allotments = this.allotments.map(a => (a.id === updated.id ? updated : a));
      this.showToast('Allotment updated');
    } catch (err: any) {
      console.error('Update failed', err);
      this.showToast(err.message || 'Failed to update allotment');
    } finally {
      this.editId = null;
      this.showAddPopup = false;
      this.addForm.reset();
    }
  }

   cancelEdit() {
    this.editId = null;
    this.showAddPopup = false;
    this.addForm.reset();
  }
  get totalSpent() {
    return this.allotments.reduce((acc, x) => acc + x.amountSpent, 0);
  }

  get totalAllotted() {
    return this.allotments.reduce((acc, x) => acc + x.amountAllotted, 0);
  }

  async openPopup() {
    this.addForm.reset({});
    this.showAddPopup = true;

    try {
    // fetch available income for selected month/year
    this.availableIncome = await this.incomeService.getTotalIncome(this.currentMonth, this.currentYear!);

    //this.remainingIncome = this.availableIncome;
    console.log('Available income for', this.currentMonth, this.currentYear, ':', this.remainingIncome, this.availableIncome);

  } catch (err) {
    console.error('Error fetching income', err);
    this.availableIncome = 0;
    //this.remainingIncome = 0;
  }
  }
onAllotmentChange() {
  if (this.remainingIncome < 0) {
      this.errorMessage = `Allotment exceeds income limit (₹${this.availableIncome})`;
    } else {
      this.errorMessage = '';
    }
}
  closePopup() {
    this.showAddPopup = false;
    this.errorMessage = '';
  }

   async addAllotment() {

     const totalIncome = await this.incomeService.getTotalIncome(this.currentMonth, this.currentYear!);

    // 2️⃣ Calculate total entered in popup
    const total = Object.values(this.popupAllotments).reduce((a, b) => a + (b || 0), 0);

    // 3️⃣ Validate
    if (total > totalIncome) {
      this.errorMessage = `Allotment exceeds income limit (₹${totalIncome})`;
      return;
    }
console.log('Popup allotments to add:', this.popupAllotments);
    try {
      for (const catId of Object.keys(this.popupAllotments)) {
        const amt = this.popupAllotments[catId];
        if (amt && amt > 0) {
          await this.allotmentService.addAllotment(
            {
        category_id: catId,
        amountAllotted: amt,
        category: this.getCategoryName(catId),
        category_type: this.categories.find(c => c.id === catId)?.category_type || '',
        month: this.currentMonth,
        year: this.currentYear!
            });
        }
      }
      this.loadAllotments();
      this.closePopup();
    } catch(err) {
      console.error(err);
      this.errorMessage = 'Error saving allotments';
    }
  }
  getCategoryName(id: string) {
    return this.categories.find(c => c.id === id)?.category_name || '';
  }

  /** Toast helper */
  showToast(msg: string) {
    this.toastMessage = msg;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 2000);
  }

  getProgress(allotment: Allotment): number {
    if (!allotment.amountAllotted) return 0;
    return Math.min((allotment.amountSpent / allotment.amountAllotted) * 100, 100);
  }

  getMonthShortName(monthNumber: number, locale: string = 'en-US'): string {
  // Month numbers in JavaScript Date objects are 0-indexed (0-11)
  // So, subtract 1 from the input monthNumber.
  const date = new Date(2000, monthNumber - 1, 1); // Use any year and day
  return date.toLocaleString(locale, { month: 'short' });
}
}
