import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { QuotationService } from '../../../core/services/quotation.service';
import { QuotationListItemDto } from '../../../core/models/quotation.models';

@Component({
  selector: 'app-quotations',
  templateUrl: './quotations.component.html',
  styleUrls: ['./quotations.component.scss'],
  standalone: false,
})
export class QuotationsComponent implements OnInit {
  quotations: QuotationListItemDto[] = [];
  loading = true;
  search = '';
  status: string | undefined;
  page = 1;
  pageSize = 10;
  totalCount = 0;

  compareList: number[] = [];

  constructor(private quotationService: QuotationService, private router: Router) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.quotationService.contractorGetAll({
      search: this.search || undefined,
      status: this.status,
      page: this.page,
      pageSize: this.pageSize
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

  toggleCompare(id: number) {
    const idx = this.compareList.indexOf(id);
    if (idx >= 0) this.compareList.splice(idx, 1);
    else if (this.compareList.length < 4) this.compareList.push(id);
  }

  isSelected(id: number) { return this.compareList.includes(id); }

  isComparable(q: QuotationListItemDto) {
    return q.status === 'Submitted' || q.status === 'Accepted';
  }

  goCompare() {
    this.router.navigate(['/contractor/quotations/compare'], {
      queryParams: { ids: this.compareList.join(',') }
    });
  }

  countdown(q: { quoteValidUntil?: string; status?: string }): string {
    if (!q.quoteValidUntil) return '';
    const end = new Date(q.quoteValidUntil).getTime();
    const ms = end - Date.now();
    if (ms <= 0) return q.status === 'Expired' ? 'Expired' : 'Expired — waiting for job';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 48 ? `${Math.floor(h / 24)}d left` : `${h}h ${m}m left`;
  }
}
