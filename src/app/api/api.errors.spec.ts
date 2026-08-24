import { describe, expect, it } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';
import { toApiError } from './api.errors';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom, Observable } from 'rxjs';
import { ApiClient } from './api.client';
import { API_BASE_URL } from './api.config';

describe('toApiError', () => {
  it('maps a network failure to offline', () => {
    expect(toApiError(new HttpErrorResponse({ status: 0 }))).toEqual({
      kind: 'offline',
      detail: null,
    });
  });

  it('maps 401 and 409 without leaking a status code', () => {
    expect(toApiError(new HttpErrorResponse({ status: 401 })).kind).toBe('unauthorized');
    expect(toApiError(new HttpErrorResponse({ status: 409 })).kind).toBe('conflict');
  });

  it('carries the first validation message off a 400', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: ['password must be longer than or equal to 8 characters', 'x'] },
    });

    expect(toApiError(error)).toEqual({
      kind: 'invalid',
      detail: 'password must be longer than or equal to 8 characters',
    });
  });

  it('falls back to unknown for anything else', () => {
    expect(toApiError(new HttpErrorResponse({ status: 500 })).kind).toBe('unknown');
    expect(toApiError(new Error('boom')).kind).toBe('unknown');
  });
});

describe('ApiClient error translation', () => {
  const BASE = 'http://api.test';
  let api: ApiClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    api = TestBed.inject(ApiClient);
    backend = TestBed.inject(HttpTestingController);
  });

  // every method must translate, or a raw HttpErrorResponse leaks above the API
  // layer and the store's message mapping silently degrades to the generic case
  const calls: [string, () => Observable<unknown>, string][] = [
    ['refresh', () => api.refresh(), '/auth/refresh'],
    ['signOut', () => api.signOut(), '/auth/signout'],
    ['signIn', () => api.signIn({ email: 'a@b.co', password: 'x' }), '/auth/signin'],
    ['signUp', () => api.signUp({ email: 'a@b.co', password: 'x' }), '/auth/signup'],
  ];

  it.each(calls)('%s surfaces an ApiError, not an HttpErrorResponse', async (_name, call, path) => {
    const pending = firstValueFrom(call()).catch((error: unknown) => error);

    backend.expectOne(`${BASE}${path}`).flush(null, {
      status: 401,
      statusText: 'Unauthorized',
    });

    expect(await pending).toEqual({ kind: 'unauthorized', detail: null });
  });
});
