import { Component, OnInit } from '@angular/core';
import { ReviewService } from '../../../core/services/review.service';
import { ReviewDto, ReviewAspects, ReviewAspectLabels } from '../../../core/models/review.models';

@Component({
  selector: 'app-my-reviews',
  templateUrl: './my-reviews.component.html',
  styleUrls: ['./my-reviews.component.scss'],
  standalone: false,
})
export class MyReviewsComponent implements OnInit {
  reviews: ReviewDto[] = [];
  loading = true;
  error = '';

  editing: ReviewDto | null = null;
  editForm = {
    overallRating: 5,
    title: '',
    reviewText: '',
    aspectRatings: { MachineryCondition: 5, Reliability: 5, Communication: 5, ValueForMoney: 5 } as { [key: string]: number }
  };
  reviewAspects = ReviewAspects;
  reviewAspectLabels = ReviewAspectLabels;
  saving = false;
  editError = '';
  deletingId: number | null = null;

  constructor(private reviewsApi: ReviewService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.reviewsApi.getMine().subscribe({
      next: res => {
        this.reviews = res.reviews || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Could not load your reviews.';
      }
    });
  }

  startEdit(r: ReviewDto) {
    this.editing = r;
    this.editError = '';
    this.editForm = {
      overallRating: r.overallRating,
      title: r.title,
      reviewText: r.reviewText,
      aspectRatings: { ...(r.aspectRatings || { MachineryCondition: 5, Reliability: 5, Communication: 5, ValueForMoney: 5 }) }
    };
  }

  cancelEdit() {
    this.editing = null;
    this.editError = '';
  }

  saveEdit() {
    if (!this.editing) return;
    if (!this.editForm.title.trim() || !this.editForm.reviewText.trim()) {
      this.editError = 'Title and review text are required.';
      return;
    }
    this.saving = true;
    this.reviewsApi.update(this.editing.reviewID, {
      overallRating: this.editForm.overallRating,
      title: this.editForm.title,
      reviewText: this.editForm.reviewText,
      aspectRatings: this.editForm.aspectRatings
    }).subscribe({
      next: res => {
        this.saving = false;
        const idx = this.reviews.findIndex(x => x.reviewID === this.editing!.reviewID);
        if (idx >= 0) this.reviews[idx] = res.review;
        this.editing = null;
      },
      error: err => {
        this.saving = false;
        this.editError = err?.error?.message || 'Could not update review.';
      }
    });
  }

  remove(r: ReviewDto) {
    if (!confirm('Delete this review?')) return;
    this.deletingId = r.reviewID;
    this.reviewsApi.delete(r.reviewID).subscribe({
      next: () => {
        this.reviews = this.reviews.filter(x => x.reviewID !== r.reviewID);
        this.deletingId = null;
        if (this.editing?.reviewID === r.reviewID) this.editing = null;
      },
      error: err => {
        this.deletingId = null;
        this.error = err?.error?.message || 'Could not delete review.';
      }
    });
  }
}
