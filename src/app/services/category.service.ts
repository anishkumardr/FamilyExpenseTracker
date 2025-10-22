import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { Category } from '../models/category.model';
import { environment } from '../../environments/environments';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private supabase: SupabaseClient;
  constructor(private authService: AuthService) {
    this.supabase = createClient(
     environment.supabaseUrl, environment.supabaseKey
    );
  }

  // ✅ Get all categories for current family
  async getCategories(): Promise<Category[]> {
    if (!this.authService.familyId) {
        console.log('No family_id found in profile:', this.authService.profile);
      throw new Error('No family_id found');
    }
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('family_id', this.authService.familyId)
      .order('created_at', { ascending: false });
      console.log('Fetched categories:', data, 'Error:', error);
    if (error) throw error;
    return data as Category[];
  }

  // ✅ Add new category
  async addCategory(category: Omit<Category, 'id' | 'family_id' | 'created_at'>): Promise<Category> {
    
    if (!this.authService.profile?.family_id) {
    throw new Error('No family_id available');
  }
  console.log('familyId found:', this.authService.profile.family_id);
    const duplicate = await this.isDuplicateName(category.category_name);
  if (duplicate) {
    throw new Error('Category name already exists');
  }
     const { data, error } = await this.supabase
    .from('categories')
    .insert([
      {
        ...category,
        family_id: this.authService.profile.family_id, // ✅ attach automatically
      },
    ])
    .select()
    .single();
    if (error) throw error;
    return data as Category;
  }

  // ✅ Update category
  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    console.log('Updating category:', id, updates);
    if (!this.authService.familyId) {
      throw new Error('No family_id found');
    }
     if (!updates.category_name) {
       throw new Error('Category name is required for update');
     }
     const duplicate = await this.isDuplicateName(updates.category_name, id);
  if (duplicate) {
    throw new Error('Category name already exists');
  }
    const { data, error } = await this.supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .eq('family_id', this.authService.familyId)
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  }

  // ✅ Delete category
  async deleteCategory(id: string): Promise<void> {
    if (!this.authService.familyId) {
      throw new Error('No family_id found');
    }

    const { error } = await this.supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('family_id', this.authService.familyId);

    if (error) throw error;
  }

  async isDuplicateName(name: string, excludeId?: string): Promise<boolean> {
  if (!this.authService.profile?.family_id) return false;

  let query = this.supabase
    .from('categories')
    .select('id')
    .eq('family_id', this.authService.profile.family_id)
    .ilike('category_name', name.trim()); // 👈 case-insensitive match

  if (excludeId) {
    query = query.neq('id', excludeId); // exclude current when updating
  }

  const { data, error } = await query;
  console.log('Duplicate check for name:', name, 'Exclude ID:', excludeId, 'Result:', data, 'Error:', error);
  if (error) throw error;

  return data && data.length > 0;
}
}
