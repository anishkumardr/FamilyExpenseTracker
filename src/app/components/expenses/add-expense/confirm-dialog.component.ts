// confirm-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogActions, MatDialogContent } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogActions, MatDialogContent],
  template: `
    <h2 mat-dialog-title>Confirm Parsed Expense</h2>
    <mat-dialog-content>
      <p><strong>Amount:</strong> {{ data.amount }}</p>
      <p><strong>Category:</strong> {{ data.category }}</p>
      <p><strong>Purchase Date:</strong> {{ data.occurred_at }}</p>
      <p><strong>Merchant:</strong> {{ data.merchant }}</p>
      <p><strong>Description:</strong> {{ data.description }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">No</button>
      <button mat-raised-button color="primary" (click)="onConfirm()">Yes</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onConfirm() {
    this.dialogRef.close(true);
  }
  onCancel() {
    this.dialogRef.close(false);
  }
}
