import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { CartService } from '../../../core/services/cart.service';
import { ListingService } from '../../../core/services/listing.service';
import { LocationService, PlaceSuggestion } from '../../../core/services/location.service';
import { CartDto, CartItemDto, CartSupplierGroupDto, CheckoutResultBookingDto } from '../../../core/models/cart.models';

/** Per-line delivery address draft (street typed, place from OpenRoute). */
interface LineAddressDraft {
  street: string;
  placeSearch: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
}

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
  standalone: false,
})
export class CartComponent implements OnInit, OnDestroy {
  cart: CartDto | null = null;
  loading = true;
  error = '';
  checkingOut = false;
  checkoutResults: CheckoutResultBookingDto[] | null = null;

  promoCode = '';
  applyingPromo = false;
  promoFeedback = '';
  promoOk = false;

  savingItemId: number | null = null;

  /** Full composed address drafts (still used when saving). */
  draftAddress: Record<number, string> = {};
  /** Structured street + place drafts per cart line. */
  lineDrafts: Record<number, LineAddressDraft> = {};
  placeSuggestions: Record<number, PlaceSuggestion[]> = {};
  placeSearching: Record<number, boolean> = {};
  showPlaceDropdown: Record<number, boolean> = {};

  private destroy$ = new Subject<void>();
  /** Emits { cartItemId, query } for debounced place search. */
  private placeQuery$ = new Subject<{ id: number; q: string }>();

  readonly provinces = [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
    'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
  ];
  shipStreet = '';
  shipSuburb = '';
  shipCity = '';
  shipProvince = 'Gauteng';
  shipPostal = '';
  shipNotes = '';
  shipError = '';

  constructor(
    private cartService: CartService,
    private listingService: ListingService,
    private locationService: LocationService,
    private router: Router
  ) {}

  resolveUrl(path: string | undefined | null): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = this.listingService.apiBase;
    return base.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
  }

  ngOnInit() {
    this.placeQuery$.pipe(
      debounceTime(300),
      distinctUntilChanged((a, b) => a.id === b.id && a.q === b.q),
      switchMap(({ id, q }) => {
        const query = (q || '').trim();
        if (query.length < 2) {
          this.placeSuggestions[id] = [];
          this.placeSearching[id] = false;
          this.showPlaceDropdown[id] = false;
          return of({ id, results: [] as PlaceSuggestion[] });
        }
        this.placeSearching[id] = true;
        return this.locationService.search(query).pipe(
          switchMap(results => of({ id, results }))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(({ id, results }) => {
      this.placeSuggestions[id] = results;
      this.placeSearching[id] = false;
      this.showPlaceDropdown[id] = results.length > 0;
    });

    this.load();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(withPromo = false) {
    this.loading = true;
    const code = withPromo && this.promoCode.trim() ? this.promoCode.trim() : undefined;
    this.cartService.getCart(code).subscribe({
      next: cart => {
        this.cart = cart;
        this.loading = false;
        this.seedLineDraftsFromCart();
        this.hydrateShippingFromCart();
        if (code) {
          this.promoOk = !!cart.promoValid;
          this.promoFeedback = cart.promoMessage || (cart.promoValid ? 'Promo applied.' : 'Invalid promo code.');
        }
      },
      error: () => { this.loading = false; this.error = 'Could not load your cart.'; }
    });
  }

  /** Initialise structured drafts from existing delivery addresses. */
  private seedLineDraftsFromCart() {
    if (!this.cart) return;
    for (const group of this.cart.supplierGroups) {
      for (const item of group.items) {
        if (this.lineDrafts[item.cartItemID]) continue;
        const raw = (item.deliveryAddress || '').trim();
        if (!raw || item.fulfillmentMethod === 'Contractor Pickup') continue;
        const parts = raw.split(',').map(p => p.trim()).filter(Boolean);
        // Heuristic: first part = street, last may be country, then postal, province, city…
        const withoutCountry = parts.filter(p => !/^south africa$/i.test(p));
        if (withoutCountry.length >= 4) {
          this.lineDrafts[item.cartItemID] = {
            street: withoutCountry[0],
            placeSearch: withoutCountry.slice(1, -2).join(', ') || withoutCountry[1] || '',
            suburb: withoutCountry.length >= 5 ? withoutCountry[1] : '',
            city: withoutCountry.length >= 5 ? withoutCountry[2] : withoutCountry[1],
            province: withoutCountry[withoutCountry.length - 2] || '',
            postalCode: withoutCountry[withoutCountry.length - 1] || ''
          };
        } else {
          this.lineDrafts[item.cartItemID] = {
            street: withoutCountry[0] || raw,
            placeSearch: '',
            suburb: '',
            city: '',
            province: '',
            postalCode: ''
          };
        }
        this.draftAddress[item.cartItemID] = raw;
      }
    }
  }

  ensureLineDraft(item: CartItemDto): LineAddressDraft {
    if (!this.lineDrafts[item.cartItemID]) {
      this.lineDrafts[item.cartItemID] = {
        street: '',
        placeSearch: '',
        suburb: '',
        city: '',
        province: '',
        postalCode: ''
      };
    }
    return this.lineDrafts[item.cartItemID];
  }

  onLineStreetChange(item: CartItemDto, value: string) {
    const d = this.ensureLineDraft(item);
    d.street = value;
    this.composeLineAddress(item);
  }

  onLinePlaceSearch(item: CartItemDto, value: string) {
    const d = this.ensureLineDraft(item);
    d.placeSearch = value;
    this.placeQuery$.next({ id: item.cartItemID, q: value });
  }

  selectLinePlace(item: CartItemDto, place: PlaceSuggestion) {
    const d = this.ensureLineDraft(item);
    d.placeSearch = place.label;
    d.suburb = place.suburb || '';
    d.city = place.city || '';
    d.province = place.province || '';
    d.postalCode = place.postalCode || '';
    this.placeSuggestions[item.cartItemID] = [];
    this.showPlaceDropdown[item.cartItemID] = false;
    this.composeLineAddress(item);
  }

  composeLineAddress(item: CartItemDto) {
    const d = this.ensureLineDraft(item);
    const parts = [d.street, d.suburb, d.city, d.province, d.postalCode, 'South Africa']
      .map(s => (s || '').trim())
      .filter(Boolean);
    this.draftAddress[item.cartItemID] = parts.join(', ');
  }

  applyPromo() {
    if (!this.promoCode.trim()) {
      this.promoFeedback = 'Enter a promo code.';
      this.promoOk = false;
      return;
    }
    this.applyingPromo = true;
    this.promoFeedback = '';
    this.cartService.getCart(this.promoCode.trim()).subscribe({
      next: cart => {
        this.cart = cart;
        this.applyingPromo = false;
        this.promoOk = !!cart.promoValid;
        this.promoFeedback = cart.promoMessage
          || (cart.promoValid
            ? `${cart.promoCampaignName || 'Promo'} applied (${cart.promoDiscountPercent}% off).`
            : 'Invalid or expired promo code.');
      },
      error: () => {
        this.applyingPromo = false;
        this.promoOk = false;
        this.promoFeedback = 'Could not validate promo code.';
      }
    });
  }

  clearPromo() {
    this.promoCode = '';
    this.promoFeedback = '';
    this.promoOk = false;
    this.load();
  }

  updateQuantity(item: CartItemDto, quantity: number) {
    if (quantity < 1) return;
    if (item.unitsAvailable && quantity > item.unitsAvailable) quantity = item.unitsAvailable;
    this.savingItemId = item.cartItemID;
    this.cartService.updateItem(item.cartItemID, {
      startDate: item.rentalStartDate,
      endDate: item.rentalEndDate,
      quantity,
      fulfillmentMethod: item.fulfillmentMethod,
      deliveryAddress: item.deliveryAddress
    }).subscribe({
      next: () => {
        this.savingItemId = null;
        this.load(!!this.promoCode.trim());
      },
      error: err => {
        this.savingItemId = null;
        this.error = err?.error?.message || 'Could not update that item.';
      }
    });
  }

  removeItem(item: CartItemDto) {
    this.savingItemId = item.cartItemID;
    this.cartService.removeItem(item.cartItemID).subscribe({
      next: () => {
        this.savingItemId = null;
        this.load(!!this.promoCode.trim());
      },
      error: () => { this.savingItemId = null; this.error = 'Could not remove that item.'; }
    });
  }

  get needsShipping(): boolean {
    if (!this.cart) return false;
    return this.cart.supplierGroups.some(g =>
      g.items.some(i => (i.fulfillmentMethod || '') !== 'Contractor Pickup'));
  }

  private hydrateShippingFromCart() {
    try {
      const raw = sessionStorage.getItem('em.ship');
      if (raw) {
        const s = JSON.parse(raw);
        this.shipStreet = s.street || this.shipStreet;
        this.shipSuburb = s.suburb || this.shipSuburb;
        this.shipCity = s.city || this.shipCity;
        this.shipProvince = s.province || this.shipProvince;
        this.shipPostal = s.postal || this.shipPostal;
        this.shipNotes = s.notes || this.shipNotes;
      }
    } catch { /* ignore */ }
    if (this.shipStreet) return;
    const item = this.cart?.supplierGroups.flatMap(g => g.items)
      .find(i => (i.fulfillmentMethod || '') !== 'Contractor Pickup' && !!i.deliveryAddress);
    if (!item?.deliveryAddress) return;
    const parts = item.deliveryAddress.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 4) {
      this.shipStreet = parts[0];
      this.shipSuburb = parts.length >= 5 ? parts[1] : '';
      this.shipCity = parts.length >= 5 ? parts[2] : parts[1];
      this.shipProvince = parts[parts.length - 2];
      this.shipPostal = parts[parts.length - 1];
    } else {
      this.shipStreet = item.deliveryAddress;
    }
  }

  private persistShipping() {
    sessionStorage.setItem('em.ship', JSON.stringify({
      street: this.shipStreet, suburb: this.shipSuburb, city: this.shipCity,
      province: this.shipProvince, postal: this.shipPostal, notes: this.shipNotes
    }));
    sessionStorage.setItem('em.shipAddress', this.composedAddress());
  }

  composedAddress(): string {
    const core = [this.shipStreet, this.shipSuburb, this.shipCity, this.shipProvince, this.shipPostal]
      .map(s => (s || '').trim()).filter(Boolean).join(', ');
    return this.shipNotes.trim() ? core + ' · ' + this.shipNotes.trim() : core;
  }

  setAllFulfillment(method: string) {
    if (!this.cart) return;
    this.cart.supplierGroups.flatMap(g => g.items).forEach(item => this.setFulfillment(item, method));
  }

  saveShipping() {
    if (!this.cart) return;
    if (!this.shipStreet.trim() || !this.shipCity.trim() || !this.shipPostal.trim()) {
      this.shipError = 'Street, city and postal code are required for supplier delivery.';
      return;
    }
    this.shipError = '';
    this.persistShipping();
    const address = this.composedAddress();
    const items = this.cart.supplierGroups.flatMap(g => g.items)
      .filter(i => (i.fulfillmentMethod || '') !== 'Contractor Pickup');
    items.forEach(item => {
      this.cartService.updateItem(item.cartItemID, {
        startDate: item.rentalStartDate,
        endDate: item.rentalEndDate,
        quantity: item.quantity,
        fulfillmentMethod: item.fulfillmentMethod,
        deliveryAddress: address
      }).subscribe({ next: () => this.load(!!this.promoCode.trim()) });
    });
  }

  setFulfillment(item: CartItemDto, method: string) {
    this.savingItemId = item.cartItemID;
    const address = method === 'Contractor Pickup'
      ? (item.deliveryAddress || '')
      : (this.draftAddress[item.cartItemID] || item.deliveryAddress || '').trim();
    this.cartService.updateItem(item.cartItemID, {
      startDate: item.rentalStartDate,
      endDate: item.rentalEndDate,
      quantity: item.quantity,
      fulfillmentMethod: method,
      deliveryAddress: address
    }).subscribe({
      next: () => {
        this.savingItemId = null;
        this.load(!!this.promoCode.trim());
      },
      error: err => {
        this.savingItemId = null;
        this.error = err?.error?.message || 'Could not update fulfilment.';
      }
    });
  }

  saveLineAddress(item: CartItemDto) {
    this.composeLineAddress(item);
    const d = this.ensureLineDraft(item);
    if (!d.street.trim() || !d.city.trim()) {
      this.error = 'Enter the street and search/select a place (city) for this item.';
      return;
    }
    const address = (this.draftAddress[item.cartItemID] || '').trim();
    this.savingItemId = item.cartItemID;
    this.error = '';
    this.cartService.updateItem(item.cartItemID, {
      startDate: item.rentalStartDate,
      endDate: item.rentalEndDate,
      quantity: item.quantity,
      fulfillmentMethod: item.fulfillmentMethod || 'Supplier Delivery',
      deliveryAddress: address
    }).subscribe({
      next: () => {
        this.savingItemId = null;
        // Keep draft so the fields stay filled after reload seed.
        this.load(!!this.promoCode.trim());
      },
      error: err => {
        this.savingItemId = null;
        this.error = err?.error?.message || 'Could not save delivery address.';
      }
    });
  }

  /** Copy this line's address onto every non-pickup item from the same supplier. */
  applyAddressToSupplierGroup(item: CartItemDto, group: CartSupplierGroupDto) {
    this.composeLineAddress(item);
    const address = (this.draftAddress[item.cartItemID] ?? item.deliveryAddress ?? '').trim();
    const d = this.ensureLineDraft(item);
    if (!d.street.trim() || !d.city.trim()) {
      this.error = 'Enter street and select a place before applying to the supplier group.';
      return;
    }
    this.error = '';
    const targets = group.items.filter(i => (i.fulfillmentMethod || '') !== 'Contractor Pickup');
    let pending = targets.length;
    if (pending === 0) return;
    targets.forEach(target => {
      // Copy structured draft so other lines show the same place fields.
      this.lineDrafts[target.cartItemID] = { ...d };
      this.draftAddress[target.cartItemID] = address;
      this.cartService.updateItem(target.cartItemID, {
        startDate: target.rentalStartDate,
        endDate: target.rentalEndDate,
        quantity: target.quantity,
        fulfillmentMethod: target.fulfillmentMethod || 'Supplier Delivery',
        deliveryAddress: address
      }).subscribe({
        next: () => {
          pending--;
          if (pending === 0) this.load(!!this.promoCode.trim());
        },
        error: err => {
          pending--;
          this.error = err?.error?.message || 'Could not apply address to all items.';
          if (pending === 0) this.load(!!this.promoCode.trim());
        }
      });
    });
  }

  checkout() {
    if (!this.cart || this.cart.itemCount === 0) return;
    if (this.needsShipping) {
      const missing = this.cart.supplierGroups.flatMap(g => g.items)
        .some(i => (i.fulfillmentMethod || '') !== 'Contractor Pickup' && !(i.deliveryAddress || '').trim());
      if (missing) {
        this.error = 'Add a delivery address on Book Now, or switch those items to Contractor Pickup.';
        return;
      }
    }
    this.checkingOut = true;
    this.error = '';
    const code = this.promoOk && this.promoCode.trim() ? this.promoCode.trim() : undefined;
    this.cartService.checkout(code).subscribe({
      next: result => {
        this.checkingOut = false;
        if (!result.success) {
          this.error = result.error || 'Checkout failed. Please review your cart and try again.';
          this.load(!!code);
          return;
        }
        this.checkoutResults = result.bookings;
      },
      error: err => {
        this.checkingOut = false;
        this.error = err?.error?.message || 'Checkout failed. Please review your cart and try again.';
        this.load(!!code);
      }
    });
  }

  goToLease(leaseAgreementId: number) {
    this.router.navigate(['/transactions/lease-agreements', leaseAgreementId]);
  }

  isPickup(item: CartItemDto): boolean {
    const method = (item.fulfillmentMethod || '').toLowerCase();
    if (method.includes('pickup')) return true;
    return (item.deliveryFee ?? 0) === 0 && method.includes('pickup');
  }

  get cartRentalTotal(): number {
    if (!this.cart) return 0;
    return this.cart.supplierGroups.reduce((s, g) => s + (g.groupRentalSubtotal || 0), 0);
  }
  get cartDiscountTotal(): number {
    if (!this.cart) return 0;
    return this.cart.supplierGroups.reduce((s, g) => s + (g.groupDiscountAmount || 0), 0);
  }
  get cartDeliveryTotal(): number {
    if (!this.cart) return 0;
    return this.cart.supplierGroups.reduce((s, g) => s + (g.groupDeliveryFee || 0), 0);
  }
  get cartVatTotal(): number {
    if (!this.cart) return 0;
    return this.cart.supplierGroups.reduce((s, g) => s + ((g.groupTotal || 0) - (g.groupPriceExclVat || 0)), 0);
  }
  get hasAnyDelivery(): boolean {
    return this.cartDeliveryTotal > 0;
  }
}