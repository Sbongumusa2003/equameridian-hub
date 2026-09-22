import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { Router, NavigationStart } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationDto } from '../../core/models/notification.models';
import { CartService } from '../../core/services/cart.service';

export interface NotificationToast extends NotificationDto {
  toastId: number;
}

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  standalone : false,
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  cartItemCount = 0;
  menuOpen = false;
  toasts: NotificationToast[] = [];
  private nextToastId = 1;
  private pollSub?: Subscription;
  private countSub?: Subscription;
  private routeSub?: Subscription;
  private newNotificationsSub?: Subscription;
  private cartCountSub?: Subscription;
  private readonly adminGroupRoutes: Record<string, string[]> = {
    overview: ['/admin/dashboard'],
    users: ['/admin/users'],
    listings: ['/admin/listings', '/admin/inspections'],
    resolution: ['/admin/disputes', '/admin/refunds', '/admin/payouts', '/admin/invoices'],
    compliance: ['/admin/content-rules', '/admin/reviews'],
    marketing: ['/admin/campaigns', '/admin/announcements'],
    analytics: ['/admin/reports'],
    platform: ['/admin/platform-fees', '/admin/roles', '/admin/timer-configuration', '/admin/data-export', '/admin/backup', '/admin/audit-log'],
  };
  openAdminGroups = new Set<string>(['overview']);

  constructor(
    public auth: AuthService,
    private notificationService: NotificationService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.countSub = this.notificationService.unreadCount$.subscribe(count => this.unreadCount = count);
    this.pollSub = interval(60000).subscribe(() => this.notificationService.refreshUnreadCount());
    this.newNotificationsSub = this.notificationService.newNotifications$.subscribe(items => {
      items.forEach(n => this.pushToast(n));
    });
    this.notificationService.refreshUnreadCount();
    if (this.isContractor) {
      this.cartCountSub = this.cartService.itemCount$.subscribe(count => this.cartItemCount = count);
      this.cartService.refreshCount();
    }
    this.openActiveAdminGroup(this.router.url);
    this.routeSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.menuOpen = false;
        this.openActiveAdminGroup(event.url);
      }
    });
  }

  private pushToast(notification: NotificationDto) {
    const toast: NotificationToast = { ...notification, toastId: this.nextToastId++ };
    this.toasts = [toast, ...this.toasts].slice(0, 4);
    setTimeout(() => this.dismissToast(toast.toastId), 8000);
  }

  dismissToast(toastId: number) {
    this.toasts = this.toasts.filter(t => t.toastId !== toastId);
  }

  openToast(toast: NotificationToast) {
    this.dismissToast(toast.toastId);
    this.router.navigate(['/account/notifications']);
  }

  
  private openActiveAdminGroup(url: string) {
    for (const [groupId, prefixes] of Object.entries(this.adminGroupRoutes)) {
      if (prefixes.some(prefix => url.startsWith(prefix))) {
        this.openAdminGroups.add(groupId);
        break;
      }
    }
  }

  isAdminGroupOpen(groupId: string): boolean {
    return this.openAdminGroups.has(groupId);
  }

  toggleAdminGroup(groupId: string, event?: Event) {
    event?.stopPropagation();
    if (this.openAdminGroups.has(groupId)) {
      this.openAdminGroups.delete(groupId);
    } else {
      this.openAdminGroups.add(groupId);
    }
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
    this.countSub?.unsubscribe();
    this.routeSub?.unsubscribe();
    this.newNotificationsSub?.unsubscribe();
    this.cartCountSub?.unsubscribe();
  }

  toggleMenu() { this.menuOpen = !this.menuOpen; }
  closeMenu()  { this.menuOpen = false; }

  @HostListener('window:keydown.escape')
  onEscape() { this.closeMenu(); }

  get isAdmin() {
    const r = this.auth.role;
    return !!r && r !== 'supplier' && r !== 'contractor';
  }
  get isSupplier()   { return this.auth.role === 'supplier'; }
  get isContractor() { return this.auth.role === 'contractor'; }

  can(permission: string): boolean {
    return this.auth.hasPermission(permission);
  }

  canAny(...permissions: string[]): boolean {
    return this.auth.hasAnyPermission(...permissions);
  }

  canSeeAdminGroup(groupId: string): boolean {
    const map: Record<string, string[]> = {
      overview: [], // dashboard always for internal staff
      users: ['Users.ManageInternal'],
      listings: ['Listings.Manage', 'Inspections.Manage'],
      resolution: ['Disputes.Manage', 'Refunds.Manage', 'Payouts.Manage', 'Invoices.View'],
      compliance: ['ContentRules.Manage', 'Reviews.Manage'],
      marketing: ['Campaigns.Manage', 'Announcements.Manage'],
      analytics: ['Reports.View', 'Reports.Export'],
      platform: ['PlatformFees.Manage', 'Roles.Manage', 'Timers.Manage', 'DataExport.Manage', 'Backup.Manage', 'AuditLog.View'],
    };
    const keys = map[groupId];
    if (!keys) return this.isAdmin;
    if (keys.length === 0) return this.isAdmin; 
    return this.canAny(...keys);
  }

  get initials(): string {
    const name = this.auth.currentUser?.fullName ?? '';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  logout() { this.auth.logout(); }
}