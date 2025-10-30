// frequency.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environments';

@Injectable({ providedIn: 'root' })
export class FrequencyService {
  private supabase: SupabaseClient;
  
    constructor(private authService: AuthService) {
      this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }
  

  async getFrequentCategories(limit = 5) {
    const { data, error } = await this.supabase
      .from('expense_frequency')
      .select('category_id, usage_count, categories!expense_frequency_category_id_fkey (category_name)')
      .eq('family_id', this.authService.familyId)
      .order('usage_count', { ascending: false })
      .limit(limit);
console.log('Frequent categories fetched:', data, 'Error:', error);
    if (error) throw error;
    // ✅ Deduplicate by category_id
  const uniqueCategories = [];
  const seen = new Set();

  for (const item of data) {
    if (!seen.has(item.category_id)) {
      seen.add(item.category_id);
      uniqueCategories.push(item);
    }
  }

  // limit after deduplication
  return uniqueCategories.slice(0, limit);
  }

  async getFrequentPaymentMethods(limit = 5) {
    const { data, error } = await this.supabase
      .from('expense_frequency')
      .select('payment_method, usage_count')
      .eq('family_id', this.authService.familyId)
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}
