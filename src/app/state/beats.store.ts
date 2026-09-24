import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../api/api.client';
import { ApiError } from '../api/api.errors';
import { Beat, BeatData } from '../api/api.types';
import { PatternStore } from './pattern.store';
import { SavedState, StorageService } from './storage.service';
import { TransportStore } from './transport.store';

/** Where a save got to. The UI shows a confirmation on 'saved'. */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** Where the library listing got to. */
export type ListStatus = 'idle' | 'loading' | 'error';

/**
 * Owns the **current beat** and the **library** (see the glossary).
 *
 * The first save creates a beat and keeps its id; every save after that patches
 * it, so five clicks leave one row rather than five. Loading a beat from the
 * library makes it the current beat, so the next save updates what you just
 * opened instead of cloning it.
 */
@Injectable({ providedIn: 'root' })
export class BeatsStore {
  private readonly api = inject(ApiClient);
  private readonly storage = inject(StorageService);
  private readonly pattern = inject(PatternStore);
  private readonly transport = inject(TransportStore);

  private readonly _currentBeat = signal<Beat | null>(null);
  private readonly _status = signal<SaveStatus>('idle');
  private readonly _error = signal<string | null>(null);
  private readonly _beats = signal<readonly Beat[]>([]);
  private readonly _total = signal<number | null>(null);
  private readonly _hasNext = signal(false);
  private readonly _page = signal(1);
  private readonly _listStatus = signal<ListStatus>('idle');
  private readonly _listError = signal<string | null>(null);

  /**
   * The grid as it stood at the last save, load, or fresh start, serialised.
   * Comparing against it is what makes "unsaved changes" a fact rather than a
   * flag that can drift out of step with reality.
   */
  private readonly _baseline = signal<string | null>(null);

  readonly currentBeat = this._currentBeat.asReadonly();
  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();
  readonly beats = this._beats.asReadonly();
  readonly total = this._total.asReadonly();
  readonly hasNext = this._hasNext.asReadonly();
  readonly listStatus = this._listStatus.asReadonly();
  readonly listError = this._listError.asReadonly();

  readonly isSaving = computed(() => this._status() === 'saving');
  readonly isListLoading = computed(() => this._listStatus() === 'loading');

  /** A title is only asked for once — the first save of a fresh pattern. */
  readonly needsTitle = computed(() => this._currentBeat() === null);

  /** The grid right now, in the shape the server stores. */
  private readonly currentState = computed(() =>
    this.storage.toSavedState({
      bpm: this.transport.bpm(),
      activeKit: this.pattern.activeKit(),
      tracks: this.pattern.tracks(),
    }),
  );

  /** True when the grid has moved on since the last save, load or fresh start. */
  readonly isDirty = computed(() => {
    const baseline = this._baseline();

    return baseline !== null && baseline !== JSON.stringify(this.currentState());
  });

  constructor() {
    // A fresh page is not "unsaved changes" — whatever is on the grid at boot
    // is the starting point to measure against.
    this.rebaseline();
  }

  /**
   * Create the beat, or update it if this pattern has already been saved.
   * `title` is required for the first save and ignored afterwards: renaming is
   * a separate act, and silently retitling on every save would surprise people.
   */
  async save(title?: string): Promise<boolean> {
    const data: BeatData = this.currentState();
    const existing = this._currentBeat();

    this._status.set('saving');
    this._error.set(null);

    try {
      const beat =
        existing === null
          ? await firstValueFrom(this.api.createBeat({ title: (title ?? '').trim(), data }))
          : await firstValueFrom(this.api.updateBeat(existing.id, { data }));

      this.adopt(beat);
      this._status.set('saved');
      void this.refresh();

      return true;
    } catch (error) {
      this._error.set(messageFor(error));
      this._status.set('error');

      return false;
    }
  }

  /** Fetch the library's first page, replacing whatever is held. */
  refresh(): Promise<void> {
    return this.fetchPage(1, 'replace');
  }

  /**
   * Append the next page. Offset pagination can shift rows when the underlying
   * data changes between requests, so a beat saved meanwhile could in principle
   * repeat — the id guard below keeps it out rather than rendering it twice.
   */
  loadMore(): Promise<void> {
    if (!this._hasNext() || this.isListLoading()) return Promise.resolve();

    return this.fetchPage(this._page() + 1, 'append');
  }

  private async fetchPage(page: number, mode: 'replace' | 'append'): Promise<void> {
    this._listStatus.set('loading');
    this._listError.set(null);

    try {
      const result = await firstValueFrom(this.api.listBeats(page));

      this._beats.update((held) =>
        mode === 'replace' ? result.items : dedupeById([...held, ...result.items]),
      );
      this._page.set(result.meta.page);
      this._total.set(result.meta.total);
      this._hasNext.set(result.meta.hasNext);
      this._listStatus.set('idle');
    } catch (error) {
      this._listError.set(messageFor(error));
      this._listStatus.set('error');
    }
  }

  /**
   * Put a saved beat on the grid and make it the current beat. The blob is
   * validated first: a beat written by another build must not be able to leave
   * the grid half-applied.
   */
  load(beat: Beat): boolean {
    const state: SavedState | null = this.storage.parse(beat.data);

    if (state === null || !this.pattern.loadSaved(state)) {
      this._error.set('That beat could not be read. It may have been saved by a newer Pulse.');
      this._status.set('error');

      return false;
    }

    this.transport.setBpm(state.bpm);
    this.adopt(beat);
    this._status.set('idle');

    return true;
  }

  async rename(id: string, title: string): Promise<boolean> {
    const trimmed = title.trim();
    if (trimmed.length === 0) return false;

    try {
      const updated = await firstValueFrom(this.api.updateBeat(id, { title: trimmed }));

      this._beats.update((beats) => beats.map((beat) => (beat.id === id ? updated : beat)));
      if (this._currentBeat()?.id === id) this._currentBeat.set(updated);

      return true;
    } catch (error) {
      this._listError.set(messageFor(error));

      return false;
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.api.deleteBeat(id));

      this._beats.update((beats) => beats.filter((beat) => beat.id !== id));
      this._total.update((total) => (total === null ? null : Math.max(0, total - 1)));

      // Deleting the beat you are editing leaves the grid alone but detaches it:
      // the next save must create a new beat, not patch a row that is gone.
      if (this._currentBeat()?.id === id) this.reset();

      return true;
    } catch (error) {
      this._listError.set(messageFor(error));

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
    this.rebaseline();
  }

  /** Drop a confirmation once it has been shown. */
  acknowledge(): void {
    if (this._status() === 'saved' || this._status() === 'error') this._status.set('idle');
  }

  private adopt(beat: Beat): void {
    this._currentBeat.set(beat);
    this.rebaseline();
  }

  /** Treat the grid as it stands as the new "no unsaved changes" mark. */
  private rebaseline(): void {
    this._baseline.set(JSON.stringify(this.currentState()));
  }
}

function dedupeById(beats: readonly Beat[]): Beat[] {
  const seen = new Map(beats.map((beat) => [beat.id, beat]));

  return [...seen.values()];
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
