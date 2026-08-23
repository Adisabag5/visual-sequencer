import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

/**
 * Keeps someone already signed in from landing back on the auth page — e.g. by
 * hitting back after signing in. It does NOT guard the sequencer: the instrument
 * works without an account, and only saving a beat needs one.
 */
export const redirectIfSignedIn: CanActivateFn = async () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  // On a full page load this guard runs while the boot refresh is still in
  // flight, when isSignedIn() is still false. Deciding now would show the sign-in
  // page to someone who is already signed in, so wait for the answer first.
  await auth.restore();

  return auth.isSignedIn() ? router.createUrlTree(['/']) : true;
};
