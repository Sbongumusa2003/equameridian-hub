import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SastDatePipe } from './pipes/sast-date.pipe';
import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { DocumentUploadWidgetComponent } from './components/document-upload-widget/document-upload-widget.component';
import { ChatbotWidgetComponent } from './components/chatbot-widget/chatbot-widget.component';
import { ContextHelpComponent } from './components/context-help/context-help.component';
import { PolicyPageComponent } from './components/policy-page/policy-page.component';
import { ReportChartComponent } from './components/report-chart/report-chart.component';
import { BrowseComponent } from '../modules/contractor/browse/browse.component';
import { ListingDetailComponent } from '../modules/contractor/listing-detail/listing-detail.component';
import { CompareComponent } from '../modules/contractor/compare/compare.component';
import { LandingComponent } from '../modules/public/landing/landing.component';
import { StorefrontComponent } from '../modules/public/storefront/storefront.component';

@NgModule({
  declarations: [
    SastDatePipe,
    StatusBadgeComponent, ConfirmDialogComponent, DocumentUploadWidgetComponent, ChatbotWidgetComponent, ContextHelpComponent,
    PolicyPageComponent, ReportChartComponent,
    BrowseComponent, ListingDetailComponent, CompareComponent, LandingComponent, StorefrontComponent
  ],
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  exports: [
    SastDatePipe,
    CommonModule, RouterModule, FormsModule, ReactiveFormsModule,
    StatusBadgeComponent, ConfirmDialogComponent, DocumentUploadWidgetComponent, ChatbotWidgetComponent, ContextHelpComponent,
    PolicyPageComponent, ReportChartComponent,
    BrowseComponent, ListingDetailComponent, CompareComponent, LandingComponent, StorefrontComponent
  ]
})
export class SharedModule {}
