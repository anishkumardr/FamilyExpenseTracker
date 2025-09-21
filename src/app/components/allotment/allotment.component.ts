import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { AllotmentService } from '../../services/allotment.service';
import { AuthService } from '../../services/auth.service';
import { Allotment } from '../../models/allotment.model';
import { Category } from '../../models/category.model';

interface AllotmentRow {
  id: string;
  category: string;
  amountAllotted: number;
  amountSpent: number;
}


@Component({
  selector: 'app-allotment',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './allotment.component.html',
  styleUrls: ['./allotment.component.scss']
})
export class AllotmentComponent {
  month = new Date().getMonth() + 1;
  currentMonthShortName = new Date().toLocaleString('default', { month: 'short' });
  year = 2025;
  hasPrev = true;
  hasNext = false;

 allotments: Allotment[] = [];
  categories: Category[] = [];
  loading = false;
  editId: string | null = null;
  tempAmount: number = 0;
  // popup state
   showAddPopup  = false;
  popupAllotments: { [key: string]: number } = {};
  errorMessage: string = '';
  mockIncome = 25000; // monthly income limit
  toastMessage = '';
  toastVisible = false;

  addForm = new FormGroup({
    category_id: new FormControl<string | null>(null, Validators.required),
    amountAllotted: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    month: new FormControl<number | null>(null, Validators.required),
    year: new FormControl<number | null>(null, Validators.required)
  });
  
 constructor(private allotmentService: AllotmentService,private authService: AuthService) {}

  ngOnInit() {
     this.loadCategories();
    this.loadAllotments();
  }
  get familyId ()
  {
    return this.authService.familyId; 
  }
  

   async loadCategories() {
    try {
      this.categories = await this.allotmentService.getCategories();
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }

  /** Load allotments */
  async loadAllotments(month?: number, year?: number) {
    this.loading = true;
    try {
      const now = new Date();
      this.allotments = await this.allotmentService.getAllotments(
        month ?? now.getMonth() + 1,
        year ?? now.getFullYear()
      );
    } catch (err) {
      console.error('Error loading allotments:', err);
    } finally {
      this.loading = false;
    }
  }

   startEdit(allotment: Allotment) {
    this.editId = allotment.id;
    this.addForm.setValue({
      category_id: allotment.category_id,
      amountAllotted: allotment.amountAllotted,
      month: allotment.month,
      year: allotment.year
    });
    this.showAddPopup = false;
  }

  async saveEdit(val: Allotment) {
    if (!this.editId || this.addForm.invalid) return;

    try {
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

  openPopup() {
    this.addForm.reset({});
    this.showAddPopup = true;
  }

  closePopup() {
    this.showAddPopup = false;
    this.errorMessage = '';
  }

   async addAllotment() {

     const total = Object.values(this.popupAllotments).reduce((a, b) => a + (b || 0), 0);
    const mockIncome = 25000;
    if (total > mockIncome) {
      this.errorMessage = `Allotment exceeds income limit (₹${mockIncome})`;
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
        month: this.month,
        year: this.year!
            });
        }
      }
      this.loadAllotments();
      this.closePopup();
    } catch(err) {
      console.error(err);
      this.errorMessage = 'Error saving allotments';
    }

//     if (this.addForm.invalid) return;
//     const val = this.addForm.value;
// console.log('Add allotment form value:', val);
//     try {
//       const newAllotment = await this.allotmentService.addAllotment({
//         category_id: val.category_id!,
//         amountAllotted: val.amountAllotted!,
//         category: this.getCategoryName(val.category_id!),
//         month: val.month!,
//         year: val.year!
//       });
//       this.allotments.unshift(newAllotment);
//       this.showToast('Allotment added');
//     } catch (err: any) {
//       console.error('Add failed', err);
//       this.showToast(err.message || 'Failed to add allotment');
//     } finally {
//       this.showAddPopup = false;
//       this.addForm.reset();
//     }
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
}
