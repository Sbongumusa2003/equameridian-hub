import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ListingService } from '../../../core/services/listing.service';
import { CategoryService, CategoryDto } from '../../../core/services/category.service';
import { ListingDto } from '../../../core/models/listing.models';

@Component({
  selector: 'app-admin-listings',
  templateUrl: './admin-listings.component.html',
  styleUrls: ['./admin-listings.component.scss'],
  standalone: false,
})
export class AdminListingsComponent implements OnInit, OnDestroy {
  listings: ListingDto[] = [];
  categories: CategoryDto[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 10;
  search = '';
  categoryFilter: number | undefined;
  statusFilter = '';
  loading = false;

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;

  constructor(
    private listingService: ListingService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.categoryService.getAll().subscribe(cats => this.categories = cats);

    this.searchSub = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(value => {
      this.search = value;
      this.page = 1;
      this.load();
    });

    this.load();
  }

  ngOnDestroy() { this.searchSub?.unsubscribe(); }

  onSearch(value: string) { this.searchSubject.next(value); }

  load(): void {
    this.loading = true;
    this.listingService.adminGetAll({
      search:   this.search,
      category: this.categoryFilter,
      status:   this.statusFilter,
      page:     this.page,
      pageSize: this.pageSize
    }).subscribe(res => {
      this.listings   = res.listings ?? [];
      this.totalCount = res.totalCount;
      this.loading    = false;
    });
  }

  getCategoryName(id: number): string {
    return this.categories.find(c => c.categoryID === id)?.name ?? String(id);
  }

  get totalPages(): number { return Math.ceil(this.totalCount / this.pageSize); }
}