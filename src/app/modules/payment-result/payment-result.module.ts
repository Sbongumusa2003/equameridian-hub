import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { PaymentSuccessComponent } from './payment-success/payment-success.component';
import { PaymentCancelledComponent } from './payment-cancelled/payment-cancelled.component';

// Matches PayFast:ReturnUrl / PayFast:CancelUrl in appsettings — PayFast's browser redirect
// (return_url / cancel_url) lands here after checkout. Actual payment confirmation still comes
// asynchronously via the notify_url (ITN) webhook; these pages are just the user-facing landing
// screens and never themselves mark anything as paid.
const routes: Routes = [
  { path: 'success', component: PaymentSuccessComponent },
  { path: 'cancelled', component: PaymentCancelledComponent },
  { path: '', redirectTo: 'success', pathMatch: 'full' }
];

@NgModule({
  declarations: [PaymentSuccessComponent, PaymentCancelledComponent],
  imports: [SharedModule, RouterModule.forChild(routes)]
})
export class PaymentResultModule {}
