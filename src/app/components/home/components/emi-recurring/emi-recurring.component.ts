import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-emi-recurring',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './emi-recurring.component.html',
  styleUrl: './emi-recurring.component.scss'
})
export class EmiRecurringComponent {
  @Input() data: any[] | null = [];
}
