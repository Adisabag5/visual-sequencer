import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { BEAT_INDICES, STEP_COUNT, STEPS_PER_BEAT } from '../../../core/constants';
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
  host: {
    class: 'block px-[30px] py-[26px]',
  },
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
    this.isBeat(i) ? String(i / STEPS_PER_BEAT + 1) : '·',
  );

  /** Same 4-groups-of-4 layout as the track rows, so the ruler stays aligned. */
  protected readonly beats = BEAT_INDICES;
  protected readonly stepsPerBeat = STEPS_PER_BEAT;

  /** Ruler slot showing a beat number (every 4th step). */
  protected isBeat(i: number): boolean {
    return i % STEPS_PER_BEAT === 0;
  }

  /** Ruler slot under the playhead while playing (lights amber). */
  protected isPlayheadCol(i: number): boolean {
    return this.isPlaying() && i === this.currentStep();
  }
}
