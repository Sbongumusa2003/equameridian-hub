import { Component, OnInit } from '@angular/core';
import { BookingService } from '../../../core/services/booking.service';
import { InvoiceService } from '../../../core/services/invoice.service';
import { AdminBookingListItemDto } from '../../../core/models/booking.models';

@Component({
  selector: 'app-admin-bookings',
  templateUrl: './admin-bookings.component.html',
  styleUrls: ['./admin-bookings.component.scss'],
  standalone: false,
})
export class AdminBookingsComponent implements OnInit {
  bookings: AdminBookingListItemDto[] = [];
  loading = true;
  page = 1;
  pageSize = 10;
  totalCount = 0;
  search = '';

  generatingId: number | null = null;
  generateMessage = '';
  generateError = '';

  constructor(private bookingService: BookingService, private invoiceService: InvoiceService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.bookingService.getAllForAdmin({ page: this.page, pageSize: this.pageSize, search: this.search || undefined })
      .subscribe({
        next: res => {
          this.bookings = res.bookings;
          this.totalCount = res.totalCount;
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
  }

  get totalPages() { return Math.max(1, Math.ceil(this.totalCount / this.pageSize)); }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.load();
  }

  onSearch() {
    this.page = 1;
    this.load();
  }

  generateInvoice(booking: AdminBookingListItemDto) {
    this.generatingId = booking.bookingID;
    this.generateMessage = '';
    this.generateError = '';
    this.invoiceService.adminGenerateForBooking(booking.bookingID).subscribe({
      next: res => {
        this.generatingId = null;
        this.generateMessage = res.message;
        this.load();
      },
      error: err => {
        this.generatingId = null;
        this.generateError = err?.error?.message || `Could not generate an invoice for booking #${booking.bookingID}.`;
      }
    });
  }
}
