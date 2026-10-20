import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-icon',
  template: `
    <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true" class="app-icon">
      <ng-container [ngSwitch]="name">
        <g *ngSwitchCase="'search'"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></g>
        <g *ngSwitchCase="'cart'"><circle cx="9" cy="20" r="1.25"/><circle cx="17" cy="20" r="1.25"/><path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.1h7.2a1.5 1.5 0 0 0 1.5-1.2L20 8H6"/></g>
        <g *ngSwitchCase="'bell'"><path d="M6 9a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21a2 2 0 0 0 4 0"/></g>
        <g *ngSwitchCase="'user'"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></g>
        <g *ngSwitchCase="'heart'"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></g>
        <g *ngSwitchCase="'heart-outline'"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></g>
        <g *ngSwitchCase="'equipment'"><path d="M4 18h16"/><path d="M6 18V9l4-4h4l4 4v9"/><path d="M10 18v-4h4v4"/></g>
        <g *ngSwitchCase="'x'"><path d="M6 6l12 12M18 6 6 18"/></g>
        <g *ngSwitchCase="'check'"><path d="M5 13l4 4L19 7"/></g>
        <g *ngSwitchCase="'help'"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4"/><path d="M12 17h.01"/></g>
        <g *ngSwitchCase="'log-out'"><path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5"/><path d="M15 8l4 4-4 4"/><path d="M19 12H9"/></g>
        <g *ngSwitchCase="'menu'"><path d="M4 7h16M4 12h16M4 17h16"/></g>
        <g *ngSwitchCase="'plus'"><path d="M12 5v14M5 12h14"/></g>
        <g *ngSwitchCase="'chevron-down'"><path d="m6 9 6 6 6-6"/></g>
        <g *ngSwitchCase="'star'"><path d="M12 3l2.5 6.5L21 10l-5 4.2 1.5 6.3L12 17.3 6.5 20.5 8 14.2 3 10l6.5-.5L12 3z"/></g>
        <g *ngSwitchDefault><circle cx="12" cy="12" r="9"/></g>
      </ng-container>
    </svg>
  `,
  styles: [`:host{display:inline-flex;align-items:center;justify-content:center;line-height:0}.app-icon{display:block;flex-shrink:0}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class IconComponent {
  @Input() name = 'help';
  @Input() size: number | string = 20;
}
