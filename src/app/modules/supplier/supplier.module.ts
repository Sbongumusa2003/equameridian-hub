import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { MyListingsComponent } from './my-listings/my-listings.component';
import { CreateListingComponent } from './create-listing/create-listing.component';
import { UpdateListingComponent } from './update-listing/update-listing.component';
import { SupplierQuotationsComponent } from './quotations/quotations.component';
import { QuotationReviewComponent } from './quotation-review/quotation-review.component';
import { SupplierInspectionsComponent } from './inspections/inspections.component';
import { SupplierPayoutsComponent } from './payouts/payouts.component';

const routes: Routes = [
  { path: 'listings',                component: MyListingsComponent },
  { path: 'listings/create',         component: CreateListingComponent },
  { path: 'listings/:id/edit',       component: UpdateListingComponent },
  { path: 'quotations',              component: SupplierQuotationsComponent },
  { path: 'quotations/:id/review',   component: QuotationReviewComponent },
  { path: 'inspections',             component: SupplierInspectionsComponent },
  { path: 'payouts',                 component: SupplierPayoutsComponent },
  { path: '',                        redirectTo: 'listings', pathMatch: 'full' }
];

@NgModule({
  declarations: [
    MyListingsComponent, CreateListingComponent, UpdateListingComponent,
    SupplierQuotationsComponent, QuotationReviewComponent,
    SupplierInspectionsComponent, SupplierPayoutsComponent
  ],
  imports: [SharedModule, RouterModule.forChild(routes)]
})
export class SupplierModule {}
