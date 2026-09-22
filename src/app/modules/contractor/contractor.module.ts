import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { BrowseComponent } from './browse/browse.component';
import { CompareComponent } from './compare/compare.component';
import { ListingDetailComponent } from './listing-detail/listing-detail.component';
import { RequestQuoteComponent } from './request-quote/request-quote.component';
import { QuotationsComponent } from './quotations/quotations.component';
import { QuotationDetailComponent } from './quotation-detail/quotation-detail.component';
import { QuotationCompareComponent } from './quotation-compare/quotation-compare.component';
import { ContractorInspectionsComponent } from './inspections/inspections.component';
import { BookNowComponent } from './book-now/book-now.component';
import { CartComponent } from './cart/cart.component';
import { WishlistComponent } from './wishlist/wishlist.component';
import { MyReviewsComponent } from './my-reviews/my-reviews.component';

const routes: Routes = [
  { path: 'browse',                        component: BrowseComponent },
  { path: 'browse/:id',                    component: ListingDetailComponent },
  { path: 'compare',                       component: CompareComponent },
  { path: 'inspections',                   component: ContractorInspectionsComponent },
  { path: 'cart',                          component: CartComponent },
  { path: 'wishlist',                      component: WishlistComponent },
  { path: 'my-reviews',                    component: MyReviewsComponent },
  { path: 'book-now/:listingId',           component: BookNowComponent },
  { path: 'quotations',                    component: QuotationsComponent },
  { path: 'quotations/compare',            component: QuotationCompareComponent },
  { path: 'quotations/request/:listingId', component: RequestQuoteComponent },
  { path: 'quotations/:id',                component: QuotationDetailComponent },
  { path: '', redirectTo: 'browse', pathMatch: 'full' }
];

@NgModule({
  declarations: [
    RequestQuoteComponent, QuotationsComponent, QuotationDetailComponent,
    QuotationCompareComponent, ContractorInspectionsComponent,
    BookNowComponent, CartComponent, WishlistComponent, MyReviewsComponent
  ],
  imports: [SharedModule, RouterModule.forChild(routes)]
})
export class ContractorModule {}
