import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RefundService } from '../../../core/services/refund.service';
import { RefundDto } from '../../../core/models/refund.models';

@Component({
  selector: 'app-admin-refunds',
  templateUrl: './refunds.component.html',
  styleUrls: ['./refunds.component.scss'],
  standalone: false,
})
export class AdminRefundsComponent implements OnInit, OnDestroy {
  refunds: RefundDto[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 10;
  search = '';
  statusFilter = '';
  loading = false;

  statusOptions = ['Pending', 'Processed', 'Rejected'];

  selected: RefundDto | null = null;
  showDetailModal = false;
  processing = false;
  processError = '';
  adminNotes = '';
  failureReason = '';

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;

  constructor(private refundService: RefundService) {}

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
    this.refundService.getAll({
      search: this.search,
      status: this.statusFilter,
      page: this.page,
      pageSize: this.pageSize
    }).subscribe({
      next: res => {
        this.refunds = res.refunds ?? [];
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

  viewDetail(refund: RefundDto) {
    this.selected = refund;
    this.showDetailModal = true;
    this.refundService.getById(refund.refundID).subscribe(full => this.selected = full);
  }

  closeDetail() {
    this.showDetailModal = false;
    this.selected = null;
    this.processError = '';
    this.adminNotes = '';
    this.failureReason = '';
  }

  approveRefund() {
    this.runProcess('Processed');
  }

  declineRefund() {
    if (!this.failureReason.trim()) {
      this.processError = 'Please provide a reason for declining this refund.';
      return;
    }
    this.runProcess('Rejected');
  }

  private runProcess(newStatus: string) {
    if (!this.selected) return;
    this.processing = true;
    this.processError = '';
    this.refundService.process(this.selected.refundID, {
      newStatus,
      administratorNotes: this.adminNotes || undefined,
      failureReason: newStatus === 'Rejected' ? this.failureReason : undefined
    }).subscribe({
      next: () => {
        this.processing = false;
        this.closeDetail();
        this.load();
      },
      error: err => {
        this.processing = false;
        this.processError = err.error?.message ?? 'Could not process this refund. Please try again.';
      }
    });
  }
}
