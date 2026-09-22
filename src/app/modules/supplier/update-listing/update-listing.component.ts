import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ListingService } from '../../../core/services/listing.service';
import { CategoryService, CategoryDto } from '../../../core/services/category.service';
import { ListingImageDto } from '../../../core/models/listing.models';


/** Reject values that are only a negative number (e.g. "-220"). */


/** Make/model: letters, digits, spaces, hyphen, slash, dot only (e.g. CAT, 320D, XL/7). */
function safeNameValidator(control: AbstractControl): ValidationErrors | null {
  const raw = (control.value ?? '').toString().trim();
  if (!raw) return null;
  if (/^-\d+(\.\d+)?$/.test(raw)) {
    return { negativeNumber: true };
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9 .\-\/]*$/.test(raw)) {
    return { invalidName: true };
  }
  return null;
}

/**
 * Operating weight / engine power: optional positive measurement.
 * Allows: "30000", "30,000 kg", "122 kW", "12.5t"
 */
function nonNegativeMeasurementValidator(control: AbstractControl): ValidationErrors | null {
  const raw = (control.value ?? '').toString().trim();
  if (!raw) return null;
  if (/^-/.test(raw)) {
    return { negativeMeasurement: true };
  }
  const ok = /^\d{1,3}([ ,]?\d{3})*([.,]\d+)?(\s*[a-zA-Z]+)?$/.test(raw);
  if (!ok) {
    return { invalidMeasurement: true };
  }
  return null;
}

/** Listing title: readable text, no junk symbols (* $ ^ ~ ` | < > { } [ ] \\). */
function safeTitleValidator(control: AbstractControl): ValidationErrors | null {
  const raw = (control.value ?? '').toString().trim();
  if (!raw) return null;
  if (/[*$^~`|<>{}\[\]\\]/.test(raw)) {
    return { invalidText: true };
  }
  // Must contain at least one letter or digit
  if (!/[a-zA-Z0-9]/.test(raw)) {
    return { invalidText: true };
  }
  return null;
}

/** Description: prose allowed; block junk symbols (* $ ^ ~ ` | < > { } [ ] \\). */
function safeDescriptionValidator(control: AbstractControl): ValidationErrors | null {
  const raw = (control.value ?? '').toString();
  if (!raw || !raw.trim()) return null;
  if (/[*$^~`|<>{}\[\]\\]/.test(raw)) {
    return { invalidText: true };
  }
  if (!/[a-zA-Z0-9]/.test(raw)) {
    return { invalidText: true };
  }
  return null;
}

/** Location: letters, digits, spaces, common place punctuation. */
function safeLocationValidator(control: AbstractControl): ValidationErrors | null {
  const raw = (control.value ?? '').toString().trim();
  if (!raw) return null;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9 .,\-\/'()]*$/.test(raw)) {
    return { invalidLocation: true };
  }
  return null;
}


/** Year: empty OK, otherwise a whole number between 1950 and next calendar year. */
function yearValidator(control: AbstractControl): ValidationErrors | null {
  const raw = control.value;
  if (raw === null || raw === undefined || raw === '') return null;
  const str = String(raw).trim();
  // Reject anything that is not a plain integer string (blocks "20-20", "20.5", "abcd")
  if (!/^\d{4}$/.test(str) && !/^\d{1,4}$/.test(str)) {
    return { invalidYear: true };
  }
  const n = Number(str);
  if (!Number.isInteger(n)) {
    return { invalidYear: true };
  }
  const maxYear = new Date().getFullYear() + 1;
  if (n < 1950 || n > maxYear) {
    return { yearRange: true };
  }
  return null;
}

export interface ImagePreview {
  file: File;
  url: string;
}

@Component({
  selector: 'app-update-listing',
  templateUrl: './update-listing.component.html',
  styleUrls: ['../create-listing/create-listing.scss'],
  standalone: false,
})
export class UpdateListingComponent implements OnInit {
  categories: CategoryDto[] = [];
  loading = false;
  saving  = false;
  error   = '';
  form: FormGroup;

  images: ImagePreview[] = [];
  readonly MIN_IMAGES = 1;
  readonly MAX_IMAGES = 5;
  readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  imageError = '';

  existingImages: ListingImageDto[] = [];
  deletingImageId: number | null = null;
  imageDeleteError = '';
  fileBaseUrl = '';

  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private listingService: ListingService,
    private categoryService: CategoryService
  ) {
    this.fileBaseUrl = this.listingService.apiBase;
    const maxYear = new Date().getFullYear() + 1;
    this.form = this.fb.group({
      listingTitle:       ['', [Validators.required, Validators.maxLength(200), safeTitleValidator]],
      categoryID:         [null as number | null, Validators.required],
      availabilityStatus: [{ value: '', disabled: true }],
      description:        ['', [Validators.required, Validators.maxLength(2000), safeDescriptionValidator]],
      makeBrand:          ['', [Validators.maxLength(100), safeNameValidator]],
      model:              ['', [Validators.maxLength(100), safeNameValidator]],
      year:               [null as number | null, [yearValidator]],
      operatingWeight:    ['', [Validators.maxLength(50), nonNegativeMeasurementValidator]],
      enginePower:        ['', [Validators.maxLength(50), nonNegativeMeasurementValidator]],
      location:           ['', [Validators.maxLength(200), safeLocationValidator]],
      dailyRateZAR:       [null as number | null, [Validators.required, Validators.min(0.01), Validators.max(10_000_000)]],
      weeklyRateZAR:      [null as number | null, [Validators.min(0.01), Validators.max(10_000_000)]],

      dryHireAvailable:   [true],
      wetHireAvailable:   [false],
      wetDailyRateZAR:    [null as number | null, [Validators.min(0.01), Validators.max(10_000_000)]],
      wetWeeklyRateZAR:   [null as number | null, [Validators.min(0.01), Validators.max(10_000_000)]],

      pickupAvailable:    [true],
      deliveryAvailable:  [false],
      deliveryFeeZAR:     [null as number | null, [Validators.min(0), Validators.max(10_000_000)]],

      pricingMode:        ['Fixed', Validators.required],
      unitsOwned:         [1, [Validators.required, Validators.min(1), Validators.max(10_000)]]
    });
  }

  ngOnInit(): void {
    this.categoryService.getAll().subscribe(cats => this.categories = cats);
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;
    this.listingService.supplierGetById(id).subscribe({
      next: listing => {
        this.form.patchValue(listing as any);
        this.existingImages = listing.images ?? (listing.imageUrls ?? []).map((url, i) => ({ imageID: -1 - i, url }));
        this.loading = false;
      },
      error: () => {
        this.error   = 'Failed to load listing. It may not exist or you do not have access.';
        this.loading = false;
      }
    });
  }

  get maxYear(): number { return new Date().getFullYear() + 1; }

  private fieldTouched(name: string): boolean {
    const ctrl = this.form.get(name);
    return !!ctrl && (ctrl.touched || ctrl.dirty);
  }

  get listingTitleError(): string {
    const ctrl = this.form.get('listingTitle');
    if (!ctrl || !this.fieldTouched('listingTitle') || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'Listing title is required.';
    if (ctrl.errors['maxlength']) return 'Listing title must be at most 200 characters.';
    if (ctrl.errors['invalidText']) return 'Listing title contains invalid characters.';
    return 'Enter a valid listing title.';
  }

  get categoryError(): string {
    const ctrl = this.form.get('categoryID');
    if (!ctrl || !this.fieldTouched('categoryID') || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'Please select a category.';
    return 'Select a valid category.';
  }

  get descriptionError(): string {
    const ctrl = this.form.get('description');
    if (!ctrl || !this.fieldTouched('description') || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'Description is required.';
    if (ctrl.errors['maxlength']) return 'Description must be at most 2000 characters.';
    if (ctrl.errors['invalidText']) return 'Description contains invalid characters.';
    return 'Enter a valid description.';
  }

  get makeBrandError(): string {
    const ctrl = this.form.get('makeBrand');
    if (!ctrl || !this.fieldTouched('makeBrand') || !ctrl.errors) return '';
    if (ctrl.errors['maxlength']) return 'Make / brand must be at most 100 characters.';
    if (ctrl.errors['negativeNumber']) return 'Make / brand cannot be a negative number.';
    if (ctrl.errors['invalidName']) return 'Make / brand contains invalid characters.';
    return 'Enter a valid make / brand.';
  }

  get modelError(): string {
    const ctrl = this.form.get('model');
    if (!ctrl || !this.fieldTouched('model') || !ctrl.errors) return '';
    if (ctrl.errors['maxlength']) return 'Model must be at most 100 characters.';
    if (ctrl.errors['negativeNumber']) return 'Model cannot be a negative number.';
    if (ctrl.errors['invalidName']) return 'Model contains invalid characters.';
    return 'Enter a valid model.';
  }

  get yearError(): string {
    const ctrl = this.form.get('year');
    if (!ctrl || !this.fieldTouched('year') || !ctrl.errors) return '';
    if (ctrl.errors['invalidYear']) {
      return 'Enter a valid 4-digit year (e.g. 2020).';
    }
    if (ctrl.errors['yearRange'] || ctrl.errors['min'] || ctrl.errors['max']) {
      return `Year must be between 1950 and ${this.maxYear}.`;
    }
    return 'Enter a valid year (e.g. 2020).';
  }

  get operatingWeightError(): string {
    const ctrl = this.form.get('operatingWeight');
    if (!ctrl || !this.fieldTouched('operatingWeight') || !ctrl.errors) return '';
    if (ctrl.errors['maxlength']) return 'Operating weight must be at most 50 characters.';
    if (ctrl.errors['negativeMeasurement']) return 'Operating weight cannot be negative.';
    if (ctrl.errors['invalidMeasurement']) return 'Enter a valid operating weight (e.g. 30000 kg).';
    return 'Enter a valid operating weight.';
  }

  get enginePowerError(): string {
    const ctrl = this.form.get('enginePower');
    if (!ctrl || !this.fieldTouched('enginePower') || !ctrl.errors) return '';
    if (ctrl.errors['maxlength']) return 'Engine power must be at most 50 characters.';
    if (ctrl.errors['negativeMeasurement']) return 'Engine power cannot be negative.';
    if (ctrl.errors['invalidMeasurement']) return 'Enter a valid engine power (e.g. 122 kW).';
    return 'Enter a valid engine power.';
  }

  get locationError(): string {
    const ctrl = this.form.get('location');
    if (!ctrl || !this.fieldTouched('location') || !ctrl.errors) return '';
    if (ctrl.errors['maxlength']) return 'Location must be at most 200 characters.';
    if (ctrl.errors['invalidLocation']) return 'Location contains invalid characters.';
    return 'Enter a valid location.';
  }

  get dailyRateError(): string {
    const ctrl = this.form.get('dailyRateZAR');
    if (!ctrl || !this.fieldTouched('dailyRateZAR') || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'Daily rate is required.';
    if (ctrl.errors['min'] || ctrl.errors['max']) return 'Daily rate must be greater than zero and at most 10,000,000.';
    return 'Enter a valid daily rate.';
  }

  get weeklyRateError(): string {
    const ctrl = this.form.get('weeklyRateZAR');
    if (!ctrl || !this.fieldTouched('weeklyRateZAR') || !ctrl.errors) return '';
    if (ctrl.errors['min'] || ctrl.errors['max']) return 'Weekly rate must be greater than zero and at most 10,000,000.';
    return 'Enter a valid weekly rate.';
  }

  get hireTypeError(): string {
    if (!this.fieldTouched('dryHireAvailable') && !this.fieldTouched('wetHireAvailable') && !this.form.touched) return '';
    if (!this.form.value.dryHireAvailable && !this.form.value.wetHireAvailable) {
      return 'At least one of dry hire or wet hire must be available.';
    }
    return '';
  }

  get wetDailyRateError(): string {
    if (!this.form.value.wetHireAvailable) return '';
    const ctrl = this.form.get('wetDailyRateZAR');
    const val = ctrl?.value;
    if (this.fieldTouched('wetDailyRateZAR') || this.fieldTouched('wetHireAvailable') || this.form.touched) {
      if (val === null || val === undefined || val === '' || Number(val) <= 0) {
        return 'A wet hire daily rate is required when wet hire is available.';
      }
      if (ctrl?.errors?.['max']) return 'Wet hire daily rate must be at most 10,000,000.';
    }
    return '';
  }

  get wetWeeklyRateError(): string {
    const ctrl = this.form.get('wetWeeklyRateZAR');
    if (!ctrl || !this.fieldTouched('wetWeeklyRateZAR') || !ctrl.errors) return '';
    if (ctrl.errors['min'] || ctrl.errors['max']) return 'Wet hire weekly rate must be greater than zero and at most 10,000,000.';
    return 'Enter a valid wet hire weekly rate.';
  }

  get fulfilmentError(): string {
    if (!this.fieldTouched('pickupAvailable') && !this.fieldTouched('deliveryAvailable') && !this.form.touched) return '';
    if (!this.form.value.pickupAvailable && !this.form.value.deliveryAvailable) {
      return 'At least one of pickup or delivery must be available.';
    }
    return '';
  }

  get deliveryFeeError(): string {
    if (!this.form.value.deliveryAvailable) return '';
    const ctrl = this.form.get('deliveryFeeZAR');
    const val = ctrl?.value;
    if (this.fieldTouched('deliveryFeeZAR') || this.fieldTouched('deliveryAvailable') || this.form.touched) {
      if (val === null || val === undefined || val === '' || Number(val) < 0) {
        return 'A delivery (establishment) fee is required when delivery is available.';
      }
      if (ctrl?.errors?.['max']) return 'Delivery fee must be at most 10,000,000.';
    }
    return '';
  }

  get pricingModeError(): string {
    const ctrl = this.form.get('pricingMode');
    if (!ctrl || !this.fieldTouched('pricingMode') || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'Pricing mode is required.';
    return 'Select a valid pricing mode.';
  }

  get unitsOwnedError(): string {
    const ctrl = this.form.get('unitsOwned');
    if (!ctrl || !this.fieldTouched('unitsOwned') || !ctrl.errors) return '';
    if (ctrl.errors['required'] || ctrl.errors['min'] || ctrl.errors['max']) {
      return 'Units owned must be between 1 and 10,000.';
    }
    return 'Enter a valid number of units.';
  }


  /** Normalize year to number or null for the API. */
  private payloadFromForm(): any {
    const payload = { ...this.form.value };
    const y = payload.year;
    if (y === null || y === undefined || y === '') {
      payload.year = null;
    } else {
      const n = Number(y);
      payload.year = Number.isInteger(n) ? n : null;
    }
    return payload;
  }

  openImagePicker(): void { this.imageInput?.nativeElement.click(); }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.imageError = '';
    for (const file of files) {
      if (this.images.length >= this.MAX_IMAGES) { this.imageError = `Maximum ${this.MAX_IMAGES} images allowed.`; break; }
      if (!this.ALLOWED_TYPES.includes(file.type)) { this.imageError = 'Only JPG, PNG, and WebP images are supported.'; continue; }
      if (file.size > 10 * 1024 * 1024) { this.imageError = `"${file.name}" exceeds the 10 MB limit.`; continue; }
      this.images.push({ file, url: URL.createObjectURL(file) });
    }
    input.value = '';
  }

  removeImage(index: number): void {
    URL.revokeObjectURL(this.images[index].url);
    this.images.splice(index, 1);
    this.imageError = '';
  }

  deleteExistingImage(image: ListingImageDto): void {
    if (image.imageID < 0) {
      this.imageDeleteError = 'This photo can\'t be removed until you reload the page.';
      return;
    }
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.imageDeleteError = '';
    this.deletingImageId = image.imageID;
    this.listingService.deleteImage(id, image.imageID).subscribe({
      next: () => {
        this.existingImages = this.existingImages.filter(i => i.imageID !== image.imageID);
        this.deletingImageId = null;
      },
      error: err => {
        this.imageDeleteError = err?.error?.message ?? 'Failed to delete photo.';
        this.deletingImageId = null;
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Please correct the highlighted fields before saving.';
      return;
    }
    const totalImages = this.existingImages.length + this.images.length;
    if (totalImages < this.MIN_IMAGES) {
      this.imageError = `Add at least ${this.MIN_IMAGES} photo (up to ${this.MAX_IMAGES}) before the listing can be reviewed.`;
      this.error = this.imageError;
      return;
    }
    if (totalImages > this.MAX_IMAGES) {
      this.imageError = `A maximum of ${this.MAX_IMAGES} photos is allowed.`;
      this.error = this.imageError;
      return;
    }
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.saving = true;
    const raw = this.form.getRawValue();
    const { availabilityStatus, ...rest } = raw;
    const payload = { ...rest };
    const y = payload.year;
    if (y === null || y === undefined || y === '') {
      payload.year = null;
    } else {
      const n = Number(y);
      payload.year = Number.isInteger(n) ? n : null;
    }

    this.listingService.supplierUpdate(id, payload).subscribe({
      next: () => {
        if (this.images.length > 0) {
          this.listingService.uploadImages(id, this.images.map(i => i.file))
            .subscribe({
              next:  () => this.router.navigate(['/supplier/listings']),
              error: () => this.router.navigate(['/supplier/listings'])
            });
        } else {
          this.router.navigate(['/supplier/listings']);
        }
      },
      error: err => {
        this.error = err.status === 403
          ? 'This listing has been suspended and can no longer be edited.'
          : (err.error?.message ?? 'Save failed.');
        this.saving = false;
      }
    });
  }

  cancel(): void { this.router.navigate(['/supplier/listings']); }
}
