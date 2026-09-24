import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../../state/auth.store';
import { BeatsStore } from '../../../state/beats.store';

/** How long a confirmation stays up before the control returns to Save. */
const CONFIRM_MS = 2200;

/** The maximum the server accepts for a beat title. */
const MAX_TITLE = 100;

/**
 * Save, plus the inline title field the first save asks for.
 *
 * Signed out the button still works — it routes to the auth page. Deliberately
 * not disabled: a dead Save button as the signed-in indicator is the idea Adi
 * rejected, and the session button in the header answers that question now.
 */
@Component({
  selector: 'app-save-control',
  imports: [],
  templateUrl: './save-control.html',
  styleUrl: './save-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveControl {
  private readonly beats = inject(BeatsStore);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  private readonly _titling = signal(false);
  private readonly _title = signal('');
  private confirmTimer?: ReturnType<typeof setTimeout>;

  readonly maxTitle = MAX_TITLE;

  private readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  constructor() {
    // Focused from code rather than with the autofocus attribute: autofocus
    // steals focus on page load, which is why the a11y rule forbids it. Here
    // the field only exists because someone just pressed Save.
    effect(() => this.titleInput()?.nativeElement.focus());
  }

  readonly titling = this._titling.asReadonly();
  readonly title = this._title.asReadonly();
  readonly status = this.beats.status;
  readonly error = this.beats.error;
  readonly total = this.beats.total;

  readonly isSaving = this.beats.isSaving;
  readonly justSaved = computed(() => this.status() === 'saved');
  readonly failed = computed(() => this.status() === 'error');

  /** The server rejects an empty title, so confirm stays inert until there is one. */
  readonly canConfirm = computed(() => this._title().trim().length > 0);

  /** Start a save: route to auth, ask for a title, or just save. */
  press(): void {
    if (this.isSaving()) return;

    if (!this.auth.isSignedIn()) {
      void this.router.navigate(['/auth']);

      return;
    }

    if (this.beats.needsTitle()) {
      this._title.set('');
      this._titling.set(true);

      return;
    }

    void this.commit();
  }

  onTitleInput(value: string): void {
    this._title.set(value);
  }

  /** Confirm the title field and create the beat. */
  async confirm(): Promise<void> {
    if (!this.canConfirm() || this.isSaving()) return;

    const title = this._title();
    this._titling.set(false);
    await this.commit(title);
  }

  cancel(): void {
    this._titling.set(false);
    this._title.set('');
  }

  private async commit(title?: string): Promise<void> {
    await this.beats.save(title);

    // Clear the confirmation on its own, so the bar does not keep a stale
    // "Saved" next to a pattern that has moved on since.
    clearTimeout(this.confirmTimer);
    this.confirmTimer = setTimeout(() => this.beats.acknowledge(), CONFIRM_MS);
  }
}
