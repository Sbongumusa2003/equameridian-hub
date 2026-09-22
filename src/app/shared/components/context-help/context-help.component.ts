import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { HelpService } from '../../../core/services/help.service';

/**
 * Small "?" control dropped onto individual screens for per-screen/function help (rubric:
 * "extensive context-sensitive help"), as opposed to the single full Help document (HelpComponent).
 * Looks its tip up by `topic` from HelpService.contextTips so content lives in one place and stays
 * in sync with the full document it links out to.
 */
@Component({
  selector: 'app-context-help',
  template: `
    <span class="context-help" (mouseenter)="open = true" (mouseleave)="open = false">
      <button type="button" class="context-help__trigger" (click)="goToFullHelp()" [attr.aria-expanded]="open" aria-label="Go to help for this screen">?</button>
      <div class="context-help__popover" *ngIf="open">
        <p>{{ tip.text }}</p>
	<a *ngIf="tip.sectionId" (click)="goToFullHelp()">Read more in Help &rsaquo;</a>
      </div>
    </span>
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; vertical-align: middle; line-height: 1; }
    .context-help { position: relative; display: inline-flex; align-items: center; margin: 0; }
    .context-help__trigger {
      width: 22px; height: 22px; border-radius: 50%;
      border: 1px solid var(--color-border-strong); background: var(--color-surface-alt);
      color: var(--color-text-secondary); font-size: 12px; font-weight: 600; line-height: 1;
      cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
      padding: 0; flex-shrink: 0;
    }
    .context-help__trigger:hover { border-color: var(--color-primary); color: var(--color-primary); }
    .context-help__popover {
      position: absolute; z-index: 40; top: calc(100% + 6px); left: 0; width: 260px;
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); box-shadow: var(--shadow-md);
      padding: 10px 12px; font-size: 12px; line-height: 1.4; color: var(--color-text);
      text-align: left; white-space: normal;
    }
    .context-help__popover a { display: inline-block; margin-top: 6px; font-size: 12px; color: var(--color-primary); cursor: pointer; }
  `],
  standalone: false,
})
export class ContextHelpComponent {
  @Input() topic!: string;
  open = false;

  constructor(private help: HelpService, private router: Router) {}

  get tip() { return this.help.contextTips[this.topic]; }

  goToFullHelp() {
    this.open = false;
    this.router.navigate(['/account/help'], { queryParams: { section: this.tip?.sectionId } });
  }
}
