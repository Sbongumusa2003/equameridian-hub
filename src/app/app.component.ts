import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription, filter, map, mergeMap } from 'rxjs';
import { IdleTimeoutService, IdleWarningState } from './core/services/idle-timeout.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'EquaMeridian Hub';
  warning: IdleWarningState = { visible: false, secondsLeft: 30 };
  private sub?: Subscription;
  private titleSub?: Subscription;

  constructor(
    private idle: IdleTimeoutService,
    private titleService: Title,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.idle.start();
    this.sub = this.idle.warning$.subscribe(w => (this.warning = w));

    this.titleSub = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => {
        let r = this.route;
        while (r.firstChild) r = r.firstChild;
        return r;
      }),
      mergeMap(r => r.data)
    ).subscribe(data => {
      const page = data['title'] as string | undefined;
      this.titleService.setTitle(page ? `${page} · EquaMeridian Hub` : 'EquaMeridian Hub');
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.titleSub?.unsubscribe();
  }

  staySignedIn() {
    this.idle.staySignedIn();
  }
}
