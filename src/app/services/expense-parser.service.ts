import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ExpenseParserService {
  private functionUrl = 'https://dtjrthjmwkhxrjlydjkt.functions.supabase.co/parse-expense';
  private anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0anJ0aGptd2toeHJqbHlkamt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NjUwODksImV4cCI6MjA3MzM0MTA4OX0.cSv3rwNGE8LDtYQUZF6VIMFscTgAgGipk9C-DrA7rD0'; // 🔑 Replace with the anon key from Supabase dashboard

  constructor(private http: HttpClient,private authservice : AuthService) {}

  parseExpense(text: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.anonKey}`
    });

    return this.http.post<any>(
      this.functionUrl,
      { text : text, family_id: this.authservice.familyId },
      { headers }
    );
  }
}
