import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardSummaryDto, DashboardChartsDto } from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/admin/dashboard`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<DashboardSummaryDto> {
    return this.http.get<DashboardSummaryDto>(this.apiUrl);
  }

  getCharts(days: number = 30): Observable<DashboardChartsDto> {
    return this.http.get<DashboardChartsDto>(`${this.apiUrl}/charts`, {
      params: { days: days.toString() }
    });
  }
}