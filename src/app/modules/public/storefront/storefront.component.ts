import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ListingDto } from '../../../core/models/listing.models';
import { ListingService } from '../../../core/services/listing.service';
import { CategoryService, CategoryDto } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';

interface SupplierStorefrontDto {
  supplierID: number;
  supplierName: string;
  companyName?: string;
  locationSummary?: string;
  averageRating: number;
  reviewCount: number;
  activeListings: number;
  verified: boolean;
  listings: ListingDto[];
}

@Component({
  selector: 'app-storefront',
  templateUrl: './storefront.component.html',
  styleUrls: ['./storefront.component.scss'],
  standalone: false,
})
export class StorefrontComponent implements OnInit {
  store: SupplierStorefrontDto | null = null;
  loading = true;
  error = '';
  page = 1;
  pageSize = 24;
  search = '';
  categoryFilter: number | undefined;
  categories: CategoryDto[] = [];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private listingService: ListingService,
    private categoryService: CategoryService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.categoryService.getAll().subscribe({
      next: cats => this.categories = cats || [],
      error: () => {}
    });
    this.route.paramMap.subscribe(pm => {
      const id = Number(pm.get('supplierId'));
      if (!id) {
        this.error = 'Supplier not found.';
        this.loading = false;
        return;
      }
      this.load(id);
    });
  }

  load(supplierId: number) {
    this.loading = true;
    this.error = '';
    this.http.get<SupplierStorefrontDto>(
      `${environment.apiUrl}/suppliers/${supplierId}`,
      { params: { page: this.page, pageSize: this.pageSize } }
    ).subscribe({
      next: s => {
        this.store = s;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Could not load this supplier storefront.';
      }
    });
  }

  get visibleListings(): ListingDto[] {
    const items = this.store?.listings ?? [];
    const q = this.search.trim().toLowerCase();
    return items.filter(l => {
      const matchesType = !this.categoryFilter || l.categoryID === this.categoryFilter;
      if (!matchesType) return false;
      if (!q) return true;
      return (l.listingTitle || '').toLowerCase().includes(q)
        || (l.description || '').toLowerCase().includes(q)
        || (l.location || '').toLowerCase().includes(q)
        || (l.makeBrand || '').toLowerCase().includes(q);
    });
  }

  resolveUrl(path: string | undefined | null): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = this.listingService.apiBase;
    return base.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
  }

  detailLink(listing: ListingDto): any[] {
    return ['/browse', listing.listingID];
  }

  actOnListing(listing: ListingDto) {
    if (listing.unitsAvailable <= 0) return;
    if (listing.pricingMode === 'Fixed') {
      this.router.navigate(['/contractor/book-now', listing.listingID]);
    } else {
      this.router.navigate(['/contractor/quotations/request', listing.listingID]);
    }
  }

  messageSupplier() {
    if (!this.store) return;
    const target = '/account/messages';
    const queryParams = {
      recipientId: this.store.supplierID,
      name: this.store.companyName || this.store.supplierName
    };
    if (!this.auth.isLoggedIn) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: `${target}?recipientId=${this.store.supplierID}` }
      });
      return;
    }
    this.router.navigate([target], { queryParams });
  }
}