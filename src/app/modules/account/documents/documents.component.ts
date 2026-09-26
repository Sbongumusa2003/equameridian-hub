import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { DocumentService, DocumentDto, DocumentTypeDto } from '../../../core/services/document.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss'],
  standalone: false,
})
export class DocumentsComponent implements OnInit {
  documents: DocumentDto[] = [];
  documentTypes: DocumentTypeDto[] = [];
  loading = true;
  error = '';

  selectedTypeId: number | null = null;
  selectedFile: File | null = null;
  uploading = false;
  uploadSuccess = '';
  uploadError = '';
  replacingDocId: number | null = null;
  replaceFile: File | null = null;
  replacing = false;
  replaceSuccess = '';
  replaceError = '';

  @ViewChild('uploadFileInput') uploadFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('replaceFileInput') replaceFileInput!: ElementRef<HTMLInputElement>;

  constructor(private docService: DocumentService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.docService.getDocumentTypes().subscribe(types => {
      this.documentTypes = types;
      this.docService.getMyDocuments().subscribe({
        next: docs => { this.documents = docs; this.loading = false; },
        error: () => { this.error = 'Failed to load documents.'; this.loading = false; }
      });
    });
  }

  getTypeName(typeId: number): string {
    return this.documentTypes.find(t => t.docTypeID === typeId)?.typeName ?? String(typeId);
  }

  isTypeRequired(typeId: number): boolean {
    return this.documentTypes.find(t => t.docTypeID === typeId)?.isRequired ?? false;
  }

  get missingRequiredTypes() {
    const uploadedTypeIds = new Set(this.documents.map(d => d.docTypeID));
    return this.documentTypes.filter(t => t.isRequired && !uploadedTypeIds.has(t.docTypeID));
  }

  get missingRequiredTypeNames(): string {
    return this.missingRequiredTypes.map(t => t.typeName).join(', ');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    this.uploadError = '';
  }

  upload(): void {
    if (!this.selectedTypeId) {
      this.uploadError = 'Please select a document type.';
      return;
    }
    if (!this.selectedFile) {
      this.uploadError = 'Please select a file to upload.';
      return;
    }

    this.uploading = true;
    this.uploadError = '';
    this.uploadSuccess = '';

    this.docService.uploadDocument(this.selectedTypeId, this.selectedFile).subscribe({
      next: () => {
        this.uploadSuccess = 'Document successfully added.';
        this.selectedFile = null;
        this.selectedTypeId = null;
        if (this.uploadFileInput) this.uploadFileInput.nativeElement.value = '';
        this.uploading = false;
        this.load();
        setTimeout(() => this.uploadSuccess = '', 5000);
      },
      error: (err) => {
        this.uploadError = err.error?.message ?? 'Upload failed. Please try again.';
        this.uploading = false;
      }
    });
  }
  startReplace(docId: number): void {
    this.replacingDocId = docId;
    this.replaceFile = null;
    this.replaceError = '';
    this.replaceSuccess = '';
    setTimeout(() => this.replaceFileInput?.nativeElement.click(), 100);
  }

  onReplaceFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.replaceFile = input.files?.[0] ?? null;
    if (this.replaceFile && this.replacingDocId !== null) {
      this.submitReplace();
    }
  }

  submitReplace(): void {
    if (!this.replaceFile || this.replacingDocId === null) {
      this.replaceError = 'Please add a document.';
      return;
    }

    this.replacing = true;
    this.replaceError = '';
    this.replaceSuccess = '';

    this.docService.replaceDocument(this.replacingDocId, this.replaceFile).subscribe({
      next: () => {
        this.replaceSuccess = 'Document successfully replaced.';
        this.replacingDocId = null;
        this.replaceFile = null;
        if (this.replaceFileInput) this.replaceFileInput.nativeElement.value = '';
        this.replacing = false;
        this.load();
        setTimeout(() => this.replaceSuccess = '', 5000);
      },
      error: (err) => {
        this.replaceError = err.error?.message ?? 'Replace failed. Please try again.';
        this.replacing = false;
      }
    });
  }


  /** Absolute URL for viewing/downloading an uploaded document (static /uploads path). */
  fileUrl(doc: DocumentDto): string {
    if (!doc?.filePath) return '#';
    const path = doc.filePath.startsWith('/') ? doc.filePath : `/${doc.filePath}`;
    // apiUrl ends with /api — strip it so /uploads is served from the API host root.
    const base = (environment.apiUrl || '').replace(/\/api\/?$/, '');
    return `${base}${path}`;
  }

  cancelReplace(): void {
    this.replacingDocId = null;
    this.replaceFile = null;
    this.replaceError = '';
  }
}