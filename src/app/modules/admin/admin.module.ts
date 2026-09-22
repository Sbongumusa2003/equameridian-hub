import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UsersComponent } from './users/users.component';
import { AdminListingsComponent } from './listings/admin-listings.component';
import { UpdateListingStatusComponent } from './listings/update-listing-status/update-listing-status.component';
import { AdminInspectionsComponent } from './inspections/inspections.component';
import { AdminDisputesComponent } from './disputes/disputes.component';
import { DisputeDetailComponent } from './disputes/dispute-detail/dispute-detail.component';
import { AdminRefundsComponent } from './refunds/refunds.component';
import { AdminPayoutsComponent } from './payouts/payouts.component';
import { AdminCampaignsComponent } from './campaigns/campaigns.component';
import { CampaignFormComponent } from './campaigns/campaign-form/campaign-form.component';
import { PlatformFeesComponent } from './platform-fees/platform-fees.component';
import { AuditLogComponent } from './audit-log/audit-log.component';
import { AdminDocumentsComponent } from './documents/admin-documents.component';
import { AdminReportsComponent } from './reports/reports.component';
import { AdminRolesComponent } from './roles/roles.component';
import { AdminTimerConfigComponent } from './timer-config/timer-config.component';
import { AdminContentRulesComponent } from './content-rules/content-rules.component';
import { AdminDataExportComponent } from './data-export/data-export.component';
import { AdminBackupComponent } from './backup/backup.component';
import { AdminAnnouncementsComponent } from './announcements/announcements.component';
import { AdminInvoicesComponent } from './invoices/admin-invoices.component';
import { AdminReviewsComponent } from './reviews/reviews.component';
import { LocationTreeComponent } from './location-tree/location-tree.component';

const routes: Routes = [
  { path: 'dashboard',        component: DashboardComponent },
  { path: 'users',            component: UsersComponent },
  { path: 'listings',         component: AdminListingsComponent },
  { path: 'listings/:id/status', component: UpdateListingStatusComponent },
  { path: 'inspections',      component: AdminInspectionsComponent },
  { path: 'disputes',         component: AdminDisputesComponent },
  { path: 'disputes/:id',     component: DisputeDetailComponent },
  { path: 'refunds',          component: AdminRefundsComponent },
  { path: 'payouts',          component: AdminPayoutsComponent },
  { path: 'invoices',         component: AdminInvoicesComponent },
  { path: 'campaigns',        component: AdminCampaignsComponent },
  { path: 'campaigns/create', component: CampaignFormComponent },
  { path: 'campaigns/:id/edit', component: CampaignFormComponent },
  { path: 'platform-fees',    component: PlatformFeesComponent },
  { path: 'audit-log',        component: AuditLogComponent },
  { path: 'documents',        component: AdminDocumentsComponent },
  { path: 'reports',          component: AdminReportsComponent },
  { path: 'roles',            component: AdminRolesComponent },
  { path: 'timer-configuration', component: AdminTimerConfigComponent },
  { path: 'content-rules',    component: AdminContentRulesComponent },
  { path: 'reviews',          component: AdminReviewsComponent },
  { path: 'data-export',      component: AdminDataExportComponent },
  { path: 'backup',           component: AdminBackupComponent },
  { path: 'announcements',    component: AdminAnnouncementsComponent },
  { path: 'location-tree',    component: LocationTreeComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];

@NgModule({
  declarations: [
    DashboardComponent, UsersComponent,
    AdminListingsComponent, UpdateListingStatusComponent,
    AdminInspectionsComponent,
    AdminDisputesComponent, DisputeDetailComponent,
    AdminRefundsComponent,
    AdminPayoutsComponent,
    AdminInvoicesComponent,
    AdminCampaignsComponent, CampaignFormComponent,
    PlatformFeesComponent,
    AuditLogComponent,
    AdminDocumentsComponent,
    AdminReportsComponent,
    AdminRolesComponent,
    AdminTimerConfigComponent,
    AdminContentRulesComponent,
    AdminReviewsComponent,
    AdminDataExportComponent,
    AdminBackupComponent,
    AdminAnnouncementsComponent,
    LocationTreeComponent
  ],
  imports: [SharedModule, RouterModule.forChild(routes)]
})
export class AdminModule {}
