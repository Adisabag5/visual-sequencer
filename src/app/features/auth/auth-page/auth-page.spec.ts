import { describe, expect, it, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AuthPage } from './auth-page';
import { AuthStore } from '../../../state/auth.store';

function setup() {
  const auth = {
    busy: signal(false),
    error: signal<string | null>(null),
    signIn: vi.fn().mockResolvedValue(true),
    signUp: vi.fn().mockResolvedValue(true),
    clearError: vi.fn(),
  };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: AuthStore, useValue: auth }],
  });

  const fixture = TestBed.createComponent(AuthPage);

  return { auth, page: fixture.componentInstance, fixture };
}

describe('AuthPage', () => {
  let harness: ReturnType<typeof setup>;

  beforeEach(() => {
    harness = setup();
  });

  describe('password rules', () => {
    it('accepts a short password when signing IN', () => {
      // the server's SignInDto only requires non-empty. Enforcing a length here
      // would lock out anyone whose password predates the current policy.
      harness.page.form.setValue({ email: 'adi@example.com', password: 'short' });

      expect(harness.page.form.valid).toBe(true);
    });

    it('requires the minimum when signing UP', () => {
      harness.page.switchMode();
      harness.page.form.setValue({ email: 'adi@example.com', password: 'short' });

      expect(harness.page.form.valid).toBe(false);
      expect(harness.page.form.controls.password.hasError('minlength')).toBe(true);
    });

    it('drops the minimum again on switching back to sign in', () => {
      harness.page.switchMode(); // to sign-up
      harness.page.switchMode(); // back to sign-in
      harness.page.form.setValue({ email: 'adi@example.com', password: 'short' });

      expect(harness.page.form.valid).toBe(true);
    });

    it('still rejects an empty password in either mode', () => {
      harness.page.form.setValue({ email: 'adi@example.com', password: '' });
      expect(harness.page.form.valid).toBe(false);

      harness.page.switchMode();
      expect(harness.page.form.valid).toBe(false);
    });
  });

  describe('submit', () => {
    it('calls signIn with the credentials and navigates on success', async () => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      harness.page.form.setValue({ email: 'adi@example.com', password: 'password123' });

      await harness.page.submit();

      expect(harness.auth.signIn).toHaveBeenCalledWith({
        email: 'adi@example.com',
        password: 'password123',
      });
      expect(navigate).toHaveBeenCalledWith(['/']);
    });

    it('calls signUp in sign-up mode', async () => {
      vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      harness.page.switchMode();
      harness.page.form.setValue({ email: 'adi@example.com', password: 'password123' });

      await harness.page.submit();

      expect(harness.auth.signUp).toHaveBeenCalled();
      expect(harness.auth.signIn).not.toHaveBeenCalled();
    });

    it('does not call the server with an invalid form', async () => {
      harness.page.form.setValue({ email: 'not-an-email', password: '' });

      await harness.page.submit();

      expect(harness.auth.signIn).not.toHaveBeenCalled();
      expect(harness.page.form.controls.email.touched).toBe(true);
    });

    it('stays put when the server rejects the credentials', async () => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      harness.auth.signIn.mockResolvedValue(false);
      harness.page.form.setValue({ email: 'adi@example.com', password: 'password123' });

      await harness.page.submit();

      expect(navigate).not.toHaveBeenCalled();
    });
  });
});
