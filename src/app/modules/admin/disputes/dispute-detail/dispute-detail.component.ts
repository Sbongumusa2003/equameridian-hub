import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DisputeService } from '../../../../core/services/dispute.service';
import { DisputeDetailDto } from '../../../../core/models/dispute.models';

@Component({
  selector: 'app-dispute-detail',
  templateUrl: './dispute-detail.component.html',
  styleUrls: ['./dispute-detail.component.scss'],
  standalone: false,
})
export class DisputeDetailComponent implements OnInit {
  dispute: DisputeDetailDto | null = null;
  loading = true;
  resolving = false;
  errorMessage = '';
  successMessage = '';

  outcomeOptions = [
    { value: 'UpholdRefund', label: 'Uphold — Full Refund' },
    { value: 'PartialRefund', label: 'Partial Refund' },
    { value: 'Reject', label: 'Reject Dispute' },
    { value: 'Escalate', label: 'Escalate' }
  ];

  form = { resolutionOutcome: '', resolutionNotes: '', refundAmount: null as number | null };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private disputeService: DisputeService
  ) {}

  ngOnInit() { this.load(); }

  load() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;
    this.disputeService.adminGetById(id).subscribe({
      next: d => {
        this.dispute = d;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get isResolved(): boolean {
    return !!this.dispute && (this.dispute.status === 'Resolved' || this.dispute.status === 'Escalated');
  }

  get needsRefundAmount(): boolean {
    return this.form.resolutionOutcome === 'PartialRefund';
  }

  resolve() {
    if (!this.dispute) return;
    if (!this.form.resolutionOutcome) {
      this.errorMessage = 'Please select a resolution outcome.';
      return;
    }
    if (!this.form.resolutionNotes.trim()) {
      this.errorMessage = 'Resolution notes are required.';
      return;
    }
    if (this.needsRefundAmount && (!this.form.refundAmount || this.form.refundAmount <= 0)) {
      this.errorMessage = 'Please enter a valid refund amount for a partial refund.';
      return;
    }
    this.resolving = true;
    this.errorMessage = '';
    this.disputeService.adminResolve(this.dispute.disputeID, {
      resolutionOutcome: this.form.resolutionOutcome,
      resolutionNotes: this.form.resolutionNotes,
      refundAmount: this.form.refundAmount ?? undefined
    }).subscribe({
      next: res => {
        this.resolving = false;
        this.successMessage = 'Dispute resolved successfully.';
        this.dispute = res.dispute;
      },
      error: err => {
        this.resolving = false;
        this.errorMessage = err?.error?.message || 'Could not resolve this dispute.';
      }
    });
  }

  back() { this.router.navigate(['/admin/disputes']); }
}
