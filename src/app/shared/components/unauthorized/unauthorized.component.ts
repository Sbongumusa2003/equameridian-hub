import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="unauthorized-page">
      <h1>403</h1>
      <h2>Access Denied</h2>
      <p>You don't have permission to view this page.</p>
      <button class="btn btn--primary" (click)="goHome()">Go to my dashboard</button>
    </div>
  `,
  styles: [`
    .unauthorized-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
      gap: 0.5rem;
    }
    h1 { font-size: 4rem; margin: 0; }
  `]
})
export class UnauthorizedComponent {
  constructor(private auth: AuthService) {}

  goHome(): void {
    this.auth.redirectByRole();
  }
}
