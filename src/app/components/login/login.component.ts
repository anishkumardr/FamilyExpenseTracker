import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  async onLogin() {
    this.errorMessage = '';
    this.loading = true;

    try {
      const result = await this.authService.login(this.email, this.password);
      console.log('Login successful:', result);
      this.router.navigate(['/expenses']);
    } catch (err: any) {
      this.errorMessage = err.message;
    } finally {
      this.loading = false;
    }
  }
}
