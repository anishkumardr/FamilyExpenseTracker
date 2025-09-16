// src/app/components/add-expense/add-expense.component.ts
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormsModule } from '@angular/forms';
// Update the import path if the service is located elsewhere, for example:
import { SupabaseService } from '../../../services/supabase.service';
import { ExpenseParserService } from '../../../services/expense-parser.service';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

// Or verify that src/app/services/supabase.service.ts exists and matches the import path.

@Component({
  selector: 'app-add-expense',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,FormsModule,ConfirmDialogComponent],
  templateUrl: './add-expense.component.html',
  styleUrls: ['./add-expense.component.scss']
})
export class AddExpenseComponent implements OnInit {
  @Output() added = new EventEmitter<any>();
  form!: FormGroup;
  inputText = '';
  parsedExpense: any;
  easyEntry = false;
  showConfirmPopup = false;
  successMessage = '';
  constructor(private fb: FormBuilder,private dialog: MatDialog, private supabase: SupabaseService,private parserService: ExpenseParserService) {}

  loading = false;
  profile: any = null;
  naturalText = '';
parseSource: string | null = null;

  async ngOnInit() {
    this.form = this.fb.group({
    amount: [null, [Validators.required, Validators.min(0.01)]],
    currency: ['INR', [Validators.required]],
    occurred_at: [new Date().toISOString().slice(0, 10), [Validators.required]], // YYYY-MM-DD
    category: ['Uncategorized', Validators.required],
    merchant: [''],
    description: ['']
  });

    try {
      this.profile = await this.supabase.getAppUserProfile();
    } catch (err) {
      console.error('Failed to get profile', err);
    }
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.profile) {
      alert('User profile not available. Please login again.');
      return;
    }

    this.loading = true;
    try {
      const v = this.form.value;
      // Build the payload. We omit id so DB default gen_random_uuid() is used.
      const payload = {
        family_id: this.profile.family_id,
        user_id: this.profile.id,
        amount: parseFloat(v.amount ?? '0'),
        currency: v.currency ?? 'INR',
        occurred_at: new Date(v.occurred_at ?? new Date().toISOString().slice(0, 10)).toISOString(), // store full ISO timestamp
        category: v.category ?? 'Uncategorized',
        merchant: v.merchant || null,
        description: v.description || null
      };
console.log('Add expense payload:', payload);
      // Insert row
      const newRow = await this.supabase.addExpense(payload);

      // emit new expense so parent can optimistically display immediately
      this.added.emit(newRow);

      // reset form (keep date default)
      this.form.reset({
        amount: null,
        currency: 'INR',
        occurred_at: new Date().toISOString().slice(0, 10),
        category: 'Uncategorized',
        merchant: '',
        description: ''
      });
    } catch (err: any) {
      console.error('Add expense error', err);
      alert('Add failed: ' + (err.message ?? err));
    } finally {
      this.loading = false;
    }
  }
  async parseExpense() {
    this.parserService.parseExpense(this.inputText).subscribe((parsed) => {
console.log ('user id and family id:', this.supabase.currentUserId, this.supabase.currentFamilyId);
 var expenseForDb: any = {};
this.supabase.currentUserId.then(userId => {
  console.log("Current User ID:", userId);
  this.supabase.currentFamilyId.then(familyId => {
  console.log("Current familyId:", familyId);

  expenseForDb = {
      user_id: userId, // 👈 add getter in service
      family_id: familyId, // 👈 add getter in service
      amount: parsed.amount ?? 0,
      currency: parsed.currency ?? "INR",
      occurred_at: new Date().toISOString().slice(0, 10),
      category: parsed.category ?? "other",
      merchant: parsed.merchant ?? "",
      description: parsed.description ?? "",
    };

});

});

    console.log('Parsed expense object for DB:', expenseForDb);
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: expenseForDb,
      });

      dialogRef.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          // ✅ Save to Supabase table
         try {
          console.log('Saving parsed expense to DB:', expenseForDb);
            // ✅ use supabase service instead of direct http
            this.supabase.addExpense(expenseForDb);
            this.successMessage = 'Expense saved successfully!';
          } catch (err) {
            console.error('Error saving expense:', err);
            this.successMessage = 'Failed to save expense';
          }
        } else {
          // ❌ Let user edit text again
          this.successMessage = '';
        }
      });
    });
    // this.parserService.parseExpense(this.inputText).subscribe({
    //   next: (res) => {
    //     console.log('Parsed result:', res);
    //     this.parsedExpense = res;
    //   },
    //   error: (err) => {
    //     console.error('Error parsing expense:', err);
    //   }
    // });
  }

   confirmSave() {
    // TODO: Insert into Supabase "expenses" table
    console.log('Saving expense:', this.parsedExpense);

    this.showConfirmPopup = false;
    this.successMessage = 'Expense saved successfully ✅';

    setTimeout(() => this.successMessage = '', 3000); // auto-hide after 3s
  }

  cancelParse() {
    this.showConfirmPopup = false;
    this.inputText = '';
  }
}
