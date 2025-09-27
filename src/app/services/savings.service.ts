import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Saving } from '../models/savings.model';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'  // ✅ Add this
})
export class SavingService {
  private supabase: SupabaseClient;

  constructor(private authService: AuthService) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  getCategories(): Observable<{id: string, category_name: string}[]> {
    return from(
      this.supabase
        .from('categories')
        .select('id, category_name')
        .eq('category_type', 'savings')
        .eq('status', true)
    ).pipe(map((res:any) => res.data || []));
  }

  getRemainingAmount(): Observable<{remaining_amount:number, allotted_amount:number}> {
    return from(
      this.supabase
        .from('current_month_saving_remaining')
        .select('allotted_amount, saved_amount, remaining_amount')
        .single()
    ).pipe(map((res:any) => res.data || {remaining_amount:0, allotted_amount:0}));
  }

  getGroupedSavings(): Observable<any[]> {
  return from(
    this.supabase
      .from('savings')
      .select(`
        *,
        category:category_id (
          id,
          category_name
        )
      `)
      .order('date_saved', { ascending: false })
  ).pipe(
    map((res: any) => {
        console.log('Fetched savings:', res);
      const savings: Saving[] = res.data || [];
      const grouped: { [month: string]: Saving[] } = {};

      savings.forEach(s => {
        const month = new Date(s.date_saved).toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!grouped[month]) grouped[month] = [];
        grouped[month].push({
          ...s,
          category_name: s.category_name,
          icon: s.icon || 'assets/icons/category/default_category_Icon.png'
        });
      });
console.log('Grouped savings:', grouped);
      return Object.keys(grouped).map(month => ({
        month,
        items: grouped[month]
      }));
    })
  );
}
  addSaving(saving: Saving): Observable<Saving> {
  if (!this.authService.userId || !this.authService.familyId) {
    throw new Error('User ID or Family ID not set');
  }

  const savingToInsert: Partial<Saving> = {
    ...saving,
    user_id: this.authService.userId,
    family_id: this.authService.familyId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log('Adding saving to DB:', savingToInsert);

  return from(
    this.supabase
      .from('savings')
      .insert([savingToInsert])
      .select()  // returns inserted record(s)
  ).pipe(
    map((res: any) => {
      if (res.error) {
        console.error('Error inserting saving:', res.error);
        throw res.error;
      }
      return res.data[0] as Saving; // return first inserted record
    })
  );
}
 updateSaving(saving: Saving): Observable<Saving> {
  if (!saving.id) {
    throw new Error('Saving ID is required for update');
  }

  const savingToUpdate: Partial<Saving> = {
    ...saving,
    updated_at: new Date().toISOString()  // update timestamp
  };

  console.log('Updating saving:', savingToUpdate);

  return from(
    this.supabase
      .from('savings')
      .update(savingToUpdate)
      .eq('id', saving.id)
      .select()  // returns updated record(s)
  ).pipe(
    map((res: any) => {
      if (res.error) {
        console.error('Error updating saving:', res.error);
        throw res.error;
      }
      return res.data[0] as Saving; // return first updated record
    })
  );
}



   deleteSaving(savingId: string): Observable<any> {
    return from(
      this.supabase
        .from('savings')
        .delete()
        .eq('id', savingId)
    ).pipe(map(res => res.data));
  }

}
