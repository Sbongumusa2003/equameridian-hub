import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DisputeService } from '../../../core/services/dispute.service';
import { DisputeListItemDto } from '../../../core/models/dispute.models';

@Component({
  selector: 'app-admin-disputes',
  templateUrl: './disputes.component.html',
  styleUrls: ['./disputes.component.scss'],
  standalone: false,
})
export class AdminDisputesComponent implements OnInit, OnDestroy {
  disputes: DisputeListItemDto[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 10;
  search = '';
  statusFilter = '';
  loading = false;

  statusOptions = ['Open', 'Under Review', 'Resolved', 'Escalated'];

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;

  constructor(private disputeService: DisputeService) {}

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
    this.disputeService.adminGetAll({
      search: this.search,
      status: this.statusFilter,
      page: this.page,
      pageSize: this.pageSize
    }).subscribe({
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
