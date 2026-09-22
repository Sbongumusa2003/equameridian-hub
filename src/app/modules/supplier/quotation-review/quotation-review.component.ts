import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QuotationService } from '../../../core/services/quotation.service';
import { QuotationReviewDto } from '../../../core/models/quotation.models';

function futureDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(value) < today ? { pastDate: true } : null;
}

@Component({
  selector: 'app-quotation-review',
  templateUrl: './quotation-review.component.html',
  styleUrls: ['./quotation-review.component.scss'],
  standalone: false,
})
export class QuotationReviewComponent implements OnInit {
  quotation: QuotationReviewDto | null = null;
  loading = true;
  submitting = false;
  errorMessage = '';
  form: FormGroup;
  readonly todayISO = new Date().toISOString().substring(0, 10);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private quotationService: QuotationService
  ) {
    this.form = this.fb.group({
      dailyRateZAR: [null, [Validators.required, Validators.min(0.01)]],
      weeklyRateZAR: [null, [Validators.min(0.01)]],
      deliveryFee: [0, [Validators.required, Validators.min(0)]],
      quoteValidUntil: ['', [Validators.required, futureDateValidator]],
      notesToCustomer: ['']
    });
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.quotationService.supplierGetForReview(id).subscribe({
      next: q => {
        this.quotation = q;
        this.loading = false;
        // Prefill any rates already on the quote (submitted / cancelled / etc.)
        this.form.patchValue({
          dailyRateZAR: q.dailyRateZAR ?? null,
          weeklyRateZAR: q.weeklyRateZAR ?? null,
          deliveryFee: q.deliveryFee ?? 0,
          quoteValidUntil: q.quoteValidUntil ? q.quoteValidUntil.substring(0, 10) : '',
          notesToCustomer: q.notesToCustomer ?? ''
        });
        if (q.fulfillmentMethod === 'Contractor Pickup') {
          this.form.patchValue({ deliveryFee: 0 });
          this.form.get('deliveryFee')?.disable();
        }
        if (q.status !== 'Requested') this.form.disable();
      },
      error: () => { this.loading = false; }
    });
  }

  get dailyRateError(): string {
    const ctrl = this.form.get('dailyRateZAR');
    if (!ctrl?.touched) return '';
    if (ctrl.errors?.['required']) return 'Daily rate is required.';
    if (ctrl.errors?.['min']) return 'Daily rate must be greater than 0.';
    return '';
  }

  get weeklyRateError(): string {
    const ctrl = this.form.get('weeklyRateZAR');
    if (!ctrl?.touched) return '';
    return ctrl.errors?.['min'] ? 'Weekly rate must be greater than 0.' : '';
  }

  get deliveryFeeError(): string {
    const ctrl = this.form.get('deliveryFee');
    if (!ctrl?.touched) return '';
    if (ctrl.errors?.['required']) return 'Delivery fee is required.';
    if (ctrl.errors?.['min']) return 'Delivery fee cannot be negative.';
    return '';
  }

  get quoteValidUntilError(): string {
    const ctrl = this.form.get('quoteValidUntil');
    if (!ctrl?.touched) return '';
    if (ctrl.errors?.['required']) return 'Please set a validity date for this quote.';
    if (ctrl.errors?.['pastDate']) return 'Validity date must be today or in the future.';
    return '';
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.quotation) {
      return;
    }
    this.submitting = true;
    this.errorMessage = '';
    const v = this.form.getRawValue();

    this.quotationService.supplierSubmit(this.quotation.quotationID, {
      dailyRateZAR: v.dailyRateZAR,
      weeklyRateZAR: v.weeklyRateZAR || undefined,
      deliveryFee: v.deliveryFee,
      quoteValidUntil: v.quoteValidUntil,
      notesToCustomer: v.notesToCustomer || undefined
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/supplier/quotations']);
      },
      error: err => {
        this.submitting = false;
        this.errorMessage = err?.error?.message || 'Could not submit this quote. Please check your details and try again.';
      }
    });
  }
}
