import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-credit-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './credit-summary.component.html',
  styleUrl: './credit-summary.component.scss'
})
export class CreditSummaryComponent {
  @Input() data: any | null = null;
}
