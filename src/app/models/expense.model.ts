export interface Expense {
  id?: string;
  category_id: string;
  category?: string;
  payment_method: string; // Payment Method
  description: string;
  amount: number;
  icon?: string;
  paymentIcon?: string;
  occurred_at: string;
  receipt_path?: string;
}