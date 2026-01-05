import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';

export type ChartOptions = {
  series: number[];
  chart: any;
  labels: string[];
  legend: any;
  dataLabels: any;
};

@Component({
  selector: 'app-category-chart',
  standalone: true,
  imports: [NgApexchartsModule,CommonModule],
  templateUrl: './category-chart.component.html',
  styleUrl: './category-chart.component.scss'
})
export class CategoryChartComponent implements OnChanges {

  @Input() data: any[] = [];

  chartOptions: Partial<ChartOptions> | null = null;
  processedList: any[] = [];

  ngOnChanges() {
    if (!this.data || this.data.length === 0) return;

    this.prepareChartData();
  }

  private prepareChartData() {
    const sorted = [...this.data].sort((a, b) => b.total_spent - a.total_spent);
    const top8 = sorted.slice(0, 8);
    const remaining = sorted.slice(8);

    const otherTotal = remaining.reduce((sum, x) => sum + x.total_spent, 0);

    const labels = top8.map(x => x.category_name);
    const series = top8.map(x => x.total_spent);

    if (remaining.length > 0) {
      labels.push("Others");
      series.push(otherTotal);
    }

    const total = series.reduce((s, v) => s + v, 0);

    this.processedList = [...top8];

    if (remaining.length > 0) {
      this.processedList.push({
        category_name: "Others",
        total_spent: otherTotal
      });
    }

    this.chartOptions = {
      series,
      labels,
      chart: {
        type: 'donut',
        width: "100%"
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        position: "bottom"
      }
    };
  }
}
