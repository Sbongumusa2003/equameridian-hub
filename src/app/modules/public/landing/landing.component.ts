import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import { CampaignService } from '../../../core/services/campaign.service';
import { CampaignDto } from '../../../core/models/campaign.models';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  standalone: false
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('reveal') revealEls!: QueryList<ElementRef<HTMLElement>>;

  private observer?: IntersectionObserver;

  /** Active Banner campaigns for the public promo strip. */
  banners: CampaignDto[] = [];
  activeBannerIndex = 0;

  readonly stats = [
    { value: '168+', label: 'Clients served' },
    { value: 'Lvl 1', label: 'B-BBEE status' },
    { value: '24/7', label: 'Platform support' },
    { value: 'SA', label: 'Built for South Africa' }
  ];

  readonly steps = [
    {
      step: '01',
      title: 'Browse the fleet',
      body: 'Explore verified plant and equipment listings with transparent rates, locations, and hire options.'
    },
    {
      step: '02',
      title: 'Quote or book',
      body: 'Request a quote for complex jobs, or book fixed-rate machinery directly when pricing is published.'
    },
    {
      step: '03',
      title: 'Secure the hire',
      body: 'Digital lease agreements, inspections, and payments keep every transaction auditable and protected.'
    },
    {
      step: '04',
      title: 'Deliver & return',
      body: 'Track fulfilment, condition reports, and off-hire — so disputes stay rare and resolution stays fair.'
    }
  ];

  readonly roles = [
    {
      tag: 'Contractors',
      title: 'Find the right machine, faster',
      points: [
        'Search by category, location, and rate',
        'Compare quotes side-by-side',
        'Book with clear terms and digital sign-off'
      ],
      cta: 'Browse machinery',
      link: '/browse',
      accent: 'gold'
    },
    {
      tag: 'Suppliers',
      title: 'List once. Reach real demand',
      points: [
        'Publish dry or wet hire packages',
        'Respond to quote requests in one place',
        'Track payouts, disputes, and utilisation'
      ],
      cta: 'Register as supplier',
      link: '/auth/register',
      accent: 'ember'
    }
  ];

  readonly features = [
    {
      icon: 'shield',
      title: 'Verified listings',
      body: 'Supplier onboarding and document checks keep the marketplace credible.'
    },
    {
      icon: 'doc',
      title: 'Digital lease flow',
      body: 'Master lease terms, booking agreements, and audit trails in one workflow.'
    },
    {
      icon: 'inspect',
      title: 'Inspection control',
      body: 'Admin and contractor inspection outcomes protect both sides of the hire.'
    },
    {
      icon: 'pay',
      title: 'Payments & payouts',
      body: 'Platform fees, invoices, and supplier payouts tracked with clarity.'
    },
    {
      icon: 'chart',
      title: 'Live reporting',
      body: 'Revenue, demand, and exception reports for operational decisions.'
    },
    {
      icon: 'lock',
      title: 'Role-based access',
      body: 'Admin, contractor, supplier, and custom internal roles with permissions.'
    }
  ];

  constructor(private campaigns: CampaignService) {}

  ngOnInit(): void {
    this.campaigns.getActive().subscribe({
      next: res => {
        this.banners = (res.campaigns || []).filter(c =>
          c.type === 'Banner' && !!c.bannerImageURL
        );
      },
      error: () => { this.banners = []; }
    });
  }

  nextBanner(): void {
    if (!this.banners.length) return;
    this.activeBannerIndex = (this.activeBannerIndex + 1) % this.banners.length;
  }

  prevBanner(): void {
    if (!this.banners.length) return;
    this.activeBannerIndex = (this.activeBannerIndex - 1 + this.banners.length) % this.banners.length;
  }

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.revealEls?.forEach(el => el.nativeElement.classList.add('is-visible'));
      return;
    }
    this.observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.observer?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    this.revealEls.forEach(ref => this.observer!.observe(ref.nativeElement));
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
