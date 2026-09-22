import { Component, OnInit } from '@angular/core';
import { ReportService } from '../../../core/services/report.service';
import {
  RevenueControlBreakReportDto,
  DemandTrendReportDto,
  ActiveListingsReportDto,
  MonthlyOverviewReportDto,
  PendingSupplierApprovalsReportDto,
  OpenDisputesReportDto,
  SupplierPerformanceReportDto,
  ReportExportFormat,
  ReportTab
} from '../../../core/models/report.models';

@Component({
  selector: 'app-admin-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  standalone: false
})
export class AdminReportsComponent implements OnInit {
  readonly Math = Math;
  activeTab: ReportTab = 'revenue';
  from = '';
  to = '';
  error = '';
  exporting = false;

  revenue: RevenueControlBreakReportDto | null = null;
  demand: DemandTrendReportDto | null = null;
  activeListings: ActiveListingsReportDto | null = null;
  monthlyOverview: MonthlyOverviewReportDto | null = null;
  pendingSuppliers: PendingSupplierApprovalsReportDto | null = null;
  openDisputes: OpenDisputesReportDto | null = null;
  supplierPerformance: SupplierPerformanceReportDto | null = null;

  loadingRevenue = false;
  loadingDemand = false;
  loadingActiveListings = false;
  loadingMonthlyOverview = false;
  loadingPendingSuppliers = false;
  loadingOpenDisputes = false;
  loadingSupplierPerformance = false;

  /** Toggle charts vs table-only for simple list reports (complexity matrix). */
  showChartsActiveListings = true;
  showChartsPendingSuppliers = true;
  showChartsOpenDisputes = true;

  private readonly dateFilteredTabs: ReportTab[] = [
    'revenue',
    'demand',
    'monthly-overview',
    'supplier-performance'
  ];

  constructor(private reportService: ReportService) {}

  ngOnInit() {
    this.loadRevenue();
  }

  switchTab(tab: ReportTab) {
    this.activeTab = tab;
    this.error = '';
    switch (tab) {
      case 'revenue':
        if (!this.revenue) this.loadRevenue();
        break;
      case 'demand':
        if (!this.demand) this.loadDemand();
        break;
      case 'active-listings':
        if (!this.activeListings) this.loadActiveListings();
        break;
      case 'monthly-overview':
        if (!this.monthlyOverview) this.loadMonthlyOverview();
        break;
      case 'pending-suppliers':
        if (!this.pendingSuppliers) this.loadPendingSuppliers();
        break;
      case 'open-disputes':
        if (!this.openDisputes) this.loadOpenDisputes();
        break;
      case 'supplier-performance':
        if (!this.supplierPerformance) this.loadSupplierPerformance();
        break;
    }
  }

  applyFilters() {
    this.revenue = null;
    this.demand = null;
    this.monthlyOverview = null;
    this.supplierPerformance = null;

    switch (this.activeTab) {
      case 'revenue':
        this.loadRevenue();
        break;
      case 'demand':
        this.loadDemand();
        break;
      case 'monthly-overview':
        this.loadMonthlyOverview();
        break;
      case 'supplier-performance':
        this.loadSupplierPerformance();
        break;
      default:
        break;
    }
  }

  get showDateFilters(): boolean {
    return this.dateFilteredTabs.includes(this.activeTab);
  }

  loadRevenue() {
    this.loadingRevenue = true;
    this.error = '';
    this.reportService.getRevenueSummary(this.from || undefined, this.to || undefined).subscribe({
      next: r => { this.revenue = r; this.loadingRevenue = false; },
      error: () => { this.loadingRevenue = false; this.error = 'Could not load the revenue report.'; }
    });
  }

  loadDemand() {
    this.loadingDemand = true;
    this.error = '';
    this.reportService.getDemandTrends(this.from || undefined, this.to || undefined).subscribe({
      next: r => { this.demand = r; this.loadingDemand = false; },
      error: () => { this.loadingDemand = false; this.error = 'Could not load the demand trends report.'; }
    });
  }

  loadActiveListings() {
    this.loadingActiveListings = true;
    this.error = '';
    this.reportService.getActiveListings().subscribe({
      next: r => { this.activeListings = r; this.loadingActiveListings = false; },
      error: () => { this.loadingActiveListings = false; this.error = 'Could not load the active listings report.'; }
    });
  }

  loadMonthlyOverview() {
    this.loadingMonthlyOverview = true;
    this.error = '';
    this.reportService.getMonthlyOverview(this.from || undefined, this.to || undefined).subscribe({
      next: r => { this.monthlyOverview = r; this.loadingMonthlyOverview = false; },
      error: () => { this.loadingMonthlyOverview = false; this.error = 'Could not load the monthly overview report.'; }
    });
  }

  loadPendingSuppliers() {
    this.loadingPendingSuppliers = true;
    this.error = '';
    this.reportService.getPendingSuppliers().subscribe({
      next: r => { this.pendingSuppliers = r; this.loadingPendingSuppliers = false; },
      error: () => { this.loadingPendingSuppliers = false; this.error = 'Could not load the pending suppliers report.'; }
    });
  }

  loadOpenDisputes() {
    this.loadingOpenDisputes = true;
    this.error = '';
    this.reportService.getOpenDisputes().subscribe({
      next: r => { this.openDisputes = r; this.loadingOpenDisputes = false; },
      error: () => { this.loadingOpenDisputes = false; this.error = 'Could not load the open disputes report.'; }
    });
  }

  loadSupplierPerformance() {
    this.loadingSupplierPerformance = true;
    this.error = '';
    this.reportService.getSupplierPerformance(this.from || undefined, this.to || undefined).subscribe({
      next: r => { this.supplierPerformance = r; this.loadingSupplierPerformance = false; },
      error: () => { this.loadingSupplierPerformance = false; this.error = 'Could not load the supplier performance report.'; }
    });
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private exportErrorMessage(err: any): string {
    if (err?.status === 403) return "You don't have permission to export reports. Contact an administrator.";
    return 'Could not export the report.';
  }

  private runExport(obs: import('rxjs').Observable<Blob>, filenameBase: string, format: string) {
    this.exporting = true;
    this.error = '';
    obs.subscribe({
      next: blob => {
        this.exporting = false;
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        this.downloadBlob(blob, `${filenameBase}-${stamp}.${format}`);
      },
      error: err => {
        this.exporting = false;
        this.error = this.exportErrorMessage(err);
      }
    });
  }

  exportRevenue(format: ReportExportFormat) {
    this.runExport(
      this.reportService.exportRevenue(format, this.from || undefined, this.to || undefined),
      'revenue-summary', format
    );
  }

  exportDemand(format: 'csv' | 'pdf' | 'xlsx') {
    this.runExport(
      this.reportService.exportDemandTrends(format, this.from || undefined, this.to || undefined),
      'demand-trends', format
    );
  }

  exportActiveListings(format: 'csv' | 'pdf' | 'xlsx') {
    this.runExport(this.reportService.exportActiveListings(format), 'active-listings', format);
  }

  exportMonthlyOverview(format: 'pdf' | 'xlsx') {
    this.runExport(
      this.reportService.exportMonthlyOverview(format, this.from || undefined, this.to || undefined),
      'monthly-overview', format
    );
  }

  exportPendingSuppliers(format: 'csv' | 'pdf' | 'xlsx') {
    this.runExport(this.reportService.exportPendingSuppliers(format), 'pending-suppliers', format);
  }

  exportOpenDisputes(format: 'csv' | 'pdf' | 'xlsx') {
    this.runExport(this.reportService.exportOpenDisputes(format), 'open-disputes', format);
  }

  exportSupplierPerformance(format: 'csv' | 'pdf' | 'xlsx') {
    this.runExport(
      this.reportService.exportSupplierPerformance(format, this.from || undefined, this.to || undefined),
      'supplier-performance', format
    );
  }

  // ---- Chart data helpers (used by <app-report-chart>) ----

  get revenueMonthLabels(): string[] {
    if (!this.revenue?.categories?.length) return [];
    const set = new Map<string, true>();
    for (const c of this.revenue.categories) {
      for (const m of c.months) set.set(m.monthLabel, true);
    }
    return Array.from(set.keys());
  }

  get revenueChartSeries(): { name: string; values: number[]; color?: string }[] {
    if (!this.revenue?.categories?.length) return [];
    const labels = this.revenueMonthLabels;
    return this.revenue.categories.map(c => ({
      name: c.categoryName,
      values: labels.map(l => {
        const m = c.months.find(x => x.monthLabel === l);
        return m ? m.totalAmount : 0;
      })
    }));
  }

  get revenueCategoryBarLabels(): string[] {
    return this.revenue?.categories?.map(c => c.categoryName) ?? [];
  }

  get revenueCategoryBarValues(): number[] {
    return this.revenue?.categories?.map(c => c.categoryTotalAmount) ?? [];
  }

  get demandCategoryLabels(): string[] {
    return this.demand?.categories?.map(c => c.categoryName) ?? [];
  }

  get demandCategorySeries(): { name: string; values: number[] }[] {
    if (!this.demand?.categories?.length) return [];
    return [
      { name: 'Quote requests', values: this.demand.categories.map(c => c.quotationRequestCount) },
      { name: 'Bookings', values: this.demand.categories.map(c => c.bookingCount) }
    ];
  }

  get demandMonthlyLabels(): string[] {
    return this.demand?.monthlyUsage?.map(m => m.monthLabel) ?? [];
  }

  get demandMonthlySeries(): { name: string; values: number[] }[] {
    if (!this.demand?.monthlyUsage?.length) return [];
    return [
      { name: 'Quotations', values: this.demand.monthlyUsage.map(m => m.quotationCount) },
      { name: 'Bookings', values: this.demand.monthlyUsage.map(m => m.bookingCount) }
    ];
  }

  get monthlyOverviewLabels(): string[] {
    return this.monthlyOverview?.months?.map(m => m.monthLabel) ?? [];
  }

  get monthlyOverviewSeries(): { name: string; values: number[] }[] {
    if (!this.monthlyOverview?.months?.length) return [];
    return [
      { name: 'Gross revenue', values: this.monthlyOverview.months.map(m => m.grossRevenue) },
      { name: 'Platform commission', values: this.monthlyOverview.months.map(m => m.platformCommission) }
    ];
  }

  get supplierPerfLabels(): string[] {
    return this.supplierPerformance?.suppliers?.slice(0, 8).map(s => s.supplierName) ?? [];
  }

  get supplierPerfSeries(): { name: string; values: number[] }[] {
    if (!this.supplierPerformance?.suppliers?.length) return [];
    const top = this.supplierPerformance.suppliers.slice(0, 8);
    return [{ name: 'Total revenue', values: top.map(s => s.supplierTotalAmount) }];
  }

  get activeListingsCategoryLabels(): string[] {
    if (!this.activeListings?.listings?.length) return [];
    const counts = new Map<string, number>();
    for (const l of this.activeListings.listings) {
      counts.set(l.categoryName, (counts.get(l.categoryName) || 0) + 1);
    }
    return Array.from(counts.keys());
  }

  get activeListingsCategoryValues(): number[] {
    if (!this.activeListings?.listings?.length) return [];
    const counts = new Map<string, number>();
    for (const l of this.activeListings.listings) {
      counts.set(l.categoryName, (counts.get(l.categoryName) || 0) + 1);
    }
    return Array.from(counts.values());
  }

  get activeListingsAvgRate(): number {
    const list = this.activeListings?.listings;
    if (!list?.length) return 0;
    return list.reduce((s, l) => s + (l.dailyRateZAR || 0), 0) / list.length;
  }

  get activeListingsAvgRatingLabel(): string {
    const rated = (this.activeListings?.listings || []).filter(l => (l.averageRating || 0) > 0);
    if (!rated.length) return 'No rating';
    const avg = rated.reduce((s, l) => s + l.averageRating, 0) / rated.length;
    return avg.toFixed(1) + ' / 5';
  }

  /** Top listings by daily rate — mirrors the PDF "Highest daily rates" chart. */
  get activeListingsTopRateLabels(): string[] {
    return this.topRateListings.map(l => l.listingTitle);
  }

  get activeListingsTopRateValues(): number[] {
    return this.topRateListings.map(l => l.dailyRateZAR || 0);
  }

  private get topRateListings() {
    const list = [...(this.activeListings?.listings || [])];
    return list.sort((a, b) => (b.dailyRateZAR || 0) - (a.dailyRateZAR || 0)).slice(0, 8);
  }

  // ---- Composition (donut) chart helpers ----

  get revenueCategoryDonutSeries(): { name: string; values: number[] }[] {
    return [{ name: 'Revenue', values: this.revenueCategoryBarValues }];
  }

  get demandBookingShareValues(): number[] {
    return this.demand?.categories?.map(c => c.bookingCount) ?? [];
  }

  get demandBookingShareSeries(): { name: string; values: number[] }[] {
    return [{ name: 'Bookings', values: this.demandBookingShareValues }];
  }

  get supplierPerfDonutLabels(): string[] {
    if (!this.supplierPerformance?.suppliers?.length) return [];
    const top = this.supplierPerformance.suppliers.slice(0, 5).map(s => s.supplierName);
    const rest = this.supplierPerformance.suppliers.slice(5);
    return rest.length ? [...top, `Other (${rest.length})`] : top;
  }

  get supplierPerfDonutSeries(): { name: string; values: number[] }[] {
    if (!this.supplierPerformance?.suppliers?.length) return [];
    const top = this.supplierPerformance.suppliers.slice(0, 5).map(s => s.supplierTotalAmount);
    const rest = this.supplierPerformance.suppliers.slice(5);
    const values = rest.length
      ? [...top, rest.reduce((sum, s) => sum + s.supplierTotalAmount, 0)]
      : top;
    return [{ name: 'Revenue', values }];
  }
}

