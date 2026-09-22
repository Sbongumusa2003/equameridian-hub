import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuditLogListItemDto, AuditLogDetailDto, AuditLogUserOptionDto } from '../../../core/models/audit-log.models';

@Component({
  selector: 'app-audit-log',
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.scss'],
  standalone: false,
})
export class AuditLogComponent implements OnInit, OnDestroy {
  logs: AuditLogListItemDto[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 25;
  search = '';
  eventTypeFilter = '';
  userFilter: number | null = null;
  fromDate = '';
  toDate = '';
  loading = false;
  exporting = false;

  eventTypes: string[] = [];
  users: AuditLogUserOptionDto[] = [];

  selected: AuditLogDetailDto | null = null;
  showDetailModal = false;

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;

  constructor(private auditLogService: AuditLogService, private route: ActivatedRoute) {}

  ngOnInit() {
    const searchParam = this.route.snapshot.queryParamMap.get('search');
    if (searchParam) this.search = searchParam;

    this.auditLogService.getEventTypes().subscribe(t => this.eventTypes = t);
    this.auditLogService.getUsers().subscribe(u => this.users = u);

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
    this.auditLogService.getAll({
      search: this.search,
      eventType: this.eventTypeFilter || undefined,
      userId: this.userFilter ?? undefined,
      from: this.fromDate || undefined,
      to: this.toDate || undefined,
      page: this.page,
      pageSize: this.pageSize
    }).subscribe({
      next: res => {
        this.logs = res.logs ?? [];
        this.totalCount = res.totalCount;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilters() {
    this.page = 1;
    this.load();
  }

  clearFilters() {
    this.eventTypeFilter = '';
    this.userFilter = null;
    this.fromDate = '';
    this.toDate = '';
    this.search = '';
    this.page = 1;
    this.load();
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.totalCount / this.pageSize)); }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.load();
  }

  viewDetail(log: AuditLogListItemDto) {
    this.selected = log;
    this.showDetailModal = true;
    this.auditLogService.getById(log.auditID).subscribe(full => this.selected = full);
  }

  closeDetail() {
    this.showDetailModal = false;
    this.selected = null;
  }

  private currentExportParams() {
    return {
      search: this.search,
      eventType: this.eventTypeFilter || undefined,
      userId: this.userFilter ?? undefined,
      from: this.fromDate || undefined,
      to: this.toDate || undefined
    };
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  exportCsv() {
    this.exporting = true;
    this.auditLogService.exportCsv(this.currentExportParams()).subscribe({
      next: blob => {
        this.exporting = false;
        this.downloadBlob(blob, `audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
      },
      error: () => { this.exporting = false; }
    });
  }

  exportPdf() {
    this.exporting = true;
    this.auditLogService.exportPdf(this.currentExportParams()).subscribe({
      next: blob => {
        this.exporting = false;
        this.downloadBlob(blob, `audit-log-${new Date().toISOString().slice(0, 10)}.pdf`);
      },
      error: () => { this.exporting = false; }
    });
  }
}
