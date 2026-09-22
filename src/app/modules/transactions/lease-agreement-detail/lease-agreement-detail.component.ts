import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LeaseAgreementService } from '../../../core/services/lease-agreement.service';
import { AuthService } from '../../../core/services/auth.service';
import { JobDocumentService } from '../../../core/services/job-document.service';
import { LeaseAgreementDetailDto } from '../../../core/models/lease-agreement.models';
import { JobDocumentsPageDto, JobDocumentTypes, JobDocumentTypeLabels } from '../../../core/models/job-document.models';

@Component({
  selector: 'app-lease-agreement-detail',
  templateUrl: './lease-agreement-detail.component.html',
  styleUrls: ['./lease-agreement-detail.component.scss'],
  standalone: false,
})
export class LeaseAgreementDetailComponent implements OnInit {
  agreement: LeaseAgreementDetailDto | null = null;
  loading = true;
  processing = false;
  errorMessage = '';
  successMessage = '';

  showSignDialog = false;
  signForm = {
    acknowledgeTermsRead: false,
    acknowledgeLegallyBinding: false,
    fullName: ''
  };

  documentsPage: JobDocumentsPageDto | null = null;
  documentsLoading = false;
  documentsMessage: string | null = null;
  documentTypes = JobDocumentTypes;
  documentTypeLabels = JobDocumentTypeLabels;

  showUploadModal = false;
  uploadForm = { documentType: 'InspectionReport' };
  uploadFile: File | null = null;
  uploading = false;
  uploadError = '';

  constructor(
    private route: ActivatedRoute,
    private leaseAgreementService: LeaseAgreementService,
    private jobDocumentService: JobDocumentService,
    public auth: AuthService
  ) {}

  ngOnInit() { this.load(); }

  load() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;
    this.leaseAgreementService.getById(id).subscribe({
      next: agreement => {
        this.agreement = agreement;
        this.loading = false;
        this.signForm.fullName = this.auth.currentUser?.fullName ?? '';
        this.loadDocuments();
      },
      error: () => { this.loading = false; }
    });
  }

  loadDocuments() {
    if (!this.agreement) return;
    this.documentsLoading = true;
    this.jobDocumentService.getForAgreement(this.agreement.leaseAgreementID).subscribe({
      next: res => {
        this.documentsPage = res.page;
        this.documentsMessage = res.message ?? null;
        this.documentsLoading = false;
      },
      error: () => { this.documentsLoading = false; }
    });
  }

  get documentGroups() {
    if (!this.documentsPage) return [];
    return [
      { label: 'Inspection Reports', docs: this.documentsPage.inspectionReports },
      { label: 'Job Site Photos', docs: this.documentsPage.jobSitePhotos },
      { label: 'Delivery Documentation', docs: this.documentsPage.deliveryDocumentation },
      { label: 'Maintenance Records', docs: this.documentsPage.maintenanceRecords },
      { label: 'Other Documents', docs: this.documentsPage.otherDocuments }
    ].filter(g => g.docs && g.docs.length > 0);
  }

  viewDocument(id: number) {
    this.jobDocumentService.view(id).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
      },
      error: () => {
        this.errorMessage = 'Could not open this document. Please try again.';
      }
    });
  }

  downloadDocument(id: number, documentName?: string) {
    this.jobDocumentService.download(id).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = documentName || 'document';
        link.click();
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
      },
      error: () => {
        this.errorMessage = 'Could not download this document. Please try again.';
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  openUpload() {
    this.uploadForm = { documentType: 'InspectionReport' };
    this.uploadFile = null;
    this.uploadError = '';
    this.showUploadModal = true;
  }

  closeUpload() { this.showUploadModal = false; }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.uploadFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  submitUpload() {
    if (!this.agreement) return;
    if (!this.uploadFile) {
      this.uploadError = 'Please add a document.';
      return;
    }
    this.uploading = true;
    this.uploadError = '';
    this.jobDocumentService.upload(this.agreement.leaseAgreementID, this.uploadForm.documentType, this.uploadFile).subscribe({
      next: () => {
        this.uploading = false;
        this.showUploadModal = false;
        this.loadDocuments();
      },
      error: err => {
        this.uploading = false;
        this.uploadError = err?.error?.message || 'Could not upload document.';
      }
    });
  }

  get alreadySignedByMe(): boolean {
    if (!this.agreement) return false;
    return this.auth.role === 'supplier' ? this.agreement.supplierSigned : this.agreement.contractorSigned;
  }

  openSign() { this.showSignDialog = true; }

  submitSign() {
    if (!this.agreement) return;
    if (!this.signForm.acknowledgeTermsRead || !this.signForm.acknowledgeLegallyBinding || !this.signForm.fullName) {
      this.errorMessage = 'Please confirm both acknowledgements and enter your full name.';
      return;
    }
    this.processing = true;
    this.errorMessage = '';
    this.leaseAgreementService.sign(this.agreement.leaseAgreementID, {
      acknowledgeTermsRead: this.signForm.acknowledgeTermsRead,
      acknowledgeLegallyBinding: this.signForm.acknowledgeLegallyBinding,
      fullName: this.signForm.fullName
    }).subscribe({
      next: res => {
        this.processing = false;
        this.showSignDialog = false;
        this.successMessage = res.message;
        this.agreement = res.agreement;
      },
      error: err => {
        this.processing = false;
        this.errorMessage = err?.error?.message || 'Could not sign this agreement.';
      }
    });
  }

  downloadingPdf = false;

  downloadInvoicePdf() {
    const agreement = this.agreement;
    if (!agreement || this.downloadingPdf) return;
    this.downloadingPdf = true;
    this.leaseAgreementService.downloadInvoicePdf(agreement.leaseAgreementID).subscribe({
      next: blob => {
        this.downloadingPdf = false;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${agreement.agreementNumber || 'invoice'}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.downloadingPdf = false;
        this.errorMessage = 'Could not generate the invoice PDF. Please try again.';
      }
    });
  }
}