import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuotationService } from '../../../core/services/quotation.service';
import { QuotationCompareDto } from '../../../core/models/quotation.models';

@Component({
  selector: 'app-quotation-compare',
  templateUrl: './quotation-compare.component.html',
  styleUrls: ['./quotation-compare.component.scss'],
  standalone: false,
})
export class QuotationCompareComponent implements OnInit {
  quotations: QuotationCompareDto[] = [];
  warning: string | null = null;
  loading = false;
  errorMessage = '';
  processingId: number | null = null;

  specs = ['makeBrand', 'model', 'year', 'operatingWeight', 'enginePower', 'location'];
  specLabels: Record<string, string> = {
    makeBrand: 'MAKE / BRAND',
    model: 'MODEL',
    year: 'YEAR',
    operatingWeight: 'OPERATING WEIGHT',
    enginePower: 'ENGINE POWER',
    location: 'LOCATION'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quotationService: QuotationService
  ) {}

  ngOnInit() {
    const ids = (this.route.snapshot.queryParamMap.get('ids') ?? '')
      .split(',').filter(Boolean).map(Number);
    if (ids.length < 2) return;

    this.loading = true;
    this.quotationService.contractorCompare(ids).subscribe({
      next: res => {
        this.quotations = res.quotations;
        this.warning = res.warning;
        this.loading = false;
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'Could not load comparison.';
        this.loading = false;
      }
    });
  }

  getValue(q: QuotationCompareDto, spec: string): string {
    const v = (q as any)[spec];
    return v ?? '—';
  }

  accept(q: QuotationCompareDto) {
    this.processingId = q.quotationID;
    this.quotationService.contractorAccept(q.quotationID).subscribe({
      next: res => {
        this.processingId = null;
        this.router.navigate(['/transactions/bookings', res.bookingId]);
      },
      error: err => {
        this.processingId = null;
        this.errorMessage = err?.error?.message || 'Could not accept this quotation.';
      }
    });
  }
}
