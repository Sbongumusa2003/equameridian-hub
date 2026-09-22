import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  template: `
    <span class="badge" [ngClass]="'badge--' + status.toLowerCase().split(' ').join('')">
      <span class="badge__dot" *ngIf="showDot"></span>
      {{ status }}
    </span>
  `,
  styleUrls: ['./status-badge.component.scss'],
  standalone: false,
})
export class StatusBadgeComponent {
  @Input() status: string = '';
  @Input() showDot = true;
}