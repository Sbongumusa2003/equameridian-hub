import { Component, OnInit } from '@angular/core';
import { BookingService } from '../../../core/services/booking.service';
import { DisputeService } from '../../../core/services/dispute.service';
import { ReviewService } from '../../../core/services/review.service';
import { BookingListItemDto, BookingSummaryCardsDto } from '../../../core/models/booking.models';
import { ReviewAspects, ReviewAspectLabels } from '../../../core/models/review.models';
import { DISPUTE_CATEGORIES } from '../../../core/models/dispute.models';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.scss'],
  standalone: false,
})
export class BookingsComponent implements OnInit {
  bookings: BookingListItemDto[] = [];
  summaryCards: BookingSummaryCardsDto = {
    activeBookings: 0, awaitingYourAction: 0, completedBookings: 0, totalLeasedToDate: 0
  };
  message: string | null = null;
  loading = true;

  search = '';
  status: string | undefined;
  page = 1;
  pageSize = 10;
  totalCount = 0;

  // Dispute modal
  showDisputeModal = false;
  disputeBooking: BookingListItemDto | null = null;
  disputeForm = { disputeCategory: '', description: '', desiredResolution: '' };
  disputeEvidence: File[] = [];
  disputeCategories = DISPUTE_CATEGORIES;
  disputeError = '';
  disputeSubmitting = false;

  // Review modal
  showReviewModal = false;
  reviewBooking: BookingListItemDto | null = null;
  isEditingReview = false;
  reviewAspects = Object.values(ReviewAspects);
  reviewAspectLabels = ReviewAspectLabels;
  reviewForm = {
    overallRating: 0,
    aspectRatings: {} as { [key: string]: number },
    title: '',
    reviewText: '',
    confirmedGenuine: false
  };
  reviewError = '';
  reviewSubmitting = false;

  // Delete review confirm
  showDeleteReviewConfirm = false;
  reviewToDeleteBooking: BookingListItemDto | null = null;
  deletingReview = false;

  constructor(
    private bookingService: BookingService,
    private disputeService: DisputeService,
    private reviewService: ReviewService
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.bookingService.getAll({
      search: this.search || undefined,
      status: this.status,
      page: this.page,
      pageSize: this.pageSize
    }).subscribe({
      next: res => {
        this.bookings = res.bookings;
        this.summaryCards = res.summaryCards;
        this.message = res.message ?? null;
        this.totalCount = res.totalCount;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get totalPages() { return Math.max(1, Math.ceil(this.totalCount / this.pageSize)); }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.load();
  }

  setStatus(s: string | undefined) {
    this.status = s;
    this.page = 1;
    this.load();
  }

  // ── Disputes ──────────────────────────────────────────────
  openDispute(b: BookingListItemDto) {
    this.disputeBooking = b;
    this.disputeForm = { disputeCategory: '', description: '', desiredResolution: '' };
    this.disputeEvidence = [];
    this.disputeError = '';
    this.showDisputeModal = true;
  }

  closeDispute() {
    this.showDisputeModal = false;
    this.disputeBooking = null;
  }

  onEvidenceSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.disputeEvidence = input.files ? Array.from(input.files) : [];
  }

  submitDispute() {
    if (!this.disputeBooking) return;
    if (!this.disputeForm.disputeCategory || !this.disputeForm.description.trim() || !this.disputeForm.desiredResolution.trim()) {
      this.disputeError = 'Please complete all required fields.';
      return;
    }
    this.disputeSubmitting = true;
    this.disputeError = '';
    this.disputeService.raise(this.disputeBooking.bookingID, this.disputeForm, this.disputeEvidence).subscribe({
      next: () => {
        this.disputeSubmitting = false;
        this.showDisputeModal = false;
        this.load();
      },
      error: err => {
        this.disputeSubmitting = false;
        this.disputeError = err?.error?.message || 'Could not submit dispute.';
      }
    });
  }

  // ── Reviews ───────────────────────────────────────────────
  openLeaveReview(b: BookingListItemDto) {
    this.reviewBooking = b;
    this.isEditingReview = false;
    this.reviewForm = { overallRating: 0, aspectRatings: {}, title: '', reviewText: '', confirmedGenuine: false };
    this.reviewError = '';
    this.showReviewModal = true;
  }

  openEditReview(b: BookingListItemDto) {
    this.reviewBooking = b;
    this.isEditingReview = true;
    this.reviewError = '';
    this.showReviewModal = true;
    // Pull the contractor's own reviews and find this one to prefill.
    this.reviewService.getMine().subscribe(res => {
      const existing = res.reviews.find(r => r.bookingID === b.bookingID);
      if (existing) {
        this.reviewForm = {
          overallRating: existing.overallRating,
          aspectRatings: { ...existing.aspectRatings },
          title: existing.title,
          reviewText: existing.reviewText,
          confirmedGenuine: true
        };
      }
    });
  }

  closeReview() {
    this.showReviewModal = false;
    this.reviewBooking = null;
  }

  setRating(value: number) { this.reviewForm.overallRating = value; }
  setAspectRating(aspect: string, value: number) { this.reviewForm.aspectRatings[aspect] = value; }

  submitReview() {
    if (!this.reviewBooking) return;
    if (!this.reviewForm.overallRating) {
      this.reviewError = 'Please select an overall rating.';
      return;
    }
    if (!this.reviewForm.title.trim() || !this.reviewForm.reviewText.trim()) {
      this.reviewError = 'Please provide a title and review text.';
      return;
    }
    if (!this.isEditingReview && !this.reviewForm.confirmedGenuine) {
      this.reviewError = 'Please confirm this review is genuine.';
      return;
    }

    this.reviewSubmitting = true;
    this.reviewError = '';

    if (this.isEditingReview && this.reviewBooking.reviewID) {
      this.reviewService.update(this.reviewBooking.reviewID, {
        overallRating: this.reviewForm.overallRating,
        aspectRatings: this.reviewForm.aspectRatings,
        title: this.reviewForm.title,
        reviewText: this.reviewForm.reviewText
      }).subscribe({
        next: () => {
          this.reviewSubmitting = false;
          this.showReviewModal = false;
          this.load();
        },
        error: err => {
          this.reviewSubmitting = false;
          this.reviewError = err?.error?.message || 'Could not update review.';
        }
      });
    } else {
      this.reviewService.create({
        bookingID: this.reviewBooking.bookingID,
        overallRating: this.reviewForm.overallRating,
        aspectRatings: this.reviewForm.aspectRatings,
        title: this.reviewForm.title,
        reviewText: this.reviewForm.reviewText,
        confirmedGenuine: this.reviewForm.confirmedGenuine
      }).subscribe({
        next: () => {
          this.reviewSubmitting = false;
          this.showReviewModal = false;
          this.load();
        },
        error: err => {
          this.reviewSubmitting = false;
          this.reviewError = err?.error?.message || 'Could not submit review.';
        }
      });
    }
  }

  confirmDeleteReview(b: BookingListItemDto) {
    this.reviewToDeleteBooking = b;
    this.showDeleteReviewConfirm = true;
  }

  cancelDeleteReview() {
    this.showDeleteReviewConfirm = false;
    this.reviewToDeleteBooking = null;
  }

  doDeleteReview() {
    if (!this.reviewToDeleteBooking?.reviewID) return;
    this.deletingReview = true;
    this.reviewService.delete(this.reviewToDeleteBooking.reviewID).subscribe({
      next: () => {
        this.deletingReview = false;
        this.showDeleteReviewConfirm = false;
        this.reviewToDeleteBooking = null;
        this.load();
      },
      error: () => { this.deletingReview = false; }
    });
  }
}
