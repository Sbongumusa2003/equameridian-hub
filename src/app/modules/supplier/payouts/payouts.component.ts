import { Component, OnInit } from '@angular/core';
import { PayoutService } from '../../../core/services/payout.service';
import { EligibleInvoiceDto, PayoutDto } from '../../../core/models/payout.models';

@Component({
  selector: 'app-supplier-payouts',
  templateUrl: './payouts.component.html',
  styleUrls: ['./payouts.component.scss'],
  standalone: false,
})
export class SupplierPayoutsComponent implements OnInit {
  eligibleInvoices: EligibleInvoiceDto[] = [];
  myPayouts: PayoutDto[] = [];
  loadingEligible = true;
  loadingPayouts = true;
  error = '';

  showRequestModal = false;
  requestTarget: EligibleInvoiceDto | null = null;
  requestNotes = '';
  requestSubmitting = false;
  requestError = '';
  requestSuccessId: number | null = null;

  constructor(private payoutService: PayoutService) {}

  ngOnInit() {
    this.loadEligible();
    this.loadPayouts();
  }

  loadEligible() {
    this.loadingEligible = true;
    this.payoutService.getEligibleInvoices().subscribe({
      next: invoices => {
        this.eligibleInvoices = invoices;
        this.loadingEligible = false;
      },
      error: () => {
        this.error = 'Failed to load invoices available for payout.';
        this.loadingEligible = false;
      }
    });
  }

  loadPayouts() {
    this.loadingPayouts = true;
    this.payoutService.getMyPayouts().subscribe({
      next: payouts => {
        this.myPayouts = payouts;
        this.loadingPayouts = false;
      },
      error: () => { this.loadingPayouts = false; }
    });
  }

  openRequestModal(invoice: EligibleInvoiceDto) {
    this.requestTarget = invoice;
    this.requestNotes = '';
    this.requestError = '';
    this.showRequestModal = true;
  }

  closeRequestModal() {
    this.showRequestModal = false;
    this.requestTarget = null;
  }

  submitRequest() {
    if (!this.requestTarget) return;

    this.requestSubmitting = true;
    this.requestError = '';
    this.payoutService.requestPayout(this.requestTarget.invoiceID, this.requestNotes || undefined).subscribe({
      next: payout => {
        this.requestSubmitting = false;
        this.requestSuccessId = payout.payoutID;
        this.showRequestModal = false;
        this.requestTarget = null;
        setTimeout(() => this.requestSuccessId = null, 5000);
        this.loadEligible();
        this.loadPayouts();
      },
      error: err => {
        this.requestSubmitting = false;
        this.requestError = err.error?.message ?? 'Could not submit payout request. Please try again.';
      }
    });
  }
}
