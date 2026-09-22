import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { DocumentService, DocumentTypeDto } from '../../../core/services/document.service';
import { PendingDocument } from '../../../shared/components/document-upload-widget/document-upload-widget.component';

type AccountRole = 'Contractor' | 'Supplier';


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
 * Examples: "John", "Mary-Jane", "O'Brien"
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
 * Company name: letters, digits, spaces, and common business punctuation (. , & ' - ( )).
 * Rejects junk like *** $$ ^^.
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
 * (spaces/hyphens/parentheses are stripped before matching so typed forms still work).
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

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['../auth.scss'],
  standalone: false,
})
export class RegisterComponent implements OnInit {
  form: FormGroup;
  role: AccountRole | '' = '';
  loading = false;
  error = '';
  success = false;
  submitted = false;

  documentTypes: DocumentTypeDto[] = [];
  documents: PendingDocument[] = [];
  documentsError = '';
  progress: number | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private documentService: DocumentService,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.maxLength(100), personNameValidator]],
        lastName: ['', [Validators.required, Validators.maxLength(100), personNameValidator]],
        email: ['', [Validators.required, Validators.email]],
        companyName: ['', [Validators.required, Validators.maxLength(200), companyNameValidator]],
        phone: [''],
        registrationNumber: [''],
        password: ['', [Validators.required, Validators.minLength(8), passwordPolicyValidator]],
        confirmPassword: ['', Validators.required],
        agreeToTerms: [false, Validators.requiredTrue]
      },
      { validators: passwordsMatchValidator }
    );
  }

  ngOnInit(): void {
    // Deep-linking support: /auth/register?role=Supplier preselects a role,
    // replacing the old dedicated /auth/supplier page.
    const roleParam = this.route.snapshot.queryParamMap.get('role');
    if (roleParam === 'Supplier' || roleParam === 'Contractor') {
      this.selectRole(roleParam);
    }
  }

  get isContractor(): boolean { return this.role === 'Contractor'; }
  get isSupplier(): boolean { return this.role === 'Supplier'; }

  selectRole(role: AccountRole): void {
    this.role = role;
    this.error = '';
    this.documentsError = '';

    const phoneCtrl = this.form.get('phone');
    // SA format + uniqueness (enforced server-side). Required for Contractor (SMS 2FA);
    // optional for Supplier but when present must be valid SA format.
    if (role === 'Contractor') {
      phoneCtrl?.setValidators([Validators.required, saPhoneValidator]);
    } else {
      phoneCtrl?.setValidators([saPhoneValidator]);
    }
    phoneCtrl?.updateValueAndValidity();

    if (role === 'Supplier' && this.documentTypes.length === 0) {
      this.documentService.getDocumentTypes('Supplier').subscribe({
        next: types => this.documentTypes = types,
        error: () => this.documentTypes = []
      });
    }
  }

  onDocumentsChange(docs: PendingDocument[]): void {
    this.documents = docs;
    if (this.documentsError) this.documentsError = '';
  }

  get missingRequiredDocs(): DocumentTypeDto[] {
    const covered = new Set(
      this.documents.filter(d => d.file && !d.error && d.docTypeId !== null).map(d => d.docTypeId)
    );
    return this.documentTypes.filter(t => t.isRequired && !covered.has(t.docTypeID));
  }

  // --- field error getters ---

  get firstNameError(): string {
    const ctrl = this.form.get('firstName');
    if (!ctrl || (!ctrl.touched && !this.submitted)) return '';
    if (ctrl.errors?.['required']) return 'First name is required.';
    if (ctrl.errors?.['nameHasDigits']) return 'Name must not contain digits.';
    if (ctrl.errors?.['invalidName']) return 'First name contains invalid characters.';
    if (ctrl.errors?.['maxlength']) return 'First name must be at most 100 characters.';
    if (ctrl.errors?.['server']) return ctrl.errors['server'];
    return '';
  }

  get lastNameError(): string {
    const ctrl = this.form.get('lastName');
    if (!ctrl || (!ctrl.touched && !this.submitted)) return '';
    if (ctrl.errors?.['required']) return 'Last name is required.';
    if (ctrl.errors?.['nameHasDigits']) return 'Name must not contain digits.';
    if (ctrl.errors?.['invalidName']) return 'Last name contains invalid characters.';
    if (ctrl.errors?.['maxlength']) return 'Last name must be at most 100 characters.';
    if (ctrl.errors?.['server']) return ctrl.errors['server'];
    return '';
  }

  get emailError(): string {
    const ctrl = this.form.get('email');
    if (!ctrl || (!ctrl.touched && !this.submitted)) return '';
    if (ctrl.errors?.['required']) return 'Email is required.';
    if (ctrl.errors?.['email']) return 'Please enter a valid email address.';
    if (ctrl.errors?.['server']) return ctrl.errors['server'];
    return '';
  }

  get companyNameError(): string {
    const ctrl = this.form.get('companyName');
    if (!ctrl || (!ctrl.touched && !this.submitted)) return '';
    if (ctrl.errors?.['required']) return 'Company name is required.';
    if (ctrl.errors?.['invalidCompany']) return 'Company name contains invalid characters.';
    if (ctrl.errors?.['maxlength']) return 'Company name must be at most 200 characters.';
    if (ctrl.errors?.['server']) return ctrl.errors['server'];
    return '';
  }

  get phoneError(): string {
    const ctrl = this.form.get('phone');
    if (!ctrl || (!ctrl.touched && !this.submitted)) return '';
    if (ctrl.errors?.['required']) return 'Phone number is required.';
    if (ctrl.errors?.['saPhone'] || ctrl.errors?.['pattern']) {
      return 'Phone number must be a valid South African number with exactly 10 digits (0XXXXXXXXX or +27XXXXXXXXX).';
    }
    if (ctrl.errors?.['server']) return ctrl.errors['server'];
    return '';
  }

  get passwordError(): string {
    const ctrl = this.form.get('password');
    if (!ctrl?.touched) return '';
    if (ctrl.errors?.['required']) return 'Password is required.';
    if (ctrl.errors?.['minlength']) return 'Password must be at least 8 characters.';
    if (ctrl.errors?.['passwordPolicy']) return 'Password must include uppercase, number, and symbol.';
    return '';
  }

  get confirmPasswordError(): string {
    const ctrl = this.form.get('confirmPassword');
    if (!ctrl?.touched) return '';
    if (ctrl.errors?.['required']) return 'Please confirm your password.';
    if (this.form.errors?.['passwordsMismatch']) return 'Passwords do not match.';
    return '';
  }

  get termsError(): string {
    const ctrl = this.form.get('agreeToTerms');
    if (!ctrl?.touched) return '';
    return ctrl.errors?.['required'] ? 'You must agree to the terms and conditions.' : '';
  }

  // --- submit ---

  submit(): void {
    this.form.markAllAsTouched();
    this.submitted = true;
    this.error = '';
    this.documentsError = '';

    if (!this.role) {
      this.error = 'Please select an account type to continue.';
      return;
    }

    if (this.form.invalid) {
      // Surface the first field-level message in the banner as well
      this.error =
        this.firstNameError ||
        this.lastNameError ||
        this.phoneError ||
        this.emailError ||
        this.passwordError ||
        this.confirmPasswordError ||
        this.termsError ||
        'Please fix the highlighted fields before continuing.';
      return;
    }

    if (this.isSupplier) {
      this.submitSupplier();
    } else {
      this.submitContractor();
    }
  }

  private submitContractor(): void {
    const { firstName, lastName, email, companyName, phone, password } = this.form.value as any;
    const phoneNumber = phone ? String(phone).replace(/[\s\-()]/g, '') : undefined;
    this.loading = true;
    this.auth.register({
      fullName: `${firstName} ${lastName}`.trim(),
      email, companyName, phoneNumber, role: 'Contractor', password
    }).subscribe({
      next: () => { this.success = true; this.loading = false; },
      error: err => {
        this.applyServerErrors(err);
        this.loading = false;
      }
    });
  }

  private submitSupplier(): void {
    const validDocs = this.documents.filter(d => d.file && d.docTypeId !== null && !d.error);

    if (this.documents.some(d => d.error)) {
      this.documentsError = 'Please fix the highlighted file errors before continuing.';
      return;
    }
    if (validDocs.length === 0) {
      this.documentsError = 'Please upload at least one verification document.';
      return;
    }
    if (this.missingRequiredDocs.length > 0) {
      this.documentsError =
        `Please upload the following required document(s): ${this.missingRequiredDocs.map(t => t.typeName).join(', ')}.`;
      return;
    }

    const { firstName, lastName, email, companyName, registrationNumber, phone, password } = this.form.value as any;
    const phoneNumber = phone ? String(phone).replace(/[\s\-()]/g, '') : undefined;

    this.loading = true;
    this.progress = 0;

    this.auth.registerSupplierWithProgress({
      fullName: `${firstName} ${lastName}`.trim(),
      email,
      companyName,
      registrationNumber: registrationNumber || undefined,
      phoneNumber,
      password,
      documents: validDocs.map(d => d.file as File),
      docTypeIds: validDocs.map(d => d.docTypeId as number)
    }).subscribe({
      next: (event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.progress = Math.round((100 * event.loaded) / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.success = true;
          this.loading = false;
          this.progress = null;
        }
      },
      error: (err: any) => {
        this.applyServerErrors(err);
        this.loading = false;
        this.progress = null;
      }
    });
  }

  /**
   * Surfaces API validation messages and paints the matching form fields red.
   */
  private applyServerErrors(err: any): void {
    const { message, fieldErrors } = this.parseRegistrationError(err);
    this.error = message;
    this.submitted = true;

    // Attach server-side errors to controls so under-field red text always appears
    if (fieldErrors['fullName'] || fieldErrors['name']) {
      const msg = fieldErrors['fullName'] || fieldErrors['name'];
      this.form.get('firstName')?.setErrors({ ...(this.form.get('firstName')?.errors || {}), server: msg });
      this.form.get('firstName')?.markAsTouched();
      this.form.get('lastName')?.markAsTouched();
    }
    if (fieldErrors['phoneNumber'] || fieldErrors['phone']) {
      const msg = fieldErrors['phoneNumber'] || fieldErrors['phone'];
      this.form.get('phone')?.setErrors({ ...(this.form.get('phone')?.errors || {}), server: msg });
      this.form.get('phone')?.markAsTouched();
    }
    if (fieldErrors['email']) {
      this.form.get('email')?.setErrors({ ...(this.form.get('email')?.errors || {}), server: fieldErrors['email'] });
      this.form.get('email')?.markAsTouched();
    }

    // Heuristic fallback when API only returns a combined message string
    const lower = message.toLowerCase();
    if (lower.includes('digit') || (lower.includes('name') && !lower.includes('company'))) {
      const ctrl = this.form.get('firstName');
      if (ctrl && !ctrl.errors?.['server']) {
        ctrl.setErrors({ ...(ctrl.errors || {}), nameHasDigits: true });
        ctrl.markAsTouched();
      }
    }
    if (lower.includes('phone')) {
      const ctrl = this.form.get('phone');
      if (ctrl && !ctrl.errors?.['server']) {
        ctrl.setErrors({ ...(ctrl.errors || {}), saPhone: true });
        ctrl.markAsTouched();
      }
    }
  }

  private parseRegistrationError(err: any): { message: string; fieldErrors: Record<string, string> } {
    const fieldErrors: Record<string, string> = {};
    const body = err?.error;

    const fallback = err?.status === 409
      ? 'Registration could not be completed. Please check your details and try again.'
      : 'Registration failed. Please try again.';

    if (body == null) {
      return { message: fallback, fieldErrors };
    }

    // Rare: error body is still a raw string
    if (typeof body === 'string' && body.trim()) {
      return { message: body.trim(), fieldErrors };
    }

    const collectFromMap = (map: Record<string, any>) => {
      for (const [key, val] of Object.entries(map)) {
        if (['type', 'title', 'status', 'traceId', 'detail', 'instance', 'message'].includes(key)) continue;
        const msgs = Array.isArray(val) ? val : (typeof val === 'string' ? [val] : []);
        const first = msgs.find((m: any) => typeof m === 'string' && m.trim());
        if (first) {
          // Normalize keys: FullName -> fullName
          const norm = key.charAt(0).toLowerCase() + key.slice(1);
          fieldErrors[norm] = first;
          fieldErrors[key.toLowerCase()] = first;
        }
      }
    };

    if (body.errors && typeof body.errors === 'object') {
      collectFromMap(body.errors);
    } else if (typeof body === 'object') {
      collectFromMap(body);
    }

    let message = '';
    if (typeof body.message === 'string' && body.message.trim()) {
      message = body.message.trim();
    } else if (Object.keys(fieldErrors).length) {
      message = [...new Set(Object.values(fieldErrors))].join(' ');
    } else if (typeof body.title === 'string' && body.title.trim()) {
      message = body.title.trim();
    } else if (typeof body.detail === 'string' && body.detail.trim()) {
      message = body.detail.trim();
    }

    return { message: message || fallback, fieldErrors };
  }
}
