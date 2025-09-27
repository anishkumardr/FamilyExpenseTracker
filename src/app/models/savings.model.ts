export interface Saving {
  id: string;
  user_id: string;
  family_id: string;
  category_id: string;
  amount: number;
  date_saved: string;
  recurring: boolean;
  comments?: string;
  created_at?: string;
  updated_at?: string;
  category_name?: string; // Joined from Category
    icon?: string;          // Joined from Category
}
