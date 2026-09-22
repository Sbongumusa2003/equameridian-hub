export interface InvoiceDto {
  invoiceID: number;
  quotationID: number;
  listingID: number;
  listingTitle: string;
  contractorName: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  platformFeePercentage: number;
  platformFeeAmount: number;
  supplierPayableAmount: number;
  currency: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  hasEftProof?: boolean;
  eftProofFileName?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranchCode?: string;
  bankAccountType?: string;
}


export interface InvoiceListItemDto {
  invoiceID: number;
  invoiceNumber: string;
  listingTitle: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paymentStatus: string;
}

export interface InvoicesPagedResult {
  invoices: InvoiceListItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}
