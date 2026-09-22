import { Component, OnInit } from '@angular/core';
import { ReviewService } from '../../../core/services/review.service';
import { ReviewDto } from '../../../core/models/review.models';

@Component({
  selector: 'app-admin-reviews',
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss'],
  standalone: false,
})
export class AdminReviewsComponent implements OnInit {
  reviews: ReviewDto[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 20;
  loading = false;
  error = '';
  message = '';

  statusFilter = '';
  starFilter: number | null = null;
  search = '';

  // Delete modal
  showDeleteModal = false;
  reviewToDelete: ReviewDto | null = null;
  deleteReason = '';
  deleting = false;
  deleteError = '';

  constructor(private reviewService: ReviewService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';
    this.reviewService.getAllForAdmin({
      page: this.page,
      pageSize: this.pageSize,
      status: this.statusFilter || undefined,
      starFilter: this.starFilter ?? undefined,
      search: this.search || undefined
    }).subscribe({
      next: res => {
        this.reviews = res.reviews;
        this.totalCount = res.totalCount;
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load reviews.';
        this.loading = false;
      }
    });
  }

  applyFilters() {
    this.page = 1;
    this.load();
  }

  clearFilters() {
    this.statusFilter = '';
    this.starFilter = null;
    this.search = '';
    this.applyFilters();
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.totalCount / this.pageSize)); }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.load();
  }

  openDelete(r: ReviewDto) {
    this.reviewToDelete = r;
    this.deleteReason = '';
    this.deleteError = '';
    this.showDeleteModal = true;
  }

  closeDelete() {
    this.showDeleteModal = false;
    this.reviewToDelete = null;
  }

  confirmDelete() {
    if (!this.reviewToDelete) return;
    if (!this.deleteReason.trim()) {
      this.deleteError = 'Please provide a reason for removing this review.';
      return;
    }

    this.deleting = true;
    this.deleteError = '';
    this.reviewService.adminDelete(this.reviewToDelete.reviewID, this.deleteReason.trim()).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteModal = false;
        this.reviewToDelete = null;
        this.message = 'Review removed.';
        this.load();
      },
      error: err => {
        this.deleting = false;
        this.deleteError = err?.error?.message ?? 'Could not remove this review.';
      }
    });
  }
}
