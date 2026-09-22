import { Component, OnInit } from '@angular/core';
import { InvoiceService } from '../../../core/services/invoice.service';
import { InvoiceListItemDto } from '../../../core/models/invoice.models';

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss'],
  standalone: false,
})
export class InvoicesComponent implements OnInit {
  invoices: InvoiceListItemDto[] = [];
  loading = true;
  page = 1;
  pageSize = 10;
  totalCount = 0;

  constructor(private invoiceService: InvoiceService) {}

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

  downloadPdf(id: number) {
    this.invoiceService.savePdfFile(id, 'invoice.pdf');
  }
}
