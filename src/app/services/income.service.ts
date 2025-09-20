import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';
import { AuthService } from './auth.service';
import { Income } from '../models/income.model';
// Update the path and filename to match your actual user model file
import { AppUser } from '../models/app-user.model';
import { IncomeType } from '../models/incometype.model';

@Injectable({
  providedIn: 'root'
})
export class IncomeService {
  private supabase: SupabaseClient;

  constructor(private authService: AuthService) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // ✅ Get all incomes with user name
  async getIncomes(): Promise<Income[]> {
    if (!this.authService.familyId) {
      throw new Error('No family_id found');
    }

   const { data, error } = await this.supabase
  .from('income')
  .select('*, user:user_id(id, full_name, username), income_type(*)')
  .order('created_at', { ascending: false });

console.log('Fetched incomes:', data, error);
if (error) throw error;

    // Map to include user_name in each income
    return (data as any[]).map(item => ({
      ...item,
      user_name: item.user?.name || '',
      user_id: item.user_id,
        income_type: item.income_type?.id || null
    })) as Income[];
  }

  // ✅ Add new income
  async addIncome(income: Omit<Income, 'id' | 'created_at' | 'updated_at'>): Promise<Income> {
    if (!this.authService.profile?.family_id) {
      throw new Error('No family_id available');
    }

    const { data, error } = await this.supabase
      .from('income')
      .insert([
        {
          ...income,
          // Optional: you can attach family_id if needed
          // family_id: this.authService.profile.family_id
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data as Income;
  }

  // ✅ Update income
  async updateIncome(id: string, updates: Partial<Income>): Promise<Income> {
    if (!id) throw new Error('Income ID is required for update');
console.log('Updating income:', id, updates);
    const { data, error } = await this.supabase
      .from('income')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Income;
  }

  // ✅ Delete income
  async deleteIncome(id: string): Promise<void> {
    if (!id) throw new Error('Income ID is required for delete');

    const { error } = await this.supabase
      .from('income')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ✅ Get all users for dropdown
  async getUsers(): Promise<AppUser[]> {
  if (!this.authService.familyId) {
    throw new Error('No family_id found');
  }

  const { data, error } = await this.supabase
    .from('app_users')
    .select('id, full_name, username, role, status')
    .eq('family_id', this.authService.familyId)
    .order('full_name', { ascending: true });

  if (error) throw error;
  console.log(`Fetched ${data?.length ?? 0} users for family ${this.authService.familyId}`);
  return data as AppUser[];
}

// In IncomeService
async getIncomeTypes(): Promise<IncomeType[]> {
  try {
    const { data, error } = await this.supabase
      .from('income_type')
      .select('id, name, status')
      .eq('status', true)     // only active types
      .order('name', { ascending: true });

    if (error) throw error;
    console.log(`Fetched ${data?.length ?? 0} income types`);
    return data as IncomeType[];
  } catch (err) {
    console.error('Error fetching income types:', err);
    throw err;
  }
}

}
