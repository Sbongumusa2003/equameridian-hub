import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DocumentService, DocumentTypeDto } from '../../../core/services/document.service';


function passwordPolicyValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  if (!value) return null;
  const hasUppercase = /[A-Z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);
  if (!hasUppercase || !hasNumber || !hasSymbol) {
    return { passwordPolicy: true };
  }
  return null;
}

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return confirmPassword && password !== confirmPassword ? { passwordsMismatch: true } : null;
}

/**
 * Person name: letters, spaces, hyphen, apostrophe only. No digits or junk symbols.
 */
function personNameValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = (control.value ?? '').trim();
  if (!value) return null;
  if (/\d/.test(value)) {
    return { nameHasDigits: true };
  }
  if (!/^[a-zA-Z][a-zA-Z\s\-']*$/.test(value)) {
    return { invalidName: true };
  }
  return null;
}

/**
 * Company name: letters, digits, spaces, and common business punctuation.
 */
function companyNameValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = (control.value ?? '').trim();
  if (!value) return null;
  if (/[*$^~`|<>{}\[\]\\]/.test(value)) {
    return { invalidCompany: true };
  }
  if (!/[a-zA-Z0-9]/.test(value)) {
    return { invalidCompany: true };
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9\s.\-&',()]*$/.test(value)) {
    return { invalidCompany: true };
  }
  return null;
}

/**
 * Valid SA phone formats only: 0XXXXXXXXX or +27XXXXXXXXX
 */
function saPhoneValidator(control: AbstractControl): ValidationErrors | null {
  const raw: string = control.value ?? '';
  if (!raw || !String(raw).trim()) return null;
  const cleaned = String(raw).replace(/[\s\-()]/g, '');
  if (!/^(\+27[0-9]{9}|0[0-9]{9})$/.test(cleaned)) {
    return { saPhone: true };
  }
  return null;
}

interface PendingDocument {
  docTypeId: number | null;
  file: File | null;
}

@Component({
  selector: 'app-supplier-auth',
  templateUrl: './supplier-auth.component.html',
  styleUrls: ['../auth.scss'],
  standalone: false,
})
export class SupplierAuthComponent implements OnInit {
  mode: 'login' | 'register' = 'login';
  loginForm: FormGroup;
  registerForm: FormGroup;
  loading = false;
  error = '';
  success = false;

  documentTypes: DocumentTypeDto[] = [];
  documents: PendingDocument[] = [{ docTypeId: null, file: null }];
  documentsError = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private documentService: DocumentService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      keepMeSignedIn: [false]
    });

    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.maxLength(100), personNameValidator]],
        lastName: ['', [Validators.required, Validators.maxLength(100), personNameValidator]],
        email: ['', [Validators.required, Validators.email]],
        companyName: ['', [Validators.required, Validators.maxLength(200), companyNameValidator]],
        phone: ['', [Validators.required, saPhoneValidator]],
        password: ['', [Validators.required, Validators.minLength(8), passwordPolicyValidator]],
        confirmPassword: ['', Validators.required],
        agreeToTerms: [false, Validators.requiredTrue]
      },
      { validators: passwordsMatchValidator }
    );
  }

  ngOnInit() {
    this.documentService.getDocumentTypes().subscribe({
      next: types => this.documentTypes = types,
      error: () => this.documentTypes = []
    });
  }

  get isLogin(): boolean {
    return this.mode === 'login';
  }

  get isRegister(): boolean {
    return this.mode === 'register';
  }

  switchMode(mode: 'login' | 'register') {
    this.mode = mode;
    this.error = '';
    this.success = false;
    this.loginForm.reset();
    this.registerForm.reset();
  }

  get loginEmailError(): string {
    const ctrl = this.loginForm.get('email');
    if (!ctrl?.touched) return '';
    if (ctrl.errors?.['required']) return 'Email is required.';
    if (ctrl.errors?.['email']) return 'Please enter a valid email address.';
    return '';
  }

  get loginPasswordError(): string {
    const ctrl = this.loginForm.get('password');
    if (!ctrl?.touched) return '';
    if (ctrl.errors?.['required']) return 'Password is required.';
    return '';
  }

  get registerEmailError(): string {
    const ctrl = this.registerForm.get('email');
    if (!ctrl?.touched) return '';
    if (ctrl.errors?.['required']) return 'Email is required.';
    if (ctrl.errors?.['email']) return 'Please enter a valid email address.';
    return '';
  }

  get passwordError(): string {
    const ctrl = this.registerForm.get('password');
    if (!ctrl?.touched) return '';
    if (ctrl.errors?.['required']) return 'Password is required.';
    if (ctrl.errors?.['minlength']) return 'Password must be at least 8 characters.';
    if (ctrl.errors?.['passwordPolicy']) {
      return 'Password must include uppercase, number, and symbol.';
    }
    return '';
  }

  get confirmPasswordError(): string {
    const ctrl = this.registerForm.get('confirmPassword');
    if (!ctrl?.touched) return '';
    if (ctrl.errors?.['required']) return 'Please confirm your password.';
    if (this.registerForm.errors?.['passwordsMismatch']) {
      return 'Passwords do not match.';
    }
    return '';
  }

  addDocument() {
    this.documents.push({ docTypeId: null, file: null });
  }

  removeDocument(index: number) {
    this.documents.splice(index, 1);
  }

  onDocTypeSelected(event: Event, index: number) {
    const value = (event.target as HTMLSelectElement).value;
    this.documents[index].docTypeId = value ? Number(value) : null;
  }

  onFileSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    this.documents[index].file = input.files && input.files.length ? input.files[0] : null;
  }

  submitLogin() {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.error = '';

    this.auth.login(this.loginForm.value as any).subscribe({
      next: () => this.auth.redirectByRole(),
      error: (err: any) => {
        const msg: string = err.error?.message ?? '';
        this.error = this.mapLoginError(msg, err.status);
        this.loading = false;
      }
    });
  }

  submitRegister() {
    this.registerForm.markAllAsTouched();
    this.documentsError = '';

    const validDocs = this.documents.filter(d => d.file && d.docTypeId);
    if (validDocs.length === 0) {
      this.documentsError = 'Please upload at least one document and select its type.';
    }

    if (this.registerForm.invalid || validDocs.length === 0) return;

    const { firstName, lastName, email, companyName, phone, password } = this.registerForm.value as any;

    this.loading = true;
    this.error = '';

    this.auth.registerSupplier({
      fullName: `${firstName} ${lastName}`,
      email,
      companyName,
      password,
      documents: validDocs.map(d => d.file as File),
      docTypeIds: validDocs.map(d => d.docTypeId as number)
    }).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message ?? 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }

  private mapLoginError(serverMsg: string, status: number): string {
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