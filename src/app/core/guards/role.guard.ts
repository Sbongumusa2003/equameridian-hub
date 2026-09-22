import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const allowed: string[] = (route.data['roles'] ?? []).map((r: string) => r.toLowerCase());
    const userRole = (this.auth.role ?? '').toLowerCase();

    if (!userRole) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    if (allowed.includes(userRole)) return true;

    const isMarketplaceRole = userRole === 'supplier' || userRole === 'contractor';
    if (!isMarketplaceRole && allowed.includes('admin')) return true;

    this.auth.redirectByRole();
    return false;
  }
}
