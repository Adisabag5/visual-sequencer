import { describe, expect, it, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { ApiClient } from './api.client';
import { AccessTokenHolder } from './access-token';
import { API_BASE_URL } from './api.config';

const BASE = 'http://api.test';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let tokens: AccessTokenHolder;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });

    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(AccessTokenHolder);
  });

  it('sends no Authorization header when there is no token', async () => {
    const pending = firstValueFrom(http.get(`${BASE}/beats`));

    const request = backend.expectOne(`${BASE}/beats`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
    await pending;
  });

  it('attaches the access token as a bearer', async () => {
    tokens.set('access.jwt');
    const pending = firstValueFrom(http.get(`${BASE}/beats`));

    const request = backend.expectOne(`${BASE}/beats`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer access.jwt');
    request.flush({});
    await pending;
  });

  it('refreshes once on 401 and retries with the new token', async () => {
    tokens.set('expired.jwt');
    const pending = firstValueFrom(http.get<{ ok: boolean }>(`${BASE}/beats`));

    // the original call fails because the 15-minute token ran out
    backend.expectOne(`${BASE}/beats`).flush(null, { status: 401, statusText: 'Unauthorized' });

    // the interceptor exchanges the refresh cookie for a fresh token
    const refresh = backend.expectOne(`${BASE}/auth/refresh`);
    expect(refresh.request.withCredentials).toBe(true);
    refresh.flush({ access_token: 'fresh.jwt', user: {} });

    // ...and replays the original request with it
    const retry = backend.expectOne(`${BASE}/beats`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer fresh.jwt');
    retry.flush({ ok: true });

    await expect(pending).resolves.toEqual({ ok: true });
    expect(tokens.token()).toBe('fresh.jwt');
  });

  it('refreshes ONCE when several requests 401 at the same time', async () => {
    // Two parallel refreshes would present the same cookie twice. The server
    // rotates on the first, reads the second as a replayed token, and revokes
    // every session the person has — concurrency here logs them out everywhere.
    tokens.set('expired.jwt');
    const first = firstValueFrom(http.get<{ n: number }>(`${BASE}/beats`));
    const second = firstValueFrom(http.get<{ n: number }>(`${BASE}/collections`));

    backend.expectOne(`${BASE}/beats`).flush(null, { status: 401, statusText: 'Unauthorized' });
    backend
      .expectOne(`${BASE}/collections`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    // exactly one refresh, not two
    backend.expectOne(`${BASE}/auth/refresh`).flush({
      access_token: 'fresh.jwt',
      user: {},
    });

    // both originals replay with the new token
    const retries = backend.match(
      (r) => r.url === `${BASE}/beats` || r.url === `${BASE}/collections`,
    );
    expect(retries).toHaveLength(2);
    retries.forEach((r, i) => {
      expect(r.request.headers.get('Authorization')).toBe('Bearer fresh.jwt');
      r.flush({ n: i });
    });

    await expect(first).resolves.toBeDefined();
    await expect(second).resolves.toBeDefined();
  });

  it('gives up and clears the token when the refresh itself fails', async () => {
    tokens.set('expired.jwt');
    const pending = firstValueFrom(http.get(`${BASE}/beats`));

    backend.expectOne(`${BASE}/beats`).flush(null, { status: 401, statusText: 'Unauthorized' });
    backend
      .expectOne(`${BASE}/auth/refresh`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(pending).rejects.toBeDefined();
    expect(tokens.token()).toBeNull();
  });

  it('never tries to refresh the refresh call itself', async () => {
    // ApiClient marks auth calls SKIP_AUTH. Without that, a 401 from
    // /auth/refresh would trigger another /auth/refresh, forever.
    const pending = firstValueFrom(TestBed.inject(ApiClient).refresh());

    backend
      .expectOne(`${BASE}/auth/refresh`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(pending).rejects.toBeDefined();
    backend.verify(); // exactly one request was made — no recursion
  });

  it('does not attach a bearer to auth calls', async () => {
    tokens.set('access.jwt');
    const pending = firstValueFrom(
      TestBed.inject(ApiClient).signIn({ email: 'a@b.co', password: 'password123' }),
    );

    const request = backend.expectOne(`${BASE}/auth/signin`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    expect(request.request.withCredentials).toBe(true);
    request.flush({ access_token: 'x', user: {} });
    await pending;
  });

  afterEach(() => backend.verify());
});
