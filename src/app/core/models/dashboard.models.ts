export interface MetricDto {
  value: number;
  previousValue: number;
  percentChange?: number | null;
}

export interface RecentActivityDto {
  auditID: number;
  eventType: string;
  actingUser?: string | null;
  timestamp: string;
}

export interface NeedsAttentionDto {
  pendingListings: number;
  openDisputes: number;
  pendingRefunds: number;
  unverifiedSuppliers: number;
  pendingDocuments: number;
  total: number;
}

export interface DashboardSummaryDto {
  totalUsers: MetricDto;
  activeListings: MetricDto;
  pendingListings: MetricDto;
  openDisputes: MetricDto;
  monthlyRevenue: MetricDto;
  activeCampaigns: MetricDto;
  recentActivity: RecentActivityDto[];
  needsAttention?: NeedsAttentionDto;
}

export interface TimeSeriesPointDto {
  date: string;
  value: number;
}

export interface ListingsBreakdownDto {
  active: number;
  pending: number;
  draft: number;
  rejected: number;
  suspended: number;
  inactive: number;
  archived: number;
}

export interface DisputeRefundRateDto {
  totalBookings: number;
  disputeCount: number;
  refundCount: number;
  disputeRatePercent: number;
  refundRatePercent: number;
}

export interface TopPerformerDto {
  id: number;
  name: string;
  bookingCount: number;
  revenue: number;
}

export interface DashboardChartsDto {
  fromDate: string;
  toDate: string;
  revenueOverTime: TimeSeriesPointDto[];
  bookingsVolumeOverTime: TimeSeriesPointDto[];
  listingsBreakdown: ListingsBreakdownDto;
  disputeRefundRate: DisputeRefundRateDto;
  topSuppliers: TopPerformerDto[];
  topCategories: TopPerformerDto[];
}