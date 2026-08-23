import { InjectionToken } from '@angular/core';

/**
 * Where nest-server lives. An injection token rather than a constant so specs can
 * point it somewhere harmless and a deployed build can override it at bootstrap.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  // Must match PORT in nest-server/.env. If the API moves, change it here too —
  // a request to a dead port shows up in the browser console as a CORS error,
  // which sends you looking in entirely the wrong place.
  factory: () => 'http://localhost:3000',
});
