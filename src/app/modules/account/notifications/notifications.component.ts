import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationDto } from '../../../core/models/notification.models';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  standalone: false,
})
export class NotificationsComponent implements OnInit {
  notifications: NotificationDto[] = [];
  totalCount = 0;
  unreadCount = 0;
  page = 1;
  pageSize = 20;
  unreadOnly = false;
  loading = false;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.notificationService.getMine({ unreadOnly: this.unreadOnly || undefined, page: this.page, pageSize: this.pageSize })
      .subscribe({
        next: res => {
          this.notifications = res.notifications;
          this.totalCount = res.totalCount;
          this.unreadCount = res.unreadCount;
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
  }

  toggleUnreadOnly() {
    this.unreadOnly = !this.unreadOnly;
    this.page = 1;
    this.load();
  }

  markRead(n: NotificationDto) {
    if (n.isRead) return;
    this.notificationService.markRead(n.notificationID).subscribe(() => {
      n.isRead = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    });
  }

  markAllRead() {
    this.notificationService.markAllRead().subscribe(() => {
      this.notifications.forEach(n => n.isRead = true);
      this.unreadCount = 0;
    });
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.totalCount / this.pageSize)); }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.load();
  }
}
