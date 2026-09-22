import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CampaignService } from '../../../core/services/campaign.service';
import { CampaignDto, CampaignTypes, CampaignStatuses } from '../../../core/models/campaign.models';

@Component({
  selector: 'app-admin-campaigns',
  templateUrl: './campaigns.component.html',
  styleUrls: ['./campaigns.component.scss'],
  standalone: false,
})
export class AdminCampaignsComponent implements OnInit, OnDestroy {
  campaigns: CampaignDto[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 10;
  search = '';
  typeFilter = '';
  statusFilter = '';
  loading = false;

  campaignTypes = CampaignTypes;
  campaignStatuses = CampaignStatuses;

  showDeleteConfirm = false;
  toDelete: CampaignDto | null = null;
  deleting = false;

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;

  constructor(private campaignService: CampaignService) {}

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
    this.campaignService.getAll({
      search: this.search,
      type: this.typeFilter,
      status: this.statusFilter,
      page: this.page,
      pageSize: this.pageSize
    }).subscribe({
      next: res => {
        this.campaigns = res.campaigns ?? [];
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

  confirmDelete(c: CampaignDto) {
    this.toDelete = c;
    this.showDeleteConfirm = true;
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.toDelete = null;
  }

  doDelete() {
    if (!this.toDelete) return;
    this.deleting = true;
    this.campaignService.delete(this.toDelete.campaignID).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.toDelete = null;
        this.load();
      },
      error: () => { this.deleting = false; }
    });
  }
}
