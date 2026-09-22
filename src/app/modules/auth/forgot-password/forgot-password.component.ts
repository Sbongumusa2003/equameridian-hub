// REPLACE src/app/modules/auth/forgot-password/forgot-password.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['../auth.scss'],
  standalone: false,
})
export class ForgotPasswordComponent {
  form: FormGroup;
  loading = false;
  sent = false;
  dispatchError = '';

  constructor(private fb: FormBuilder, private auth: AuthService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.dispatchError = '';

    this.auth.forgotPassword(this.form.value as any).subscribe({
      next: () => {
        this.sent = true;
        this.loading = false;
        this.form.reset();
        this.form.markAsPristine();
        this.form.markAsUntouched();
      },
      error: (err) => {
        const msg: string = err.error?.message ?? '';
        if (err.status === 500 || msg.toLowerCase().includes('email')) {
          this.dispatchError = 'We were unable to send the reset email. Please try again later.';
        } else {
          this.sent = true;
          this.form.reset();
          this.form.markAsPristine();
          this.form.markAsUntouched();
        }
        this.loading = false;
      }
    });
  }
}