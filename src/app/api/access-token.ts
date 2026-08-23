import { Injectable, signal } from '@angular/core';

/**
 * Holds the access token for the lifetime of the page, and nowhere else.
 *
 * Deliberately NOT localStorage: anything JavaScript can read, an XSS can read.
 * Losing it on reload is fine — the httpOnly refresh cookie is what restores a
 * session, and only the browser can read that.
 *
 * It lives in the API layer, not the store, because the interceptor needs it and
 * the API layer may not import from State (dependencies flow downward only).
 */
@Injectable({ providedIn: 'root' })
export class AccessTokenHolder {
  private readonly _token = signal<string | null>(null);

  readonly token = this._token.asReadonly();

  set(token: string): void {
    this._token.set(token);
  }

  clear(): void {
    this._token.set(null);
  }
}
