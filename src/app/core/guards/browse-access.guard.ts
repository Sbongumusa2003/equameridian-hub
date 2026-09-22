import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class BrowseAccessGuard implements CanActivate, CanActivateChild {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.allow(state.url);
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.allow(state.url);
  }

  private allow(url: string): boolean {
    if (!this.auth.isLoggedIn || this.auth.role !== 'supplier') {
      return true;
    }

    const path = (url || '').split('?')[0];
    if (path === '/' || path === '') {
      return true;
    }

    this.router.navigate(['/supplier/listings']);
    return false;
  }
}
