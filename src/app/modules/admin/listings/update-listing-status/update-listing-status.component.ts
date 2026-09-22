import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ListingService } from '../../../../core/services/listing.service';
import { CategoryService, CategoryDto } from '../../../../core/services/category.service';
import { ListingDto } from '../../../../core/models/listing.models';

@Component({
  selector: 'app-update-listing-status',
  templateUrl: './update-listing-status.component.html',
  styleUrls: ['./update-listing-status.component.scss'],
  standalone: false,
})
export class UpdateListingStatusComponent implements OnInit {
  listing: ListingDto | null = null;
  categories: CategoryDto[] = [];
  loading = false;
  saving = false;
  error = '';
  showStatusDropdown = false;
  form: FormGroup;
  statusOptions = ['Active', 'Suspended', 'Inactive'];
  suspensionReasonTouched = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listingService: ListingService,
    private categoryService: CategoryService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      newStatus: ['Active'],
      suspensionReason: ['']
    });
  }

  ngOnInit() {
    this.categoryService.getAll().subscribe(cats => this.categories = cats);

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;
    this.listingService.adminGetById(id).subscribe(listing => {
      this.listing = listing;
      this.form.patchValue({ newStatus: listing.availabilityStatus });
      this.loading = false;
    });
  }

  get selectedStatus(): string { return this.form.value.newStatus ?? 'Active'; }

  // Req: photos must be visible to the admin during the approval flow, so an admin can catch
  // inappropriate images before a listing goes live — same resolution pattern as the public browse page.
  resolveUrl(path: string | undefined | null): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = this.listingService.apiBase;
    return base.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
  }

  selectStatus(status: string) {
    this.form.patchValue({ newStatus: status });
    this.showStatusDropdown = false;
  }

  getCategoryName(id: number): string {
    return this.categories.find(c => c.categoryID === id)?.name ?? String(id);
  }

  get suspensionReasonError(): string {
    if (!this.suspensionReasonTouched) return '';
    const { newStatus, suspensionReason } = this.form.value;
    if (newStatus === 'Suspended' && !suspensionReason?.trim()) {
      return 'A suspension reason is required before saving.';
    }
    return '';
  }

  save() {
    this.suspensionReasonTouched = true;
    const { newStatus, suspensionReason } = this.form.value;
    if (newStatus === 'Suspended' && !suspensionReason?.trim()) {
      this.error = 'A suspension reason is required before saving.';
      return;
    }
    this.saving = true;
    this.listingService.adminUpdateStatus(this.listing!.listingID, {
      newStatus, suspensionReason
    }).subscribe({
      next: () => this.router.navigate(['/admin/listings']),
      error: err => {
        this.error = err.error?.message ?? 'Save failed.';
        this.saving = false;
      }
    });
  }

  cancel() { this.router.navigate(['/admin/listings']); }
}