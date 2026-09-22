import { Component } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';
import { AnnouncementResultDto } from '../../../core/models/notification.models';

@Component({
  selector: 'app-admin-announcements',
  templateUrl: './announcements.component.html',
  styleUrls: ['./announcements.component.scss'],
  standalone: false,
})
export class AdminAnnouncementsComponent {
  form = { title: '', body: '', targetRole: '' };
  sending = false;
  error = '';
  result: AnnouncementResultDto | null = null;

  constructor(private notificationService: NotificationService) {}

  send() {
    if (!this.form.title.trim() || !this.form.body.trim()) return;
    this.sending = true;
    this.error = '';
    this.result = null;
    this.notificationService.broadcastAnnouncement({
      title: this.form.title.trim(),
      body: this.form.body.trim(),
      targetRole: this.form.targetRole || null
    }).subscribe({
      next: res => {
        this.sending = false;
        this.result = res;
        this.form = { title: '', body: '', targetRole: '' };
      },
      error: err => {
        this.sending = false;
        this.error = err?.error?.message ?? 'Could not send the announcement.';
      }
    });
  }
}
