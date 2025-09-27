import { Component, OnInit } from '@angular/core';
import { SavingService } from '../../services/savings.service';
import { Saving } from '../../models/savings.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-saving-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './savings-management.component.html',
  styleUrls: ['./savings-management.component.scss']
})
export class SavingsManagementComponent implements OnInit {

  savingsGrouped: any[] = [];
  remainingAmount = 0;
  allottedAmount = 0;
  remainingAmountPercent = 100;

  categories: {id: string, category_name: string}[] = [];

  showPopup = false;
  editingSaving: Saving | null = null;

  model: Partial<Saving> = {
    amount: 0,
    category_id: '',
    date_saved: new Date().toISOString().substring(0,10),
    recurring: false,
    comments: ''
  };

  constructor(private savingService: SavingService,private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.loadCategories();
    this.loadRemainingAmount();
    this.loadSavings();
  }

  loadCategories() {
    this.savingService.getCategories().subscribe(res => this.categories = res);
  }

  loadRemainingAmount() {
    this.savingService.getRemainingAmount().subscribe(res => {
      this.remainingAmount = res.remaining_amount;
      this.allottedAmount = res.allotted_amount;
      this.remainingAmountPercent = this.allottedAmount ? (this.remainingAmount / this.allottedAmount) * 100 : 100;
    });
  }

  loadSavings() {
    this.savingService.getGroupedSavings().subscribe(res => this.savingsGrouped = res);
  }

  openPopup(saving?: Saving) {
    if (saving) {
      this.editingSaving = saving;
      this.model = {...saving};
    } else {
      this.editingSaving = null;
      this.model = {
        amount: 0,
        category_id: '',
        date_saved: new Date().toISOString().substring(0,10),
        recurring: false,
        comments: ''
      };
    }
    this.showPopup = true;
  }

  closePopup(refresh: boolean = true) {
    this.showPopup = false;
    this.editingSaving = null;
    if (refresh) {
      this.loadSavings();
      this.loadRemainingAmount();
    }
  }

  saveSaving() {
    if (!this.model.amount || !this.model.category_id) {
      alert('Please fill required fields.');
      return;
    }

    if (this.editingSaving) {
      this.savingService.updateSaving({...this.model, id: this.editingSaving.id} as Saving)
        .subscribe(() => this.closePopup());
    } else {
      this.savingService.addSaving(this.model as Saving)
        .subscribe(() => this.closePopup());
    }
  }

   onDeleteSaving(savingId: string) {
    if (!confirm('Are you sure you want to delete this saving?')) return;

    this.savingService.deleteSaving(savingId).subscribe({
      next: () => {
        this.loadSavings();
        this.loadRemainingAmount();
        this.snackBar.open('Saving deleted successfully', 'Close', { duration: 2000 });
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Failed to delete saving', 'Close', { duration: 2000 });
      }
    });
  }
}
