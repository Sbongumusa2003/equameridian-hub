import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CategoryDto {
  categoryID: number;
  name: string;
  listingCount?: number;
}

export interface UpsertCategoryDto {
  name: string;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private url = `${environment.apiUrl}/categories`;
  private cache$?: Observable<CategoryDto[]>;

  constructor(private http: HttpClient) {}

  getAll(): Observable<CategoryDto[]> {
    if (!this.cache$) {
      this.cache$ = this.http.get<CategoryDto[]>(this.url).pipe(shareReplay(1));
    }
    return this.cache$;
  }

  // Admin-only management. Any successful mutation clears the shared cache above so every page
  // using getAll() (e.g. the listing creation form) sees the change without a full reload.
  getAllForAdmin(): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>(`${this.url}/admin`);
  }

  create(dto: UpsertCategoryDto): Observable<CategoryDto> {
    return this.http.post<CategoryDto>(`${this.url}/admin`, dto).pipe(
      tap(() => this.clearCache())
    );
  }

  update(id: number, dto: UpsertCategoryDto): Observable<CategoryDto> {
    return this.http.put<CategoryDto>(`${this.url}/admin/${id}`, dto).pipe(
      tap(() => this.clearCache())
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/admin/${id}`).pipe(
      tap(() => this.clearCache())
    );
  }

  private clearCache() {
    this.cache$ = undefined;
  }
}