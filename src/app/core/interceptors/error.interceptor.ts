import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler,
  HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { SUPPRESS_403_REDIRECT } from '../http-context-tokens';

const PRE_SESSION_PATHS = ['/auth/login', '/auth/verify-otp', '/auth/resend-otp', '/auth/register'];

const PUBLIC_API_FRAGMENTS = [
  '/contractor/listings',
  '/categories',
  '/campaigns/active',
  '/listings/',
  '/service-areas',
  '/promo',
  '/chatbot'
];

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        const isPreSessionCall = PRE_SESSION_PATHS.some(path => req.url.includes(path));
        const isPublicApi = PUBLIC_API_FRAGMENTS.some(frag => req.url.includes(frag));

        if (err.status === 401 && !isPreSessionCall && !isPublicApi) {
          if (this.auth.isLoggedIn) {
            this.auth.logout();
          }
        } else if (err.status === 403 && !isPreSessionCall && !isPublicApi && !req.context.get(SUPPRESS_403_REDIRECT)) {
          if (this.auth.isLoggedIn) {
            this.router.navigate(['/unauthorized']);
          }
        }
        return throwError(() => err);
      })
    );
  }
}
