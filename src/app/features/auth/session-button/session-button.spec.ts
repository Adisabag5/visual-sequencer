import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { SessionButton } from './session-button';
import { AuthStore, SessionStatus } from '../../../state/auth.store';

function setup(status: SessionStatus, signOut = vi.fn().mockResolvedValue(undefined)) {
  const auth = {
    isSignedIn: signal(status === 'signed-in'),
    isRestoring: signal(status === 'restoring'),
    signOut,
  };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: AuthStore, useValue: auth }],
  });

  const fixture = TestBed.createComponent(SessionButton);
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

  return { auth, fixture, navigate, button: () => queryButton(fixture.nativeElement) };
}

function queryButton(host: HTMLElement): HTMLButtonElement {
  return host.querySelector('.session-btn') as HTMLButtonElement;
}

describe('SessionButton', () => {
  describe('signed out', () => {
    it('offers to sign in, with no neon border', async () => {
      const { fixture, button } = setup('signed-out');
      await fixture.whenStable();

      expect(button().textContent?.trim()).toBe('Sign in');
      expect(button().classList.contains('is-signed-in')).toBe(false);
      expect(button().disabled).toBe(false);
    });

    it('navigates to the auth page instead of signing out', async () => {
      const { fixture, button, navigate, auth } = setup('signed-out');
      await fixture.whenStable();

      button().click();
      await fixture.whenStable();

      expect(navigate).toHaveBeenCalledWith(['/auth']);
      expect(auth.signOut).not.toHaveBeenCalled();
    });
  });

  describe('signed in', () => {
    it('offers to sign out, with the neon border', async () => {
      const { fixture, button } = setup('signed-in');
      await fixture.whenStable();

      // the glossary term is "Sign out" — "Log out" is a listed synonym to avoid
      expect(button().textContent?.trim()).toBe('Sign out');
      expect(button().classList.contains('is-signed-in')).toBe(true);
    });

    it('signs out instead of navigating', async () => {
      const { fixture, button, navigate, auth } = setup('signed-in');
      await fixture.whenStable();

      button().click();
      await fixture.whenStable();

      expect(auth.signOut).toHaveBeenCalledOnce();
      expect(navigate).not.toHaveBeenCalled();
    });

    it('ignores a second click while the first sign-out is in flight', async () => {
      // assigned synchronously by the Promise executor below
      let release!: () => void;
      const signOut = vi.fn().mockReturnValue(
        new Promise<void>((resolve) => {
          release = resolve;
        }),
      );
      const { fixture, button, auth } = setup('signed-in', signOut);
      await fixture.whenStable();

      button().click();
      await fixture.whenStable();

      expect(button().disabled).toBe(true);

      button().click();
      release();
      await fixture.whenStable();

      expect(auth.signOut).toHaveBeenCalledOnce();
    });
  });

  describe('restoring', () => {
    // the boot refresh has not answered yet. Showing "Sign in" here would flash
    // the wrong answer at someone whose session is about to be restored.
    it('says nothing definite and cannot be pressed', async () => {
      const { fixture, button, navigate, auth } = setup('restoring');
      await fixture.whenStable();

      expect(button().textContent?.trim()).toBe('Checking…');
      expect(button().disabled).toBe(true);

      button().click();
      await fixture.whenStable();

      expect(navigate).not.toHaveBeenCalled();
      expect(auth.signOut).not.toHaveBeenCalled();
    });
  });
});
