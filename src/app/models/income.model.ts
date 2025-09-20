export interface Income {
  id: string;
  user_id: string;
  user_name?: string;
  income_type?: number;
  amount: number;
  date_received?: string | null; // ✅ allow null
  recurring: boolean;
  source_name?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}
