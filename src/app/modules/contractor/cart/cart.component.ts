import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { ListingService } from '../../../core/services/listing.service';
import { CartDto, CartItemDto, CheckoutResultBookingDto } from '../../../core/models/cart.models';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
  standalone: false,
})
export class CartComponent implements OnInit {
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
    private router: Router
  ) {}

  resolveUrl(path: string | undefined | null): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = this.listingService.apiBase;
    return base.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
  }

  ngOnInit() {
    this.load();
  }

  load(withPromo = false) {
    this.loading = true;
    const code = withPromo && this.promoCode.trim() ? this.promoCode.trim() : undefined;
    this.cartService.getCart(code).subscribe({
      next: cart => {
        this.cart = cart;
        this.loading = false;
        this.hydrateShippingFromCart();
        if (code) {
          this.promoOk = !!cart.promoValid;
          this.promoFeedback = cart.promoMessage || (cart.promoValid ? 'Promo applied.' : 'Invalid promo code.');
        }
      },
      error: () => { this.loading = false; this.error = 'Could not load your cart.'; }
    });
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
    this.cartService.updateItem(item.cartItemID, {
      startDate: item.rentalStartDate,
      endDate: item.rentalEndDate,
      quantity: item.quantity,
      fulfillmentMethod: method,
      deliveryAddress: method === 'Contractor Pickup' ? item.deliveryAddress : this.composedAddress() || item.deliveryAddress
    }).subscribe({
      next: () => this.load(!!this.promoCode.trim()),
      error: err => this.error = err?.error?.message || 'Could not update fulfilment.'
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