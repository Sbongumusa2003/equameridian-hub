import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService, MyProfileDto } from '../../../core/services/profile.service';
import { ServiceAreaService, ServiceAreaDto } from '../../../core/services/service-area.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss'],
  standalone: false,
})
export class MyProfileComponent implements OnInit {
  activeTab = 'personal';
  profile: MyProfileDto | null = null;
  loading = true;
  saving = false;
  saved = false;
  error = '';
  form: FormGroup;
  readonly saBanks = [
    'Absa', 'Standard Bank', 'First National Bank (FNB)', 'Nedbank', 'Capitec',
    'Investec', 'Discovery Bank', 'TymeBank', 'African Bank', 'Bidvest Bank',
    'Grindrod Bank', 'Mercantile Bank', 'Sasfin Bank', 'Bank Zero'
  ];

  showDeactivateConfirm = false;
  deactivating = false;
  deactivateError = '';

  // --- Service areas ---
  serviceAreas: ServiceAreaDto[] = [];
  selectedServiceAreaIds: number[] = [];

  // --- Two-factor authentication ---
  showTwoFactorConfirm = false;
  twoFactorPassword = '';
  twoFactorSaving = false;
  twoFactorError = '';
  twoFactorMessage = '';

  constructor(
    private fb: FormBuilder,
    public auth: AuthService,
    private profileService: ProfileService,
    private serviceAreaService: ServiceAreaService,
    private router: Router
  ) {
    this.form = this.fb.group({
      fullName:           ['', [Validators.required, Validators.maxLength(200)]],
      email:              ['', [Validators.required, Validators.email]],
      companyName:        [''],
      bankName:           [''],
      bankAccountName:    [''],
      bankAccountNumber:  [''],
      bankBranchCode:     [''],
      bankAccountType:    ['Cheque'],
      registrationNumber: ['', Validators.maxLength(100)]
    });
  }

  ngOnInit(): void {
    this.loadProfile();
    this.serviceAreaService.getAll().subscribe(areas => this.serviceAreas = areas);
  }

  loadProfile(): void {
    this.loading = true;
    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.form.patchValue({
          fullName:           profile.fullName,
          email:              profile.email,
          companyName:        profile.companyName ?? '',
          bankName:           profile.bankName ?? '',
          bankAccountName:    profile.bankAccountName ?? '',
          bankAccountNumber:  profile.bankAccountNumber ?? '',
          bankBranchCode:     profile.bankBranchCode ?? '',
          bankAccountType:    profile.bankAccountType ?? 'Cheque',
          registrationNumber: profile.registrationNumber ?? ''
        });
        this.selectedServiceAreaIds = [...(profile.serviceAreaIds ?? [])];
        this.loading = false;
      },
      error: () => {
        this.error = 'Account details could not be found. Please contact support.';
        this.loading = false;
      }
    });
  }

  get initials(): string {
    const name = this.profile?.fullName ?? this.auth.currentUser?.fullName ?? '';
    return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.saved = false;
    this.error = '';

    this.profileService.updateProfile({ ...this.form.value, serviceAreaIds: this.selectedServiceAreaIds }).subscribe({
      next: () => {
        this.saving = false;
        this.saved = true;
        this.loadProfile(); // Refresh displayed data
        setTimeout(() => this.saved = false, 4000);
      },
      error: (err) => {
        this.error = err.error?.message ?? 'Failed to save changes. Please try again.';
        this.saving = false;
      }
    });
  }

  cancel(): void {
    if (this.profile) {
      this.form.patchValue({
        fullName:           this.profile.fullName,
        email:              this.profile.email,
        companyName:        this.profile.companyName ?? '',
        registrationNumber: this.profile.registrationNumber ?? ''
      });
      this.selectedServiceAreaIds = [...(this.profile.serviceAreaIds ?? [])];
    }
    this.saved = false;
    this.error = '';
  }

  // --- Service areas ---

  isServiceAreaSelected(serviceAreaID: number): boolean {
    return this.selectedServiceAreaIds.includes(serviceAreaID);
  }

  toggleServiceArea(serviceAreaID: number): void {
    this.selectedServiceAreaIds = this.isServiceAreaSelected(serviceAreaID)
      ? this.selectedServiceAreaIds.filter(id => id !== serviceAreaID)
      : [...this.selectedServiceAreaIds, serviceAreaID];
  }

  // --- Two-factor authentication ---

  openTwoFactorConfirm(): void {
    this.showTwoFactorConfirm = true;
    this.twoFactorPassword = '';
    this.twoFactorError = '';
  }

  cancelTwoFactorConfirm(): void {
    this.showTwoFactorConfirm = false;
    this.twoFactorPassword = '';
    this.twoFactorError = '';
  }

  confirmToggleTwoFactor(): void {
    if (!this.twoFactorPassword) {
      this.twoFactorError = 'Please enter your password to confirm this change.';
      return;
    }
    const enabling = !this.profile?.twoFactorEnabled;
    this.twoFactorSaving = true;
    this.twoFactorError = '';

    const request$ = enabling
      ? this.auth.enableTwoFactor({ password: this.twoFactorPassword })
      : this.auth.disableTwoFactor({ password: this.twoFactorPassword });

    request$.subscribe({
      next: () => {
        this.twoFactorSaving = false;
        this.showTwoFactorConfirm = false;
        this.twoFactorMessage = enabling
          ? 'Two-factor authentication is now enabled. You will be asked for a code at your next sign-in.'
          : 'Two-factor authentication has been disabled.';
        this.loadProfile();
        setTimeout(() => this.twoFactorMessage = '', 5000);
      },
      error: (err) => {
        this.twoFactorSaving = false;
        this.twoFactorError = err.error?.message ?? 'Could not update two-factor authentication. Please try again.';
      }
    });
  }

  openDeactivate(): void {
    this.showDeactivateConfirm = true;
    this.deactivateError = '';
  }

  confirmDeactivate(): void {
    this.deactivating = true;
    this.deactivateError = '';

    this.profileService.deactivateAccount().subscribe({
      next: () => {
        this.auth.logout();
      },
      error: (err) => {
        this.deactivateError = err.error?.message ?? 'Could not deactivate account. Please try again.';
        this.deactivating = false;
      }
    });
  }
}