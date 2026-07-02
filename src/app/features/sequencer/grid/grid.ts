import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { STEP_COUNT } from '../../../core/constants';
import { PatternStore } from '../../../state/pattern.store';
import { TransportStore } from '../../../state/transport.store';
import { TrackRow } from '../track-row/track-row';

/** The step grid: beat ruler + a row per track. Reads pattern + transport state. */
@Component({
  selector: 'app-grid',
  imports: [TrackRow],
  templateUrl: './grid.html',
  styleUrl: './grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Grid {
  private readonly pattern = inject(PatternStore);
  private readonly transport = inject(TransportStore);

  readonly tracks = this.pattern.tracks;
  readonly currentStep = this.transport.currentStep;
  readonly isPlaying = this.transport.isPlaying;
  readonly anySoloed = computed(() => this.tracks().some((t) => t.soloed));

  /** Emits which step of which track was toggled. */
  readonly stepToggle = output<{ trackIndex: number; stepIndex: number }>();
  /** Emits the index of a track whose mute was toggled. */
  readonly muteToggle = output<number>();
  /** Emits the index of a track whose solo was toggled. */
  readonly soloToggle = output<number>();
  /** Emits a track's new volume. */
  readonly volumeChange = output<{ trackIndex: number; value: number }>();
  /** Emits a step's new pitch. */
  readonly pitchChange = output<{ trackIndex: number; stepIndex: number; pitch: number }>();

  /** Beat numbers on every 4th slot, a dot on the rest. */
  protected readonly ruler = Array.from({ length: STEP_COUNT }, (_, i) =>
    i % 4 === 0 ? String(i / 4 + 1) : '·',
  );

  /** Same 4-groups-of-4 layout as the track rows, so the ruler stays aligned. */
  protected readonly groups = [0, 1, 2, 3];
  protected readonly quarter = [0, 1, 2, 3];

  /** Ruler color: amber under the playhead, muted violet on beats, else transparent. */
  protected rulerColor(i: number): string {
    if (this.isPlaying() && i === this.currentStep()) return '#e0a93b';
    return i % 4 === 0 ? '#a99ac9' : 'transparent';
  }
}
