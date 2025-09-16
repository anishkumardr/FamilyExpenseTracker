import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() {}

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  getCurrentUser() {
    return supabase.auth.getUser();
  }
}
