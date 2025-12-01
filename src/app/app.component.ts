import { Component, OnInit } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { SupabaseService } from './services/supabase.service';
import { Router, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BottomNavComponent } from "./components/bottom-nav/bottom-nav.component";
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatIconModule, MatButtonModule, BottomNavComponent],
  styleUrls: ['./app.component.scss'],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  users: any;
  userName = '';
  constructor(private supabase: SupabaseService,private router: Router,private auth: AuthService) {
    console.log('AppComponent constructor called.'); 
    this.userName = this.auth.getUserName();
     console.log('AppComponent initialized. UserName:', this.userName);
  }
showNav = true;
lightTheme = false;
  toggleTheme(){ this.lightTheme = !this.lightTheme; }
  async ngOnInit() {
    const { data: { session } } = await this.supabase.auth.getSession();
    const currentUrl = this.router.url;

    // if (session) {
    //   // only redirect to home if user is at root or at login
    //   if (!currentUrl || currentUrl === '/' || currentUrl === '/login') {
    //     this.router.navigate(['/home']);
    //   }
    // } else {
    //   // if not authenticated, send to login unless already there
    //   if (currentUrl !== '/login') {
    //     this.router.navigate(['/login']);
    //   }
    // }

    // // listen for auth changes
    // this.supabase.auth.onAuthStateChange((_event, session) => {
    //   const cur = this.router.url;
    //   if (session) {
    //     if (!cur || cur === '/' || cur === '/login') this.router.navigate(['/home']);
    //   } else {
    //     if (cur !== '/login') this.router.navigate(['/login']);
    //   }
    // });
  }
}
