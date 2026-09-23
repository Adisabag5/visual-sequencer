import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../api/api.client';
import { ApiError } from '../api/api.errors';
import { Beat, BeatData } from '../api/api.types';
import { PersistedSnapshot, StorageService } from './storage.service';

/** Where a save got to. The UI shows a confirmation on 'saved'. */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Owns the **current beat** — the one a later Save updates rather than
 * duplicating (see the glossary). The first save creates a beat and keeps its
 * id; every save after that patches it, so five clicks leave one row, not five.
 */
@Injectable({ providedIn: 'root' })
export class BeatsStore {
  private readonly api = inject(ApiClient);
  private readonly storage = inject(StorageService);

  private readonly _currentBeat = signal<Beat | null>(null);
  private readonly _status = signal<SaveStatus>('idle');
  private readonly _error = signal<string | null>(null);
  private readonly _total = signal<number | null>(null);

  readonly currentBeat = this._currentBeat.asReadonly();
  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();
  /** How many beats the account has, from the list call after a save. */
  readonly total = this._total.asReadonly();

  readonly isSaving = computed(() => this._status() === 'saving');
  /** A title is only asked for once — the first save of a fresh pattern. */
  readonly needsTitle = computed(() => this._currentBeat() === null);

  /**
   * Create the beat, or update it if this pattern has already been saved.
   * `title` is required for the first save and ignored afterwards: renaming is
   * a separate act, and silently retitling on every save would surprise people.
   */
  async save(snapshot: PersistedSnapshot, title?: string): Promise<boolean> {
    const data: BeatData = this.storage.toSavedState(snapshot);
    const existing = this._currentBeat();

    this._status.set('saving');
    this._error.set(null);

    try {
      const beat =
        existing === null
          ? await firstValueFrom(this.api.createBeat({ title: (title ?? '').trim(), data }))
          : await firstValueFrom(this.api.updateBeat(existing.id, { data }));

      this._currentBeat.set(beat);
      this._status.set('saved');
      void this.refreshTotal();

      return true;
    } catch (error) {
      this._error.set(messageFor(error));
      this._status.set('error');

      return false;
    }
  }

  /**
   * Forget the current beat, so the next save creates a new one. Clearing the
   * pattern or loading a kit both mean "I am starting something else".
   */
  reset(): void {
    this._currentBeat.set(null);
    this._status.set('idle');
    this._error.set(null);
  }

  /** Drop a confirmation once it has been shown. */
  acknowledge(): void {
    if (this._status() === 'saved' || this._status() === 'error') this._status.set('idle');
  }

  /**
   * There is no list UI yet, so the list call exists to prove the round trip and
   * to report a count. A failure here must not turn a successful save into an
   * error, so it is swallowed.
   */
  private async refreshTotal(): Promise<void> {
    try {
      this._total.set((await firstValueFrom(this.api.listBeats())).meta.total);
    } catch {
      // the save itself succeeded; a missing count is not worth reporting
    }
  }
}

function messageFor(error: unknown): string {
  const apiError = error as ApiError | null;

  switch (apiError?.kind) {
    case 'offline':
      return 'Cannot reach the server. Is it running?';
    case 'unauthorized':
      return 'Your session expired. Sign in and try again.';
    case 'invalid':
      return apiError.detail ?? 'The server refused that beat. Check the title.';
    default:
      return 'Could not save. Try again.';
  }
}
