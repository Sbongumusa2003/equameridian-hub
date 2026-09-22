import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

export interface ChartSeries {
  name: string;
  values: number[];
  color?: string;
}

export interface DonutSegment {
  label: string;
  value: number;
  percent: number;
  color: string;
  dasharray: string;
  dashoffset: number;
}

@Component({
  selector: 'app-report-chart',
  templateUrl: './report-chart.component.html',
  styleUrls: ['./report-chart.component.scss'],
  standalone: false
})
export class ReportChartComponent implements OnChanges {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() type: 'bar' | 'line' | 'horizontal-bar' | 'donut' | 'area' = 'bar';
  @Input() labels: string[] = [];
  @Input() series: ChartSeries[] = [];
  @Input() valuePrefix = '';
  @Input() height = 220;

  readonly Math = Math;
  readonly palette = ['#C9A227', '#8B6914', '#E0C36A', '#5C4A1F', '#D4A84B', '#3A3630', '#A8841A', '#6B5A2E'];

  // SVG geometry (cartesian charts)
  readonly viewWBase = 640;
  readonly padLBase = 52;
  readonly padR = 16;
  readonly padT = 28;
  readonly padB = 36;

  /** Effective left padding — widened for horizontal-bar category labels. */
  padL = 52;
  viewW = 640;

  maxVal = 1;
  ticks: number[] = [];
  chartH = 0;
  chartW = 0;

  // Donut geometry
  readonly donutSize = 200;
  readonly donutCx = 100;
  readonly donutCy = 100;
  readonly donutR = 68;
  readonly donutStroke = 30;
  donutSegments: DonutSegment[] = [];
  donutTotal = 0;

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.type === 'horizontal-bar') {
      // Fit full-ish listing titles on the left without clipping the start of the name.
      const maxChars = Math.min(28, Math.max(10, ...(this.labels || []).map(l => Math.min((l || '').length, 28))));
      this.padL = Math.max(120, Math.min(240, Math.round(maxChars * 7.2 + 24)));
      this.viewW = Math.max(640, 640 + (this.padL - this.padLBase));
    } else {
      this.padL = this.padLBase;
      this.viewW = this.viewWBase;
    }
    this.chartH = this.height - this.padT - this.padB;
    this.chartW = this.viewW - this.padL - this.padR;
    this.computeScale();
    if (this.type === 'donut') {
      this.computeDonut();
    }
  }

  private computeDonut(): void {
    const s = this.series[0];
    if (!s || !s.values.length) {
      this.donutSegments = [];
      this.donutTotal = 0;
      return;
    }
    const total = s.values.reduce((a, b) => a + (Number(b) || 0), 0);
    this.donutTotal = total;
    const circumference = 2 * Math.PI * this.donutR;
    let cursor = 0; // arc length consumed so far
    this.donutSegments = s.values.map((v, i) => {
      const value = Number(v) || 0;
      const percent = total > 0 ? (value / total) * 100 : 0;
      const arc = total > 0 ? (value / total) * circumference : 0;
      // dasharray: draw `arc`, then gap the rest of the ring
      const dasharray = `${arc} ${circumference}`;
      // negative offset rotates the start of this segment to `cursor`
      const dashoffset = -cursor;
      cursor += arc;
      return {
        label: this.labels[i] ?? `Item ${i + 1}`,
        value,
        percent,
        color: this.color(i, s),
        dasharray,
        dashoffset
      };
    });
  }

  private computeScale(): void {
    let max = 0;
    for (const s of this.series) {
      for (const v of s.values) {
        if (v > max) max = v;
      }
    }
    this.maxVal = max <= 0 ? 1 : this.niceMax(max);
    this.ticks = [0, 0.25, 0.5, 0.75, 1].map(t => this.maxVal * t);
  }

  private niceMax(v: number): number {
    if (v <= 0) return 1;
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    for (const step of [1, 2, 2.5, 5, 10]) {
      const c = mag * step;
      if (c >= v) return c;
    }
    return mag * 10;
  }

  color(i: number, s?: ChartSeries): string {
    return s?.color || this.palette[i % this.palette.length];
  }

  yFor(val: number): number {
    return this.padT + this.chartH - (val / this.maxVal) * this.chartH;
  }

  xForBar(index: number, seriesIndex: number, seriesCount: number): number {
    const slot = this.chartW / Math.max(this.labels.length, 1);
    const groupW = slot * 0.72;
    const barW = groupW / Math.max(seriesCount, 1);
    const groupStart = this.padL + index * slot + (slot - groupW) / 2;
    return groupStart + seriesIndex * barW;
  }

  barWidth(seriesCount: number): number {
    const slot = this.chartW / Math.max(this.labels.length, 1);
    const groupW = slot * 0.72;
    return Math.max(4, groupW / Math.max(seriesCount, 1) - 2);
  }

  xForLine(index: number): number {
    const slot = this.chartW / Math.max(this.labels.length, 1);
    return this.padL + index * slot + slot / 2;
  }

  linePath(s: ChartSeries): string {
    if (!s.values.length) return '';
    return s.values
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${this.xForLine(i).toFixed(1)} ${this.yFor(v).toFixed(1)}`)
      .join(' ');
  }

  /** Filled area path — the line path closed down to the baseline. */
  areaPath(s: ChartSeries): string {
    if (!s.values.length) return '';
    const baseline = this.padT + this.chartH;
    const last = s.values.length - 1;
    return `${this.linePath(s)} L ${this.xForLine(last).toFixed(1)} ${baseline} L ${this.xForLine(0).toFixed(1)} ${baseline} Z`;
  }

  formatPercent(v: number): string {
    return v.toFixed(v < 10 ? 1 : 0) + '%';
  }

  labelX(index: number): number {
    const slot = this.chartW / Math.max(this.labels.length, 1);
    return this.padL + index * slot + slot / 2;
  }

  formatTick(v: number): string {
    if (Math.abs(v) >= 1_000_000) return this.valuePrefix + (v / 1_000_000).toFixed(1) + 'M';
    if (Math.abs(v) >= 1_000) return this.valuePrefix + (v / 1_000).toFixed(v >= 10_000 ? 0 : 1) + 'k';
    return this.valuePrefix + Math.round(v).toLocaleString();
  }

  // Horizontal bar helpers
  hBarMaxLabelLen(): number {
    return Math.min(18, Math.max(...this.labels.map(l => l.length), 4));
  }

  hBarY(i: number): number {
    const rowH = this.chartH / Math.max(this.labels.length, 1);
    return this.padT + i * rowH + rowH * 0.2;
  }

  hBarHeight(): number {
    const rowH = this.chartH / Math.max(this.labels.length, 1);
    return Math.max(8, rowH * 0.55);
  }

  hBarWidth(val: number): number {
    return Math.max(2, (val / this.maxVal) * this.chartW);
  }

  truncatedLabel(label: string, max = 16): string {
    const s = (label || '').trim();
    if (s.length <= max) return s;
    return s.slice(0, Math.max(1, max - 1)).trimEnd() + '…';
  }

  /** Longer labels for horizontal bars so machinery names stay readable. */
  hBarLabel(label: string): string {
    return this.truncatedLabel(label, 28);
  }

  /** Safe access for horizontal-bar primary series values. */
  valueAt(seriesIndex: number, valueIndex: number): number {
    const s = this.series[seriesIndex];
    if (!s || valueIndex < 0 || valueIndex >= s.values.length) return 0;
    return s.values[valueIndex] ?? 0;
  }
}
