import { HttpClient, HttpContext, HttpContextToken } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, finalize, Observable, shareReplay, throwError } from 'rxjs';
import { API_BASE_URL } from './api.config';
import {
  AuthResponse,
  Beat,
  CreateBeatBody,
  Credentials,
  Paginated,
  UpdateBeatBody,
} from './api.types';
import { toApiError } from './api.errors';

export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

const skipAuth = () => new HttpContext().set(SKIP_AUTH, true);

const asApiError = <T>() =>
  catchError<T, Observable<never>>((error: unknown) => throwError(() => toApiError(error)));

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private inFlightRefresh: Observable<AuthResponse> | null = null;

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

  createBeat(body: CreateBeatBody): Observable<Beat> {
    return this.http
      .post<Beat>(`${this.baseUrl}/beats`, body, { withCredentials: true })
      .pipe(asApiError());
  }

  updateBeat(id: string, body: UpdateBeatBody): Observable<Beat> {
    return this.http
      .patch<Beat>(`${this.baseUrl}/beats/${id}`, body, { withCredentials: true })
      .pipe(asApiError());
  }

  /** 404 if it is gone, 403 if it belongs to somebody else. */
  getBeat(id: string): Observable<Beat> {
    return this.http
      .get<Beat>(`${this.baseUrl}/beats/${id}`, { withCredentials: true })
      .pipe(asApiError());
  }

  /** 204 on success; the body is empty, so nothing comes back. */
  deleteBeat(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/beats/${id}`, { withCredentials: true })
      .pipe(asApiError());
  }

  /**
   * The server answers `{items, meta}`, never a bare array, and defaults to
   * page 1 / limit 20. Callers that only want the count read `meta.total`.
   */
  listBeats(page = 1): Observable<Paginated<Beat>> {
    return this.http
      .get<Paginated<Beat>>(`${this.baseUrl}/beats`, {
        withCredentials: true,
        params: { page },
      })
      .pipe(asApiError());
  }
}
