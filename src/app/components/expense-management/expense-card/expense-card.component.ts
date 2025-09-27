import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-expense-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expense-card.component.html',
  styleUrls: ['./expense-card.component.scss']
})
export class ExpenseCardComponent {
  @Input() expense: any;
  @Output() edit = new EventEmitter<void>();

  onEditClick() {
    this.edit.emit();
  }
}
