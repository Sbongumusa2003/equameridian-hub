import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InvoiceDto, InvoicesPagedResult } from '../models/invoice.models';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private baseUrl = `${environment.apiUrl}/invoices`;

  constructor(private http: HttpClient) {}

  getAll(params: { page?: number; pageSize?: number }): Observable<InvoicesPagedResult> {
    let p = new HttpParams();
    p = p.set('page',     (params.page ?? 1).toString());
    p = p.set('pageSize', (params.pageSize ?? 10).toString());
    return this.http.get<InvoicesPagedResult>(this.baseUrl, { params: p });
  }

  getById(id: number): Observable<InvoiceDto> {
    return this.http.get<InvoiceDto>(`${this.baseUrl}/${id}`);
  }

  downloadPdfBlob(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  savePdfFile(id: number, fallbackName = 'invoice.pdf'): void {
    this.downloadPdfBlob(id).subscribe({
      next: blob => {
        if (!blob || blob.size < 8) {
          this.getById(id).subscribe(inv => this.openTaxInvoicePdf(inv));
          return;
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fallbackName;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.getById(id).subscribe(inv => this.openTaxInvoicePdf(inv))
    });
  }

  adminGenerate(quotationId: number): Observable<{ message: string; invoice: InvoiceDto }> {
    return this.http.post<{ message: string; invoice: InvoiceDto }>(
      `${this.baseUrl}/quotations/${quotationId}/generate`, {}
    );
  }

  openTaxInvoicePdf(inv: InvoiceDto): void {
    const money = (n: number | null | undefined) =>
      'R ' + Number(n ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const d = (s?: string) => {
      if (!s) return '—';
      const dt = new Date(s);
      return isNaN(dt.getTime()) ? s : dt.toLocaleDateString('en-ZA', { timeZone: 'Africa/Johannesburg' });
    };
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${inv.invoiceNumber}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;color:#111;padding:28px;max-width:720px;margin:0 auto}
  .brand{font-size:22px;font-weight:700;letter-spacing:.08em}
  .muted{color:#666;font-size:12px}
  h1{font-size:20px;margin:8px 0 4px}
  table{width:100%;border-collapse:collapse;margin-top:16px}
  th{text-align:left;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#666;border-bottom:2px solid #111;padding:8px 0}
  td{padding:8px 0;border-bottom:1px solid #eee;font-size:13px;vertical-align:top}
  .right{text-align:right}
  .totals{width:280px;margin-left:auto;margin-top:16px}
  .totals .row{display:flex;justify-content:space-between;padding:5px 0}
  .totals .grand{border-top:2px solid #111;margin-top:8px;padding-top:8px;font-weight:700;font-size:16px}
  .legal{margin-top:28px;font-size:11px;color:#555;line-height:1.45}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}
</style></head><body>
  <div class="brand">EQUAMERIDIAN</div>
  <div class="muted">B2B plant hire marketplace · Tax invoice (VAT Act 89 of 1991)</div>
  <h1>${inv.invoiceNumber}</h1>
  <div class="muted">Invoice date ${d(inv.invoiceDate)} · Due ${d(inv.dueDate)} · Status ${inv.paymentStatus || inv.status || ''}</div>
  <div class="grid">
    <div><div class="muted">Supplier</div><strong>${inv.supplierName || '—'}</strong></div>
    <div><div class="muted">Bill to (contractor)</div><strong>${inv.contractorName || '—'}</strong></div>
  </div>
  <table>
    <thead><tr><th>Description</th><th class="right">Amount (ZAR)</th></tr></thead>
    <tbody>
      <tr><td>${inv.listingTitle || 'Plant hire'}<div class="muted">Hire of listed machinery</div></td><td class="right">${money(inv.subtotal)}</td></tr>
    </tbody>
  </table>
  <div class="totals">
    <div class="row"><span>Subtotal excl. VAT</span><span>${money(inv.subtotal)}</span></div>
    ${inv.discountAmount ? `<div class="row"><span>Discount</span><span>- ${money(inv.discountAmount)}</span></div>` : ''}
    <div class="row"><span>Delivery</span><span>${inv.deliveryFee ? money(inv.deliveryFee) : 'Free'}</span></div>
    <div class="row"><span>VAT @ ${inv.vatRate ?? 15}%</span><span>${money(inv.vatAmount)}</span></div>
    <div class="row grand"><span>Total incl. VAT</span><span>${money(inv.totalAmount)}</span></div>
  </div>
  <div class="legal">
    Amounts are in South African Rand (ZAR). VAT is charged at the platform rate.
    This document is generated from EquaMeridian transactional records for invoice ${inv.invoiceNumber}.
    Payment status: ${inv.paymentStatus || 'Pending'}. Currency: ${inv.currency || 'ZAR'}.
  </div>
</body></html>`;
    const w = window.open('', '_blank', 'noopener,width=800,height=1000');
    if (!w) { alert('Allow pop-ups to download the invoice PDF.'); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 300);
  }
}
