import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { BrowseAccessGuard } from './core/guards/browse-access.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { UnauthorizedComponent } from './shared/components/unauthorized/unauthorized.component';
import { BrowseComponent } from './modules/contractor/browse/browse.component';
import { LandingComponent } from './modules/public/landing/landing.component';
import { StorefrontComponent } from './modules/public/storefront/storefront.component';
import { ListingDetailComponent } from './modules/contractor/listing-detail/listing-detail.component';
import { CompareComponent } from './modules/contractor/compare/compare.component';
import { PolicyPageComponent } from './shared/components/policy-page/policy-page.component';

const routes: Routes = [
  
  {
    path: '',
    component: PublicLayoutComponent,
    canActivate: [BrowseAccessGuard],
    canActivateChild: [BrowseAccessGuard],
    children: [
      { path: '', component: LandingComponent },
      { path: 'browse', component: BrowseComponent },
      { path: 'browse/compare', component: CompareComponent },
      { path: 'browse/:id', component: ListingDetailComponent },
      { path: 'suppliers/:supplierId', component: StorefrontComponent }
    ]
  },

 
  {
    path: 'policies',
    component: PublicLayoutComponent,
    children: [
      { path: 'terms', component: PolicyPageComponent, data: { policyKey: 'terms' } },
      { path: 'privacy', component: PolicyPageComponent, data: { policyKey: 'privacy' } },
      { path: 'master-lease-agreement', component: PolicyPageComponent, data: { policyKey: 'mla' } }
    ]
  },

  {
    path: 'unauthorized',
    component: UnauthorizedComponent,
    canActivate: [AuthGuard]
  },

  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.module').then(m => m.AuthModule)
  },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'admin',
        canActivate: [RoleGuard],
        data: { roles: ['admin'] },
        loadChildren: () =>
          import('./modules/admin/admin.module').then(m => m.AdminModule)
      },
      {
        path: 'supplier',
        canActivate: [RoleGuard],
        data: { roles: ['supplier'] },
        loadChildren: () =>
          import('./modules/supplier/supplier.module').then(m => m.SupplierModule)
      },
      {
        path: 'contractor',
        canActivate: [RoleGuard],
        data: { roles: ['contractor'] },
        loadChildren: () =>
          import('./modules/contractor/contractor.module').then(m => m.ContractorModule)
      },
      {
        path: 'account',
        loadChildren: () =>
          import('./modules/account/account.module').then(m => m.AccountModule)
      },
      {
        path: 'transactions',
        canActivate: [RoleGuard],
        data: { roles: ['contractor', 'supplier'] },
        loadChildren: () =>
          import('./modules/transactions/transactions.module').then(m => m.TransactionsModule)
      },
      {
        path: 'payments',
        loadChildren: () =>
          import('./modules/payment-result/payment-result.module').then(m => m.PaymentResultModule)
      }
    ]
  },

  
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}