export interface DashboardDTO {
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    month: number;
    year: number;
  };
  categoryWise: Array<{ category: string; amount: number }>;
  budget: Array<{ category: string; allotted: number; spent: number }>;
  credit: {
    totalCreditUsed: number;
    upcomingBills: Array<{ cardName: string; dueDate: string; dueAmount: number }>;
  };
  recentTxns: Array<{
    id: string;
    amount: number;
    category: string;
    occurred_at: string;
    payment_method: string;
  }>;
  emi: Array<{
    id: string;
    name: string;
    due_date: string;
    amount: number;
  }>;
}
