import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CampaignService } from '../../../../core/services/campaign.service';
import { ListingService } from '../../../../core/services/listing.service';
import { CampaignTypes, CampaignAudiences, CampaignStatuses } from '../../../../core/models/campaign.models';
import { ListingDto } from '../../../../core/models/listing.models';

@Component({
  selector: 'app-campaign-form',
  templateUrl: './campaign-form.component.html',
  styleUrls: ['./campaign-form.component.scss'],
  standalone: false,
})
export class CampaignFormComponent implements OnInit {
  isEdit = false;
  campaignId: number | null = null;
  loading = false;
  saving = false;
  error = '';
  uploadingBanner = false;
  bannerUploadMsg = '';

  campaignTypes = CampaignTypes;
  campaignAudiences = CampaignAudiences;
  campaignStatuses = CampaignStatuses;
  listingOptions: ListingDto[] = [];

  form = {
    name: '', type: 'Banner', description: '', audience: 'All',
    startDate: '', endDate: '', status: 'Draft',
    bannerImageURL: '', discountValue: null as number | null,
    discountCode: '', featuredListingID: null as number | null
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campaignService: CampaignService,
    private listingService: ListingService
  ) {}

  ngOnInit() {
    this.listingService.adminGetAll({ status: 'Active', page: 1, pageSize: 100 })
      .subscribe(res => this.listingOptions = res.listings ?? []);

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.campaignId = Number(idParam);
      this.loading = true;
      this.campaignService.getById(this.campaignId).subscribe(c => {
        this.form = {
          name: c.name, type: c.type, description: c.description, audience: c.audience,
          startDate: c.startDate?.substring(0, 10), endDate: c.endDate?.substring(0, 10),
          status: c.status, bannerImageURL: c.bannerImageURL ?? '',
          discountValue: c.discountValue ?? null, discountCode: c.discountCode ?? '',
          featuredListingID: c.featuredListingID ?? null
        };
        this.loading = false;
      });
    }
  }

  get isBanner() { return this.form.type === 'Banner'; }
  get isDiscount() { return this.form.type === 'Discount Code'; }
  get isFeatured() { return this.form.type === 'Featured Listing'; }

  save(saveAsDraft: boolean) {
    this.error = '';
    if (!this.form.name.trim() || !this.form.description.trim() || !this.form.startDate || !this.form.endDate) {
      this.error = 'Please complete all required fields.';
      return;
    }
    if (new Date(this.form.endDate) <= new Date(this.form.startDate)) {
      this.error = 'End date must be after start date.';
      return;
    }
    if (this.isDiscount) {
      const code = (this.form.discountCode || '').trim().toUpperCase();
      if (!code || code.length < 3) {
        this.error = 'Discount campaigns need a promo code (at least 3 characters) that contractors enter at checkout.';
        return;
      }
      if (this.form.discountValue == null || this.form.discountValue <= 0 || this.form.discountValue > 100) {
        this.error = 'Enter a discount percentage between 1 and 100.';
        return;
      }
      this.form.discountCode = code;
    }

    this.saving = true;
    if (this.isEdit && this.campaignId) {
      this.campaignService.update(this.campaignId, {
        name: this.form.name, description: this.form.description, audience: this.form.audience,
        startDate: this.form.startDate, endDate: this.form.endDate, status: this.form.status,
        bannerImageURL: this.form.bannerImageURL || undefined,
        discountValue: this.form.discountValue ?? undefined,
        discountCode: this.form.discountCode || undefined,
        featuredListingID: this.form.featuredListingID ?? undefined
      }).subscribe({
        next: () => this.router.navigate(['/admin/campaigns']),
        error: err => {
          this.saving = false;
          this.error = err?.error?.message || 'Could not update campaign.';
        }
      });
    } else {
      this.campaignService.create({
        name: this.form.name, type: this.form.type, description: this.form.description,
        audience: this.form.audience, startDate: this.form.startDate, endDate: this.form.endDate,
        saveAsDraft,
        bannerImageURL: this.form.bannerImageURL || undefined,
        discountValue: this.form.discountValue ?? undefined,
        discountCode: this.form.discountCode || undefined,
        featuredListingID: this.form.featuredListingID ?? undefined
      }).subscribe({
        next: () => this.router.navigate(['/admin/campaigns']),
        error: err => {
          this.saving = false;
          this.error = err?.error?.message || 'Could not create campaign.';
        }
      });
    }
  }

  cancel() { this.router.navigate(['/admin/campaigns']); }

  onBannerSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadingBanner = true;
    this.bannerUploadMsg = '';
    this.campaignService.uploadBanner(file).subscribe({
      next: res => {
        this.form.bannerImageURL = res.url;
        this.uploadingBanner = false;
        this.bannerUploadMsg = 'Banner uploaded.';
      },
      error: err => {
        this.uploadingBanner = false;
        this.bannerUploadMsg = err?.error?.message || 'Upload failed.';
      }
    });
  }
}
