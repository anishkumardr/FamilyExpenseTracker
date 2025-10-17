export interface Category {
  id: string;              // uuid
  family_id: string;       // fk from profiles
  category_name: string;
  description?: string;
  category_type: 'savings' | 'expense'; 
   is_global?: boolean;
  status: boolean;         // active/inactive
  created_at?: string;
}
