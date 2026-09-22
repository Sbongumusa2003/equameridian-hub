import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from '../../../../core/services/message.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ThreadDetailDto } from '../../../../core/models/message.models';

@Component({
  selector: 'app-thread-detail',
  templateUrl: './thread-detail.component.html',
  styleUrls: ['./thread-detail.component.scss'],
  standalone: false,
})
export class ThreadDetailComponent implements OnInit {
  threadId!: number;
  thread: ThreadDetailDto | null = null;
  loading = true;
  replyBody = '';
  attachment: File | null = null;
  sending = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private messageService: MessageService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.threadId = Number(this.route.snapshot.paramMap.get('threadId'));
    this.load();
  }

  load() {
    this.loading = true;
    this.messageService.getThreadDetail(this.threadId).subscribe({
      next: t => { this.thread = t; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  isMine(senderId: number): boolean {
    return senderId === this.auth.currentUser?.userID;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.attachment = input.files?.[0] ?? null;
  }

  sendReply() {
    if (!this.replyBody.trim()) return;
    this.sending = true;
    this.error = '';
    this.messageService.reply(this.threadId, this.replyBody.trim(), this.attachment ?? undefined).subscribe({
      next: () => {
        this.sending = false;
        this.replyBody = '';
        this.attachment = null;
        this.load();
      },
      error: err => {
        this.sending = false;
        this.error = err?.error?.message ?? 'Could not send reply.';
      }
    });
  }
}
