import { Component, OnInit } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { SupabaseService } from './services/supabase.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <!-- <h1>Family Expense Tracker</h1>
    <pre>{{ users | json }}</pre> -->
    <router-outlet></router-outlet>
  `
})
export class AppComponent implements OnInit {
  users: any;

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    this.users = await this.supabase.getUsers();
  }
}
