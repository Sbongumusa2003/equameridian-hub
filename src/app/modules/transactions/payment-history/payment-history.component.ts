import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../../core/services/payment.service';
import { RefundService } from '../../../core/services/refund.service';
import { AuthService } from '../../../core/services/auth.service';
import { PaymentHistoryItemDto } from '../../../core/models/payment.models';
import { SupplierPaymentHistoryItemDto } from '../../../core/models/payout.models';

@Component({
  selector: 'app-payment-history',
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.scss'],
  standalone: false,
})
export class PaymentHistoryComponent implements OnInit {
  payments: (PaymentHistoryItemDto | SupplierPaymentHistoryItemDto)[] = [];
  loading = true;
  error = '';

  statusFilter = '';
  sort = 'Newest';
  page = 1;
  pageSize = 10;
  totalCount = 0;

  constructor(
    private paymentService: PaymentService,
    private refundService: RefundService,
    private auth: AuthService
  ) {}

  get isSupplier(): boolean { return this.auth.role === 'supplier'; }

  get statusOptions(): string[] {
    return this.isSupplier ? ['Approved'] : ['Pending', 'Paid', 'Failed', 'Refunded'];
  }

  showRefundModal = false;
  refundTarget: PaymentHistoryItemDto | null = null;
  refundReason = '';
  refundSubmitting = false;
  refundError = '';
  refundSuccessId: number | null = null;

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error = '';

    this.paymentService.getHistory({
      status: this.statusFilter || undefined,
      sort: this.sort,
      page: this.page,
      pageSize: this.pageSize
    }).subscribe({
      next: res => {
        this.payments = res.payments;
        this.totalCount = res.totalCount;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load payment history.';
        this.loading = false;
      }
    });
  }

  get totalPages() { return Math.max(1, Math.ceil(this.totalCount / this.pageSize)); }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.load();
  }

  onFilterChange() {
    this.page = 1;
    this.load();
  }

  openRefundRequest(payment: PaymentHistoryItemDto | SupplierPaymentHistoryItemDto) {
    if (!('paymentID' in payment)) return; // supplier rows never reach here (button is hidden for them)
    this.refundTarget = payment;
    this.refundReason = '';
    this.refundError = '';
    this.showRefundModal = true;
  }

  closeRefundRequest() {
    this.showRefundModal = false;
    this.refundTarget = null;
  }

  submitRefundRequest() {
    if (!this.refundTarget) return;
    if (!this.refundReason.trim()) {
      this.refundError = 'Please describe the reason for this refund request.';
      return;
    }

    this.refundSubmitting = true;
    this.refundError = '';
    this.refundService.requestRefund(this.refundTarget.paymentID, this.refundReason).subscribe({
      next: refund => {
        this.refundSubmitting = false;
        this.refundSuccessId = refund.refundID;
        this.showRefundModal = false;
        this.refundTarget = null;
        setTimeout(() => this.refundSuccessId = null, 5000);
      },
      error: err => {
        this.refundSubmitting = false;
        this.refundError = err.error?.message ?? 'Could not submit refund request. Please try again.';
      }
    });
  }
}

