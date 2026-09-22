import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ListingService } from '../../../core/services/listing.service';
import { QuotationService } from '../../../core/services/quotation.service';
import { ListingDto } from '../../../core/models/listing.models';

function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value;
  const end = group.get('endDate')?.value;
  if (!start || !end) return null;
  // Backend requires EndDate to be strictly after StartDate (same-day requests are rejected),
  // so same-day picks must be flagged here too, not just end < start.
  return new Date(end) <= new Date(start) ? { dateRangeInvalid: true } : null;
}

function minStartDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  // Backend requires StartDate to be at least the next day (today is rejected).
  return new Date(control.value) < tomorrow ? { startTooSoon: true } : null;
}

@Component({
  selector: 'app-request-quote',
  templateUrl: './request-quote.component.html',
  styleUrls: ['./request-quote.component.scss'],
  standalone: false,
})
export class RequestQuoteComponent implements OnInit {
  listing: ListingDto | null = null;
  loading = true;
  submitting = false;
  errorMessage = '';
  needsDocumentApproval = false;
  form: FormGroup;
  readonly minStartDateISO = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().substring(0, 10);
  })();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private listingService: ListingService,
    private quotationService: QuotationService
  ) {
    this.form = this.fb.group(
      {
        startDate: ['', [Validators.required, minStartDateValidator]],
        endDate: ['', Validators.required],
        quantity: [1, [Validators.required, Validators.min(1)]],
        hireType: ['Dry', Validators.required],
        fulfillmentMethod: ['Supplier Delivery', Validators.required],
        deliveryAddress: ['', [Validators.minLength(5), Validators.maxLength(300)]],
        specialRequirements: ['', Validators.maxLength(500)],
        preferredContact: ['Email', Validators.required]
      },
      { validators: dateRangeValidator }
    );
  }

  ngOnInit() {
    const listingId = Number(this.route.snapshot.paramMap.get('listingId'));
    this.listingService.contractorGetById(listingId).subscribe({
      next: l => {
        this.listing = l;
        this.loading = false;
        this.form.get('quantity')?.setValidators([
          Validators.required, Validators.min(1), Validators.max(Math.max(1, l.unitsAvailable || 1))
        ]);
        this.form.get('quantity')?.updateValueAndValidity();

        // Default to whichever hire type / fulfilment option the listing actually offers.
        this.form.patchValue({
          hireType: l.dryHireAvailable ? 'Dry' : 'Wet',
          fulfillmentMethod: l.deliveryAvailable && !l.pickupAvailable ? 'Supplier Delivery' : 'Contractor Pickup'
        });
        this.onFulfillmentMethodChange();
        this.form.get('fulfillmentMethod')?.valueChanges.subscribe(() => this.onFulfillmentMethodChange());
      },
      error: () => { this.loading = false; }
    });
  }

  private onFulfillmentMethodChange() {
    const addressCtrl = this.form.get('deliveryAddress');
    if (this.form.get('fulfillmentMethod')?.value === 'Supplier Delivery') {
      addressCtrl?.setValidators([Validators.required, Validators.minLength(5), Validators.maxLength(300)]);
    } else {
      addressCtrl?.setValidators([Validators.maxLength(300)]);
    }
    addressCtrl?.updateValueAndValidity();
  }

  get startDateError(): string {
    const ctrl = this.form.get('startDate');
    if (!ctrl?.touched) return '';
    if (ctrl.errors?.['required']) return 'Rental start date is required.';
    if (ctrl.errors?.['startTooSoon']) return 'Rental start date must be at least the next day.';
    return '';
  }

  get endDateError(): string {
    const ctrl = this.form.get('endDate');
    if (!ctrl?.touched) return '';
    if (ctrl.errors?.['required']) return 'Rental end date is required.';
    if (this.form.errors?.['dateRangeInvalid']) return 'End date must be after the start date.';
    return '';
  }

  get quantityError(): string {
    const ctrl = this.form.get('quantity');
    if (!ctrl?.touched) return '';
    if (ctrl.errors?.['required']) return 'Quantity is required.';
    if (ctrl.errors?.['min'] || ctrl.errors?.['max']) return 'Quantity must be between 1 and 10.';
    return '';
  }

  get deliveryAddressError(): string {
    const ctrl = this.form.get('deliveryAddress');
    if (!ctrl?.touched) return '';
    if (ctrl.errors?.['required']) return 'Delivery address is required.';
    if (ctrl.errors?.['minlength']) return 'Please enter a more complete address.';
    if (ctrl.errors?.['maxlength']) return 'Delivery address is too long.';
    return '';
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.listing) {
      return;
    }
    this.submitting = true;
    this.errorMessage = '';
    this.needsDocumentApproval = false;

    const v = this.form.value;
    this.quotationService.contractorCreate({
      listingID: this.listing.listingID,
      startDate: v.startDate,
      endDate: v.endDate,
      quantity: v.quantity,
      hireType: v.hireType,
      fulfillmentMethod: v.fulfillmentMethod,
      deliveryAddress: v.fulfillmentMethod === 'Supplier Delivery' ? v.deliveryAddress : undefined,
      specialRequirements: v.specialRequirements || undefined,
      preferredContact: v.preferredContact
    }).subscribe({
      next: res => {
        this.submitting = false;
        this.router.navigate(['/contractor/quotations', res.quotation.quotationID]);
      },
      error: err => {
        this.submitting = false;
        this.needsDocumentApproval = err?.status === 403;
        this.errorMessage = err?.error?.message || 'Could not submit quote request. Please check your details and try again.';
      }
    });
  }
}
