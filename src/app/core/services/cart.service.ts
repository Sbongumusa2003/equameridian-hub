import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, switchMap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AddCartItemDto, UpdateCartItemDto, CartDto, CheckoutResult
} from '../models/cart.models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private apiUrl = `${environment.apiUrl}/contractor/cart`;

  // Powers the Cart badge in the sidebar — kept in sync whenever the cart is fetched or mutated.
  private itemCountSubject = new BehaviorSubject<number>(0);
  itemCount$ = this.itemCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  getCart(promoCode?: string): Observable<CartDto> {
    const options = promoCode ? { params: { promoCode } } : {};
    return this.http.get<CartDto>(this.apiUrl, options).pipe(
      tap(cart => this.itemCountSubject.next(cart.itemCount))
    );
  }

  addItem(dto: AddCartItemDto): Observable<CartDto> {
    // ASP.NET Core default JSON is camelCase — single shape is enough.
    const body = {
      listingID: dto.listingID,
      startDate: dto.startDate,
      endDate: dto.endDate,
      quantity: dto.quantity,
      fulfillmentMethod: dto.fulfillmentMethod,
      deliveryAddress: dto.deliveryAddress ?? ''
    };
    return this.http.post<CartDto>(`${this.apiUrl}/items`, body).pipe(
      tap(cart => this.itemCountSubject.next(cart.itemCount))
    );
  }

  updateItem(cartItemId: number, dto: UpdateCartItemDto): Observable<CartDto> {
    return this.http.put<CartDto>(`${this.apiUrl}/items/${cartItemId}`, dto).pipe(
      tap(cart => this.itemCountSubject.next(cart.itemCount))
    );
  }

  removeItem(cartItemId: number): Observable<CartDto> {
    return this.http.delete<CartDto>(`${this.apiUrl}/items/${cartItemId}`).pipe(
      tap(cart => this.itemCountSubject.next(cart.itemCount))
    );
  }

  /**
   * Clears every line by deleting sequentially. Prefer this over parallel deletes
   * so the badge and server state stay consistent.
   */
  clearCart(itemIds: number[]): Observable<CartDto | null> {
    if (!itemIds.length) {
      this.itemCountSubject.next(0);
      return of(null);
    }
    // Chain deletes one after another; final emission is last cart response (or null).
    let chain: Observable<CartDto | null> = of(null);
    for (const id of itemIds) {
      chain = chain.pipe(
        switchMap(() =>
          this.removeItem(id).pipe(
            catchError(() => of(null as unknown as CartDto))
          )
        )
      );
    }
    return chain.pipe(
      tap(cart => {
        if (!cart) this.itemCountSubject.next(0);
      })
    );
  }

  checkout(promoCode?: string): Observable<CheckoutResult> {
    const body = promoCode ? { promoCode } : {};
    return this.http.post<CheckoutResult>(`${this.apiUrl}/checkout`, body).pipe(
      tap(() => this.itemCountSubject.next(0))
    );
  }

  /** Refreshes the badge count without needing the full cart contents (e.g. after login). */
  refreshCount(): void {
    this.getCart().subscribe({ error: () => {} });
  }
}
