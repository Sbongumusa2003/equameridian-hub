import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardSummaryDto, MetricDto, DashboardChartsDto, ListingsBreakdownDto, TimeSeriesPointDto } from '../../../core/models/dashboard.models';

interface LinePoint { x: number; y: number; label?: string; value?: number; }
interface BarSegment { label: string; value: number; colorVar: string; pct: number; }

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone:false,
})
export class DashboardComponent implements OnInit {
  summary: DashboardSummaryDto | null = null;
  loading = false;
  error = '';

  // --- Charts (Req 3.7: live operational graphs, distinct from the printable Reports module) ---
  charts: DashboardChartsDto | null = null;
  chartsLoading = false;
  chartRangeDays = 30;
  chartDays = 30;
  revenuePath = '';
  bookingsPath = '';
  bookingsPoints: { x: number; y: number; label: string; value: number }[] = [];
  revenueMax = 1;
  bookingsMax = 1;
  breakdownBars: { label: string; value: number; pct: number; color: string }[] = [];
  readonly padL = 48;
  readonly padR = 16;
  readonly padT = 16;
  readonly padB = 36;
  readonly chartRangeOptions = [
    { label: '7 days', value: 7 },
    { label: '30 days', value: 30 },
    { label: '90 days', value: 90 },
  ];

  // Revenue line chart geometry (viewBox 0 0 560 200)
  readonly chartW = 560;
  readonly chartH = 200;
  readonly chartPad = 28;
  revenuePoints: { x: number; y: number; label?: string; value?: number }[] = [];
  revenueLinePath = '';
  revenueAreaPath = '';
  revenueMaxLabel = '';
  revenueLatestLabel = '';
  revenueStartDateLabel = '';
  hoverTip: { x: number; y: number; title: string; value: string } | null = null;
  revenueEndDateLabel = '';

  // Listings-by-status bar chart
  listingSegments: BarSegment[] = [];
  listingTotal = 0;

  constructor(private dashboardService: DashboardService, private auth: AuthService) {}

  // The dashboard is shared by every internal role (admin and any custom role from Admin > Roles),
  // so each widget below is gated by the permission it actually needs — a limited role (e.g. only
  // Disputes.Manage) sees just the KPIs and quick actions relevant to them, not the full admin view
  // with buttons that would 403 if clicked.
  can(permission: string): boolean {
    return this.auth.hasPermission(permission);
  }

  get hasAnyDashboardWidget(): boolean {
    return this.can('Dashboard.View') || this.can('Users.ManageInternal') || this.can('Listings.Manage') || this.can('Disputes.Manage')
      || this.can('Reports.View') || this.can('Campaigns.Manage') || this.can('AuditLog.View');
  }

  /** Built-in admin always has access; custom internal roles need Dashboard.View. */
  get canViewDashboard(): boolean {
    return this.auth.role === 'admin' || this.can('Dashboard.View');
  }

  ngOnInit() {
    if (!this.canViewDashboard) {
      this.loading = false;
      this.error = 'You do not have permission to view the dashboard. Ask an administrator to grant Dashboard.View.';
      return;
    }
    this.load();
    this.loadCharts();
  }

  load() {
    this.loading = true;
    this.error = '';
    this.dashboardService.getSummary().subscribe({
      next: summary => { this.summary = summary; this.loading = false; },
      error: () => {
        this.loading = false;
        this.error = 'Could not load dashboard data.';
      }
    });
  }

  loadCharts() {
    this.chartsLoading = true;
    this.dashboardService.getCharts(this.chartRangeDays).subscribe({
      next: charts => {
        this.charts = charts;
        this.buildRevenueLine(charts.revenueOverTime);
        this.buildListingsBreakdown(charts.listingsBreakdown);
        this.buildRevenueChart(charts.revenueOverTime || []);
        this.buildBookingsChart(charts.bookingsVolumeOverTime || []);
        this.buildBreakdownBars(charts.listingsBreakdown);
        this.chartsLoading = false;
      },
      error: () => { this.chartsLoading = false; }
    });
  }

  onRangeChange(days: number) {
    this.chartRangeDays = days;
    this.chartDays = days;
    this.loadCharts();
  }

  private buildRevenueLine(series: { date: string; value: number }[]) {
    if (!series || series.length === 0) {
      this.revenuePoints = [];
      this.revenueLinePath = '';
      this.revenueAreaPath = '';
      this.revenueMaxLabel = '';
      this.revenueLatestLabel = '';
      this.revenueStartDateLabel = '';
      this.revenueEndDateLabel = '';
      return;
    }

    const values = series.map(p => p.value);
    const maxVal = Math.max(...values, 1);
    const innerW = this.chartW - this.chartPad * 2;
    const innerH = this.chartH - this.chartPad * 2;
    const stepX = series.length > 1 ? innerW / (series.length - 1) : 0;

    this.revenuePoints = series.map((p, i) => ({
      x: this.chartPad + i * stepX,
      y: this.chartPad + innerH - (p.value / maxVal) * innerH
    }));

    this.revenueLinePath = this.revenuePoints
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
      .join(' ');

    const baseline = this.chartPad + innerH;
    const first = this.revenuePoints[0];
    const last = this.revenuePoints[this.revenuePoints.length - 1];
    this.revenueAreaPath =
      `${this.revenueLinePath} L ${last.x.toFixed(1)} ${baseline} L ${first.x.toFixed(1)} ${baseline} Z`;

    this.revenueMaxLabel = `R ${Math.round(maxVal).toLocaleString()}`;
    this.revenueLatestLabel = `R ${Math.round(values[values.length - 1]).toLocaleString()}`;

    const formatDate = (d: string) =>
      new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' });
    this.revenueStartDateLabel = formatDate(series[0].date);
    this.revenueEndDateLabel = formatDate(series[series.length - 1].date);
  }

  private buildListingsBreakdown(breakdown: ListingsBreakdownDto) {
    if (!breakdown) { this.listingSegments = []; this.listingTotal = 0; return; }

    const raw: { label: string; value: number; colorVar: string }[] = [
      { label: 'Active', value: breakdown.active, colorVar: '--color-success' },
      { label: 'Pending', value: breakdown.pending, colorVar: '--color-warning' },
      { label: 'Draft', value: breakdown.draft, colorVar: '--color-text-muted' },
      { label: 'Suspended', value: breakdown.suspended, colorVar: '--color-danger' },
      { label: 'Rejected', value: breakdown.rejected, colorVar: '--color-danger-hover' },
      { label: 'Inactive', value: breakdown.inactive, colorVar: '--color-border-strong' },
      { label: 'Archived', value: breakdown.archived, colorVar: '--color-text-faint' },
    ];

    this.listingTotal = raw.reduce((sum, s) => sum + s.value, 0) || 1;
    this.listingSegments = raw
      .filter(s => s.value > 0)
      .map(s => ({ ...s, pct: Math.round((s.value / this.listingTotal) * 100) }));
  }

  changeLabel(metric: MetricDto | undefined): string {
    if (!metric || metric.percentChange == null) return '';
    const sign = metric.percentChange >= 0 ? '+' : '';
    return `${sign}${metric.percentChange.toFixed(1)}% vs last month`;
  }

  changeClass(metric: MetricDto | undefined): string {
    if (!metric || metric.percentChange == null) return '';
    return metric.percentChange >= 0 ? 'stat-card__sub--up' : 'stat-card__sub--down';
  }

  setChartDays(days: number) {
    this.chartDays = days;
    this.chartRangeDays = days;
    this.loadCharts();
  }

  private buildRevenueChart(series: TimeSeriesPointDto[]) {
    const filled = this.fillSeries(series, this.chartDays);
    this.revenueMax = Math.max(...filled.map(p => p.value), 1);
    this.revenuePoints = this.toPoints(filled, this.revenueMax);
    this.revenuePath = this.toLinePath(this.revenuePoints);
  }

  private buildBookingsChart(series: TimeSeriesPointDto[]) {
    const filled = this.fillSeries(series, this.chartDays);
    this.bookingsMax = Math.max(...filled.map(p => p.value), 1);
    this.bookingsPoints = this.toPoints(filled, this.bookingsMax);
    this.bookingsPath = this.toLinePath(this.bookingsPoints);
  }

  private buildBreakdownBars(b: ListingsBreakdownDto | undefined) {
    if (!b) { this.breakdownBars = []; return; }
    const items = [
      { label: 'Active', value: b.active || 0, color: '#2ea043' },
      { label: 'Pending', value: b.pending || 0, color: '#d4a017' },
      { label: 'Draft', value: b.draft || 0, color: '#6b7280' },
      { label: 'Rejected', value: b.rejected || 0, color: '#c62828' },
      { label: 'Suspended', value: b.suspended || 0, color: '#c84b11' },
      { label: 'Inactive', value: b.inactive || 0, color: '#9ca3af' },
      { label: 'Archived', value: b.archived || 0, color: '#374151' },
    ].filter(i => i.value > 0);
    const max = Math.max(...items.map(i => i.value), 1);
    this.breakdownBars = items.map(i => ({ ...i, pct: (i.value / max) * 100 }));
  }

  /** Ensure one point per day so the line is continuous. */
  private fillSeries(series: TimeSeriesPointDto[], days: number): { date: Date; value: number }[] {
    const map = new Map<string, number>();
    for (const p of series) {
      const d = new Date(p.date);
      const key = d.toISOString().slice(0, 10);
      map.set(key, Number(p.value) || 0);
    }
    const end = new Date();
    end.setUTCHours(0, 0, 0, 0);
    const out: { date: Date; value: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setUTCDate(end.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({ date: d, value: map.get(key) ?? 0 });
    }
    return out;
  }

  private toPoints(series: { date: Date; value: number }[], max: number) {
    const n = Math.max(series.length - 1, 1);
    const plotW = this.chartW - this.padL - this.padR;
    const plotH = this.chartH - this.padT - this.padB;
    return series.map((p, i) => ({
      x: this.padL + (i / n) * plotW,
      y: this.padT + plotH - (p.value / max) * plotH,
      label: p.date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      value: p.value
    }));
  }

  private toLinePath(points: { x: number; y: number }[]): string {
    if (!points.length) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  }

  yTicks(max: number): number[] {
    if (max <= 0) return [0];
    const step = max / 4;
    return [0, step, step * 2, step * 3, max];
  }

  formatY(v: number): string {
    if (v >= 1000) return `R${(v / 1000).toFixed(1)}k`;
    return `R${v.toFixed(0)}`;
  }

  firstLabel(pts: { label?: string }[]): string {
    return pts.length ? (pts[0].label || '') : '';
  }
  midLabel(pts: { label?: string }[]): string {
    return pts.length > 2 ? (pts[Math.floor(pts.length / 2)].label || '') : '';
  }
  lastLabel(pts: { label?: string }[]): string {
    return pts.length ? (pts[pts.length - 1].label || '') : '';
  }
  midX(pts: { x: number }[]): number {
    return pts.length > 2 ? pts[Math.floor(pts.length / 2)].x : 0;
  }
  lastX(pts: { x: number }[]): number {
    return pts.length ? pts[pts.length - 1].x : 0;
  }
  firstX(pts: { x: number }[]): number {
    return pts.length ? pts[0].x : 0;
  }

  showTip(ev: MouseEvent, pt: { label?: string; value?: number }, kind: 'revenue' | 'bookings') {
    const host = (ev.currentTarget as SVGElement).closest('.chart-wrap') as HTMLElement | null;
    const svg = (ev.currentTarget as SVGElement).closest('svg') as SVGSVGElement | null;
    if (!host || !svg) return;
    const rect = svg.getBoundingClientRect();
    const wrap = host.getBoundingClientRect();
    this.hoverTip = {
      x: ev.clientX - wrap.left + 12,
      y: ev.clientY - wrap.top - 8,
      title: pt.label || '',
      value: kind === 'revenue'
        ? 'R ' + Number(pt.value ?? 0).toLocaleString('en-ZA', { maximumFractionDigits: 0 })
        : String(pt.value ?? 0) + ' booking(s)'
    };
  }

  hideTip() { this.hoverTip = null; }
}

