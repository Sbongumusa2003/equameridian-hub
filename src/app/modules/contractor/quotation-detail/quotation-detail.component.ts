import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuotationService } from '../../../core/services/quotation.service';
import { QuotationDetailDto } from '../../../core/models/quotation.models';

@Component({
  selector: 'app-quotation-detail',
  templateUrl: './quotation-detail.component.html',
  styleUrls: ['./quotation-detail.component.scss'],
  standalone: false,
})
export class QuotationDetailComponent implements OnInit {
  quotation: QuotationDetailDto | null = null;
  loading = true;
  processing = false;
  errorMessage = '';

  showRejectDialog = false;
  rejectReason = '';

  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quotationService: QuotationService
  ) {}

  ngOnInit() { this.load(); }

  load() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;
    this.quotationService.contractorGetById(id).subscribe({
      next: q => { this.quotation = q; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  accept() {
    if (!this.quotation) return;
    this.processing = true;
    this.errorMessage = '';
    this.quotationService.contractorAccept(this.quotation.quotationID).subscribe({
      next: res => {
        this.processing = false;
        this.router.navigate(['/transactions/bookings', res.bookingId]);
      },
      error: err => {
        this.processing = false;
        this.errorMessage = err?.error?.message || 'Could not accept this quotation.';
      }
    });
  }

  openReject() { this.showRejectDialog = true; }

  confirmReject() {
    if (!this.quotation) return;
    this.processing = true;
    this.quotationService.contractorReject(this.quotation.quotationID, { reason: this.rejectReason || undefined })
      .subscribe({
        next: () => {
          this.processing = false;
          this.showRejectDialog = false;
          this.load();
        },
        error: err => {
          this.processing = false;
          this.showRejectDialog = false;
          this.errorMessage = err?.error?.message || 'Could not reject this quotation.';
        }
      });
  }
}
