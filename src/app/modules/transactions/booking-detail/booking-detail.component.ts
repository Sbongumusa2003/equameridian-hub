import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { DisputeService } from '../../../core/services/dispute.service';
import { AuthService } from '../../../core/services/auth.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ReviewService } from '../../../core/services/review.service';
import { DeliveryDetailDto, BookingTrackingDto } from '../../../core/models/booking.models';
import { PaymentStatusDto } from '../../../core/models/payment.models';
import { DISPUTE_CATEGORIES } from '../../../core/models/dispute.models';
import { ReviewAspects, ReviewAspectLabels } from '../../../core/models/review.models';

@Component({
  selector: 'app-booking-detail',
  templateUrl: './booking-detail.component.html',
  styleUrls: ['./booking-detail.component.scss'],
  standalone: false,
})
export class BookingDetailComponent implements OnInit {
  bookingId!: number;
  detail: DeliveryDetailDto | null = null;
  loading = true;
  processing = false;
  errorMessage = '';
  successMessage = '';

  tracking: BookingTrackingDto | null = null;
  trackingLoading = false;

  editingAddress = false;
  newAddress = '';

  showReturnForm = false;
  returnForm = {
    returnReason: '', preferredPickupDate: '', pickupTimeWindow: '',
    pickupLocation: '', notes: ''
  };
  pickupTimeWindows = ['8am - 10am', '10am - 12pm', '12pm - 2pm', '2pm - 4pm', '4pm - 6pm'];
  returnReasons = ['Lease period ending', 'Early return', 'Equipment fault'];

  showConfirmReturnForm = false;
  confirmReturnForm = { condition: '', inspectionNotes: '', damageDescription: '', estimatedRepairCost: null as number | null };
  returnPhotos: File[] = [];

  downloadingCalendar = false;

  paymentStatus: PaymentStatusDto | null = null;
  paymentStatusLoading = false;

  showDisputeForm = false;
  disputeForm = { disputeCategory: '', description: '', desiredResolution: '' };
  disputeCategories = DISPUTE_CATEGORIES;
  disputeEvidence: File[] = [];
  raisingDispute = false;
  disputeError = '';
  disputeSuccess = '';

  showReviewForm = false;
  reviewForm = {
    overallRating: 5,
    title: '',
    reviewText: '',
    confirmedGenuine: false,
    aspectRatings: { MachineryCondition: 5, Reliability: 5, Communication: 5, ValueForMoney: 5 } as { [key: string]: number }
  };
  reviewAspects = ReviewAspects;
  reviewAspectLabels = ReviewAspectLabels;
  submittingReview = false;
  reviewError = '';
  reviewSubmitted = false;

  handoverNotes = '';
  handoverOutcome = 'Pass';

  constructor(
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private disputeService: DisputeService,
    private paymentService: PaymentService,
    private reviewService: ReviewService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.bookingId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
    this.loadPaymentStatus();
    this.loadTracking();
  }

  load() {
    this.loading = true;
    this.bookingService.getDeliveryDetail(this.bookingId).subscribe({
      next: d => {
        this.detail = d;
        this.newAddress = d.deliveryAddress;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadTracking() {
    this.trackingLoading = true;
    this.bookingService.getTracking(this.bookingId).subscribe({
      next: t => { this.tracking = t; this.trackingLoading = false; },
      error: () => { this.trackingLoading = false; }
    });
  }

  trackingIcon(stage: string): string {
    switch (stage) {
      case 'AwaitingSignature':        return '✍️';
      case 'AwaitingPayment':          return '💳';
      case 'Confirmed':               return '✓';
      case 'Ready For Pickup':        return '📦';
      case 'Delivered':                return '🛵';
      case 'Return Requested':         return '↩️';
      case 'Ready For Return Pickup':  return '📦';
      case 'Completed':                return '🏠';
      default: return '•';
    }
  }

  get trackingHeadline(): string {
    if (!this.tracking) return '';
    if (this.tracking.isCancelled) return 'Booking Cancelled';
    const current = this.tracking.stages.find(s => s.isCurrent);
    if (current) return current.label;
    return this.tracking.stages.every(s => s.isComplete) ? 'Returned To Supplier' : this.tracking.currentStatus;
  }

  get trackingSubtext(): string {
    if (!this.tracking) return '';
    const current = this.tracking.stages.find(s => s.isCurrent);
    const stage = current?.stage ?? this.tracking.currentStatus;
    switch (stage) {
      case 'AwaitingSignature':
        return this.isSupplier
          ? 'Waiting on both parties to sign the lease agreement before this booking is confirmed.'
          : 'Please sign the lease agreement to move this booking forward.';
      case 'AwaitingPayment':
        return this.isSupplier
          ? 'Lease agreement signed — waiting on the contractor to complete payment.'
          : 'Lease agreement signed. Please complete payment to confirm your booking.';
      case 'Confirmed':
        return this.isSupplier
          ? 'Booking confirmed. Mark the machine ready when it is prepared for pickup or delivery.'
          : 'Your booking is confirmed. The supplier is preparing the machinery for pickup or delivery.';
      case 'Ready For Pickup':
        return this.isContractor
          ? 'The machinery is ready. Arrange collection, or wait for the supplier’s delivery.'
          : 'Machinery marked ready. Waiting on the contractor to collect or for your delivery run.';
      case 'Delivered':
        return this.isSupplier
          ? 'The machinery has been delivered and is on-site with the contractor.'
          : 'The machinery has been delivered and is on-site with you.';
      case 'Return Requested':
        return this.isSupplier
          ? 'The contractor has requested a return. Confirm a pickup time with them.'
          : 'Your return request has been sent to the supplier.';
      case 'Ready For Return Pickup':
        return this.isSupplier
          ? 'The machinery is ready for you to collect from the contractor.'
          : 'The machinery is packed up and ready for the supplier to collect.';
      case 'Completed':
        return 'All done — the machinery has been returned to the supplier.';
      default:
        return '';
    }
  }

  loadPaymentStatus() {
    this.paymentStatusLoading = true;
    this.paymentService.getStatus(this.bookingId).subscribe({
      next: status => {
        this.paymentStatus = status;
        this.paymentStatusLoading = false;
      },
      error: () => { this.paymentStatusLoading = false; }
    });
  }

  get isContractor() { return this.auth.role === 'contractor'; }
  get isSupplier() { return this.auth.role === 'supplier'; }
  get otherPartyId(): number | null {
    if (!this.detail) return null;
    return this.isSupplier ? (this.detail.contractorID ?? null) : (this.detail.supplierID ?? null);
  }
  get otherPartyName(): string {
    if (!this.detail) return '';
    return this.isSupplier ? this.detail.contractorName : this.detail.supplierName;
  }

  get isCancelledBooking(): boolean {
    return (this.detail?.bookingStatus || '').toLowerCase() === 'cancelled';
  }

  get displayDeliveryMethod(): string {
    const method = (this.detail?.deliveryMethod || '').trim();
    const address = (this.detail?.deliveryAddress || '').trim();
    // Address hint (e.g. "Pickup: Pretoria") wins over a mismatched method label.
    if (/pickup|pick-up|collect/i.test(address)) return 'Pick-up';
    if (/pickup|pick-up|collect|contractor pickup/i.test(method)) return 'Pick-up';
    if (/deliver/i.test(method)) return 'Delivery';
    if (address) return 'Delivery';
    return '—';
  }

  get displayDeliveryStatus(): string {
    if (this.isCancelledBooking) return 'Cancelled';
    const s = this.detail?.deliveryStatus || 'Pending';
    if (s === 'Delivered' && this.isPickupMethod) return 'Collected';
    if (s === 'Delivered') return 'Delivered To You';
    return s;
  }

  get displayPaymentStatus(): string {
    if (this.isCancelledBooking && (this.paymentStatus?.status || '').toLowerCase() !== 'paid') {
      return 'Cancelled';
    }
    return this.paymentStatus?.status || 'Pending';
  }

  get canUpdateAddress() {
    return this.isContractor && !!this.detail && !this.isCancelledBooking && this.detail.deliveryStatus !== 'Delivered';
  }

  /** Pickup/collect vs supplier delivery — aligned with backend IsPickupFulfillment. */
  get isPickupMethod(): boolean {
    if (!this.detail) return false;
    const raw = `${this.detail.deliveryMethod || ''} ${this.detail.deliveryAddress || ''}`.toLowerCase();
    return /pickup|pick-up|collect|contractor pickup/.test(raw);
  }

  get canMarkReadyForPickup(): boolean {
    return this.isSupplier && !!this.detail && !this.isCancelledBooking
      && this.detail.bookingStatus === 'Confirmed'
      && this.detail.deliveryStatus !== 'Delivered';
  }

  get markReadyButtonLabel(): string {
    return this.isPickupMethod ? 'Mark Ready for Pickup' : 'Mark Ready for Delivery';
  }

  get canMarkReadyForReturnPickup(): boolean {
    return this.isSupplier && !!this.detail && this.detail.bookingStatus === 'Return Requested';
  }

  get canConfirmDelivery() {
    if (!this.isContractor || !this.detail || this.isCancelledBooking) return false;
    if (this.detail.deliveryStatus === 'Delivered' || this.detail.bookingStatus === 'Completed') return false;
    // Pickup: only after supplier marks Ready For Pickup.
    if (this.isPickupMethod) return this.detail.bookingStatus === 'Ready For Pickup';
    // Supplier delivery: allowed from Confirmed or Ready For Pickup.
    return this.detail.bookingStatus === 'Confirmed' || this.detail.bookingStatus === 'Ready For Pickup';
  }

  get canRequestReturn() {
    if (!this.isContractor || !this.detail) return false;
    if (this.detail.deliveryStatus !== 'Delivered') return false;
    const blocked = ['Completed', 'Return Requested', 'Ready For Return Pickup', 'Cancelled'];
    return !blocked.includes(this.detail.bookingStatus);
  }

  get canConfirmReturn() {
    return this.isSupplier && !!this.detail
      && (this.detail.bookingStatus === 'Return Requested' || this.detail.bookingStatus === 'Ready For Return Pickup');
  }
  get canCancelBooking() {
    return !!this.detail
      && (this.isContractor || this.isSupplier)
      && !this.detail.hasDelivery
      && this.detail.deliveryStatus !== 'Delivered'
      && ['AwaitingSignature', 'AwaitingPayment', 'Confirmed'].includes(this.detail.bookingStatus);
  }

  get cancelBlockedByDelivery() {
    return !!this.detail
      && (this.isContractor || this.isSupplier)
      && this.detail.bookingStatus !== 'Cancelled'
      && this.detail.bookingStatus !== 'Completed'
      && !this.canCancelBooking
      && (this.detail.hasDelivery || this.detail.deliveryStatus === 'Delivered');
  }

  showCancelForm = false;
  cancelReason = '';
  cancelling = false;
  cancelError = '';

  cancelBooking() {
    if (!this.cancelReason.trim()) {
      this.cancelError = 'Please provide a reason for cancelling.';
      return;
    }
    this.cancelling = true;
    this.cancelError = '';
    this.bookingService.cancel(this.bookingId, { reason: this.cancelReason.trim() }).subscribe({
      next: res => {
        this.cancelling = false;
        this.showCancelForm = false;
        this.successMessage = res.refundRequestCreated
          ? 'Booking cancelled. A refund request has been created for Admin to process.'
          : 'Booking cancelled.';
        this.load();
        this.loadTracking();
      },
      error: err => {
        this.cancelling = false;
        this.cancelError = err?.error?.message || 'Could not cancel this booking.';
      }
    });
  }

  saveAddress() {
    if (!this.newAddress || this.newAddress.length < 5) return;
    this.processing = true;
    this.bookingService.updateDeliveryAddress(this.bookingId, { deliveryAddress: this.newAddress }).subscribe({
      next: () => {
        this.processing = false;
        this.editingAddress = false;
        this.successMessage = 'Delivery address updated.';
        this.load();
      },
      error: err => {
        this.processing = false;
        this.errorMessage = err?.error?.message || 'Could not update delivery address.';
      }
    });
  }

  markReadyForPickup() {
    this.processing = true;
    this.errorMessage = '';
    this.bookingService.markReadyForPickup(this.bookingId).subscribe({
      next: () => {
        this.processing = false;
        this.successMessage = this.isPickupMethod
          ? 'Marked ready for pickup.'
          : 'Marked ready for delivery.';
        this.load();
        this.loadTracking();
      },
      error: err => {
        this.processing = false;
        this.errorMessage = err?.error?.message || 'Could not mark ready.';
      }
    });
  }

  markReadyForReturnPickup() {
    this.processing = true;
    this.errorMessage = '';
    this.bookingService.markReadyForReturnPickup(this.bookingId).subscribe({
      next: () => {
        this.processing = false;
        this.successMessage = 'Marked ready for return pickup.';
        this.load();
        this.loadTracking();
      },
      error: err => {
        this.processing = false;
        this.errorMessage = err?.error?.message || 'Could not mark ready for return pickup.';
      }
    });
  }

  confirmDelivery() {
    this.processing = true;
    this.bookingService.confirmDelivery(this.bookingId, {
      notes: this.handoverNotes || undefined,
      outcome: this.handoverOutcome || 'Pass',
      checklistData: this.handoverNotes || undefined
    }).subscribe({
      next: () => {
        this.processing = false;
        this.successMessage = 'Delivery confirmed.';
        this.load();
        this.loadTracking();
      },
      error: err => {
        this.processing = false;
        this.errorMessage = err?.error?.message || 'Could not confirm delivery.';
      }
    });
  }

  submitReturnRequest() {
    this.processing = true;
    this.errorMessage = '';
    this.bookingService.requestReturn(this.bookingId, this.returnForm).subscribe({
      next: () => {
        this.processing = false;
        this.showReturnForm = false;
        this.successMessage = 'Return request submitted.';
        this.load();
        this.loadTracking();
      },
      error: err => {
        this.processing = false;
        this.errorMessage = err?.error?.message || 'Could not submit return request.';
      }
    });
  }

  onPhotosSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.returnPhotos = input.files ? Array.from(input.files) : [];
  }

  submitConfirmReturn() {
    this.processing = true;
    this.errorMessage = '';
    this.bookingService.confirmReturn(this.bookingId, {
      condition: this.confirmReturnForm.condition,
      inspectionNotes: this.confirmReturnForm.inspectionNotes,
      damageDescription: this.confirmReturnForm.damageDescription || undefined,
      estimatedRepairCost: this.confirmReturnForm.estimatedRepairCost ?? undefined
    }, this.returnPhotos).subscribe({
      next: () => {
        this.processing = false;
        this.showConfirmReturnForm = false;
        this.successMessage = 'Return confirmed.';
        this.load();
        this.loadTracking();
      },
      error: err => {
        this.processing = false;
        this.errorMessage = err?.error?.message || 'Could not confirm return.';
      }
    });
  }

  downloadCalendar() {
    this.downloadingCalendar = true;
    this.bookingService.downloadCalendar(this.bookingId).subscribe({
      next: blob => {
        this.downloadingCalendar = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `equameridian-booking-${this.bookingId}.ics`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.downloadingCalendar = false;
        this.errorMessage = 'Could not generate the calendar file.';
      }
    });
  }

  get canRaiseDispute(): boolean {
    return (this.isContractor || this.isSupplier) && !!this.detail?.canRaiseDispute;
  }

  get canReview(): boolean {
    return this.isContractor && !!this.detail && this.detail.bookingStatus === 'Completed';
  }

  submitReview() {
    if (!this.reviewForm.title.trim() || !this.reviewForm.reviewText.trim()) {
      this.reviewError = 'Please add a title and description for your review.';
      return;
    }
    if (!this.reviewForm.confirmedGenuine) {
      this.reviewError = 'Please confirm this review reflects your genuine experience.';
      return;
    }

    this.submittingReview = true;
    this.reviewError = '';
    this.reviewService.create({
      bookingID: this.bookingId,
      overallRating: this.reviewForm.overallRating,
      aspectRatings: this.reviewForm.aspectRatings,
      title: this.reviewForm.title,
      reviewText: this.reviewForm.reviewText,
      confirmedGenuine: this.reviewForm.confirmedGenuine
    }).subscribe({
      next: () => {
        this.submittingReview = false;
        this.showReviewForm = false;
        this.reviewSubmitted = true;
      },
      error: err => {
        this.submittingReview = false;
        this.reviewError = err?.error?.message ?? 'Could not submit your review. Please try again.';
      }
    });
  }

  onEvidenceSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.disputeEvidence = input.files ? Array.from(input.files) : [];
  }

  submitDispute() {
    if (!this.disputeForm.disputeCategory || !this.disputeForm.description || !this.disputeForm.desiredResolution) return;
    this.raisingDispute = true;
    this.disputeError = '';
    this.disputeService.raise(this.bookingId, this.disputeForm, this.disputeEvidence).subscribe({
      next: () => {
        this.raisingDispute = false;
        this.showDisputeForm = false;
        this.disputeSuccess = 'Dispute submitted successfully. Our team will review it shortly.';
        this.disputeForm = { disputeCategory: '', description: '', desiredResolution: '' };
        this.disputeEvidence = [];
      },
      error: err => {
        this.raisingDispute = false;
        this.disputeError = err?.error?.message ?? 'Could not submit dispute.';
      }
    });
  }
}