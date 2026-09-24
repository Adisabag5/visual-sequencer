import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Beat } from '../../../api/api.types';
import { AuthStore } from '../../../state/auth.store';
import { BeatsStore } from '../../../state/beats.store';
import { LibraryPanelStore } from '../../../state/library-panel.store';
import { BeatRow } from '../beat-row/beat-row';

/**
 * The Library: a slide-out of the account's saved beats, mirroring the Kit
 * panel on the left. Rows are dumb; this shell owns the store wiring and the
 * two confirmations — loading over unsaved work, and deleting.
 */
@Component({
  selector: 'app-library-panel',
  imports: [BeatRow],
  templateUrl: './library-panel.html',
  styleUrl: './library-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryPanel {
  protected readonly panel = inject(LibraryPanelStore);
  protected readonly beats = inject(BeatsStore);
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  /** The beat a confirmation is currently asking about, if any. */
  private readonly _pendingLoad = signal<Beat | null>(null);
  private readonly _pendingDelete = signal<Beat | null>(null);

  protected readonly pendingLoad = this._pendingLoad.asReadonly();
  protected readonly pendingDelete = this._pendingDelete.asReadonly();

  constructor() {
    // The list is fetched when the panel opens rather than at boot: signed-out
    // visitors never need it, and a beat saved on another device should show up
    // when you go looking, not only after a reload.
    effect(() => {
      if (this.panel.panelOpen() && this.auth.isSignedIn()) void this.beats.refresh();
    });
  }

  protected signIn(): void {
    void this.router.navigate(['/auth']);
  }

  protected loadMore(): void {
    void this.beats.loadMore();
  }

  /** Load straight away, or ask first when it would discard unsaved work. */
  protected onLoad(beat: Beat): void {
    if (this.beats.isDirty()) {
      this._pendingLoad.set(beat);

      return;
    }

    this.beats.load(beat);
  }

  protected confirmLoad(): void {
    const beat = this._pendingLoad();
    this._pendingLoad.set(null);

    if (beat) this.beats.load(beat);
  }

  protected cancelLoad(): void {
    this._pendingLoad.set(null);
  }

  /** Deleting is always confirmed — there is no undo, and the row is gone. */
  protected onRemove(beat: Beat): void {
    this._pendingDelete.set(beat);
  }

  protected confirmDelete(): void {
    const beat = this._pendingDelete();
    this._pendingDelete.set(null);

    if (beat) void this.beats.remove(beat.id);
  }

  protected cancelDelete(): void {
    this._pendingDelete.set(null);
  }

  protected onRename(beat: Beat, title: string): void {
    void this.beats.rename(beat.id, title);
  }
}
