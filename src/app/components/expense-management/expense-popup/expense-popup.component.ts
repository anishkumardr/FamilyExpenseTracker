import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Expense } from '../../../models/expense.model';
import { ExpenseService } from '../../../services/expense.service';
import { ExpenseParserService } from '../../../services/expense-parser.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-expense-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expense-popup.component.html',
  styleUrls: ['./expense-popup.component.scss']
})
export class ExpensePopupComponent {
  @Input() expense: any = null; // null = add new, else edit
  @Output() close = new EventEmitter<boolean>();
  @Input() categories: { id: string, category_name: string }[] = [];
   successMessage = '';
  // toggle easy/manual
  entryMode: 'easy' | 'manual' = 'easy';
constructor(private expenseService: ExpenseService,private dialog: MatDialog,private parserService: ExpenseParserService) {}
  // Manual entry model
 model: Partial<Expense> = {
    amount: 0,
    category_id: '',
    payment_method: '',
    occurred_at: new Date().toISOString().substring(0, 10),
    description: '',
    receipt_path: ''
  };
// ngOnInit() {
//   console.log('Popup opened. Editing expense:', this.expense);
//   this.expenseService.getCategories().subscribe(cats => {
//     console.log('Fetched categories:', cats);
//     this.categories = cats;
//   });
// }
ngOnChanges(changes:SimpleChanges) {
 
  if (this.expense) {
    this.entryMode = 'manual'; // force manual for edit
    console.log('Editing expense, switching to manual mode:', this.expense);
    this.model = {
      amount: this.expense.amount,
      category_id: this.expense.category_id,
      payment_method: this.expense.payment_method || 'cash',
      occurred_at: this.expense.occurred_at ? this.expense.occurred_at.substring(0, 10) : new Date().toISOString().substring(0, 10),
      description: this.expense.description,
      receipt_path: ''
    };
  } else {
    this.entryMode = 'easy'; // default for new entry
  }
}
   closePopup(refresh: boolean = true) {
    this.close.emit(refresh);
  }

  switchMode(mode: 'easy' | 'manual') {
    this.entryMode = mode;
  }
// submitEasyEntry() {
//     // Call your parser service here
//     alert('Easy Entry submitted (parser integration)');
//     this.closePopup(true);
//   }
  submitManualEntry() {
    console.log('Manual entry model:', this.model);
    if (!this.model.amount || !this.model.category_id || !this.model.payment_method || !this.model.description) {
    alert('Please fill all required fields.');
    return;
  }
    console.log('Submitting manual entry:', this.model);
    if (this.expense) {
      // Update
      this.expenseService.updateExpense({ ...this.model, id: this.expense.id } as Expense)
        .subscribe(() => this.closePopup(true));
    } else {
      // Add new
      console.log('Adding expense:', this.model);
      this.expenseService.addExpense(this.model as Expense)
        .subscribe(() => this.closePopup(true));
    }
  }


  onFileSelected(event: any) {
    this.model.receipt_path = event.target.files[0];
  }

  async submitEasyEntry() {
  try {
    // 1️⃣ Parse the input text using parser service
    const parsed = await firstValueFrom(this.parserService.parseExpense(this.model.description!));
    console.log('Parsed expense:', parsed);

    // 3️⃣ Construct expense object for DB
    const expenseForDb: Partial<Expense> = {

      amount: parsed.amount ?? 0,
      occurred_at: parsed.occurred_at ? parsed.occurred_at.substring(0, 10) : new Date().toISOString().substring(0, 10),
      category: parsed.category ?? 'other',
      description: parsed.description  ?? '',
      payment_method: parsed.payment_method ?? 'cash',
      category_id: parsed.category_id ?? '',
    };
    console.log('Expense object for DB:', expenseForDb);
this.closePopup(true);
    // 4️⃣ Open confirmation dialog
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: expenseForDb,
    });

   const confirmed = await firstValueFrom(dialogRef.afterClosed());

    if (confirmed) {
      // 5️⃣ Save expense via ExpenseService
      try {
        const expenseDb: Partial<Expense> = {

          amount: parsed.amount ?? 0,
          occurred_at: parsed.occurred_at ? parsed.occurred_at.substring(0, 10) : new Date().toISOString().substring(0, 10),
          description: parsed.description  ?? '',
          payment_method: parsed.payment_method ?? 'cash',
          category_id: parsed.category_id ?? '',
        };
        await this.expenseService.addExpense(expenseDb as Expense).toPromise();
        this.successMessage = 'Expense saved successfully!';
        // Optionally refresh the list
        this.closePopup(true)
      } catch (err) {
        console.error('Error saving expense:', err);
        this.successMessage = 'Failed to save expense';
      }
    } else {
      // User cancelled edit
      this.successMessage = '';
    }
  } catch (err) {
    console.error('Error parsing expense:', err);
    this.successMessage = 'Failed to parse expense';
  }
}

}
