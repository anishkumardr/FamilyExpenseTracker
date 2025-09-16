import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  profile: any;
  constructor() {
    console.log('Supabase URL:', environment.supabaseUrl);
    console.log('Supabase Key:', environment.supabaseKey);
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // Test function: fetch users
  async getUsers() {
    const { data, error } = await this.supabase.from('app_users').select('*');
    if (error) throw error;
    console.log('Fetched users:', data);
    
    return data;
  }
   async getExpenses() {
    const { data, error } = await this.supabase
      .from('expenses')
      .select('*')
      .order('occurred_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // ✅ Subscribe to realtime expense changes
  onExpensesChange(callback: (payload: any) => void) {
    return this.supabase
      .channel('public:expenses')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  }

  async getCurrentAuthUser() {
    const res = await this.supabase.auth.getUser();
    console.log('Current auth user:', res);
    return res.data?.user ?? null;
  }

  // Returns the row from app_users that matches auth.uid()
  async getAppUserProfile() {
    const user = await this.getCurrentAuthUser();
    console.log('Auth user for profile fetch:', user);
    if (!user) return null;
    const data = await this.loadProfile(user.id);
    console.log('App user profile:', data);
    return data;
  }

  // Insert an expense and return the inserted row (uses .select() to return row)
  async addExpense(expense: any) {
    // expense should contain user_id and family_id to satisfy RLS insert policy
    const { data, error } = await this.supabase
      .from('expenses')
      .insert([expense])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // 🔹 Update Expense
async updateExpense(expenseId: string, updates: any) {
  return this.supabase
    .from('expenses')
    .update(updates)
    .eq('id', expenseId)
    .select()
    .single();
}

// 🔹 Delete Expense
async deleteExpense(expenseId: string) {
  return this.supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId);
}

  // Fetch expenses for a family (descending by occurred_at)
  async getExpensesForFamily(familyId: string) {
    const { data, error } = await this.supabase
      .from('expenses')
      .select('*')
      .eq('family_id', familyId)
      .order('occurred_at', { ascending: false });
    if (error) throw error;
    console.log(`Fetched ${data?.length ?? 0} expenses for family ${familyId}`);
    return data;
  }

  async loadProfile(userId: string) {
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
console.log('Loaded profile:', { profile, error });

    if (error) {
      console.error('Failed to load profile:', error);
      return;
    }

    if (!profile) {
      console.log('No profile found. Creating one...');
      const { data: newProfile, error: insertError } = await this.supabase
        .from('profiles')
        .insert([{ id: userId , family_id: '11111111-1111-1111-1111-111111111111'}])
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create profile:', insertError);
        return;
      }
      this.profile = newProfile;
        console.log('Created new profile:', newProfile);
    } else {
      this.profile = profile;
      console.log('Profile exists:', profile);
      return profile;
    }
  }

get currentUserId() {
  // assuming you store the user after login
  return this.supabase.auth.getUser().then(({ data }) => data.user?.id);
}

get currentFamilyId() {
  // you might have this stored after profile load
  return this.supabase.auth.getUser().then(({ data }) => {
    const userId = data.user?.id;
    if (!userId) return undefined;
    return this.loadProfile(userId).then(profile => profile?.family_id);
  });
}

}
