import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WishlistItemDto } from '../models/wishlist.models';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private url = `${environment.apiUrl}/contractor/wishlist`;

  private idsSubject = new BehaviorSubject<Set<number>>(new Set());
  readonly ids$: Observable<Set<number>> = this.idsSubject.asObservable();

  constructor(private http: HttpClient) {}

  refreshIds(): void {
    this.http.get<number[]>(`${this.url}/ids`).subscribe({
      next: ids => this.idsSubject.next(new Set(ids)),
      error: () => {}
    });
  }

  clear(): void {
    this.idsSubject.next(new Set());
  }

  isWishlisted(listingId: number): boolean {
    return this.idsSubject.value.has(listingId);
  }

  getAll(): Observable<WishlistItemDto[]> {
    return this.http.get<WishlistItemDto[]>(this.url);
  }

  add(listingId: number): Observable<WishlistItemDto> {
    return this.http.post<WishlistItemDto>(this.url, { listingID: listingId }).pipe(
      tap(() => {
        const next = new Set(this.idsSubject.value);
        next.add(listingId);
        this.idsSubject.next(next);
      })
    );
  }

  removeByListing(listingId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.url}/by-listing/${listingId}`).pipe(
      tap(() => {
        const next = new Set(this.idsSubject.value);
        next.delete(listingId);
        this.idsSubject.next(next);
      })
    );
  }

  toggle(listingId: number): Observable<unknown> {
    return this.isWishlisted(listingId) ? this.removeByListing(listingId) : this.add(listingId);
  }
}
