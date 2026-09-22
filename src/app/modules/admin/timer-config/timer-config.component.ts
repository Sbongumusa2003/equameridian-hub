import { Component, OnInit } from '@angular/core';
import { TimerConfigService } from '../../../core/services/timer-config.service';
import { IdleTimeoutService } from '../../../core/services/idle-timeout.service';
import { TimerConfigurationDto } from '../../../core/models/timer-config.models';

@Component({
  selector: 'app-admin-timer-config',
  templateUrl: './timer-config.component.html',
  styleUrls: ['./timer-config.component.scss'],
  standalone: false,
})
export class AdminTimerConfigComponent implements OnInit {
  config: TimerConfigurationDto | null = null;
  loading = false;
  saving = false;
  running = false;
  error = '';
  message = '';

  form = { intervalMinutes: 15, quoteExpiryHours: 48, sessionIdleMinutes: 30, isEnabled: true };

  constructor(
    private timerConfigService: TimerConfigService,
    private idle: IdleTimeoutService
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.timerConfigService.get().subscribe({
      next: cfg => {
        this.config = cfg;
        this.form = {
          intervalMinutes: cfg.intervalMinutes,
          quoteExpiryHours: cfg.quoteExpiryHours,
          sessionIdleMinutes: cfg.sessionIdleMinutes || 30,
          isEnabled: cfg.isEnabled
        };
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  save() {
    this.saving = true;
    this.error = '';
    this.message = '';
    this.timerConfigService.update(this.form).subscribe({
      next: cfg => {
        this.saving = false;
        this.config = cfg;
        this.idle.applyMinutes(this.form.sessionIdleMinutes);
        this.idle.refreshFromServer();
        this.message = 'Saved. Idle logout is now ' + this.form.sessionIdleMinutes + ' minutes for every user.';
      },
      error: err => {
        this.saving = false;
        this.error = err?.error?.message ?? 'Could not save the configuration.';
      }
    });
  }

  runNow() {
    this.running = true;
    this.error = '';
    this.message = '';
    this.timerConfigService.runNow().subscribe({
      next: res => {
        this.running = false;
        this.message = `Ran successfully — ${res.expiredCount} quote(s) expired.`;
        this.load();
      },
      error: err => {
        this.running = false;
        this.error = err?.error?.message ?? 'Could not run the job now.';
      }
    });
  }
}