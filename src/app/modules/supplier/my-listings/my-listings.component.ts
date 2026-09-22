import { Component, OnInit } from '@angular/core';
import { ListingService } from '../../../core/services/listing.service';
import { CategoryService, CategoryDto } from '../../../core/services/category.service';
import { ListingDto } from '../../../core/models/listing.models';

@Component({
  selector: 'app-my-listings',
  templateUrl: './my-listings.component.html',
  styleUrls: ['./my-listings.component.scss'],
  standalone: false,
})
export class MyListingsComponent implements OnInit {
  allListings: ListingDto[] = [];
  filtered: ListingDto[] = [];
  categories: CategoryDto[] = [];
  activeTab = 'All';
  loading = false;
  page = 1;
  pageSize = 20;
  totalCount = 0;
  showDeleteDialog = false;
  selectedListing: ListingDto | null = null;
  tabs = ['All', 'Active', 'Pending', 'Suspended', 'Inactive'];

  // Excel bulk import
  importing = false;
  importResult: { createdCount: number; createdTitles: string[]; errorCount: number; errors: string[] } | null = null;
  importErrorMessage = '';
  downloadingTemplate = false;
  showImportPanel = false;

  constructor(
    private listingService: ListingService,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {
    this.categoryService.getAll().subscribe(cats => this.categories = cats);
    this.load();
  }


  toggleImportPanel() {
    this.showImportPanel = !this.showImportPanel;
    this.importErrorMessage = '';
  }

  downloadTemplate() {
    this.downloadingTemplate = true;
    this.importErrorMessage = '';
    this.listingService.supplierDownloadImportTemplate().subscribe({
      next: blob => {
        this.downloadingTemplate = false;
        if (!blob || blob.size < 64) {
          this.importErrorMessage = 'Template download returned an empty file.';
          return;
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'equameridian-listings-import-template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: err => {
        this.downloadingTemplate = false;
        this.importErrorMessage = err?.error?.message || 'Could not download the import template.';
      }
    });
  }

  onImportFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow re-selecting the same file name after a failed attempt
    if (!file) return;

    this.importing = true;
    this.importResult = null;
    this.importErrorMessage = '';

    this.listingService.supplierImportFromExcel(file).subscribe({
      next: result => {
        this.importing = false;
        this.importResult = result;
        if (result.createdCount > 0) this.load();
      },
      error: err => {
        this.importing = false;
        this.importErrorMessage = err?.error?.message || 'Could not import the file.';
      }
    });
  }

  onImportJsonFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.importing = true;
    this.importResult = null;
    this.importErrorMessage = '';

    const reader = new FileReader();
    reader.onload = () => {
      let listings: any[];
      try {
        const parsed = JSON.parse(reader.result as string);
        listings = Array.isArray(parsed) ? parsed : parsed.listings;
        if (!Array.isArray(listings)) throw new Error('not an array');
      } catch {
        this.importing = false;
        this.importErrorMessage = 'That file is not valid JSON (expected an array of listings, or { "listings": [...] }).';
        return;
      }

      this.listingService.supplierImportFromJson(listings).subscribe({
        next: result => {
          this.importing = false;
          this.importResult = result;
          if (result.createdCount > 0) this.load();
        },
        error: err => {
          this.importing = false;
          this.importErrorMessage = err?.error?.message || 'Could not import the file.';
        }
      });
    };
    reader.readAsText(file);
  }

  exportToJson() {
    this.listingService.supplierExportToJson().subscribe({
      next: data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `equameridian-listings-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: err => { this.importErrorMessage = err?.error?.message || 'Could not export listings.'; }
    });
  }

  load() {
    this.loading = true;
    const statusFilter = this.activeTab === 'All' ? undefined : this.activeTab;
    this.listingService.supplierGetOwn({
      status: statusFilter, page: this.page, pageSize: this.pageSize
    }).subscribe((res: any) => {
      const raw = res.listings ?? [];
      this.allListings = raw.map((item: any) => item.listing ?? item);
      this.totalCount  = res.totalCount ?? this.allListings.length;
      this.filtered    = this.allListings;
      this.loading     = false;
    });
  }

  applyTab(tab: string) { this.activeTab = tab; this.page = 1; this.load(); }

  count(tab: string): number {
    return tab === this.activeTab ? this.totalCount : 0;
  }

  get totalPages(): number { return Math.ceil(this.totalCount / this.pageSize); }

  getCategoryName(id: number): string {
    return this.categories.find(c => c.categoryID === id)?.name ?? String(id);
  }

  deleteError = '';

  openDelete(listing: ListingDto) {
    this.selectedListing = listing;
    this.deleteError = '';
    this.showDeleteDialog = true;
  }

  confirmDelete() {
    if (!this.selectedListing) return;
    this.deleteError = '';
    this.listingService.supplierDelete(this.selectedListing.listingID).subscribe({
      next: () => {
        this.showDeleteDialog = false;
        this.selectedListing = null;
        this.load();
      },
      error: err => {
        this.deleteError = err?.error?.message
          ?? 'This listing cannot be deleted because it is linked to cart, booking, or other history.';
      }
    });
  }
}