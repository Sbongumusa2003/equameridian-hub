import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MessageService } from '../../../core/services/message.service';
import { ThreadListItemDto, RecipientSearchResult } from '../../../core/models/message.models';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
  standalone: false,
})
export class MessagesComponent implements OnInit {
  threads: ThreadListItemDto[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 20;
  search = '';
  loading = false;

  showNewMessage = false;
  newRecipientId: number | null = null;
  newRecipientQuery = '';
  recipientResults: RecipientSearchResult[] = [];
  recipientSearching = false;
  showRecipientDropdown = false;
  newBody = '';
  sending = false;
  sendError = '';

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;
  private recipientSearchSubject = new Subject<string>();
  private recipientSearchSub!: Subscription;

  constructor(private messageService: MessageService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    const rid = Number(this.route.snapshot.queryParamMap.get('recipientId'));
    const rname = this.route.snapshot.queryParamMap.get('name') || '';
    if (rid) {
      this.showNewMessage = true;
      this.newRecipientId = rid;
      this.newRecipientQuery = rname;
    }

    this.searchSub = this.searchSubject.pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(value => { this.search = value; this.page = 1; this.load(); });

    this.recipientSearchSub = this.recipientSearchSubject.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(value => this.runRecipientSearch(value));

    this.load();
  }

  ngOnDestroy() {
    this.searchSub?.unsubscribe();
    this.recipientSearchSub?.unsubscribe();
  }

  onSearch(value: string) { this.searchSubject.next(value); }

  load() {
    this.loading = true;
    this.messageService.getThreads({ search: this.search, page: this.page, pageSize: this.pageSize })
      .subscribe({
        next: res => { this.threads = res.threads; this.totalCount = res.totalCount; this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  openThread(threadId: number) {
    this.router.navigate(['/account/messages', threadId]);
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.totalCount / this.pageSize)); }
  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.load();
  }

  startNewMessage() {
    this.showNewMessage = true;
    this.newRecipientId = null;
    this.newRecipientQuery = '';
    this.recipientResults = [];
    this.showRecipientDropdown = false;
    this.newBody = '';
    this.sendError = '';
  }

  cancelNewMessage() { this.showNewMessage = false; }

  /** Called on every keystroke in the recipient field. Typing after a selection clears it,
   * since the query no longer refers to the previously chosen person. */
  onRecipientQueryChange(value: string) {
    this.newRecipientQuery = value;
    this.newRecipientId = null;
    if (value.trim().length < 2) {
      this.recipientResults = [];
      this.showRecipientDropdown = false;
      return;
    }
    this.recipientSearchSubject.next(value.trim());
  }

  private runRecipientSearch(value: string) {
    this.recipientSearching = true;
    this.messageService.searchRecipients(value).subscribe({
      next: results => {
        this.recipientResults = results;
        this.recipientSearching = false;
        this.showRecipientDropdown = true;
      },
      error: () => { this.recipientSearching = false; }
    });
  }

  selectRecipient(user: RecipientSearchResult) {
    this.newRecipientId = user.userID;
    this.newRecipientQuery = `${user.fullName} (${user.role})`;
    this.recipientResults = [];
    this.showRecipientDropdown = false;
  }

  hideRecipientDropdownSoon() {
    // Delay so a click on a dropdown item registers before the list disappears.
    setTimeout(() => { this.showRecipientDropdown = false; }, 150);
  }

  sendNewMessage() {
    if (!this.newRecipientId || !this.newBody.trim()) return;
    this.sending = true;
    this.sendError = '';
    this.messageService.send(this.newRecipientId, this.newBody.trim()).subscribe({
      next: msg => {
        this.sending = false;
        this.showNewMessage = false;
        this.router.navigate(['/account/messages', msg.threadID]);
      },
      error: err => {
        this.sending = false;
        this.sendError = err?.error?.message ?? 'Could not send message. Please try again.';
      }
    });
  }
}
