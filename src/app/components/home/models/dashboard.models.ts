export interface TotalAmountResponse {
  total_expense?: number;
  total_income?: number;
  cc_expense?: number;
}

export interface CategoryBreakdown {
  category_name: string;
  total_spent: number;
}

export interface BudgetVsSpending {
  category_name: string;
  amount_allotted: number;
  actual_spent: number;
}

export interface RecentExpense {
  id: string;
  amount: number;
  description: string;
  category_name: string;
  payment_method: string;
  occurred_at: string;
}

export interface PaymentMethodUsage {
  payment_method: string;
  total_usage: number;
}

export interface EmiExpense {
  id: string;
  amount: number;
  description: string;
  category_name: string;
  occurred_at: string;
}

export interface SavingSummary {
  total_savings: number;
}

export interface MonthlyTrend {
  month_num: number;
  total_spent: number;
}
