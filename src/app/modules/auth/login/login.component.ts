import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { isOtpChallenge } from '../../../core/models/auth.models';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['../auth.scss'],
  standalone: false,
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  error = '';
  private returnUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      email:          ['', [Validators.required, Validators.email]],
      password:       ['', Validators.required],
      keepMeSignedIn: [false]
    });
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';
    const keepMeSignedIn = !!this.form.value.keepMeSignedIn;
    this.auth.login(this.form.value as any).subscribe({
      next: (result) => {
        if (isOtpChallenge(result)) {
          this.loading = false;
          this.router.navigate(['/auth/verify-otp'], {
            queryParams: {
              ref: result.otpReference,
              keep: keepMeSignedIn ? '1' : '0',
              returnUrl: this.returnUrl ?? undefined
            }
          });
          return;
        }
        this.auth.redirectByRole(this.returnUrl);
      },
      error: err => {
        const msg: string = err.error?.message ?? '';
        this.error = this.mapErrorMessage(msg, err.status);
        this.loading = false;
      }
    });
  }

  private mapErrorMessage(serverMsg: string, status: number): string {
    const lower = serverMsg.toLowerCase();

    if (lower.includes('locked')) {
      return 'Your account has been temporarily locked due to multiple failed login attempts. Please try again in 30 minutes or contact support.';
    }
    if (lower.includes('pending')) {
      return 'Your account is pending approval by an administrator. You will be notified by email once your account is activated.';
    }
    if (lower.includes('disabled')) {
      return 'Your account has been disabled. Please contact support.';
    }
    if (lower.includes('suspended')) {
      return 'Your account has been suspended. Please contact support.';
    }
    if (status === 401 || lower.includes('incorrect') || lower.includes('password')) {
      return 'Incorrect email or password. Please try again.';
    }

    return serverMsg || 'Login failed. Please try again.';
  }
}