import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { DocumentTypeDto } from '../../../core/services/document.service';

export interface PendingDocument {
  docTypeId: number | null;
  file: File | null;
  previewUrl: string | null;
  error: string | null;
}

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB — keep in sync with backend DocumentUploadPolicy

@Component({
  selector: 'app-document-upload-widget',
  templateUrl: './document-upload-widget.component.html',
  styleUrls: ['./document-upload-widget.component.scss'],
  standalone: false,
})
export class DocumentUploadWidgetComponent implements OnChanges, OnDestroy {
  @Input() documentTypes: DocumentTypeDto[] = [];
  @Input() disabled = false;
  /** 0-100 while the parent's HTTP request is in flight, null otherwise */
  @Input() progress: number | null = null;
  @Input() submitted = false;

  @Output() documentsChange = new EventEmitter<PendingDocument[]>();

  rows: PendingDocument[] = [{ docTypeId: null, file: null, previewUrl: null, error: null }];
  dragActiveIndex: number | null = null;
  dragActiveNewRow = false;

  ngOnChanges(changes: SimpleChanges): void {
    // If document types arrive after the widget was already rendered, nothing else to do —
    // the dropdowns bind directly to documentTypes.
  }

  ngOnDestroy(): void {
    this.rows.forEach(r => this.revokePreview(r));
  }

  get requiredTypes(): DocumentTypeDto[] {
    return this.documentTypes.filter(t => t.isRequired);
  }

  isTypeCovered(typeId: number): boolean {
    return this.rows.some(r => r.docTypeId === typeId && r.file && !r.error);
  }

  get missingRequiredCount(): number {
    return this.requiredTypes.filter(t => !this.isTypeCovered(t.docTypeID)).length;
  }

  /** Types available for a given row's dropdown: not already picked in another row */
  availableTypesFor(index: number): DocumentTypeDto[] {
    const usedElsewhere = new Set(
      this.rows.filter((_, i) => i !== index && this.rows[i].docTypeId !== null).map(r => r.docTypeId)
    );
    return this.documentTypes.filter(t => !usedElsewhere.has(t.docTypeID));
  }

  hasAnyValidDocument(): boolean {
    return this.rows.some(r => r.file && r.docTypeId && !r.error);
  }

  addRow(): void {
    this.rows.push({ docTypeId: null, file: null, previewUrl: null, error: null });
  }

  removeRow(index: number): void {
    this.revokePreview(this.rows[index]);
    this.rows.splice(index, 1);
    if (this.rows.length === 0) this.addRow();
    this.emitChange();
  }

  onDocTypeSelected(event: Event, index: number): void {
    const value = (event.target as HTMLSelectElement).value;
    this.rows[index].docTypeId = value ? Number(value) : null;
    this.emitChange();
  }

  onFileSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : null;
    this.assignFile(index, file);
    input.value = ''; // allow re-selecting the same file after removal
  }

  onRowDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.disabled) return;
    this.dragActiveIndex = index;
  }

  onRowDragLeave(index: number): void {
    if (this.dragActiveIndex === index) this.dragActiveIndex = null;
  }

  onRowDrop(event: DragEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragActiveIndex = null;
    if (this.disabled) return;
    const file = event.dataTransfer?.files?.[0] ?? null;
    if (file) this.assignFile(index, file);
  }

  /** Drop zone shown after the last row: drops go into a freshly-added row */
  onNewRowDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.disabled) return;
    this.dragActiveNewRow = true;
  }

  onNewRowDragLeave(): void {
    this.dragActiveNewRow = false;
  }

  onNewRowDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragActiveNewRow = false;
    if (this.disabled) return;
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    // Fill the last empty row first, then create new rows for any extra files dropped at once.
    for (let i = 0; i < files.length; i++) {
      let targetIndex = this.rows.findIndex(r => !r.file);
      if (targetIndex === -1) {
        this.addRow();
        targetIndex = this.rows.length - 1;
      }
      this.assignFile(targetIndex, files[i]);
    }
  }

  private assignFile(index: number, file: File | null): void {
    const row = this.rows[index];
    this.revokePreview(row);
    row.file = file;
    row.previewUrl = null;
    row.error = null;

    if (!file) {
      this.emitChange();
      return;
    }

    const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      row.error = 'Unsupported format. Use PDF, JPG, or PNG.';
      row.file = null;
      this.emitChange();
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      row.error = `File is too large (max 10MB).`;
      row.file = null;
      this.emitChange();
      return;
    }

    if (/\.(jpg|jpeg|png)$/i.test(file.name)) {
      row.previewUrl = URL.createObjectURL(file);
    }

    // Auto-fill the document type if there's exactly one required type still missing
    // and this row hasn't been assigned a type yet — saves a click in the common case.
    if (row.docTypeId === null) {
      const stillMissing = this.requiredTypes.filter(t => !this.isTypeCovered(t.docTypeID));
      if (stillMissing.length === 1) {
        row.docTypeId = stillMissing[0].docTypeID;
      }
    }

    this.emitChange();
  }

  private revokePreview(row: PendingDocument): void {
    if (row.previewUrl) {
      URL.revokeObjectURL(row.previewUrl);
      row.previewUrl = null;
    }
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private emitChange(): void {
    this.documentsChange.emit(this.rows);
  }
}
