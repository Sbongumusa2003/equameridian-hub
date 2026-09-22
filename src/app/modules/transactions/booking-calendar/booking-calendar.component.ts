import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { BookingListItemDto } from '../../../core/models/booking.models';

interface CalendarChip {
  bookingID: number;
  machinery: string;
  status: string;
  kind: 'start' | 'end' | 'ongoing';
}

interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
  chips: CalendarChip[];
}


@Component({
  selector: 'app-booking-calendar',
  templateUrl: './booking-calendar.component.html',
  styleUrls: ['./booking-calendar.component.scss'],
  standalone: false,
})
export class BookingCalendarComponent implements OnInit {
  readonly weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  viewYear: number;
  viewMonth: number;
  viewMode: 'calendar' | 'list' = 'calendar';
  weeks: CalendarDay[][] = [];
  bookings: BookingListItemDto[] = [];
  loading = false;
  error = '';

  constructor(private bookingService: BookingService, private router: Router) {
    const today = new Date();
    this.viewYear = today.getFullYear();
    this.viewMonth = today.getMonth();
  }

  ngOnInit() {
    this.load();
  }

  get monthLabel(): string {
    return new Date(this.viewYear, this.viewMonth, 1)
      .toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  setViewMode(mode: 'calendar' | 'list') {
    this.viewMode = mode;
  }

  get bookingsSortedByStart(): BookingListItemDto[] {
    return [...this.bookings].sort((a, b) =>
      new Date(a.rentalStartDate).getTime() - new Date(b.rentalStartDate).getTime());
  }

  prevMonth() {
    this.viewMonth--;
    if (this.viewMonth < 0) { this.viewMonth = 11; this.viewYear--; }
    this.load();
  }

  nextMonth() {
    this.viewMonth++;
    if (this.viewMonth > 11) { this.viewMonth = 0; this.viewYear++; }
    this.load();
  }

  goToToday() {
    const today = new Date();
    this.viewYear = today.getFullYear();
    this.viewMonth = today.getMonth();
    this.load();
  }

  openBooking(bookingId: number) {
    this.router.navigate(['/transactions/bookings', bookingId]);
  }

  private load() {
    this.loading = true;
    this.error = '';

   
    const gridStart = this.startOfGrid();
    const gridEnd = this.endOfGrid();

    this.bookingService.getAll({
      dateFrom: this.toIsoDate(gridStart),
      dateTo: this.toIsoDate(gridEnd),
      page: 1,
      pageSize: 500
    }).subscribe({
      next: res => {
        this.bookings = res.bookings;
        this.weeks = this.buildGrid(res.bookings);
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load bookings for this month.';
        this.loading = false;
      }
    });
  }

  private buildGrid(bookings: BookingListItemDto[]): CalendarDay[][] {
    const gridStart = this.startOfGrid();
    const today = new Date();
    const days: CalendarDay[] = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      days.push({
        date,
        inCurrentMonth: date.getMonth() === this.viewMonth,
        isToday: this.isSameDay(date, today),
        chips: this.chipsForDay(date, bookings)
      });
    }

    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }

  private chipsForDay(date: Date, bookings: BookingListItemDto[]): CalendarChip[] {
    const chips: CalendarChip[] = [];
    for (const b of bookings) {
      const start = new Date(b.rentalStartDate);
      const end = new Date(b.rentalEndDate);
      const startsToday = this.isSameDay(date, start);
      const endsToday = this.isSameDay(date, end);

      if (startsToday) {
        chips.push({ bookingID: b.bookingID, machinery: b.machinery, status: b.status, kind: 'start' });
      } else if (endsToday) {
        chips.push({ bookingID: b.bookingID, machinery: b.machinery, status: b.status, kind: 'end' });
      } else if (date > start && date < end) {
        chips.push({ bookingID: b.bookingID, machinery: b.machinery, status: b.status, kind: 'ongoing' });
      }
    }
    return chips;
  }

  private startOfGrid(): Date {
    const firstOfMonth = new Date(this.viewYear, this.viewMonth, 1);
    const start = new Date(firstOfMonth);
    start.setDate(start.getDate() - start.getDay());
    return start;
  }

  private endOfGrid(): Date {
    const end = new Date(this.startOfGrid());
    end.setDate(end.getDate() + 41);
    return end;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  private toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}