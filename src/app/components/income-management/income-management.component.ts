import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Income } from '../../models/income.model';
import { IncomeType } from '../../models/incometype.model';
import { AppUser } from '../../models/app-user.model';
import { IncomeService } from '../../services/income.service';

@Component({
  selector: 'app-income-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,FormsModule],
  templateUrl: './income-management.component.html',
  styleUrls: ['./income-management.component.scss']
})
export class IncomeManagementComponent implements OnInit {
  incomes: Income[] = [];
  users: AppUser[] = [];
  incomeTypes: IncomeType[] = [];
  loading = false;

  // state
  showAddPopup = false;
  editId: string | null = null;
  toastMessage = '';
  toastVisible = false;

  // Form
  addForm = new FormGroup({
    user_id: new FormControl<string | null>(null, [Validators.required]),
    income_type: new FormControl<number | null>(null, [Validators.required]),
    amount: new FormControl<number | null>(null, [Validators.required]),
    date_received: new FormControl<string | null>(null, [Validators.required]),
    recurring: new FormControl<boolean>(false),
    source_name: new FormControl<string | null>(null),
    notes: new FormControl<string | null>(null)
  });

  constructor(private incomeService: IncomeService) {}

  async ngOnInit() {
    await this.loadDropdowns();
    await this.loadIncomes();
  }

  /** Load incomes, users and income types */
  async loadDropdowns() {
    try {
      this.users = await this.incomeService.getUsers();
      this.incomeTypes = await this.incomeService.getIncomeTypes();
    } catch (err) {
      console.error('Error loading dropdowns:', err);
    }
  }

  async loadIncomes() {
    this.loading = true;
    try {
      this.incomes = await this.incomeService.getIncomes();
      console.log('Incomes loaded:', this.incomes);
    } catch (err) {
      console.error('Error loading incomes:', err);
    } finally {
      this.loading = false;
    }
  }

  /** Edit actions */
  startEdit(income: Income) {
    this.editId = income.id;
    console.log('Editing income:', income.income_type, income.user_id);
    this.addForm.setValue({
      user_id: income.user_id,
      income_type: income.income_type ?? null,
      amount: income.amount ?? null,
      date_received: income.date_received ?? null,
      recurring: income.recurring,
      source_name: income.source_name || '',
      notes: income.notes || ''
    });
    this.showAddPopup = false;
  }

  async saveEdit(val: Income) {
    if (!this.editId || this.addForm.invalid) return;

    try {
      //const val = this.addForm.value;
      console.log('Saving edit for income ID:', this.editId, val);
      const updated = await this.incomeService.updateIncome(this.editId, {
        user_id: val.user_id ?? '',
        income_type: val.income_type !== null && val.income_type !== undefined ? Number(val.income_type) : undefined,
        amount: val.amount !== null ? val.amount : undefined,
        date_received: val.date_received,
        recurring: val.recurring ?? false,
        source_name: val.source_name ?? undefined,
        notes: val.notes ?? undefined
      });
      this.incomes = this.incomes.map(i => (i.id === updated.id ? updated : i));
      this.showToast('Income updated');
    } catch (err: any) {
      console.error('Update failed', err);
      this.showToast(err.message || 'Failed to update income');
    } finally {
      this.editId = null;
      this.showAddPopup = false;
      this.addForm.reset({ recurring: false });
    }
  }

  cancelEdit() {
    this.editId = null;
    this.showAddPopup = false;
    this.addForm.reset({ recurring: false });
  }

  /** Add actions */
  openAdd() {
    this.addForm.reset({ recurring: false });
    this.showAddPopup = true;
  }

  async addIncome() {
    if (this.addForm.invalid) return;
    const val = this.addForm.value;

    try {
      const newIncome = await this.incomeService.addIncome({
        user_id: String(val.user_id),
        income_type: val.income_type !== null && val.income_type !== undefined ? Number(val.income_type) : undefined,
        amount: val.amount !== null && val.amount !== undefined ? Number(val.amount) : 0,
        date_received: val.date_received,
        recurring: val.recurring ?? false,
        source_name: val.source_name ?? undefined,
        notes: val.notes ?? undefined
      });
      this.incomes.unshift(newIncome);
      this.showToast('Income added');
    } catch (err: any) {
      console.error('Add failed', err);
      this.showToast(err.message || 'Failed to add income');
    } finally {
      this.showAddPopup = false;
      this.addForm.reset({ recurring: false });
    }
  }

  /** Delete actions */
  async deleteIncome(income: Income) {
    if (!confirm(`Delete income of amount ${income.amount}?`)) return;

    try {
      await this.incomeService.deleteIncome(income.id);
      this.incomes = this.incomes.filter(i => i.id !== income.id);
      this.showToast('Income deleted');
    } catch (err) {
      console.error('Delete failed', err);
      this.showToast('Failed to delete income');
    }
  }

  /** Toast helper */
  showToast(msg: string) {
    this.toastMessage = msg;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 2000);
  }

  /** Utility functions for display in table */
  getUserName(userId: string): string {
    const user = this.users.find(u => u.id === userId);
    return user?.full_name || '';
  }

  getIncomeTypeName(typeId: number): string {
    const type = this.incomeTypes.find(t => t.id === typeId);
    return type?.name || '';
  }
}
