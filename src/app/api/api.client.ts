import { HttpClient, HttpContext, HttpContextToken } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, finalize, Observable, shareReplay, throwError } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { AuthResponse, Credentials } from './api.types';
import { toApiError } from './api.errors';

/**
 * Marks a request the auth interceptor must leave alone. Without it, refreshing
 * after a 401 would itself 401 and refresh again, forever.
 */
export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

const skipAuth = () => new HttpContext().set(SKIP_AUTH, true);

/** Transport failures become domain errors here, so no layer above sees a status code. */
const asApiError = <T>() =>
  catchError<T, Observable<never>>((error: unknown) => throwError(() => toApiError(error)));

/**
 * The only place HttpClient is imported. Everything above talks to the server
 * through these methods, which means the whole backend is one fake away in tests.
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /**
   * The refresh currently in flight, shared by every caller.
   *
   * Without this, two requests failing with 401 at once each POST /auth/refresh
   * with the same cookie. The server rotates on the first one, so the second
   * presents an already-rotated token — which it correctly reads as theft and
   * answers by revoking every session the person has. Concurrency on the client
   * would log them out everywhere.
   */
  private inFlightRefresh: Observable<AuthResponse> | null = null;

  /**
   * withCredentials is mandatory on every auth call: the refresh token is an
   * httpOnly cookie, and the browser only sends it cross-origin when asked.
   */
  signUp(credentials: Credentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/signup`, credentials, {
        withCredentials: true,
        context: skipAuth(),
      })
      .pipe(asApiError());
  }

  signIn(credentials: Credentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/signin`, credentials, {
        withCredentials: true,
        context: skipAuth(),
      })
      .pipe(asApiError());
  }

  /** Exchanges the refresh cookie for a new access token; rotates the cookie. */
  refresh(): Observable<AuthResponse> {
    this.inFlightRefresh ??= this.http
      .post<AuthResponse>(
        `${this.baseUrl}/auth/refresh`,
        {},
        { withCredentials: true, context: skipAuth() },
      )
      .pipe(
        asApiError(),
        // clear the slot once the request settles, so the next 401 refreshes again
        finalize(() => (this.inFlightRefresh = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.inFlightRefresh;
  }

  signOut(): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(
        `${this.baseUrl}/auth/signout`,
        {},
        { withCredentials: true, context: skipAuth() },
      )
      .pipe(asApiError());
  }
}
