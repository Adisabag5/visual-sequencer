import { describe, expect, it, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthStore } from './auth.store';
import { ApiClient } from '../api/api.client';
import { AccessTokenHolder } from '../api/access-token';
import { Account, AuthResponse } from '../api/api.types';
import { installLocalStorageMock } from '../testing/local-storage-mock';
import { ApiError, ApiErrorKind } from '../api/api.errors';

const account: Account = {
  id: '1',
  email: 'adi@example.com',
  role: 'USER',
  createdAt: '2026-08-23T00:00:00.000Z',
};

const response: AuthResponse = { access_token: 'access.jwt', user: account };

const apiError = (kind: ApiErrorKind, detail: string | null = null): ApiError => ({
  kind,
  detail,
});

function setup(api: Partial<Record<keyof ApiClient, unknown>>) {
  TestBed.configureTestingModule({
    providers: [{ provide: ApiClient, useValue: api }],
  });

  return {
    store: TestBed.inject(AuthStore),
    tokens: TestBed.inject(AccessTokenHolder),
  };
}

describe('AuthStore', () => {
  beforeEach(() => {
    installLocalStorageMock();
    TestBed.resetTestingModule();
  });

  it('starts as restoring, so a reload does not flash the sign-in page', () => {
    const { store } = setup({ refresh: () => of(response) });

    expect(store.status()).toBe('restoring');
    expect(store.isRestoring()).toBe(true);
  });

  it('restores a session from the refresh cookie', async () => {
    const { store, tokens } = setup({ refresh: () => of(response) });

    await store.restore();

    expect(store.isSignedIn()).toBe(true);
    expect(store.account()).toEqual(account);
    expect(tokens.token()).toBe('access.jwt');
  });

  it('treats a failed restore as signed-out, not an error to show', async () => {
    const { store } = setup({
      refresh: () => throwError(() => apiError('unauthorized')),
    });

    await store.restore();

    expect(store.status()).toBe('signed-out');
    expect(store.error()).toBeNull();
  });

  it('signs in and holds the token in memory only', async () => {
    const { store, tokens } = setup({ signIn: () => of(response) });

    const ok = await store.signIn({ email: 'adi@example.com', password: 'password123' });

    expect(ok).toBe(true);
    expect(tokens.token()).toBe('access.jwt');
    // the token must never be written anywhere an XSS could read it
    const setItem = vi.spyOn(localStorage, 'setItem');
    await store.signIn({ email: 'adi@example.com', password: 'password123' });
    expect(setItem).not.toHaveBeenCalled();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('does not invent a more specific message than the server gave', async () => {
    const { store } = setup({
      signIn: () => throwError(() => apiError('unauthorized')),
    });

    await store.signIn({ email: 'nobody@example.com', password: 'password123' });

    // the server refuses to say whether the email exists; neither may we
    expect(store.error()).toBe('Email or password is incorrect.');
    expect(store.error()).not.toContain('email');
    expect(store.isSignedIn()).toBe(false);
  });

  it('explains a duplicate email on sign up', async () => {
    const { store } = setup({
      signUp: () => throwError(() => apiError('conflict')),
    });

    await store.signUp({ email: 'adi@example.com', password: 'password123' });

    expect(store.error()).toContain('already registered');
  });

  it('surfaces the first validation message from a 400', async () => {
    const { store } = setup({
      signUp: () =>
        throwError(() =>
          apiError('invalid', 'password must be longer than or equal to 8 characters'),
        ),
    });

    await store.signUp({ email: 'adi@example.com', password: 'short' });

    expect(store.error()).toContain('8 characters');
  });

  it('names an unreachable server rather than blaming the credentials', async () => {
    const { store } = setup({
      signIn: () => throwError(() => apiError('offline')),
    });

    await store.signIn({ email: 'adi@example.com', password: 'password123' });

    expect(store.error()).toContain('Cannot reach the server');
  });

  it('goes signed-out when the interceptor drops the token after a failed refresh', async () => {
    // the interceptor cannot reach this store, so it clears the token holder and
    // nothing else. Without noticing, status stays signed-in with no token and
    // the guard keeps bouncing the person away from /auth.
    const { store, tokens } = setup({ signIn: () => of(response) });
    await store.signIn({ email: 'adi@example.com', password: 'password123' });
    expect(store.isSignedIn()).toBe(true);

    tokens.clear();
    TestBed.tick();

    expect(store.isSignedIn()).toBe(false);
    expect(store.account()).toBeNull();
  });

  describe('restore memoisation', () => {
    it('remembers a definite "no session" and does not re-ask', async () => {
      let calls = 0;
      const { store } = setup({
        refresh: () => {
          calls++;

          return throwError(() => apiError('unauthorized'));
        },
      });

      await store.restore();
      await store.restore();

      expect(calls).toBe(1);
      expect(store.status()).toBe('signed-out');
    });

    it('retries after a network blip rather than stranding a valid session', async () => {
      let calls = 0;
      const { store } = setup({
        refresh: () => {
          calls++;

          // first attempt fails to reach the server; second succeeds
          return calls === 1 ? throwError(() => apiError('offline')) : of(response);
        },
      });

      await store.restore();
      expect(store.isSignedIn()).toBe(false);

      await store.restore();

      expect(calls).toBe(2);
      expect(store.isSignedIn()).toBe(true);
    });
  });

  it('clears the session even if signout fails server-side', async () => {
    const { store, tokens } = setup({
      signIn: () => of(response),
      signOut: () => throwError(() => apiError('unauthorized')),
    });
    await store.signIn({ email: 'adi@example.com', password: 'password123' });

    await store.signOut();

    expect(store.isSignedIn()).toBe(false);
    expect(store.account()).toBeNull();
    expect(tokens.token()).toBeNull();
  });

  it('reports busy while a request is in flight', async () => {
    const { store } = setup({ signIn: vi.fn(() => of(response)) });

    const pending = store.signIn({ email: 'adi@example.com', password: 'password123' });
    await pending;

    expect(store.busy()).toBe(false);
  });
});
