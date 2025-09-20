import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  session: Session | null = null;
   private _profile: any;

  constructor(private router: Router) {
    this.supabase = createClient(
      'https://dtjrthjmwkhxrjlydjkt.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0anJ0aGptd2toeHJqbHlkamt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NjUwODksImV4cCI6MjA3MzM0MTA4OX0.cSv3rwNGE8LDtYQUZF6VIMFscTgAgGipk9C-DrA7rD0'
    );
  this.loadProfileFromStorage();
    
  }
  get profile() {
    return this._profile;
  }
  get userId() {
    return this._profile?.id;
  }

  get familyId() {
    return this._profile?.family_id;
  }

  get isAdmin() {
    return this._profile?.is_admin === true;
  }
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();

    this._profile = profile;
    localStorage.setItem('profile', JSON.stringify(profile));
    return profile;
  }

  loadProfileFromStorage() {
    console.log('Loading profile from storage...');
    const stored = localStorage.getItem('profile');
    if (!stored) {
      this._profile = null;
      // no stored profile -> go to login
      try { this.router.navigate(['/login']); } catch(e) { /* router might not be available in some test contexts */ }
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      // basic validity check: must have id
      if (!parsed || !parsed.id) {
        this._profile = null;
        localStorage.removeItem('profile');
        try { this.router.navigate(['/login']); } catch(e) {}
        return;
      }
      this._profile = parsed;
    } catch (err) {
      // invalid JSON
      this._profile = null;
      localStorage.removeItem('profile');
      try { this.router.navigate(['/login']); } catch(e) {}
    }
  }

  logout() {
    this._profile = null;
    localStorage.removeItem('profile');
    return this.supabase.auth.signOut();
  }

  async getSession(): Promise<any> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      console.log('Current session:', session);
      return session;
    } catch (err) {
      console.error('Failed to get session', err);
      return null;
    }
  }
}
