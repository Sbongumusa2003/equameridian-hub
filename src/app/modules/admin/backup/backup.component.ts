import { Component, OnInit } from '@angular/core';
import { BackupService } from '../../../core/services/backup.service';
import { BackupFileDto } from '../../../core/models/backup.models';

@Component({
  selector: 'app-admin-backup',
  templateUrl: './backup.component.html',
  styleUrls: ['./backup.component.scss'],
  standalone: false,
})
export class AdminBackupComponent implements OnInit {
  backups: BackupFileDto[] = [];
  loading = false;
  creating = false;
  error = '';
  message = '';

  restoreTarget: BackupFileDto | null = null;
  restoreConfirmText = '';
  restoring = false;

  constructor(private backupService: BackupService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';
    this.backupService.list().subscribe({
      next: backups => { this.backups = backups ?? []; this.loading = false; },
      error: err => {
        this.loading = false;
        this.backups = [];
        this.error = err?.error?.message
          || (err?.status === 403
            ? 'You do not have permission to manage backups.'
            : 'Could not load backups. Check that the API is running and Backup:Directory is configured.');
      }
    });
  }

  createBackup() {
    this.creating = true;
    this.error = '';
    this.message = '';
    this.backupService.create().subscribe({
      next: backup => {
        this.creating = false;
        this.message = `Backup "${backup.fileName}" created.`;
        this.load();
      },
      error: err => {
        this.creating = false;
        this.error = err?.error?.message
          || (err?.status === 403
            ? 'You do not have permission to create backups.'
            : 'Could not create a backup. Ensure SQL Server allows BACKUP and Backup:Directory is writable.');
      }
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  openRestore(backup: BackupFileDto) {
    this.restoreTarget = backup;
    this.restoreConfirmText = '';
    this.error = '';
  }

  closeRestore() {
    this.restoreTarget = null;
  }

  confirmRestore() {
    if (!this.restoreTarget || this.restoreConfirmText !== this.restoreTarget.fileName) return;
    this.restoring = true;
    this.error = '';
    this.backupService.restore({ fileName: this.restoreTarget.fileName, confirmOverride: true }).subscribe({
      next: () => {
        this.restoring = false;
        this.message = `Database restored from "${this.restoreTarget?.fileName}".`;
        this.restoreTarget = null;
      },
      error: err => {
        this.restoring = false;
        this.error = err?.error?.message ?? 'Could not restore from this backup.';
      }
    });
  }
}
