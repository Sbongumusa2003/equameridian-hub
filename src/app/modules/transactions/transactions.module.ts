import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { BookingsComponent } from './bookings/bookings.component';
import { BookingCalendarComponent } from './booking-calendar/booking-calendar.component';
import { BookingDetailComponent } from './booking-detail/booking-detail.component';
import { InvoicesComponent } from './invoices/invoices.component';
import { InvoiceDetailComponent } from './invoice-detail/invoice-detail.component';
import { LeaseAgreementsComponent } from './lease-agreements/lease-agreements.component';
import { LeaseAgreementDetailComponent } from './lease-agreement-detail/lease-agreement-detail.component';
import { PaymentHistoryComponent } from './payment-history/payment-history.component';
import { DisputesComponent } from './disputes/disputes.component';
import { DisputeDetailComponent } from './dispute-detail/dispute-detail.component';

const routes: Routes = [
  { path: 'bookings/calendar',           component: BookingCalendarComponent },
  { path: 'bookings',                    component: BookingsComponent },
  { path: 'bookings/:id',                component: BookingDetailComponent },
  { path: 'invoices',                    component: InvoicesComponent },
  { path: 'invoices/:id',                component: InvoiceDetailComponent },
  { path: 'payments',                    component: PaymentHistoryComponent },
  { path: 'lease-agreements',            component: LeaseAgreementsComponent },
  { path: 'lease-agreements/:id',        component: LeaseAgreementDetailComponent },
  { path: 'disputes',                    component: DisputesComponent },
  { path: 'disputes/:id',                component: DisputeDetailComponent },
  { path: '', redirectTo: 'bookings', pathMatch: 'full' }
];

@NgModule({
  declarations: [
    BookingsComponent, BookingCalendarComponent, BookingDetailComponent,
    InvoicesComponent, InvoiceDetailComponent,
    LeaseAgreementsComponent, LeaseAgreementDetailComponent,
    PaymentHistoryComponent,
    DisputesComponent, DisputeDetailComponent
  ],
  imports: [SharedModule, RouterModule.forChild(routes)]
})
export class TransactionsModule {}