import { Component } from '@angular/core';
import { DataExportReason, DataExportService } from '../../../core/services/data-export.service';

@Component({
  selector: 'app-admin-data-export',
  templateUrl: './data-export.component.html',
  styleUrls: ['./data-export.component.scss'],
  standalone: false,
})
export class AdminDataExportComponent {
  exportingListings = false;
  exportingBookings = false;
  error = '';
  success = '';

  /** POPIA / Req 3.8 — required by the API before any export is generated */
  reason: DataExportReason = 'RegulatoryAudit';
  reasonDetails = '';

  readonly reasonOptions: { value: DataExportReason; label: string }[] = [
    { value: 'RegulatoryAudit', label: 'Regulatory / compliance audit' },
    { value: 'FinancialReconciliation', label: 'Financial reconciliation' },
    { value: 'DisputeInvestigation', label: 'Dispute investigation' },
    { value: 'Other', label: 'Other (provide details)' },
  ];

  constructor(private dataExportService: DataExportService) {}

  private downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private validateReason(): boolean {
    if (this.reason === 'Other' && !this.reasonDetails.trim()) {
      this.error = 'Please provide details when selecting "Other" as the export reason.';
      return false;
    }
    return true;
  }

  private readErrorBlob(err: any): Promise<string> {
    const fallback = 'Export failed. Check that you are logged in as an admin and try again.';
    const blob = err?.error;
    if (!(blob instanceof Blob)) {
      return Promise.resolve(err?.error?.message || err?.message || fallback);
    }
    return blob.text().then(text => {
      try {
        const parsed = JSON.parse(text);
        return parsed.message || fallback;
      } catch {
        return text || fallback;
      }
    }).catch(() => fallback);
  }

  exportListings(format: 'json' | 'xml') {
    this.error = '';
    this.success = '';
    if (!this.validateReason()) return;

    this.exportingListings = true;
    this.dataExportService.exportListings(format, this.reason, this.reasonDetails).subscribe({
      next: blob => {
        this.exportingListings = false;
        this.downloadBlob(blob, `listings-export-${new Date().toISOString().slice(0, 10)}.${format}`);
        this.success = `Listings exported as ${format.toUpperCase()}.`;
      },
      error: async err => {
        this.exportingListings = false;
        this.error = await this.readErrorBlob(err);
      }
    });
  }

  exportBookings(format: 'json' | 'xml') {
    this.error = '';
    this.success = '';
    if (!this.validateReason()) return;

    this.exportingBookings = true;
    this.dataExportService.exportBookings(format, this.reason, this.reasonDetails).subscribe({
      next: blob => {
        this.exportingBookings = false;
        this.downloadBlob(blob, `bookings-export-${new Date().toISOString().slice(0, 10)}.${format}`);
        this.success = `Bookings exported as ${format.toUpperCase()}.`;
      },
      error: async err => {
        this.exportingBookings = false;
        this.error = await this.readErrorBlob(err);
      }
    });
  }
}
