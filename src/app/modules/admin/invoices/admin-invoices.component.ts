import { Component, OnInit } from '@angular/core';
import { InvoiceService } from '../../../core/services/invoice.service';
import { PaymentService } from '../../../core/services/payment.service';
import { InvoiceListItemDto, InvoiceDto } from '../../../core/models/invoice.models';

@Component({
  selector: 'app-admin-invoices',
  templateUrl: './admin-invoices.component.html',
  styleUrls: ['./admin-invoices.component.scss'],
  standalone: false,
})
export class AdminInvoicesComponent implements OnInit {
  invoices: InvoiceListItemDto[] = [];
  loading = true;
  page = 1;
  pageSize = 10;
  totalCount = 0;

  showGenerateModal = false;
  quotationId: number | null = null;
  generating = false;
  generateError = '';
  generateSuccess = '';

  showDetailModal = false;
  selectedInvoice: InvoiceDto | null = null;

  constructor(private invoiceService: InvoiceService, private paymentService: PaymentService) {}

  syncingId: number | null = null;
  syncMessage = '';

  forceSync(invoiceId: number) {
    this.syncingId = invoiceId;
    this.syncMessage = '';
    this.paymentService.forceSync(invoiceId).subscribe({
      next: res => {
        this.syncingId = null;
        this.syncMessage = res.changed
          ? `Status updated: ${res.previousStatus} → ${res.status}`
          : `Still ${res.status} (no change from PayFast).`;
        this.load();
        if (this.selectedInvoice?.invoiceID === invoiceId) {
          this.invoiceService.getById(invoiceId).subscribe(full => this.selectedInvoice = full);
        }
      },
      error: err => {
        this.syncingId = null;
        this.syncMessage = err?.error?.message || 'Force sync failed.';
      }
    });
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.invoiceService.getAll({ page: this.page, pageSize: this.pageSize }).subscribe({
      next: res => {
        this.invoices = res.invoices;
        this.totalCount = res.totalCount;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get totalPages() { return Math.max(1, Math.ceil(this.totalCount / this.pageSize)); }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.load();
  }

  openGenerateModal() {
    this.quotationId = null;
    this.generateError = '';
    this.generateSuccess = '';
    this.showGenerateModal = true;
  }

  closeGenerateModal() {
    this.showGenerateModal = false;
  }

  generate() {
    if (!this.quotationId) {
      this.generateError = 'Please enter a quotation ID.';
      return;
    }
    this.generating = true;
    this.generateError = '';
    this.generateSuccess = '';
    this.invoiceService.adminGenerate(this.quotationId).subscribe({
      next: res => {
        this.generating = false;
        this.generateSuccess = res.message;
        this.page = 1;
        this.load();
      },
      error: err => {
        this.generating = false;
        this.generateError = err?.error?.message ?? 'Could not generate invoice for that quotation.';
      }
    });
  }

  viewDetail(inv: InvoiceListItemDto) {
    this.showDetailModal = true;
    this.selectedInvoice = null;
    this.invoiceService.getById(inv.invoiceID).subscribe(full => this.selectedInvoice = full);
  }

  closeDetail() {
    this.showDetailModal = false;
    this.selectedInvoice = null;
  }
}
