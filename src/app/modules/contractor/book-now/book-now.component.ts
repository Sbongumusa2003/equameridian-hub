import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ListingService } from '../../../core/services/listing.service';
import { CartService } from '../../../core/services/cart.service';
import { ListingDto } from '../../../core/models/listing.models';

function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value;
  const end = group.get('endDate')?.value;
  if (!start || !end) return null;
  return new Date(end) <= new Date(start) ? { dateRangeInvalid: true } : null;
}

function minStartDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return new Date(control.value) < tomorrow ? { startTooSoon: true } : null;
}

@Component({
  selector: 'app-book-now',
  templateUrl: './book-now.component.html',
  styleUrls: ['./book-now.component.scss'],
  standalone: false,
})
export class BookNowComponent implements OnInit {
  listing: ListingDto | null = null;
  loading = true;
  submitting = false;
  errorMessage = '';
  added = false;
  form: FormGroup;
  readonly minStartDateISO = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().substring(0, 10); })();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private listingService: ListingService,
    private cartService: CartService
  ) {
    this.form = this.fb.group(
      {
        startDate: ['', [Validators.required, minStartDateValidator]],
        endDate: ['', Validators.required],
        quantity: [1, [Validators.required, Validators.min(1)]],
        fulfillmentMethod: ['Supplier Delivery', Validators.required],
        deliveryAddress: ['']
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
          Validators.required, Validators.min(1), Validators.max(Math.max(1, l.unitsAvailable))
        ]);
        this.form.get('quantity')?.updateValueAndValidity();

        // Default to whichever fulfilment option the listing actually offers.
        this.form.patchValue({
          fulfillmentMethod: l.deliveryAvailable ? 'Supplier Delivery' : 'Contractor Pickup'
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
      addressCtrl?.clearValidators();
    }
    addressCtrl?.updateValueAndValidity();
  }

  get isPickup(): boolean {
    return this.form.get('fulfillmentMethod')?.value === 'Contractor Pickup';
  }

  get addressLabel(): string {
    return 'Delivery Address';
  }

  get startDateError(): string {
    const ctrl = this.form.get('startDate');
    if (!ctrl?.touched) return '';
    if (ctrl.errors?.['required']) return 'Rental start date is required.';
    if (ctrl.errors?.['startTooSoon']) return 'Rental must start from tomorrow onwards.';
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
    if (ctrl.errors?.['min']) return 'Quantity must be at least 1.';
    if (ctrl.errors?.['max']) return `Only ${this.listing?.unitsAvailable ?? 1} unit(s) available.`;
    return '';
  }

  get deliveryAddressError(): string {
    const ctrl = this.form.get('deliveryAddress');
    if (!ctrl?.touched) return '';
    if (ctrl.errors?.['required']) return `${this.addressLabel} is required.`;
    if (ctrl.errors?.['minlength']) return 'Please enter a more complete address.';
    if (ctrl.errors?.['maxlength']) return 'Address is too long.';
    return '';
  }

  addToCart() {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.listing) return;

    this.submitting = true;
    this.errorMessage = '';
    const v = this.form.value;

    const isPickup = v.fulfillmentMethod === 'Contractor Pickup';
    const deliveryAddress = isPickup
      ? (this.listing.location || 'Supplier yard (pickup)')
      : (v.deliveryAddress || '').trim();

    this.cartService.addItem({
      listingID: this.listing.listingID,
      startDate: v.startDate,
      endDate: v.endDate,
      quantity: v.quantity,
      fulfillmentMethod: v.fulfillmentMethod,
      deliveryAddress
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.added = true;
        this.router.navigate(['/contractor/cart']);
      },
      error: err => {
        this.submitting = false;
        this.errorMessage = err?.error?.message || 'Could not add this item to your cart. Please try again.';
      }
    });
  }

  goToCart() {
    this.router.navigate(['/contractor/cart']);
  }
}
