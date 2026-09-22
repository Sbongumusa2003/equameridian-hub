import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SuburbNode { suburbID: number; name: string; }
export interface CityNode { cityID: number; name: string; suburbs: SuburbNode[]; }
export interface ProvinceNode { provinceID: number; name: string; cities: CityNode[]; }

@Injectable({ providedIn: 'root' })
export class LocationTreeService {
  private url = `${environment.apiUrl}/location-tree`;

  constructor(private http: HttpClient) {}

  getTree(): Observable<ProvinceNode[]> {
    return this.http.get<ProvinceNode[]>(this.url);
  }

  createProvince(name: string): Observable<ProvinceNode> {
    return this.http.post<ProvinceNode>(`${this.url}/provinces`, { name });
  }
  updateProvince(id: number, name: string): Observable<ProvinceNode> {
    return this.http.put<ProvinceNode>(`${this.url}/provinces/${id}`, { name });
  }
  deleteProvince(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/provinces/${id}`);
  }

  createCity(provinceID: number, name: string): Observable<CityNode> {
    return this.http.post<CityNode>(`${this.url}/cities`, { provinceID, name });
  }
  updateCity(id: number, name: string): Observable<CityNode> {
    return this.http.put<CityNode>(`${this.url}/cities/${id}`, { name });
  }
  deleteCity(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/cities/${id}`);
  }

  createSuburb(cityID: number, name: string): Observable<SuburbNode> {
    return this.http.post<SuburbNode>(`${this.url}/suburbs`, { cityID, name });
  }
  updateSuburb(id: number, name: string): Observable<SuburbNode> {
    return this.http.put<SuburbNode>(`${this.url}/suburbs/${id}`, { name });
  }
  deleteSuburb(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/suburbs/${id}`);
  }
}
