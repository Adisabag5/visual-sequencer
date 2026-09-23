import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../../state/auth.store';

/**
 * The always-visible answer to "am I signed in?" — a green neon border when yes
 * — which doubles as the control for changing that. Session state was otherwise
 * invisible until an API call failed.
 */
@Component({
  selector: 'app-session-button',
  imports: [],
  templateUrl: './session-button.html',
  styleUrl: './session-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionButton {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  /**
   * In-flight sign-out. Local because it is the state of *this* click, not of
   * the session — `AuthStore.busy` covers sign in / sign up, which this button
   * never performs.
   */
  private readonly signingOut = signal(false);

  readonly isSignedIn = this.auth.isSignedIn;
  readonly isBusy = this.signingOut.asReadonly();

  readonly label = computed(() => {
    // The store has three states, not two: on a reload the session is unknown
    // until the boot refresh answers. Rendering 'Sign in' during that window
    // flashes the wrong answer at someone who is, in fact, signed in.
    if (this.auth.isRestoring()) return 'Checking…';

    return this.isSignedIn() ? 'Sign out' : 'Sign in';
  });

  /** Unknown session, or a sign-out already running — either way, not clickable. */
  readonly disabled = computed(() => this.auth.isRestoring() || this.signingOut());

  async press(): Promise<void> {
    if (this.disabled()) return;

    if (!this.isSignedIn()) {
      await this.router.navigate(['/auth']);

      return;
    }

    this.signingOut.set(true);

    try {
      await this.auth.signOut();
    } finally {
      this.signingOut.set(false);
    }
  }
}
