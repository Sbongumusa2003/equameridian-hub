export interface LeaseAgreementListItemDto {
  leaseAgreementID: number;
  agreementNumber: string;
  listingTitle: string;
  status: string;
  rentalStartDate: string;
  rentalEndDate: string;
  canSign: boolean;
}

export interface LeaseAgreementDetailDto {
  leaseAgreementID: number;
  agreementNumber: string;
  status: string;
  supplierName: string;
  contractorName: string;
  listingTitle: string;
  category: string;
  make?: string;
  model?: string;
  year?: number;
  location?: string;
  rentalStartDate: string;
  rentalEndDate: string;
  quantity: number;
  rentalSubtotal?: number;
  discountAmount?: number;
  deliveryFee?: number;
  priceExclVat?: number;
  vatRate?: number;
  vatAmount?: number;
  totalAmount: number;
  depositAmount?: number;
  paymentDueDate: string;
  paymentMethod: string;
  standardTerms: string;
  specialConditions?: string;
  cancellationPolicy: string;
  liabilityAndInsuranceTerms: string;
  damageAndMaintenanceProvisions: string;
  supplierSigned: boolean;
  supplierSignatureName?: string;
  supplierSignedDate?: string;
  contractorSigned: boolean;
  contractorSignatureName?: string;
  contractorSignedDate?: string;
  canSign: boolean;
}

export interface SignLeaseAgreementDto {
  acknowledgeTermsRead: boolean;
  acknowledgeLegallyBinding: boolean;
  fullName: string;
  signingDate?: string;
  digitalSignature?: string;
}

export interface LeaseAgreementsPagedResult {
  agreements: LeaseAgreementListItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}
