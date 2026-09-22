export interface BookingListItemDto {
  bookingID: number;
  machinery: string;
  supplierName: string;
  contractorName: string;
  rentalStartDate: string;
  rentalEndDate: string;
  deliveryAddress: string;
  status: string;
  canViewAddress: boolean;
  canConfirmDelivery: boolean;
  canUpdateAddress: boolean;
  canMarkReadyForPickup?: boolean;
  canMarkReadyForReturnPickup?: boolean;
  canRequestReturn: boolean;
  canConfirmReturn: boolean;
  canRaiseDispute: boolean;
  canLeaveReview: boolean;
  canEditReview: boolean;
  canDeleteReview: boolean;
  reviewID?: number;
}

export interface BookingSummaryCardsDto {
  activeBookings: number;
  awaitingYourAction: number;
  completedBookings: number;
  totalLeasedToDate: number;
}

export interface BookingsPageDto {
  bookings: BookingListItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  summaryCards: BookingSummaryCardsDto;
  message?: string;
}

export interface DeliveryDetailDto {
  bookingID: number;
  supplierID?: number;
  contractorID?: number;
  machinery: string;
  supplierName: string;
  contractorName: string;
  rentalStartDate: string;
  rentalEndDate: string;
  deliveryAddress: string;
  bookingStatus: string;
  deliveryStatus: string;
  hasDelivery?: boolean;
  deliveryMethod: string;
  deliveryDate?: string;
  canRaiseDispute: boolean;
}

export interface UpdateDeliveryAddressDto {
  deliveryAddress: string;
}

export interface ConfirmDeliveryDto {
  deliveryMethod?: string;
  checklistData?: string;
  outcome?: string;
  notes?: string;
  damageDescription?: string;
  photoUrls?: string;
}

export interface RequestReturnDto {
  returnReason: string;
  preferredPickupDate: string;
  pickupTimeWindow: string;
  pickupLocation: string;
  notes?: string;
}

export interface ConfirmReturnDto {
  condition: string;
  inspectionNotes: string;
  damageDescription?: string;
  estimatedRepairCost?: number;
}

export interface TrackingStageDto {
  stage: string;
  label: string;
  timestamp?: string | null;
  notes?: string | null;
  isComplete: boolean;
  isCurrent: boolean;
}

export interface BookingTrackingDto {
  bookingID: number;
  machinery: string;
  currentStatus: string;
  isCancelled: boolean;
  stages: TrackingStageDto[];
}

export interface CancelBookingDto {
  reason: string;
}

export interface CancelBookingResponse {
  message: string;
  cancellationFeeApplies: boolean;
  refundRequestCreated: boolean;
}
