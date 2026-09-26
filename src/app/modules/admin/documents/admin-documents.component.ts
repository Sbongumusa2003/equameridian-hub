import { Component, OnInit } from '@angular/core';
import { DocumentService, DocumentReviewListItemDto } from '../../../core/services/document.service';

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
    this.error = '';
    this.documentService.adminDownloadFile(docId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: () => { this.error = 'Could not open this document. It may be missing or still uploading.'; }
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
