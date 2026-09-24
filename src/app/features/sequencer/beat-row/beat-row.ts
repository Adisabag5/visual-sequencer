import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Beat } from '../../../api/api.types';

/** The maximum the server accepts for a beat title. */
const MAX_TITLE = 100;

/**
 * One row of the Library. Dumb by design: it renders a beat and emits intent,
 * exactly like kit-card. Renaming is the one piece of state it owns, because
 * the half-typed title belongs to this row and nothing else.
 */
@Component({
  selector: 'app-beat-row',
  imports: [DatePipe],
  templateUrl: './beat-row.html',
  styleUrl: './beat-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BeatRow {
  readonly beat = input.required<Beat>();
  /** True when this is the beat currently on the grid. */
  readonly active = input(false);

  /** Named loadBeat, not load: `load` is a native DOM event. Matches kit-card's loadKit. */
  readonly loadBeat = output<void>();
  readonly rename = output<string>();
  readonly remove = output<void>();

  readonly maxTitle = MAX_TITLE;

  private readonly _renaming = signal(false);
  private readonly _draft = signal('');

  readonly renaming = this._renaming.asReadonly();
  readonly draft = this._draft.asReadonly();

  /** The server requires 1-100 characters, so a blank rename is not offered. */
  readonly canConfirm = computed(() => this._draft().trim().length > 0);

  startRename(): void {
    this._draft.set(this.beat().title);
    this._renaming.set(true);
  }

  onDraftInput(value: string): void {
    this._draft.set(value);
  }

  confirmRename(): void {
    if (!this.canConfirm()) return;

    this._renaming.set(false);
    this.rename.emit(this._draft().trim());
  }

  cancelRename(): void {
    this._renaming.set(false);
    this._draft.set('');
  }
}
