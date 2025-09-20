// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean | UrlTree> {
    // Check session
    const session = await this.auth.getSession();
    if (session) {
        console.log('User is authenticated, session:', session);
      return true;
    }
console.log('User is not authenticated, redirecting to login.');
    // Not authenticated -> return UrlTree so Angular redirects immediately
    return this.router.createUrlTree(['/login']);
  }
}
