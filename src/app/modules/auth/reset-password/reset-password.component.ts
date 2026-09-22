import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordPolicyValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  if (!value) return null;
  if (!/[A-Z]/.test(value) || !/[0-9]/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
    return { passwordPolicy: true };
  }
  return null;
}

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPw   = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return confirm && newPw !== confirm ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['../auth.scss'],
  standalone: false,
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  loading = false;
  validatingToken = false;  // No pre-validation; form renders immediately
  tokenValid = true;
  tokenError = '';
  error = '';
  success = false;

  private token = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group(
      {
        newPassword:     ['', [Validators.required, Validators.minLength(8), passwordPolicyValidator]],
        confirmPassword: ['', Validators.required]
      },
      { validators: passwordsMatchValidator }
    );
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.tokenValid = false;
      this.tokenError = 'No reset token found. Please request a new reset link.';
    }
  }

  get newPasswordErrors(): string {
    const ctrl = this.form.get('newPassword');
    if (!ctrl?.touched) return '';
    if (ctrl.errors?.['required'])       return 'This is required.';
    if (ctrl.errors?.['minlength'])      return 'Password must be at least 8 characters.';
    if (ctrl.errors?.['passwordPolicy']) return 'Must include an uppercase letter, a number, and a symbol.';
    return '';
  }

  get confirmPasswordErrors(): string {
    const ctrl = this.form.get('confirmPassword');
    if (!ctrl?.touched) return '';
    if (ctrl.errors?.['required'])               return 'This is required.';
    if (this.form.errors?.['passwordsMismatch']) return 'Passwords do not match.';
    return '';
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { newPassword, confirmPassword } = this.form.value;
    this.loading = true;
    this.error = '';

    this.auth.resetPassword({ token: this.token, newPassword, confirmPassword }).subscribe({
      next: () => { this.success = true; this.loading = false; },
      error: (err: any) => {
        const msg: string = err.error?.message ?? '';
        const lower = msg.toLowerCase();
        if (lower.includes('expired') || lower.includes('invalid') || lower.includes('used')) {
          this.tokenValid = false;
          this.tokenError = lower.includes('expired')
            ? 'This reset link has expired. Please request a new one.'
            : 'This reset link is invalid or has already been used. Please request a new one.';
        } else {
          this.error = msg || 'Reset failed. Please try again.';
        }
        this.loading = false;
      }
    });
  }
}