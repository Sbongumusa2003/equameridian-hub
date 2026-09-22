import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InvoiceService } from '../../../core/services/invoice.service';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { InvoiceDto } from '../../../core/models/invoice.models';
import { ReceiptDataDto, InitiatePaymentResponseDto } from '../../../core/models/payment.models';

@Component({
  selector: 'app-invoice-detail',
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.scss'],
  standalone: false,
})
export class InvoiceDetailComponent implements OnInit {
  invoice: InvoiceDto | null = null;
  loading = true;

  paying = false;
  payError = '';
  payErrorLeaseId: number | null = null;

  receipt: ReceiptDataDto | null = null;
  loadingReceipt = false;
  receiptError = '';
  eft: InitiatePaymentResponseDto | null = null;
  proofName = '';
  confirmingEft = false;

  constructor(
    private route: ActivatedRoute,
    private invoiceService: InvoiceService,
    private paymentService: PaymentService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.invoiceService.getById(id).subscribe({
      next: inv => {
        this.invoice = inv;
        this.loading = false;
        if (this.isContractor && this.canPay) this.payNow(true);
      },
      error: () => { this.loading = false; }
    });
  }

  get isContractor() { return this.auth.role === 'contractor'; }
  get isPaid() { return (this.invoice?.paymentStatus ?? '').toLowerCase() === 'paid'; }
  get isCancelled() {
    const ps = (this.invoice?.paymentStatus ?? '').toLowerCase();
    const st = (this.invoice?.status ?? '').toLowerCase();
    return ps === 'cancelled' || st === 'cancelled';
  }
  get canPay() { return !this.isPaid && !this.isCancelled; }

  payNow(silent = false) {
    if (!this.invoice) return;
    this.paying = true;
    this.payError = '';
    this.payErrorLeaseId = null;
    this.paymentService.initiate(this.invoice.invoiceID).subscribe({
      next: res => {
        this.paying = false;
        if ((res.method || '').toUpperCase() === 'EFT') {
          this.eft = res;
          return;
        }
        if (!silent) this.paymentService.redirectToCheckout(res);
      },
      error: err => {
        this.paying = false;
        this.payError = err?.error?.message ?? 'Could not start checkout. Please try again.';
        this.payErrorLeaseId = err?.error?.leaseAgreementId ?? null;
      }
    });
  }

  viewReceipt() {
    if (!this.invoice) return;
    this.loadingReceipt = true;
    this.receiptError = '';
    this.paymentService.getReceipt(this.invoice.invoiceID).subscribe({
      next: r => { this.receipt = r; this.loadingReceipt = false; },
      error: err => {
        this.loadingReceipt = false;
        this.receiptError = err?.error?.message ?? 'Receipt is not available yet.';
      }
    });
  }

  closeReceipt() { this.receipt = null; }

  downloadPdf() {
    if (this.invoice)
      this.invoiceService.savePdfFile(this.invoice.invoiceID, this.invoice.invoiceNumber + '.pdf');
  }

  onProofSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.invoice) return;
    this.proofName = file.name;
    this.paymentService.uploadEftProof(this.invoice.invoiceID, file).subscribe({
      next: () => {
        if (this.invoice) this.invoice.hasEftProof = true;
        this.invoice!.eftProofFileName = file.name;
        this.invoice!.paymentStatus = 'EftSubmitted';
      },
      error: err => { this.payError = err?.error?.message ?? 'Could not upload proof.'; }
    });
  }

  downloadProof() {
    if (!this.invoice) return;
    this.paymentService.downloadEftProof(this.invoice.invoiceID).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.invoice?.eftProofFileName || 'proof-of-payment';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  confirmEft() {
    if (!this.invoice) return;
    this.confirmingEft = true;
    this.paymentService.confirmEftReceived(this.invoice.invoiceID).subscribe({
      next: () => {
        this.confirmingEft = false;
        if (this.invoice) this.invoice.paymentStatus = 'Paid';
      },
      error: err => {
        this.confirmingEft = false;
        this.payError = err?.error?.message ?? 'Could not confirm EFT.';
      }
    });
  }
}
