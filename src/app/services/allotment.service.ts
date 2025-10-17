import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';
import { AuthService } from './auth.service';
import { Allotment } from '../models/allotment.model';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class AllotmentService {
  private supabase: SupabaseClient;

  constructor(private authService: AuthService) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // ✅ Get all allotments with spent amount for current month/year
  async getAllotments(month: number, year: number): Promise<Allotment[]> {
    if (!this.authService.familyId) {
      throw new Error('No family_id found');
    }

    const familyId = this.authService.familyId;

    // Using Supabase join to fetch category name + allotted + spent
    if (!this.authService.familyId) throw new Error('No family_id');

  // 1️⃣ Fetch all global categories for this family
  const { data: globalCategories, error: catError } = await this.supabase
    .from('categories')
    .select('*')
    .eq('family_id', this.authService.familyId)
    .eq('is_global', true)
    .eq('status', true)
    .order('category_name', { ascending: true });

  if (catError) throw catError;

   const { data: familyCats, error: familyErr } = await this.supabase
    .from('categories')
    .select('*')
    .eq('family_id', familyId)
    .eq('status', true)
    .order('category_name', { ascending: true });
  if (familyErr) throw familyErr;

  // 2️⃣ Fetch existing allotments for this month/year
  const { data: allotmentsData, error: allotError } = await this.supabase
    .from('allotments')
    .select('*')
    .eq('family_id', this.authService.familyId)
    .eq('month', month)
    .eq('year', year);

  if (allotError) throw allotError;
console.log('Fetched allotments data:', allotmentsData);

// 3️⃣ Merge and remove duplicates (preference: family category)
  const mergedCategoriesMap = new Map<string, any>();

// Add global categories first
(globalCategories || []).forEach(cat => {
  if (cat && cat.id) {
    mergedCategoriesMap.set(cat.id, cat);
  }
});
console.log('Global categories map:', mergedCategoriesMap);
// Then overlay allotments (they have priority)
(allotmentsData || []).forEach(allot => {
  if (allot && allot.category_id) {
    // Find matching global category to get its details
    const matchingCategory = familyCats?.find(c => c.id === allot.category_id);
    mergedCategoriesMap.set(allot.category_id,matchingCategory);
  }
});

const categories = Array.from(mergedCategoriesMap.values());
console.log('Merged categories:', categories);
const lastDay = new Date(year, month, 0).getDate();
const { data: expenseSpent, error: expenseError } = await this.supabase
    .from('expense_management')
    .select('category_id, amount')
    .eq('family_id', familyId)
    .gte('occurred_at', `${year}-${month}-01`)
    .lte('occurred_at', `${year}-${month}-${lastDay}`);
console.log('Fetched expense spent data:', expenseSpent);
    if (expenseError) throw expenseError;

  const { data: savingsSpent, error: savingsError } = await this.supabase
    .from('savings')
    .select('category_id, amount')
    .eq('family_id', familyId)
    .gte('date_saved', `${year}-${month}-01`)
    .lte('date_saved', `${year}-${month}-${lastDay}`);

  if (savingsError) throw savingsError;

  // 🧮 Combine both into a map of total spent per category
  const spentMap: { [key: string]: number } = {};

  expenseSpent?.forEach(e => {
    spentMap[e.category_id] = (spentMap[e.category_id] || 0) + (e.amount || 0);
  });

  savingsSpent?.forEach(s => {
    spentMap[s.category_id] = (spentMap[s.category_id] || 0) + (s.amount || 0);
  });

  // 3️⃣ Map categories to allotments
  const allotments: Allotment[] = categories!.map(cat => {
    const existing = allotmentsData?.find(a => a.category_id === cat.id);
    const totalSpent = spentMap[cat.id] || 0;
    return {
      id: existing?.id ?? '',           // empty id for new entries
      category: cat.category_name,
      category_id: cat.id,
      category_type: cat.category_type,
      amountAllotted: existing?.amount_allotted ?? 0,
      amountSpent: totalSpent ?? 0, // set to 0 if no record
      month,
      year
    };
  });
console.log('Fetched allotments:', allotments);
  return allotments;
  }

  // ✅ Add new allotment
  async addAllotment(allotment: Omit<Allotment, 'id' | 'amountSpent'>): Promise<Allotment> {
    if (!this.authService.familyId) {
      throw new Error('No family_id found');
    }
console.log('Adding allotment:', allotment);
    const { data, error } = await this.supabase
      .from('allotments')
      .insert([{
        family_id: this.authService.familyId,
        category_id: allotment.category_id,
        month: allotment.month,
        year: allotment.year,
        amount_allotted: allotment.amountAllotted
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding allotment:', error);
      throw error;
    }

    return {
      id: data.id,
      category: allotment.category,
      category_id: allotment.category_id,
        category_type: allotment.category_type,
      amountAllotted: data.amount_allotted,
      amountSpent: 0,
      month: data.month,
      year: data.year
    };
  }

  // ✅ Update existing allotment
  async updateAllotment(id: string, updates: Partial<Allotment>): Promise<Allotment> {
    if (!id) throw new Error('Allotment ID is required');

    const { data, error } = await this.supabase
      .from('allotments')
      .update({
        amount_allotted: updates.amountAllotted
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating allotment:', error);
      throw error;
    }

    return {
      id: data.id,
      category_id: updates.category_id!,
      category: updates.category!,
        category_type: updates.category_type!,
      amountAllotted: data.amount_allotted,
      amountSpent: updates.amountSpent ?? 0,
      month: data.month,
      year: data.year
    };
  }

  // ✅ Delete allotment (optional)
  async deleteAllotment(id: string): Promise<void> {
    if (!id) throw new Error('Allotment ID is required');

    const { error } = await this.supabase
      .from('allotments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting allotment:', error);
      throw error;
    }
  }

  // ✅ Get categories for dropdown
  async getCategories(): Promise<Category[]> {
    if (!this.authService.familyId) {
      throw new Error('No family_id found');
    }

    const { data, error } = await this.supabase
      .from('categories')
      .select('id, category_name, status,category_type')
      .eq('family_id', this.authService.familyId)
      .eq('status', true)
      .order('category_name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
 return (data as any[]).map(item => ({
      ...item
    })) as Category[];
  }

  
}
