import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface PlaceSuggestion {
  label: string;
  suburb?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private url = `${environment.apiUrl}/locations`;

  constructor(private http: HttpClient) {}

  /** Search SA places via OpenRouteService (proxied by the API). */
  search(query: string): Observable<PlaceSuggestion[]> {
    const q = (query || '').trim();
    if (q.length < 2) return of([]);
    const params = new HttpParams().set('q', q);
    return this.http.get<PlaceSuggestion[]>(`${this.url}/search`, { params }).pipe(
      catchError(() => of([]))
    );
  }
}
