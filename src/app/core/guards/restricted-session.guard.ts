import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * When a Disabled Supplier/Contractor has a restricted session
 * (RestrictedAccess = true), they may only reach document upload
 * and profile (reactivation request) routes. All other authenticated
 * app areas redirect to /account/documents.
 */
@Injectable({ providedIn: 'root' })
export class RestrictedSessionGuard implements CanActivate, CanActivateChild {
  /** Path prefixes a restricted user is allowed to visit. */
  private static readonly AllowedPrefixes = [
    '/account/documents',
    '/account/profile',
    '/unauthorized',
    '/auth'
  ];

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.allow(state.url);
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.allow(state.url);
  }

  private allow(url: string): boolean {
    if (!this.auth.isRestricted) {
      return true;
    }

    const path = (url || '').split('?')[0];

    const allowed = RestrictedSessionGuard.AllowedPrefixes.some(
      prefix => path === prefix || path.startsWith(prefix + '/')
    );

    if (allowed) {
      return true;
    }

    this.router.navigate(['/account/documents'], {
      queryParams: { restricted: '1' }
    });
    return false;
  }
}
