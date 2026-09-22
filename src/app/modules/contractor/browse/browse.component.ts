import { Component, OnInit, AfterViewInit, OnDestroy, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ListingService } from '../../../core/services/listing.service';
import { CategoryService, CategoryDto } from '../../../core/services/category.service';
import { CampaignService } from '../../../core/services/campaign.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { AuthService } from '../../../core/services/auth.service';
import { ServiceAreaService } from '../../../core/services/service-area.service';
import { ListingDto } from '../../../core/models/listing.models';
import { CampaignDto } from '../../../core/models/campaign.models';

@Component({
  selector: 'app-browse',
  templateUrl: './browse.component.html',
  styleUrls: ['./browse.component.scss'],
  standalone: false,
})
export class BrowseComponent implements OnInit, AfterViewInit, OnDestroy {
  listings: ListingDto[]   = [];
  categories: CategoryDto[] = [];
  loading     = false;
  error       = '';
  search      = '';
  categoryFilter: number | undefined;
  serviceAreaFilter: number | undefined;
  serviceAreas: { serviceAreaID: number; name: string }[] = [];
  compareList: ListingDto[] = [];

  @ViewChildren('reveal') revealEls!: QueryList<ElementRef<HTMLElement>>;
  private observer?: IntersectionObserver;

  activeCampaigns: CampaignDto[] = [];
  banners: CampaignDto[] = [];
  private discountByListingId = new Map<number, CampaignDto>();

  constructor(
    private listingService: ListingService,
    private categoryService: CategoryService,
    private campaignService: CampaignService,
    public wishlist: WishlistService,
    public auth: AuthService,
    private serviceAreaService: ServiceAreaService,
    private router: Router,
    private route: ActivatedRoute
  ) {}


  ngAfterViewInit(): void {
    this.setupReveals();
    this.revealEls?.changes.subscribe(() => this.setupReveals());
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private setupReveals(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.revealEls?.forEach(el => el.nativeElement.classList.add('is-visible'));
      return;
    }
    this.observer?.disconnect();
    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.observer?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    this.revealEls?.forEach(ref => this.observer!.observe(ref.nativeElement));
  }

  ngOnInit() {
    this.categoryService.getAll().subscribe(cats => this.categories = cats);
    this.serviceAreaService.getAll().subscribe(areas => this.serviceAreas = areas as any);
    this.loadActivePromotions();

    // Picks up a category pre-filter passed from the homepage's category tiles
    // (e.g. /browse?category=5); a direct visit to /browse has no query param and behaves as before.
    const categoryParam = this.route.snapshot.queryParamMap.get('category');
    if (categoryParam) {
      this.categoryFilter = Number(categoryParam);
    }
    this.load();
    if (this.auth.isLoggedIn && this.auth.role === 'contractor') {
      this.wishlist.refreshIds();
    }
  }

  /** Guests get sent to log in (and land back here after); contractors toggle immediately. */
  toggleWishlist(listing: ListingDto, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.auth.isLoggedIn) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/browse' } });
      return;
    }
    this.wishlist.toggle(listing.listingID).subscribe();
  }

  loadActivePromotions() {
    this.campaignService.getActive().subscribe({
      next: res => {
        this.activeCampaigns = res.campaigns ?? [];
        this.banners = this.activeCampaigns.filter(c => c.type === 'Banner');
        this.discountByListingId.clear();
        this.activeCampaigns
          .filter(c => (c.type === 'Discount Code' || c.type === 'Featured Listing') && c.featuredListingID)
          .forEach(c => this.discountByListingId.set(c.featuredListingID!, c));
      },
      // Promotions are a nice-to-have on this page — don't block browsing if they fail to load.
      error: () => {}
    });
  }

  /** Returns the active discount/promotion campaign for a listing, if any. */
  discountFor(listing: ListingDto): CampaignDto | undefined {
    return this.discountByListingId.get(listing.listingID);
  }

  discountedPrice(listing: ListingDto): number | null {
    const campaign = this.discountFor(listing);
    if (!campaign || !campaign.discountValue) return null;
    return Math.max(0, listing.dailyRateZAR * (1 - campaign.discountValue / 100));
  }

  load() {
    this.loading = true;
    this.error = '';
    this.listingService.browseMachinery({
      search: this.search || undefined,
      category: this.categoryFilter,
      serviceAreaId: this.serviceAreaFilter,
      page: 1,
      pageSize: 48
    }).subscribe({
      next: res => {
        this.listings = res?.listings ?? [];
        this.loading = false;
        // Cards re-render — re-bind reveal observer on next tick
        setTimeout(() => this.setupReveals(), 0);
      },
      error: err => {
        this.listings = [];
        this.loading = false;
        this.error = err?.error?.message
          || 'Could not load machinery listings. Please try again.';
      }
    });
  }


  /** Only Active listings with stock can be compared. */
  isComparable(listing: ListingDto): boolean {
    return listing.availabilityStatus === 'Active' && (listing.unitsAvailable ?? 0) > 0;
  }

  toggleCompare(listing: ListingDto) {
    // Allow removing from compare even if it became unavailable
    const idx = this.compareList.findIndex(l => l.listingID === listing.listingID);
    if (idx >= 0) {
      this.compareList.splice(idx, 1);
      return;
    }
    if (!this.isComparable(listing)) return;
    if (this.compareList.length < 4) this.compareList.push(listing);
  }


  isInCompare(listing: ListingDto): boolean {
    return this.compareList.some(l => l.listingID === listing.listingID);
  }

  resolveUrl(path: string | undefined | null): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = this.listingService.apiBase;
    return base.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
  }



  /** Detail route depends on whether we are under /contractor or public /browse. */
  detailLink(listing: ListingDto): any[] {
    if (this.router.url.startsWith('/contractor')) {
      return ['/contractor/browse', listing.listingID];
    }
    return ['/browse', listing.listingID];
  }

  /**
   * Guests can browse freely; booking/quote requires a contractor account.
   * Send them to login with a return URL so they land back on the action after signing in.
   */
  actOnListing(listing: ListingDto): void {
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

  goCompare() {
    const available = this.compareList.filter(l => this.isComparable(l));
    this.compareList = available;
    if (available.length < 2) {
      this.error = 'Select at least 2 available listings to compare. Unavailable machinery cannot be compared.';
      return;
    }
    const base = this.router.url.startsWith('/contractor') ? '/contractor/compare' : '/browse/compare';
    this.router.navigate(
      [base],
      { queryParams: { ids: available.map(l => l.listingID).join(',') } }
    );
  }
}