import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WishlistService } from '../../../core/services/wishlist.service';
import { WishlistItemDto } from '../../../core/models/wishlist.models';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss'],
  standalone: false,
})
export class WishlistComponent implements OnInit {
  items: WishlistItemDto[] = [];
  loading = true;
  error = '';
  removingId: number | null = null;

  constructor(private wishlist: WishlistService, private router: Router) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.wishlist.getAll().subscribe({
      next: items => {
        this.items = items || [];
        this.loading = false;
        this.wishlist.refreshIds();
      },
      error: () => {
        this.loading = false;
        this.error = 'Could not load your wishlist.';
      }
    });
  }

  listingId(item: WishlistItemDto): number {
    return item.listing?.listingID ?? 0;
  }

  listingTitle(item: WishlistItemDto): string {
    return item.listing?.listingTitle || ('Listing #' + this.listingId(item));
  }

  supplierName(item: WishlistItemDto): string {
    return item.listing?.supplierName || '';
  }

  remove(item: WishlistItemDto) {
    const id = this.listingId(item);
    if (!id) return;
    this.removingId = item.wishlistItemID;
    this.wishlist.removeByListing(id).subscribe({
      next: () => {
        this.items = this.items.filter(i => i.wishlistItemID !== item.wishlistItemID);
        this.removingId = null;
      },
      error: () => {
        this.removingId = null;
        this.error = 'Could not remove that item.';
      }
    });
  }

  openListing(item: WishlistItemDto) {
    const id = this.listingId(item);
    if (id) this.router.navigate(['/contractor/browse', id]);
  }
}
