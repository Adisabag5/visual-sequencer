import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Track } from '../../../core/models';
import { StepOrb } from '../step-orb/step-orb';

/** One track: label (mute + solo + name + volume) and its 16 steps. */
@Component({
  selector: 'app-track-row',
  imports: [StepOrb],
  templateUrl: './track-row.html',
  styleUrl: './track-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackRow {
  readonly track = input.required<Track>();
  readonly currentStep = input(0);
  readonly playing = input(false);
  /** Whether any track in the pattern is soloed. */
  readonly anySoloed = input(false);
  /** Emits the index of a toggled step. */
  readonly stepToggle = output<number>();
  /** Emits when the mute swatch is clicked. */
  readonly muteToggle = output<void>();
  /** Emits when the solo swatch is clicked. */
  readonly soloToggle = output<void>();
  /** Emits a new volume (0…1) while dragging the volume bar. */
  readonly volumeChange = output<number>();
  /** Emits a step's new pitch while turning its knob. */
  readonly pitchChange = output<{ stepIndex: number; pitch: number }>();

  /** This track is silent right now (muted, or not-soloed while others are). */
  protected readonly notAudible = computed(() => {
    const t = this.track();
    return this.anySoloed() ? !t.soloed : t.muted;
  });

  /** Steps are laid out as 4 beat-groups of 4 (keeps every orb the same size). */
  protected readonly groups = [0, 1, 2, 3];
  protected readonly quarter = [0, 1, 2, 3];
}
