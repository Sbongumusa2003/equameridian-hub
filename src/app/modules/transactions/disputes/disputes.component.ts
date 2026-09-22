import { Component, OnInit } from '@angular/core';
import { DisputeService } from '../../../core/services/dispute.service';
import { DisputeListItemDto } from '../../../core/models/dispute.models';

@Component({
  selector: 'app-disputes',
  templateUrl: './disputes.component.html',
  styleUrls: ['./disputes.component.scss'],
  standalone: false,
})
export class DisputesComponent implements OnInit {
  disputes: DisputeListItemDto[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 10;
  loading = false;

  constructor(private disputeService: DisputeService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.disputeService.getMine({ page: this.page, pageSize: this.pageSize }).subscribe({
      next: res => {
        this.disputes = res.disputes ?? [];
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
}
