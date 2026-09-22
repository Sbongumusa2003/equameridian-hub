import { Component, OnInit } from '@angular/core';
import { LeaseAgreementService } from '../../../core/services/lease-agreement.service';
import { LeaseAgreementListItemDto } from '../../../core/models/lease-agreement.models';

@Component({
  selector: 'app-lease-agreements',
  templateUrl: './lease-agreements.component.html',
  styleUrls: ['./lease-agreements.component.scss'],
  standalone: false,
})
export class LeaseAgreementsComponent implements OnInit {
  agreements: LeaseAgreementListItemDto[] = [];
  loading = true;
  page = 1;
  pageSize = 10;
  totalCount = 0;

  constructor(private leaseAgreementService: LeaseAgreementService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.leaseAgreementService.getAll({ page: this.page, pageSize: this.pageSize }).subscribe({
      next: res => {
        this.agreements = res.agreements;
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
}
