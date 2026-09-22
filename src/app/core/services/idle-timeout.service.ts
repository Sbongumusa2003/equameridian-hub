import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { TimerConfigService } from './timer-config.service';

const DEFAULT_MINUTES = 30;
const STORAGE_KEY = 'em.sessionIdleMinutes';
const ACTIVITY_KEY = 'em.lastActivityAt';
const WARN_SECONDS = 30;

export interface IdleWarningState {
  visible: boolean;
  secondsLeft: number;
}

@Injectable({ providedIn: 'root' })
export class IdleTimeoutService {
  private started = false;
  private minutes = DEFAULT_MINUTES;
  private lastActivity = Date.now();
  private tick: ReturnType<typeof setInterval> | null = null;
  private loggingOut = false;
  private warningVisible = false;

  readonly warning$ = new BehaviorSubject<IdleWarningState>({ visible: false, secondsLeft: WARN_SECONDS });

  constructor(
    private auth: AuthService,
    private zone: NgZone,
    private timers: TimerConfigService
  ) {}

  start(): void {
    if (this.started) return;
    this.started = true;

    const stored = Number(localStorage.getItem(STORAGE_KEY));
    if (stored >= 1 && stored <= 480) this.minutes = stored;

    const bump = () => this.markActivity();
    ['click', 'keydown', 'mousemove', 'mousedown', 'scroll', 'touchstart', 'touchmove'].forEach(ev =>
      window.addEventListener(ev, bump, { passive: true })
    );
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.checkIdle();
    });
    window.addEventListener('storage', ev => {
      if (ev.key === STORAGE_KEY && ev.newValue) {
        const n = Number(ev.newValue);
        if (n >= 1 && n <= 480) this.minutes = n;
      }
    });

    this.auth.currentUser$.subscribe(u => {
      if (u) {
        this.markActivity();
        this.refreshFromServer();
      } else {
        this.hideWarning();
      }
    });

    this.refreshFromServer();
    this.zone.runOutsideAngular(() => {
      this.tick = setInterval(() => this.checkIdle(), 1000);
    });
  }

  applyMinutes(minutes: number): void {
    const n = Number(minutes);
    if (n >= 1 && n <= 480) {
      this.minutes = n;
      localStorage.setItem(STORAGE_KEY, String(n));
    }
  }

  refreshFromServer(): void {
    this.timers.getSessionSettings().subscribe({
      next: s => {
        const n = Number(s?.sessionIdleMinutes);
        if (n >= 1 && n <= 480) this.applyMinutes(n);
      },
      error: () => {}
    });
  }

  staySignedIn(): void {
    this.hideWarning();
    this.lastActivity = Date.now();
    try { localStorage.setItem(ACTIVITY_KEY, String(this.lastActivity)); } catch {}
  }

  private markActivity(): void {
    if (this.warningVisible) return;
    this.lastActivity = Date.now();
    try { localStorage.setItem(ACTIVITY_KEY, String(this.lastActivity)); } catch {}
  }

  private hideWarning(): void {
    if (!this.warningVisible && !this.warning$.value.visible) return;
    this.warningVisible = false;
    this.zone.run(() => this.warning$.next({ visible: false, secondsLeft: WARN_SECONDS }));
  }

  private checkIdle(): void {
    if (!this.auth.currentUser || this.loggingOut) {
      this.hideWarning();
      return;
    }
    const limitMs = this.minutes * 60 * 1000;
    if (limitMs < 1000) return;

    const idleMs = Date.now() - this.lastActivity;
    const remainingMs = limitMs - idleMs;
    const warnMs = Math.min(WARN_SECONDS * 1000, Math.floor(limitMs / 2));

    if (remainingMs <= 0) {
      this.loggingOut = true;
      this.hideWarning();
      this.zone.run(() => {
        this.auth.logout();
        this.loggingOut = false;
      });
      return;
    }

    if (remainingMs <= warnMs) {
      const secondsLeft = Math.max(1, Math.ceil(remainingMs / 1000));
      this.warningVisible = true;
      this.zone.run(() => this.warning$.next({ visible: true, secondsLeft }));
    } else if (this.warningVisible) {
      this.hideWarning();
    }
  }
}