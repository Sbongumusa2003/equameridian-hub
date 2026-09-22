import { Component, OnInit } from '@angular/core';
import { FeeService } from '../../../core/services/fee.service';
import { CategoryService, CategoryDto } from '../../../core/services/category.service';
import {
  FeeConfigurationDto,
  DiscountTierDto,
  UpsertDiscountTierDto
} from '../../../core/models/fee.models';

@Component({
  selector: 'app-platform-fees',
  templateUrl: './platform-fees.component.html',
  styleUrls: ['./platform-fees.component.scss'],
  standalone: false,
})
export class PlatformFeesComponent implements OnInit {
  config: FeeConfigurationDto | null = null;
  loading = true;
  saving = false;
  error = '';
  successMessage = '';

  form = { commissionRate: 0, minFee: 0, maxFee: 0, vatInclusive: false, vatRate: 15, deliveryBaseFee: 350, deliveryFreeRadiusKm: 50, deliveryRatePerKm: 15 };

  // Duration discount tiers (hire-length discounts)
  tiers: DiscountTierDto[] = [];
  categories: CategoryDto[] = [];
  tiersLoading = false;
  tierSaving = false;
  tierError = '';
  tierSuccess = '';
  editingTierId: number | null = null;
  tierForm: UpsertDiscountTierDto = { categoryID: null, minDays: 1, maxDays: null, discountPercent: 0 };

  // Category management (Req: referential integrity — a category can only be deleted while
  // nothing references it; the backend enforces this and returns a clear message if it can't).
  categoriesAdmin: CategoryDto[] = [];
  categoriesLoading = false;
  categorySaving = false;
  categoryError = '';
  categorySuccess = '';
  editingCategoryId: number | null = null;
  categoryForm = { name: '' };

  constructor(private feeService: FeeService, private categoryService: CategoryService) {}

  ngOnInit() {
    this.load();
    this.loadTiers();
    this.loadCategoriesAdmin();
    this.categoryService.getAll().subscribe({ next: c => this.categories = c ?? [], error: () => {} });
  }

  loadCategoriesAdmin() {
    this.categoriesLoading = true;
    this.categoryService.getAllForAdmin().subscribe({
      next: c => { this.categoriesAdmin = c ?? []; this.categoriesLoading = false; },
      error: err => {
        this.categoriesLoading = false;
        this.categoryError = err?.error?.message || 'Could not load categories.';
      }
    });
  }

  resetCategoryForm() {
    this.editingCategoryId = null;
    this.categoryForm = { name: '' };
    this.categoryError = '';
  }

  editCategory(c: CategoryDto) {
    this.editingCategoryId = c.categoryID;
    this.categoryForm = { name: c.name };
    this.categoryError = '';
    this.categorySuccess = '';
  }

  saveCategory() {
    this.categoryError = '';
    this.categorySuccess = '';
    if (!this.categoryForm.name.trim()) {
      this.categoryError = 'Category name is required.';
      return;
    }

    this.categorySaving = true;
    const req = this.editingCategoryId
      ? this.categoryService.update(this.editingCategoryId, this.categoryForm)
      : this.categoryService.create(this.categoryForm);

    req.subscribe({
      next: () => {
        this.categorySaving = false;
        this.categorySuccess = this.editingCategoryId ? 'Category updated.' : 'Category created.';
        this.resetCategoryForm();
        this.loadCategoriesAdmin();
        this.categoryService.getAll().subscribe({ next: c => this.categories = c ?? [], error: () => {} });
      },
      error: err => {
        this.categorySaving = false;
        this.categoryError = err?.error?.message || 'Could not save category.';
      }
    });
  }

  deleteCategory(c: CategoryDto) {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    this.categoryService.delete(c.categoryID).subscribe({
      next: () => {
        this.categorySuccess = 'Category deleted.';
        if (this.editingCategoryId === c.categoryID) this.resetCategoryForm();
        this.loadCategoriesAdmin();
      },
      // Surfaces the backend's referential-integrity message, e.g.
      // "Cannot delete X — it is still used by 3 listing(s)."
      error: err => { this.categoryError = err?.error?.message || 'Could not delete category.'; }
    });
  }

  load() {
    this.loading = true;
    this.feeService.get().subscribe({
      next: c => {
        this.config = c;
        this.form = {
        commissionRate: c.commissionRate,
        minFee: c.minFee,
        maxFee: c.maxFee,
        vatInclusive: c.vatInclusive,
        vatRate: c.vatRate,
        deliveryBaseFee: c.deliveryBaseFee ?? 350,
        deliveryFreeRadiusKm: c.deliveryFreeRadiusKm ?? 50,
        deliveryRatePerKm: c.deliveryRatePerKm ?? 15
      };
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.error = err?.error?.message || 'Could not load platform fee configuration.';
      }
    });
  }

  save() {
    this.error = '';
    this.successMessage = '';
    if (this.form.maxFee < this.form.minFee) {
      this.error = 'Maximum fee must be greater than or equal to minimum fee.';
      return;
    }
    this.saving = true;
    this.feeService.update(this.form).subscribe({
      next: c => {
        this.saving = false;
        this.config = c;
        this.successMessage = 'Platform fee configuration updated.';
      },
      error: err => {
        this.saving = false;
        this.error = err?.error?.message || 'Could not update fee configuration.';
      }
    });
  }

  loadTiers() {
    this.tiersLoading = true;
    this.feeService.getDiscountTiers().subscribe({
      next: tiers => { this.tiers = tiers ?? []; this.tiersLoading = false; },
      error: err => {
        this.tiersLoading = false;
        this.tierError = err?.error?.message || 'Could not load discount tiers.';
      }
    });
  }

  resetTierForm() {
    this.editingTierId = null;
    this.tierForm = { categoryID: null, minDays: 1, maxDays: null, discountPercent: 0 };
    this.tierError = '';
  }

  editTier(t: DiscountTierDto) {
    this.editingTierId = t.discountTierID;
    this.tierForm = {
      categoryID: t.categoryID ?? null,
      minDays: t.minDays,
      maxDays: t.maxDays ?? null,
      discountPercent: t.discountPercent
    };
    this.tierError = '';
    this.tierSuccess = '';
  }

  saveTier() {
    this.tierError = '';
    this.tierSuccess = '';
    if (this.tierForm.minDays < 1) {
      this.tierError = 'Minimum days must be at least 1.';
      return;
    }
    if (this.tierForm.maxDays != null && this.tierForm.maxDays < this.tierForm.minDays) {
      this.tierError = 'Maximum days must be greater than or equal to minimum days.';
      return;
    }
    if (this.tierForm.discountPercent < 0 || this.tierForm.discountPercent > 100) {
      this.tierError = 'Discount percent must be between 0 and 100.';
      return;
    }

    const payload: UpsertDiscountTierDto = {
      categoryID: this.tierForm.categoryID || null,
      minDays: this.tierForm.minDays,
      maxDays: this.tierForm.maxDays,
      discountPercent: this.tierForm.discountPercent
    };

    this.tierSaving = true;
    const req = this.editingTierId
      ? this.feeService.updateDiscountTier(this.editingTierId, payload)
      : this.feeService.createDiscountTier(payload);

    req.subscribe({
      next: () => {
        this.tierSaving = false;
        this.tierSuccess = this.editingTierId ? 'Discount tier updated.' : 'Discount tier created.';
        this.resetTierForm();
        this.loadTiers();
      },
      error: err => {
        this.tierSaving = false;
        this.tierError = err?.error?.message || 'Could not save discount tier.';
      }
    });
  }

  deleteTier(t: DiscountTierDto) {
    if (!confirm(`Delete tier ${t.minDays}–${t.maxDays ?? '+'} days (${t.discountPercent}%)?`)) return;
    this.feeService.deleteDiscountTier(t.discountTierID).subscribe({
      next: () => {
        this.tierSuccess = 'Discount tier deleted.';
        if (this.editingTierId === t.discountTierID) this.resetTierForm();
        this.loadTiers();
      },
      error: err => { this.tierError = err?.error?.message || 'Could not delete discount tier.'; }
    });
  }

  daysLabel(t: DiscountTierDto): string {
    return t.maxDays == null ? `${t.minDays}+ days` : `${t.minDays}–${t.maxDays} days`;
  }
}
