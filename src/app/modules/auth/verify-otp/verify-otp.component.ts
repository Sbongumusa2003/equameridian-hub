import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const RESEND_COOLDOWN_SECONDS = 30;

@Component({
  selector: 'app-verify-otp',
  templateUrl: './verify-otp.component.html',
  styleUrls: ['../auth.scss'],
  standalone: false,
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
  form: FormGroup;
  loading = false;
  error = '';
  missingReference = false;

  resending = false;
  resendMessage = '';
  resendError = '';
  resendCooldown = 0;

  private otpReference = '';
  private keepMeSignedIn = false;
  private returnUrl: string | null = null;
  private cooldownHandle: ReturnType<typeof setInterval> | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
    });
  }

  ngOnInit(): void {
    this.otpReference = this.route.snapshot.queryParamMap.get('ref') ?? '';
    this.keepMeSignedIn = this.route.snapshot.queryParamMap.get('keep') === '1';
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (!this.otpReference) {
      this.missingReference = true;
    } else {
      this.startCooldown();
    }
  }

  ngOnDestroy(): void {
    if (this.cooldownHandle) clearInterval(this.cooldownHandle);
  }

  get canResend(): boolean {
    return !this.resending && this.resendCooldown === 0;
  }

  resend(): void {
    if (!this.canResend) return;
    this.resending = true;
    this.resendMessage = '';
    this.resendError = '';
    this.error = '';

    this.auth.resendOtp({ otpReference: this.otpReference }).subscribe({
      next: res => {
        this.resending = false;
        this.resendMessage = res.message || 'A new code has been sent.';
        this.form.reset();
        this.startCooldown();
      },
      error: err => {
        this.resending = false;
        // A dead reference (e.g. 5 failed attempts already burned it, or it's simply
        // too old) can't be revived server-side - send the user back to get a new one.
        if (err.status === 401) {
          this.missingReference = true;
          return;
        }
        this.resendError = err.error?.message ?? 'Could not resend the code. Please try again.';
        // Server enforces its own cooldown too; if we got 429'd, resync to it.
        if (err.status === 429) this.startCooldown();
      }
    });
  }

  private startCooldown(): void {
    this.resendCooldown = RESEND_COOLDOWN_SECONDS;
    if (this.cooldownHandle) clearInterval(this.cooldownHandle);
    this.cooldownHandle = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0 && this.cooldownHandle) {
        clearInterval(this.cooldownHandle);
        this.cooldownHandle = null;
      }
    }, 1000);
  }

  get codeError(): string {
    const ctrl = this.form.get('code');
    if (!ctrl?.touched) return '';
    if (ctrl.errors?.['required']) return 'Please enter the 6-digit code.';
    if (ctrl.errors?.['pattern'])  return 'The code must be exactly 6 digits.';
    return '';
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';

    this.auth.verifyOtp({
      otpReference: this.otpReference,
      code: this.form.value.code,
      keepMeSignedIn: this.keepMeSignedIn
    }).subscribe({
      next: () => {
        this.loading = false;
        this.auth.redirectByRole(this.returnUrl);
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.message ?? 'Code is invalid, expired, or already used.';
      }
    });
  }

  backToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
