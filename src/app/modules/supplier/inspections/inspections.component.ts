import { Component, OnInit } from '@angular/core';
import { InspectionService } from '../../../core/services/inspection.service';
import { InspectionListItemDto, InspectionOutcomeDto } from '../../../core/models/inspection.models';

@Component({
  selector: 'app-supplier-inspections',
  templateUrl: './inspections.component.html',
  styleUrls: ['./inspections.component.scss'],
  standalone: false,
})
export class SupplierInspectionsComponent implements OnInit {
  inspections: InspectionListItemDto[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 10;
  statusFilter = '';
  loading = false;

  statusOptions = ['Requested', 'Completed'];

  // Req: a supplier may only VIEW the outcome of an inspection on their own listing. Confirming
  // the outcome is an Admin/Contractor action (see AdminInspectionsComponent /
  // ContractorInspectionsComponent) — the API has no confirm endpoint for suppliers at all.
  selected: InspectionOutcomeDto | null = null;
  showOutcomeModal = false;
  error = '';

  constructor(private inspectionService: InspectionService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.inspectionService.supplierGetAll({
      status: this.statusFilter || undefined,
      page: this.page,
      pageSize: this.pageSize
    }).subscribe({
      next: res => {
        this.inspections = res.inspections ?? [];
        this.totalCount = res.totalCount;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  setStatus(status: string) {
    this.statusFilter = status;
    this.page = 1;
    this.load();
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.totalCount / this.pageSize)); }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.load();
  }

  viewOutcome(i: InspectionListItemDto) {
    this.error = '';
    this.showOutcomeModal = true;
    this.inspectionService.supplierGetForOutcome(i.inspectionID).subscribe({
      next: full => this.selected = full,
      error: err => {
        this.error = err?.error?.message || 'Could not load inspection details.';
      }
    });
  }

  closeOutcome() {
    this.showOutcomeModal = false;
    this.selected = null;
  }
}
