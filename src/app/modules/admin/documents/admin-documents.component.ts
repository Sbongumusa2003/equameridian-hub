import { Component, OnInit } from '@angular/core';
import { DocumentService, DocumentReviewListItemDto, DocumentReviewDetailDto } from '../../../core/services/document.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-documents',
  templateUrl: './admin-documents.component.html',
  styleUrls: ['./admin-documents.component.scss'],
  standalone: false,
})
export class AdminDocumentsComponent implements OnInit {
  documents: DocumentReviewListItemDto[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 10;
  statusFilter = 'Pending';
  loading = false;

  reviewingDocId: number | null = null;
  message = '';
  error = '';

  // The API serves uploaded files as static content off the host root, not under /api.
  readonly fileBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');

  constructor(private documentService: DocumentService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.documentService.adminGetAll({
      status: this.statusFilter || undefined,
      page: this.page,
      pageSize: this.pageSize
    }).subscribe({
      next: res => {
        this.documents = res.documents ?? [];
        this.totalCount = res.totalCount;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onFilterChange() {
    this.page = 1;
    this.load();
  }

  viewDocument(docId: number) {
    this.documentService.adminGetById(docId).subscribe({
      next: (doc: DocumentReviewDetailDto) => {
        window.open(`${this.fileBaseUrl}${doc.filePath}`, '_blank');
      },
      error: () => { this.error = 'Could not open this document.'; }
    });
  }

  review(docId: number, decision: 'Accepted' | 'Rejected') {
    this.reviewingDocId = docId;
    this.message = '';
    this.error = '';

    this.documentService.adminReview(docId, decision).subscribe({
      next: (res: any) => {
        this.reviewingDocId = null;
        this.message = res?.accountActivated
          ? `Document ${decision.toLowerCase()}. The supplier's account has been activated and they can now log in.`
          : `Document ${decision.toLowerCase()}.`;
        this.load();
      },
      error: err => {
        this.reviewingDocId = null;
        this.error = err?.error?.message ?? 'Could not review this document. Please try again.';
      }
    });
  }

  get totalPages(): number { return Math.ceil(this.totalCount / this.pageSize); }
}
