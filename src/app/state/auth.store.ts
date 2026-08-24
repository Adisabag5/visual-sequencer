import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AccessTokenHolder } from '../api/access-token';
import { ApiClient } from '../api/api.client';
import { Account, AuthResponse, Credentials } from '../api/api.types';
import { ApiError } from '../api/api.errors';

/**
 * `restoring` is the state on first paint, before the boot-time refresh has
 * answered. The UI must distinguish it from `signed-out`, or every reload
 * flashes the sign-in page at someone who is already signed in.
 */
export type SessionStatus = 'restoring' | 'signed-in' | 'signed-out';

/** Single source of truth for the session. Readonly signals out, intents in. */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(ApiClient);
  private readonly tokens = inject(AccessTokenHolder);

  private readonly _account = signal<Account | null>(null);
  private readonly _status = signal<SessionStatus>('restoring');
  private readonly _error = signal<string | null>(null);
  private readonly _busy = signal(false);

  /**
   * The in-flight boot restore, kept so callers can await it. Memoised: the
   * guard and the root component both ask for it, and one round trip is enough.
   */
  private restoring: Promise<void> | null = null;

  readonly account = this._account.asReadonly();
  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();
  readonly busy = this._busy.asReadonly();

  readonly isSignedIn = computed(() => this._status() === 'signed-in');
  readonly isRestoring = computed(() => this._status() === 'restoring');

  constructor() {
    // The interceptor drops the token when a refresh fails, but it cannot reach
    // this store (state sits above api). Without noticing, status would stay
    // 'signed-in' with no token: the guard would keep bouncing the person away
    // from /auth and they could not sign in again without reloading.
    effect(() => {
      if (this.tokens.token() === null && this._status() === 'signed-in') {
        this._account.set(null);
        this._status.set('signed-out');
      }
    });
  }

  /**
   * Called once at boot. The access token is gone after a reload, but the
   * httpOnly refresh cookie is not — so a session is restored by asking the
   * server, never by reading storage.
   */
  restore(): Promise<void> {
    this.restoring ??= this.runRestore();

    return this.restoring;
  }

  private async runRestore(): Promise<void> {
    try {
      this.adopt(await firstValueFrom(this.api.refresh()));
    } catch (error) {
      // no cookie, expired, or revoked: simply not signed in. Not an error to show.
      this.reset();

      // Only a definite "no" is worth remembering. A network blip is not an
      // answer, and memoising it would strand a valid session as signed-out for
      // the life of the page with no way to retry.
      if ((error as ApiError | null)?.kind !== 'unauthorized') this.restoring = null;
    }
  }

  async signUp(credentials: Credentials): Promise<boolean> {
    return this.attempt(() => firstValueFrom(this.api.signUp(credentials)));
  }

  async signIn(credentials: Credentials): Promise<boolean> {
    return this.attempt(() => firstValueFrom(this.api.signIn(credentials)));
  }

  async signOut(): Promise<void> {
    try {
      await firstValueFrom(this.api.signOut());
    } catch {
      // the session may already be dead server-side; either way we drop it here
    } finally {
      this.reset();
    }
  }

  clearError(): void {
    this._error.set(null);
  }

  private async attempt(call: () => Promise<AuthResponse>): Promise<boolean> {
    this._busy.set(true);
    this._error.set(null);

    try {
      this.adopt(await call());

      return true;
    } catch (error) {
      this._error.set(messageFor(error));
      this.reset();

      return false;
    } finally {
      this._busy.set(false);
    }
  }

  private adopt(response: AuthResponse): void {
    this.tokens.set(response.access_token);
    this._account.set(response.user);
    this._status.set('signed-in');
  }

  private reset(): void {
    this.tokens.clear();
    this._account.set(null);
    this._status.set('signed-out');
  }
}

/**
 * Turns a domain error into something worth showing a person. Sign-in reports a
 * deliberately vague failure — the server refuses to reveal whether an email
 * exists — so the UI must not invent a more specific message than it was given.
 */
function messageFor(error: unknown): string {
  const apiError = error as ApiError | null;

  switch (apiError?.kind) {
    case 'offline':
      return 'Cannot reach the server. Is it running?';
    case 'unauthorized':
      return 'Email or password is incorrect.';
    case 'conflict':
      return 'That email is already registered. Sign in instead.';
    case 'invalid':
      return apiError.detail ?? 'Check the details and try again.';
    default:
      return 'Something went wrong. Try again.';
  }
}
