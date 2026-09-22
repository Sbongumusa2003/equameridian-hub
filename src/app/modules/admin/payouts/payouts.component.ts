import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PayoutService } from '../../../core/services/payout.service';
import { PayoutDto } from '../../../core/models/payout.models';

@Component({
  selector: 'app-admin-payouts',
  templateUrl: './payouts.component.html',
  styleUrls: ['./payouts.component.scss'],
  standalone: false,
})
export class AdminPayoutsComponent implements OnInit, OnDestroy {
  payouts: PayoutDto[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 10;
  search = '';
  statusFilter = '';
  loading = false;

  statusOptions = ['Pending', 'Approved', 'Declined'];

  selected: PayoutDto | null = null;
  showDetailModal = false;
  processing = false;
  processError = '';
  adminNotes = '';
  declineReason = '';

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;

  constructor(private payoutService: PayoutService) {}

  ngOnInit() {
    this.searchSub = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(value => {
      this.search = value;
      this.page = 1;
      this.load();
    });
    this.load();
  }

  ngOnDestroy() { this.searchSub?.unsubscribe(); }

  onSearch(value: string) { this.searchSubject.next(value); }

  load() {
    this.loading = true;
    this.payoutService.getAll({
      search: this.search,
      status: this.statusFilter,
      page: this.page,
      pageSize: this.pageSize
    }).subscribe({
      next: res => {
        this.payouts = res.payouts ?? [];
        this.totalCount = res.totalCount;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.totalCount / this.pageSize)); }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.load();
  }

  viewDetail(payout: PayoutDto) {
    this.selected = payout;
    this.showDetailModal = true;
    this.payoutService.getById(payout.payoutID).subscribe(full => this.selected = full);
  }

  closeDetail() {
    this.showDetailModal = false;
    this.selected = null;
    this.processError = '';
    this.adminNotes = '';
    this.declineReason = '';
  }

  approvePayout() {
    this.runProcess('Approved');
  }

  declinePayout() {
    if (!this.declineReason.trim()) {
      this.processError = 'Please provide a reason for declining this payout.';
      return;
    }
    this.runProcess('Declined');
  }

  private runProcess(newStatus: string) {
    if (!this.selected) return;
    this.processing = true;
    this.processError = '';
    this.payoutService.process(this.selected.payoutID, {
      newStatus,
      administratorNotes: this.adminNotes || undefined,
      declineReason: newStatus === 'Declined' ? this.declineReason : undefined
    }).subscribe({
      next: () => {
        this.processing = false;
        this.closeDetail();
        this.load();
      },
      error: err => {
        this.processing = false;
        this.processError = err.error?.message ?? 'Could not process this payout. Please try again.';
      }
    });
  }
}
