import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="dialog-overlay" *ngIf="visible" (click)="onCancel()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <button class="dialog__close" (click)="onCancel()">✕</button>
        <div class="dialog__icon">
          <span [innerHTML]="icon"></span>
        </div>
        <h3 class="dialog__title">{{ title }}</h3>
        <p class="dialog__message">{{ message }}</p>
        <div class="dialog__card" *ngIf="detail">
          <strong>{{ detail.title }}</strong>
          <small>{{ detail.subtitle }}</small>
        </div>
        <p class="dialog__warning" *ngIf="warning">
          <span>⚠</span> {{ warning }}
        </p>
        <div class="dialog__actions">
          <button class="btn btn--ghost" (click)="onCancel()">Cancel</button>
          <button class="btn btn--danger" (click)="onConfirm()">{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./confirm-dialog.component.scss'],
  standalone: false,
})
export class ConfirmDialogComponent {
  @Input() visible = false;
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Input() icon = '⚠';
  @Input() confirmLabel = 'Confirm';
  @Input() warning?: string;
  @Input() detail?: { title: string; subtitle: string };
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm() { this.confirmed.emit(); }
  onCancel()  { this.cancelled.emit(); }
}