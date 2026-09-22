import { Component, OnInit } from '@angular/core';
import { QuotationService } from '../../../core/services/quotation.service';
import { QuotationListItemDto } from '../../../core/models/quotation.models';

@Component({
  selector: 'app-supplier-quotations',
  templateUrl: './quotations.component.html',
  styleUrls: ['./quotations.component.scss'],
  standalone: false,
})
export class SupplierQuotationsComponent implements OnInit {
  quotations: QuotationListItemDto[] = [];
  loading = true;
  status: string | undefined;
  page = 1;
  pageSize = 10;
  totalCount = 0;

  constructor(private quotationService: QuotationService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.quotationService.supplierGetAll({
      status: this.status, page: this.page, pageSize: this.pageSize
    }).subscribe({
      next: res => {
        this.quotations = res.quotations;
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

  setStatus(s: string | undefined) {
    this.status = s;
    this.page = 1;
    this.load();
  }
}
