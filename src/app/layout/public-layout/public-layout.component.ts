import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-public-layout',
  templateUrl: './public-layout.component.html',
  styleUrls: ['./public-layout.component.scss'],
  standalone: false,
})
export class PublicLayoutComponent {
  currentYear = new Date().getFullYear();
  isHome = true;

  constructor(public auth: AuthService, private router: Router) {
    this.isHome = this.router.url === '/' || this.router.url === '';
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => {
        this.isHome = e.urlAfterRedirects === '/' || e.urlAfterRedirects === '';
      });
  }
}
