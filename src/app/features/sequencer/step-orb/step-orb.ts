import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { PITCH_RANGE } from '../../../core/constants';
import { Step } from '../../../core/models';
import { clampPitch } from '../../../core/util';

const PIXELS_PER_SEMITONE = 8;
const DRAG_THRESHOLD = 3;

/**
 * A single step orb. Renders the four states; an on-step doubles as a pitch knob.
 * Colors are consumed from the enclosing `.cat-*` scope (--track-main/--track-light);
 * the notch angle crosses into CSS as the --notch-deg custom property.
 */
@Component({
  selector: 'app-step-orb',
  imports: [],
  templateUrl: './step-orb.html',
  styleUrl: './step-orb.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--notch-deg]': 'notchDeg()',
  },
})
export class StepOrb {
  readonly step = input.required<Step>();
  /** True when the playhead is on this step while playing. */
  readonly current = input(false);
  /** True when the owning track is muted (dims an on-step). */
  readonly muted = input(false);
  readonly stepToggle = output<void>();
  /** New absolute pitch (−12…+12) while turning the knob. */
  readonly pitchChange = output<number>();

  protected readonly dragging = signal(false);
  private startY = 0;
  private startPitch = 0;
  private pointerId?: number;
  private moved = false;

  protected readonly isHit = computed(() => this.step().on && this.current() && !this.muted());
  protected readonly isPlayhead = computed(() => !this.step().on && this.current());

  /** At-rest pitch indicator (only for tweaked on-steps). */
  protected readonly showNotch = computed(() => this.step().on && this.step().pitch !== 0);
  /** ±PITCH_RANGE mapped to −135°…+135°, as a CSS length for the --notch-deg property. */
  protected readonly notchDeg = computed(() => `${(this.step().pitch / PITCH_RANGE) * 135}deg`);
  protected readonly pitchLabel = computed(() => {
    const p = this.step().pitch;
    return p > 0 ? `+${p}` : String(p);
  });

  onClick(): void {
    // A drag consumes the click so it doesn't also toggle the step.
    if (this.moved) {
      this.moved = false;
      return;
    }
    this.stepToggle.emit();
  }

  onPointerDown(e: PointerEvent): void {
    this.startY = e.clientY;
    this.startPitch = this.step().pitch;
    this.moved = false;
    this.pointerId = e.pointerId;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // pointer may not be capturable (synthetic events / edge cases)
    }
  }

  onPointerMove(e: PointerEvent): void {
    if (this.pointerId === undefined) return;
    const dy = this.startY - e.clientY; // up = higher
    if (Math.abs(dy) < DRAG_THRESHOLD) return;
    this.moved = true;
    if (!this.step().on) return; // pitch only applies to active steps
    this.dragging.set(true);
    const next = clampPitch(this.startPitch + Math.round(dy / PIXELS_PER_SEMITONE));
    if (next !== this.step().pitch) this.pitchChange.emit(next);
  }

  onPointerUp(e: PointerEvent): void {
    if (this.pointerId !== undefined) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(this.pointerId);
      } catch {
        // ignore
      }
      this.pointerId = undefined;
    }
    this.dragging.set(false);
  }

  onWheel(e: WheelEvent): void {
    if (!this.step().on) return;
    e.preventDefault();
    const next = clampPitch(this.step().pitch + (e.deltaY < 0 ? 1 : -1));
    if (next !== this.step().pitch) this.pitchChange.emit(next);
  }

  onReset(e: MouseEvent): void {
    e.preventDefault();
    if (this.step().on && this.step().pitch !== 0) this.pitchChange.emit(0);
  }
}
