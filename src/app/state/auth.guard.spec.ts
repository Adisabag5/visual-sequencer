import { describe, expect, it, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError, timer, map } from 'rxjs';
import { redirectIfSignedIn } from './auth.guard';
import { AuthStore } from './auth.store';
import { ApiClient } from '../api/api.client';
import { AuthResponse } from '../api/api.types';

const response: AuthResponse = {
  access_token: 'access.jwt',
  user: {
    id: '1',
    email: 'adi@example.com',
    role: 'USER',
    createdAt: '2026-08-23T00:00:00.000Z',
  },
};

function runGuard(api: Partial<Record<keyof ApiClient, unknown>>) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: ApiClient, useValue: api }],
  });

  return TestBed.runInInjectionContext(() => redirectIfSignedIn(null as never, null as never));
}

describe('redirectIfSignedIn', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('lets a signed-out visitor reach the auth page', async () => {
    const result = await runGuard({
      refresh: () => throwError(() => ({ kind: 'unauthorized', detail: null })),
    });

    expect(result).toBe(true);
  });

  it('redirects someone who is already signed in', async () => {
    const result = await runGuard({ refresh: () => of(response) });

    expect(result).toBeInstanceOf(UrlTree);
    expect(String(result)).toBe('/');
  });

  it('waits for a slow restore instead of deciding early', async () => {
    // the bug this guards against: on a full page load the guard runs while the
    // refresh is still in flight, and deciding then shows the sign-in page to
    // someone who is already signed in
    const result = await runGuard({
      refresh: () => timer(20).pipe(map(() => response)),
    });

    expect(result).toBeInstanceOf(UrlTree);
  });

  it('only ever issues one restore, however many times it is asked', async () => {
    let calls = 0;
    const api = {
      refresh: () => {
        calls++;

        return of(response);
      },
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ApiClient, useValue: api }],
    });
    const store = TestBed.inject(AuthStore);

    await Promise.all([store.restore(), store.restore(), store.restore()]);

    expect(calls).toBe(1);
  });
});
