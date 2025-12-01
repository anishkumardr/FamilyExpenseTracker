import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-summary-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-bar.component.html',
  styleUrl: './summary-bar.component.scss'
})
export class SummaryBarComponent {
  @Input() data: any;

  getPercent(value: number, total: number): number {
    if (!value || !total || total === 0) return 0;
    return Math.min(100, (value / total) * 100);
  }
}
