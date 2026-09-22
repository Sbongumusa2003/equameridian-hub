import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { VerifyOtpComponent } from './verify-otp/verify-otp.component';

const routes: Routes = [
  { path: 'login',          component: LoginComponent },
  { path: 'register',       component: RegisterComponent },
  // The old dedicated supplier registration page has been merged into the single
  // smart register form. This redirect keeps any old bookmarks/links working.
  { path: 'supplier',       redirectTo: 'register?role=Supplier', pathMatch: 'full' },
  { path: 'forgot-password',component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'verify-otp',     component: VerifyOtpComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];

@NgModule({
  declarations: [
    LoginComponent, RegisterComponent,
    ForgotPasswordComponent, ResetPasswordComponent, VerifyOtpComponent
  ],
  imports: [SharedModule, RouterModule.forChild(routes)]
})
export class AuthModule {}
