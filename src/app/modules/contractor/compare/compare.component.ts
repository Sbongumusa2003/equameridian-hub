import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ListingService } from '../../../core/services/listing.service';
import { AuthService } from '../../../core/services/auth.service';
import { ListingDto } from '../../../core/models/listing.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-compare',
  templateUrl: './compare.component.html',
  styleUrls: ['./compare.component.scss'],
  standalone: false,
})
export class CompareComponent implements OnInit {
  listings: (ListingDto | null)[] = [null, null, null, null];
  specs = ['operatingWeight', 'enginePower', 'location'];
  specLabels: Record<string, string> = {
    operatingWeight: 'OPERATING WEIGHT',
    enginePower:     'ENGINE POWER',
    location:        'LOCATION'
  };
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listingService: ListingService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    const ids = (this.route.snapshot.queryParamMap.get('ids') ?? '')
      .split(',').filter(Boolean).map(Number)
      .filter(n => !Number.isNaN(n));

    if (ids.length < 2) {
      this.error = 'Select at least 2 listings on Browse machinery to compare them.';
      return;
    }

    this.loading = true;
    // Public AllowAnonymous endpoint — works for guests and logged-in contractors/admins
    forkJoin(ids.slice(0, 4).map(id => this.listingService.contractorGetById(id))).subscribe({
      next: results => {
        // Only compare available machinery (Active + units in stock)
        const available = results.filter(l =>
          l && l.availabilityStatus === 'Active' && (l.unitsAvailable ?? 0) > 0
        );
        if (available.length < 2) {
          this.error = 'At least 2 available listings are required to compare. Unavailable machinery is excluded.';
          this.listings = [null, null, null, null];
          this.loading = false;
          return;
        }
        available.forEach((l, i) => this.listings[i] = l);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Could not load listings for comparison. Please try again from Browse machinery.';
      }
    });
  }

  getValue(listing: ListingDto | null, spec: string): string {
    if (!listing) return '—';
    return (listing as any)[spec] ?? '—';
  }

  backToBrowse(): void {
    this.router.navigate(['/browse']);
  }

  /** Guests can compare; booking requires contractor login. */
  bookNow(listing: ListingDto | null): void {
    if (!listing) return;
    const target = listing.pricingMode === 'Fixed'
      ? `/contractor/book-now/${listing.listingID}`
      : `/contractor/quotations/request/${listing.listingID}`;

    if (!this.auth.isLoggedIn) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: target } });
      return;
    }
    if (this.auth.role !== 'contractor') {
      this.router.navigate(['/unauthorized']);
      return;
    }
    this.router.navigateByUrl(target);
  }
}
