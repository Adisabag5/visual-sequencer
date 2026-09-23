import { InjectionToken } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Where nest-server lives.
 *
 * The value comes from the environment file, which angular.json swaps for the
 * production one at build time — otherwise a shipped build would tell every
 * visitor's browser to call their own machine. Specs override the token directly.
 *
 * In development it must match PORT in nest-server/.env: a request to a dead port
 * surfaces in the browser console as a CORS error, which sends you looking in
 * entirely the wrong place.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl,
});
