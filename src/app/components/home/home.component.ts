import { Component, signal, inject } from '@angular/core';
import { DashboardService } from './dashboard.service';
import { CommonModule } from '@angular/common';
import { SummaryBarComponent } from './components/summary-bar/summary-bar.component';
import { CategoryChartComponent } from './components/category-chart/category-chart.component';
import { BudgetVsSpendComponent } from './components/budget-vs-spend/budget-vs-spend.component';
import { CreditSummaryComponent } from './components/credit-summary/credit-summary.component';
import { RecentTransactionsComponent } from './components/recent-transactions/recent-transactions.component';
import { EmiRecurringComponent } from './components/emi-recurring/emi-recurring.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    SummaryBarComponent,
    CategoryChartComponent,
    BudgetVsSpendComponent,
    CreditSummaryComponent,
    RecentTransactionsComponent,
    EmiRecurringComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  dashboard = signal<any>(null);
  dashboardService = inject(DashboardService);

  ngOnInit() {
    // default month-year
    const now = new Date();
    this.loadDashboard(now.getMonth() + 1, now.getFullYear());
  }

  loading = signal(false);

async loadDashboard(month: number, year: number) {
  this.loading.set(true);
  try {
  this.dashboard.set(await this.dashboardService.getDashboard(month, year));
  console.log('Dashboard data loaded:', this.dashboard() );
} catch (err) {
  console.error(err);
  alert("Failed to load dashboard!");
}
  this.loading.set(false);
}
}
