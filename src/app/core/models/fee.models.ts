export interface FeeConfigurationDto {
  feeConfigurationID: number;
  commissionRate: number;
  minFee: number;
  maxFee: number;
  vatInclusive: boolean;
  vatRate: number;
  deliveryBaseFee: number;
  deliveryFreeRadiusKm: number;
  deliveryRatePerKm: number;
  paymentWindowHours: number;
  nonPaymentFeePercent: number;
  nonPaymentFeeMinZAR: number;
  nonPaymentFeeMaxZAR: number;
  updatedByAdminName?: string;
  updatedAt: string;
}

export interface UpdateFeeConfigurationDto {
  commissionRate: number;
  minFee: number;
  maxFee: number;
  vatInclusive: boolean;
  vatRate: number;
  deliveryBaseFee: number;
  deliveryFreeRadiusKm: number;
  deliveryRatePerKm: number;
  paymentWindowHours: number;
  nonPaymentFeePercent: number;
  nonPaymentFeeMinZAR: number;
  nonPaymentFeeMaxZAR: number;
}

export interface DiscountTierDto {
  discountTierID: number;
  categoryID?: number | null;
  categoryName?: string | null;
  minDays: number;
  maxDays?: number | null;
  discountPercent: number;
  updatedAt: string;
}

export interface UpsertDiscountTierDto {
  categoryID?: number | null;
  minDays: number;
  maxDays?: number | null;
  discountPercent: number;
}
