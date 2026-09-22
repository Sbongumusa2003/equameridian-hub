import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { LocationTreeService, ProvinceNode, CityNode } from '../../../core/services/location-tree.service';

@Component({
  selector: 'app-location-tree',
  templateUrl: './location-tree.component.html',
  styleUrls: ['./location-tree.component.scss'],
  standalone: false
})
export class LocationTreeComponent implements OnInit {
  tree: ProvinceNode[] = [];
  loading = false;
  errorMessage = '';

  expandedProvinces = new Set<number>();
  expandedCities = new Set<number>();

  // Inline "add" inputs, keyed by parent id (0 = new top-level province)
  newProvinceName = '';
  newCityName: Record<number, string> = {};
  newSuburbName: Record<number, string> = {};

  // Inline rename state
  editing: { type: 'province' | 'city' | 'suburb'; id: number; name: string } | null = null;

  constructor(private treeService: LocationTreeService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.treeService.getTree().subscribe({
      next: tree => { this.tree = tree; this.loading = false; },
      error: err => { this.errorMessage = err?.error?.message || 'Could not load the location tree.'; this.loading = false; }
    });
  }

  toggleProvince(id: number) {
    this.expandedProvinces.has(id) ? this.expandedProvinces.delete(id) : this.expandedProvinces.add(id);
  }
  toggleCity(id: number) {
    this.expandedCities.has(id) ? this.expandedCities.delete(id) : this.expandedCities.add(id);
  }

  // --- Add ---

  addProvince() {
    if (!this.newProvinceName.trim()) return;
    this.errorMessage = '';
    this.treeService.createProvince(this.newProvinceName.trim()).subscribe({
      next: () => { this.newProvinceName = ''; this.load(); },
      error: err => { this.errorMessage = err?.error?.message || 'Could not add province.'; }
    });
  }

  addCity(province: ProvinceNode) {
    const name = (this.newCityName[province.provinceID] || '').trim();
    if (!name) return;
    this.errorMessage = '';
    this.treeService.createCity(province.provinceID, name).subscribe({
      next: () => { this.newCityName[province.provinceID] = ''; this.expandedProvinces.add(province.provinceID); this.load(); },
      error: err => { this.errorMessage = err?.error?.message || 'Could not add city.'; }
    });
  }

  addSuburb(city: CityNode) {
    const name = (this.newSuburbName[city.cityID] || '').trim();
    if (!name) return;
    this.errorMessage = '';
    this.treeService.createSuburb(city.cityID, name).subscribe({
      next: () => { this.newSuburbName[city.cityID] = ''; this.expandedCities.add(city.cityID); this.load(); },
      error: err => { this.errorMessage = err?.error?.message || 'Could not add suburb.'; }
    });
  }

  // --- Edit ---

  startEdit(type: 'province' | 'city' | 'suburb', id: number, currentName: string) {
    this.editing = { type, id, name: currentName };
  }
  cancelEdit() {
    this.editing = null;
  }
  saveEdit() {
    if (!this.editing || !this.editing.name.trim()) return;
    const { type, id, name } = this.editing;
    this.errorMessage = '';

    const req: Observable<any> = type === 'province' ? this.treeService.updateProvince(id, name.trim())
      : type === 'city' ? this.treeService.updateCity(id, name.trim())
      : this.treeService.updateSuburb(id, name.trim());

    req.subscribe({
      next: () => { this.editing = null; this.load(); },
      error: (err: any) => { this.errorMessage = err?.error?.message || 'Could not save the change.'; }
    });
  }

  // --- Delete ---

  deleteProvince(p: ProvinceNode) {
    if (!confirm(`Delete province "${p.name}"?`)) return;
    this.errorMessage = '';
    this.treeService.deleteProvince(p.provinceID).subscribe({
      next: () => this.load(),
      error: err => { this.errorMessage = err?.error?.message || 'Could not delete province.'; }
    });
  }

  deleteCity(c: CityNode) {
    if (!confirm(`Delete city "${c.name}"?`)) return;
    this.errorMessage = '';
    this.treeService.deleteCity(c.cityID).subscribe({
      next: () => this.load(),
      error: err => { this.errorMessage = err?.error?.message || 'Could not delete city.'; }
    });
  }

  deleteSuburb(cityID: number, suburbID: number, name: string) {
    if (!confirm(`Delete suburb "${name}"?`)) return;
    this.errorMessage = '';
    this.treeService.deleteSuburb(suburbID).subscribe({
      next: () => this.load(),
      error: err => { this.errorMessage = err?.error?.message || 'Could not delete suburb.'; }
    });
  }
}