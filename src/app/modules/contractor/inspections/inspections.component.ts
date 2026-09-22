import { Component, OnInit } from '@angular/core';
import { InspectionService } from '../../../core/services/inspection.service';
import { InspectionListItemDto, InspectionOutcomeDto, MachineryOptionDto } from '../../../core/models/inspection.models';

@Component({
  selector: 'app-contractor-inspections',
  templateUrl: './inspections.component.html',
  styleUrls: ['./inspections.component.scss'],
  standalone: false,
})
export class ContractorInspectionsComponent implements OnInit {
  inspections: InspectionListItemDto[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 10;
  statusFilter = '';
  loading = false;

  statusOptions = ['Requested', 'Completed'];

  // Req: a contractor may confirm the outcome only of an inspection they themselves requested —
  // the API scopes GetForOutcome/Confirm to the authenticated contractor server-side, so this
  // list (already scoped to "my requests" via contractorGetAll) is safe to offer the action on.
  selected: InspectionOutcomeDto | null = null;
  showDetailModal = false;
  outcomeForm = { outcome: '', notes: '' };
  confirming = false;
  confirmError = '';

  showRequestModal = false;
  machineryOptions: MachineryOptionDto[] = [];
  requestForm = { listingID: 0, scheduledDate: '' };
  requestError = '';
  requesting = false;

  constructor(private inspectionService: InspectionService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.inspectionService.contractorGetAll({
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

  viewDetail(inspection: InspectionListItemDto) {
    this.confirmError = '';
    this.outcomeForm = { outcome: '', notes: '' };
    this.showDetailModal = true;
    this.inspectionService.contractorGetForOutcome(inspection.inspectionID).subscribe(full => {
      this.selected = full;
    });
  }

  closeDetail() {
    this.showDetailModal = false;
    this.selected = null;
  }

  confirmOutcome() {
    if (!this.selected) return;
    if (!this.outcomeForm.outcome) {
      this.confirmError = 'Please select an outcome.';
      return;
    }
    this.confirming = true;
    this.confirmError = '';
    this.inspectionService.contractorConfirmOutcome(this.selected.inspectionID, this.outcomeForm).subscribe({
      next: () => {
        this.confirming = false;
        this.showDetailModal = false;
        this.load();
      },
      error: err => {
        this.confirming = false;
        this.confirmError = err?.error?.message || 'Could not confirm outcome.';
      }
    });
  }

  openRequestModal() {
    this.requestError = '';
    this.requestForm = { listingID: 0, scheduledDate: '' };
    this.showRequestModal = true;
    this.inspectionService.contractorGetAvailableMachinery().subscribe(m => this.machineryOptions = m);
  }

  closeRequestModal() { this.showRequestModal = false; }

  submitRequest() {
    if (!this.requestForm.listingID || !this.requestForm.scheduledDate) {
      this.requestError = 'Please select machinery and a scheduled date.';
      return;
    }
    this.requesting = true;
    this.requestError = '';
    this.inspectionService.contractorRequest(this.requestForm).subscribe({
      next: () => {
        this.requesting = false;
        this.showRequestModal = false;
        this.load();
      },
      error: err => {
        this.requesting = false;
        this.requestError = err?.error?.message || 'Could not request inspection.';
      }
    });
  }
}
