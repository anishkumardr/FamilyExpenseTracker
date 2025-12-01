import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-budget-vs-spend',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './budget-vs-spend.component.html',
  styleUrl: './budget-vs-spend.component.scss'
})
export class BudgetVsSpendComponent {
  @Input() data: any[] | null = [];
}
