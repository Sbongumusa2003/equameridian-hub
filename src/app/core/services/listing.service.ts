import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ListingDto,
  CreateListingDto,
  UpdateListingDto,
  UpdateListingStatusDto,
  PagedResult
} from '../models/listing.models';
import { SUPPRESS_403_REDIRECT } from '../http-context-tokens';

@Injectable({ providedIn: 'root' })
export class ListingService {
  private adminUrl      = `${environment.apiUrl}/admin/listings`;
  private supplierUrl   = `${environment.apiUrl}/supplier/listings`;
  private contractorUrl = `${environment.apiUrl}/contractor/listings`;
  constructor(private http: HttpClient) {}
  adminGetAll(params: {
    search?: string; category?: number; status?: string;
    page?: number; pageSize?: number;
  }): Observable<PagedResult<ListingDto>> {
    let p = new HttpParams();
    if (params.search)   p = p.set('search',   params.search);
    if (params.category) p = p.set('category', params.category.toString());
    if (params.status)   p = p.set('status',   params.status);
    p = p.set('page',     (params.page     ?? 1).toString());
    p = p.set('pageSize', (params.pageSize ?? 10).toString());
    return this.http.get<PagedResult<ListingDto>>(this.adminUrl, { params: p });
  }

  adminGetById(id: number): Observable<ListingDto> {
    return this.http.get<ListingDto>(`${this.adminUrl}/${id}`);
  }
  adminUpdateStatus(id: number, dto: UpdateListingStatusDto): Observable<any> {
    return this.http.patch(`${this.adminUrl}/${id}/status`, dto);
  }

  // Bulk-import listings from an Excel (.xlsx) file. Returns a summary with per-row errors so the
  // UI can show exactly which rows succeeded/failed without failing the whole batch.
  supplierDownloadImportTemplate(): Observable<Blob> {
    return this.http.get(`${this.supplierUrl}/import-template`, { responseType: 'blob' });
  }

  supplierImportFromExcel(file: File): Observable<{
    createdCount: number; createdTitles: string[]; errorCount: number; errors: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ createdCount: number; createdTitles: string[]; errorCount: number; errors: string[] }>(
      `${this.supplierUrl}/import`, formData
    );
  }

  // JSON equivalents of the Excel import/export above (system-to-system integration use case).
  supplierImportFromJson(listings: any[]): Observable<{
    createdCount: number; createdTitles: string[]; errorCount: number; errors: string[];
  }> {
    return this.http.post<{ createdCount: number; createdTitles: string[]; errorCount: number; errors: string[] }>(
      `${this.supplierUrl}/import-json`, { listings }
    );
  }

  supplierExportToJson(): Observable<any[]> {
    return this.http.get<any[]>(`${this.supplierUrl}/export-json`);
  }

  supplierGetOwn(params: {
    status?: string; page?: number; pageSize?: number;
  }): Observable<any> {
    let p = new HttpParams();
    if (params.status) p = p.set('status', params.status);
    p = p.set('page',     (params.page     ?? 1).toString());
    p = p.set('pageSize', (params.pageSize ?? 20).toString());
    return this.http.get<any>(this.supplierUrl, { params: p });
  }
  supplierGetById(id: number): Observable<ListingDto> {
    return this.http.get<ListingDto>(`${this.supplierUrl}/${id}`);
  }
  supplierCreate(dto: CreateListingDto): Observable<{ listingId: number; status: string }> {
    return this.http.post<{ listingId: number; status: string }>(this.supplierUrl, dto);
  }
  supplierUpdate(id: number, dto: UpdateListingDto): Observable<any> {
    return this.http.put(`${this.supplierUrl}/${id}`, dto, {
      context: new HttpContext().set(SUPPRESS_403_REDIRECT, true)
    });
  }
  supplierDeactivate(id: number): Observable<any> {
    return this.http.patch(`${this.supplierUrl}/${id}/deactivate`, {});
  }
  /** Hard-delete a listing. Fails if cart, bookings, quotes, or history are linked. */
  supplierDelete(id: number): Observable<{ listingId: number; status: string; message?: string }> {
    return this.http.delete<{ listingId: number; status: string; message?: string }>(`${this.supplierUrl}/${id}`);
  }

  uploadImages(
    listingId: number,
    files: File[]
  ): Observable<{ listingId: number; imageUrls: string[] }> {
    const form = new FormData();
    files.forEach(f => form.append('files', f, f.name));
    return this.http.post<{ listingId: number; imageUrls: string[] }>(
      `${this.supplierUrl}/${listingId}/images`, form
    );
  }
  deleteImage(listingId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.supplierUrl}/${listingId}/images/${imageId}`);
  }

  contractorGetById(id: number): Observable<ListingDto> {
    return this.http.get<ListingDto>(`${this.contractorUrl}/${id}`);
  }

  browseMachinery(params: {
    search?: string; category?: number; serviceAreaId?: number;
    page?: number; pageSize?: number;
  }): Observable<PagedResult<ListingDto>> {
    let p = new HttpParams();
    if (params.search)   p = p.set('search',   params.search);
    if (params.category) p = p.set('category', params.category.toString());
    if (params.serviceAreaId) p = p.set('serviceAreaId', params.serviceAreaId.toString());
    p = p.set('page',     (params.page     ?? 1).toString());
    p = p.set('pageSize', (params.pageSize ?? 12).toString());
    return this.http.get<PagedResult<ListingDto>>(this.contractorUrl, { params: p });
  }

  get apiBase(): string {
    try {
      const url = new URL(environment.apiUrl);
      return url.origin;
    } catch {
      return environment.apiUrl.replace(/\/api\/?$/, '');
    }
  }
}