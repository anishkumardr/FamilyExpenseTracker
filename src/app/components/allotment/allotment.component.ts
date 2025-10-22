import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { AllotmentService } from '../../services/allotment.service';
import { AuthService } from '../../services/auth.service';
import { Allotment } from '../../models/allotment.model';
import { Category } from '../../models/category.model';
import { IncomeService } from '../../services/income.service';
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatDividerModule } from '@angular/material/divider';
import { CategoryAddPopupComponent } from '../category-management/category-add-popup/category-add-popup.component';

interface AllotmentRow {
  id: string;
  category: string;
  amountAllotted: number;
  amountSpent: number;
}


@Component({
  selector: 'app-allotment',
  standalone: true,
  imports: [FormsModule, CommonModule, MatIconModule,MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,NgxMatSelectSearchModule,MatDividerModule,CategoryAddPopupComponent],
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
categoryFilter: string = '';
 allotments: Allotment[] = [];
  categories: Category[] = [];
  loading = false;
  editId: string | null = null;
  tempAmount: number = 0;
  tempAmounts: { [key: string]: number } = {};
  // popup state
   showAddPopup  = false;
   showAddCatagoryPopup = false;
  popupAllotments: { [key: string]: number } = {};
  errorMessage: string = '';
  toastMessage = '';
  toastVisible = false;
  availableIncome = 0;   // total income fetched from DB
  hasAllotmentData = true; // whether any allotment data exists for the month
// --- Add Category Row State ---
showCategoryAddRow = false;
newCategorySearch = '';
filteredCategories: Category[] = [];
selectedCategoryId: string | null = null;

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
console.log('current month'+this.currentMonth + 'current year'+this.currentYear + ': month'+ (new Date().getMonth() + 1));
      this.canEdit = !(this.currentMonth < (new Date().getMonth() + 1) && this.currentYear <= new Date().getFullYear());
      console.log('Can edit allotments:', this.canEdit);
    } catch (err) {
      console.error('Error loading allotments:', err);
    } finally {
      this.loading = false;
    }
  }

   startEdit(allotment: Allotment) {
    console.log('Editing allotment:', allotment);
    this.editId = allotment.category_id;
    this.tempAmount = Number(allotment.amountAllotted) || 0;
    this.tempAmounts[allotment.category_id] = Number(allotment.amountAllotted) || 0;
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
  
 onEditAmountChange(value: number, allotment: Allotment ) {
    this.tempAmounts[allotment.category_id] = value;
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
      if(val.id===''){
        // new allotment added via edit row
        const addedAmount = this.tempAmounts[val.category_id]??val.amountAllotted;
        console.log('Saving added amount for', val.category, '=>', addedAmount);
        const added = await this.allotmentService.addAllotment(
              {
          category_id: val.category_id,
          amountAllotted: addedAmount,
          category: this.getCategoryName(val.category_id),
          category_type: this.categories.find(c => c.id === val.category_id)?.category_type || '',
          month: this.currentMonth,
          year: this.currentYear!
              });
              if(added.id)
              {
                this.showToast('Allotment added');
                this.allotments = this.allotments.map(a => (a.category_id === added.category_id ? added : a));
              }
              
      }
      else
      {
        const updatedAmount = this.tempAmounts[val.category_id];
        console.log('Saving updated amount for', val.category, '=>', updatedAmount);
        val.amountAllotted = updatedAmount;
        const updated = await this.allotmentService.updateAllotment(val.id, val);
        this.allotments = this.allotments.map(a => (a.id === updated.id ? updated : a));
        this.showToast('Allotment updated');
      }
    
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
      this.loadAllotments(this.currentMonth, this.currentYear);
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

toggleAddCategoryRow() {
  this.showCategoryAddRow = !this.showCategoryAddRow;
  if (this.showCategoryAddRow) {
    console.log('toggleAddCategoryRow - Allotments:', this.allotments);
    console.log('toggleAddCategoryRow - Categories:', this.categories);
    this.filteredCategories = this.categories.filter(
      c => !this.allotments.some(a => a.category_id === c.id)
    );
    console.log('toggleAddCategoryRow - filteredCategories:', this.filteredCategories);

  } else {
    this.newCategorySearch = '';
    this.selectedCategoryId = null;
  }
}

filterCategories() {
  const term = this.newCategorySearch.toLowerCase();
  this.filteredCategories = this.categories.filter(
    c =>
      !this.allotments.some(a => a.category_id === c.id) &&
      c.category_name.toLowerCase().includes(term)
  );
}

async addSelectedCategory() {
  if (!this.selectedCategoryId) return;

  const cat = this.categories.find(c => c.id === this.selectedCategoryId);
  if (!cat) return;

  try {
     this.allotments.push( {
      id: '',           // empty id for new entries
      category: cat.category_name,
      category_id: cat.id,
      category_type: cat.category_type,
      amountAllotted:  0,
      amountSpent:  0, // set to 0 if no record
      month: this.currentMonth,
      year: this.currentYear
    });
    // await this.allotmentService.addAllotment(newAllotment);
    // this.loadAllotments(this.currentMonth, this.currentYear);
    this.showToast(`Category "${cat.category_name}" added`);
  } catch (err) {
    console.error('Failed to add category', err);
    this.showToast('Error adding category');
  } finally {
    this.toggleAddCategoryRow();
  }
}

 openAddCategoryPopup() {
    this.showAddCatagoryPopup = true;
  }

  handlePopupClose() {
    this.showAddCatagoryPopup = false;
  }

  async handleCategoryAdded(newCategory: any) {
    this.showAddCatagoryPopup = false;
    await this.loadCategories(); // reload
   
    this.selectedCategoryId = newCategory?.id || null;
  }
}
