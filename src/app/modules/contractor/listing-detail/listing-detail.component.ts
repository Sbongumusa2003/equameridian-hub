import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ListingService } from '../../../core/services/listing.service';
import { ReviewService } from '../../../core/services/review.service';
import { CampaignService } from '../../../core/services/campaign.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { AuthService } from '../../../core/services/auth.service';
import { ListingDto } from '../../../core/models/listing.models';
import { RatingSummaryDto, ReviewDto, ReviewAspectLabels } from '../../../core/models/review.models';
import { CampaignDto } from '../../../core/models/campaign.models';

@Component({
  selector: 'app-listing-detail',
  templateUrl: './listing-detail.component.html',
  styleUrls: ['./listing-detail.component.scss'],
  standalone: false,
})
export class ListingDetailComponent implements OnInit {
  listing: ListingDto | null = null;
  loading = true;
  activeImage = 0;
  activePromo: CampaignDto | null = null;

  reviews: ReviewDto[] = [];
  reviewsSummary: RatingSummaryDto | null = null;
  reviewsTotalCount = 0;
  reviewsPage = 1;
  reviewsPageSize = 3;
  reviewsSortBy = 'recent';
  reviewsStarFilter: number | null = null;
  reviewsMessage: string | null = null;
  reviewsLoading = false;
  reviewAspectLabels = ReviewAspectLabels;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listingService: ListingService,
    private reviewService: ReviewService,
    private campaignService: CampaignService,
    public wishlist: WishlistService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.listingService.contractorGetById(id).subscribe({
      next: l => {
        this.listing = l;
        this.loading = false;
        this.loadReviews();
        this.loadActivePromo(id);
      },
      error: () => { this.loading = false; }
    });
    if (this.auth.isLoggedIn && this.auth.role === 'contractor') {
      this.wishlist.refreshIds();
    }
  }

  toggleWishlist(): void {
    if (!this.listing) return;
    if (!this.auth.isLoggedIn) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: `/browse/${this.listing.listingID}` }
      });
      return;
    }
    this.wishlist.toggle(this.listing.listingID).subscribe();
  }

  loadActivePromo(listingId: number) {
    this.campaignService.getActive().subscribe({
      next: res => {
        this.activePromo = (res.campaigns ?? []).find(
          c => (c.type === 'Discount Code' || c.type === 'Featured Listing') && c.featuredListingID === listingId
        ) ?? null;
      },
      error: () => {}
    });
  }

  get discountedPrice(): number | null {
    if (!this.listing || !this.activePromo?.discountValue) return null;
    return Math.max(0, this.listing.dailyRateZAR * (1 - this.activePromo.discountValue / 100));
  }

  loadReviews() {
    if (!this.listing) return;
    this.reviewsLoading = true;
    this.reviewService.getForListing(this.listing.listingID, {
      page: this.reviewsPage,
      pageSize: this.reviewsPageSize,
      sortBy: this.reviewsSortBy,
      starFilter: this.reviewsStarFilter ?? undefined
    }).subscribe({
      next: res => {
        this.reviews = res.reviews;
        this.reviewsSummary = res.summary;
        this.reviewsTotalCount = res.totalCount;
        this.reviewsMessage = res.message ?? null;
        this.reviewsLoading = false;
      },
      error: () => { this.reviewsLoading = false; }
    });
  }

  setReviewsSort(sortBy: string) {
    this.reviewsSortBy = sortBy;
    this.reviewsPage = 1;
    this.loadReviews();
  }

  setStarFilter(star: number | null) {
    this.reviewsStarFilter = star;
    this.reviewsPage = 1;
    this.loadReviews();
  }

  get reviewsTotalPages(): number { return Math.max(1, Math.ceil(this.reviewsTotalCount / this.reviewsPageSize)); }

  goToReviewsPage(p: number) {
    if (p < 1 || p > this.reviewsTotalPages) return;
    this.reviewsPage = p;
    this.loadReviews();
  }

  aspectKeys(ratings: { [key: string]: number }): string[] {
    return Object.keys(ratings || {});
  }

  resolveUrl(path: string | undefined | null): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = this.listingService.apiBase;
    return base.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
  }

  requestQuote() {
    if (!this.listing) return;
    const target = `/contractor/quotations/request/${this.listing.listingID}`;
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

  bookNow() {
    if (!this.listing) return;
    const target = `/contractor/book-now/${this.listing.listingID}`;
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

  prevImage(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!this.listing?.imageUrls?.length) return;
    const n = this.listing.imageUrls.length;
    this.activeImage = (this.activeImage - 1 + n) % n;
  }

  nextImage(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!this.listing?.imageUrls?.length) return;
    const n = this.listing.imageUrls.length;
    this.activeImage = (this.activeImage + 1) % n;
  }

  messageSupplier() {
    if (!this.listing) return;
    const target = '/account/messages';
    const queryParams = {
      recipientId: this.listing.supplierID,
      name: this.listing.supplierName
    };
    if (!this.auth.isLoggedIn) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: `${target}?recipientId=${this.listing.supplierID}` }
      });
      return;
    }
    this.router.navigate([target], { queryParams });
  }
}