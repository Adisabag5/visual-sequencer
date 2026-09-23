import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { AccessTokenHolder } from './access-token';
import { ApiClient, SKIP_AUTH } from './api.client';

const UNAUTHORIZED = 401;

/**
 * Attaches the access token, and recovers from the one failure that is expected
 * rather than exceptional: tokens last 15 minutes, so a long session will hit a
 * 401 mid-use. On the first 401 we refresh once and retry; a second failure means
 * the session is genuinely over.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.context.get(SKIP_AUTH)) return next(request);

  const tokens = inject(AccessTokenHolder);
  const api = inject(ApiClient);

  return next(withToken(request, tokens.token())).pipe(
    catchError((error: unknown) => {
      if (!isUnauthorized(error)) return throwError(() => error);

      return api.refresh().pipe(
        switchMap((response): Observable<HttpEvent<unknown>> => {
          tokens.set(response.access_token);

          return next(withToken(request, response.access_token));
        }),
        catchError((refreshError: unknown) => {
          // the refresh cookie is gone, expired, or revoked — stop pretending
          tokens.clear();

          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

function withToken(request: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  if (!token) return request;

  return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === UNAUTHORIZED;
}
