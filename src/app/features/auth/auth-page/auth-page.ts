import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthStore } from '../../../state/auth.store';
import { MIN_PASSWORD_LENGTH } from '../../../core/constants';

type Mode = 'sign-in' | 'sign-up';

/**
 * One page for both modes. They differ only in which endpoint they call and
 * whether the password length rule applies, so splitting them into two routes
 * would duplicate the form for no gain.
 */
@Component({
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPage {
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  private readonly _mode = signal<Mode>('sign-in');

  readonly mode = this._mode.asReadonly();

  readonly isSignUp = computed(() => this._mode() === 'sign-up');
  readonly heading = computed(() => (this.isSignUp() ? 'Create your account' : 'Welcome back'));
  readonly submitLabel = computed(() => (this.isSignUp() ? 'Sign up' : 'Sign in'));
  readonly switchPrompt = computed(() =>
    this.isSignUp() ? 'Already have an account?' : 'New to Pulse?',
  );
  readonly switchAction = computed(() => (this.isSignUp() ? 'Sign in' : 'Create one'));

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    // length rule is applied per mode — see applyPasswordRules
    password: ['', [Validators.required]],
  });

  readonly minPasswordLength = MIN_PASSWORD_LENGTH;

  /**
   * Reactive Forms state is not signals, and this app is zoneless — nothing would
   * tell Angular to re-render when a control becomes touched or invalid. Mirroring
   * the form's own event stream into a signal gives the template something to
   * depend on.
   */
  private readonly formState = toSignal(this.form.events);

  switchMode(): void {
    this._mode.update((mode) => (mode === 'sign-in' ? 'sign-up' : 'sign-in'));
    this.applyPasswordRules();
    this.auth.clearError();
  }

  /**
   * The minimum only applies when creating a password. The server's SignInDto
   * deliberately checks nothing but "non-empty" — enforcing a length here would
   * lock out anyone whose existing password predates the rule, and would leak
   * the current policy to an unauthenticated caller.
   */
  private applyPasswordRules(): void {
    const password = this.form.controls.password;

    password.setValidators(
      this.isSignUp()
        ? [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]
        : [Validators.required],
    );
    password.updateValueAndValidity();
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.auth.busy()) {
      this.form.markAllAsTouched();

      return;
    }

    const credentials = this.form.getRawValue();
    const signedIn = this.isSignUp()
      ? await this.auth.signUp(credentials)
      : await this.auth.signIn(credentials);

    if (signedIn) await this.router.navigate(['/']);
  }

  /** Only complain once someone has actually interacted with the field. */
  showsError(field: 'email' | 'password'): boolean {
    this.formState(); // registers the dependency that drives re-evaluation
    const control = this.form.controls[field];

    return control.invalid && (control.touched || control.dirty);
  }
}
