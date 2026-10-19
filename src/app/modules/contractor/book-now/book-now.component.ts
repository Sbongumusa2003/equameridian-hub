import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { ListingService } from '../../../core/services/listing.service';
import { CartService } from '../../../core/services/cart.service';
import { LocationService, PlaceSuggestion } from '../../../core/services/location.service';
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
export class BookNowComponent implements OnInit, OnDestroy {
  listing: ListingDto | null = null;
  loading = true;
  submitting = false;
  errorMessage = '';
  added = false;
  form: FormGroup;
  readonly minStartDateISO = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().substring(0, 10); })();

  /** OpenRoute place suggestions for the area search box. */
  placeSuggestions: PlaceSuggestion[] = [];
  placeSearching = false;
  showPlaceDropdown = false;
  private destroy$ = new Subject<void>();
  private placeQuery$ = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private listingService: ListingService,
    private cartService: CartService,
    private locationService: LocationService
  ) {
    this.form = this.fb.group(
      {
        startDate: ['', [Validators.required, minStartDateValidator]],
        endDate: ['', Validators.required],
        quantity: [1, [Validators.required, Validators.min(1)]],
        fulfillmentMethod: ['Supplier Delivery', Validators.required],
        // Street is typed by the user; place fields come from OpenRoute search.
        street: [''],
        placeSearch: [''],
        suburb: [''],
        city: [''],
        province: [''],
        postalCode: [''],
        deliveryAddress: [''] // composed on submit
      },
      { validators: dateRangeValidator }
    );
  }

  ngOnInit() {
    // Debounced place search (OpenRoute via API).
    this.placeQuery$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        const query = (q || '').trim();
        if (query.length < 2) {
          this.placeSuggestions = [];
          this.placeSearching = false;
          return of([] as PlaceSuggestion[]);
        }
        this.placeSearching = true;
        return this.locationService.search(query);
      }),
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.placeSuggestions = results;
      this.placeSearching = false;
      this.showPlaceDropdown = results.length > 0;
    });

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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPlaceSearchInput(value: string) {
    this.form.patchValue({ placeSearch: value }, { emitEvent: false });
    this.placeQuery$.next(value);
  }

  selectPlace(place: PlaceSuggestion) {
    this.form.patchValue({
      placeSearch: place.label,
      suburb: place.suburb || '',
      city: place.city || '',
      province: place.province || '',
      postalCode: place.postalCode || ''
    });
    this.placeSuggestions = [];
    this.showPlaceDropdown = false;
    this.composeDeliveryAddress();
  }

  composeDeliveryAddress() {
    const v = this.form.value;
    const parts = [v.street, v.suburb, v.city, v.province, v.postalCode, 'South Africa']
      .map((s: string) => (s || '').trim())
      .filter(Boolean);
    this.form.patchValue({ deliveryAddress: parts.join(', ') }, { emitEvent: false });
  }

  private onFulfillmentMethodChange() {
    const street = this.form.get('street');
    const city = this.form.get('city');
    if (this.form.get('fulfillmentMethod')?.value === 'Supplier Delivery') {
      street?.setValidators([Validators.required, Validators.minLength(3), Validators.maxLength(120)]);
      city?.setValidators([Validators.required, Validators.minLength(2)]);
    } else {
      street?.clearValidators();
      city?.clearValidators();
    }
    street?.updateValueAndValidity();
    city?.updateValueAndValidity();
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

  get streetError(): string {
    const ctrl = this.form.get('street');
    if (!ctrl?.touched || this.isPickup) return '';
    if (ctrl.errors?.['required']) return 'Street / building is required.';
    if (ctrl.errors?.['minlength']) return 'Enter a fuller street address.';
    return '';
  }

  get cityError(): string {
    const ctrl = this.form.get('city');
    if (!ctrl?.touched || this.isPickup) return '';
    if (ctrl.errors?.['required']) return 'Select a place from the search results (city is required).';
    return '';
  }

  get deliveryAddressError(): string {
    if (this.isPickup) return '';
    if (this.streetError) return this.streetError;
    if (this.cityError) return this.cityError;
    return '';
  }

  addToCart() {
    this.composeDeliveryAddress();
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.listing) return;

    this.submitting = true;
    this.errorMessage = '';
    const v = this.form.value;

    const isPickup = v.fulfillmentMethod === 'Contractor Pickup';
    const deliveryAddress = isPickup
      ? (this.listing.location || 'Supplier yard (pickup)')
      : (v.deliveryAddress || '').trim();

    if (!isPickup && (!v.street?.trim() || !v.city?.trim())) {
      this.submitting = false;
      this.errorMessage = 'Enter your street and search/select a place (suburb or city) in South Africa.';
      return;
    }

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
