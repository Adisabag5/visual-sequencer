import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Step } from '../../../core/models';

const PIXELS_PER_SEMITONE = 8;
const DRAG_THRESHOLD = 3;
const MAX_PITCH = 12;

/** A single step orb. Renders the four states; an on-step doubles as a pitch knob. */
@Component({
  selector: 'app-step-orb',
  imports: [],
  templateUrl: './step-orb.html',
  styleUrl: './step-orb.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepOrb {
  readonly step = input.required<Step>();
  /** True when the playhead is on this step while playing. */
  readonly current = input(false);
  /** True when the owning track is muted (dims an on-step). */
  readonly muted = input(false);
  /** The track's two colors. */
  readonly main = input('#9e86e8');
  readonly light = input('#c7b8f5');
  readonly stepToggle = output<void>();
  /** New absolute pitch (−12…+12) while turning the knob. */
  readonly pitchChange = output<number>();

  protected readonly dragging = signal(false);
  private startY = 0;
  private startPitch = 0;
  private pointerId?: number;
  private moved = false;

  private readonly isHit = computed(() => this.step().on && this.current() && !this.muted());
  private readonly isPlayhead = computed(() => !this.step().on && this.current());

  /** At-rest pitch indicator (only for tweaked on-steps). */
  protected readonly showNotch = computed(() => this.step().on && this.step().pitch !== 0);
  protected readonly notchAngle = computed(() => (this.step().pitch / MAX_PITCH) * 135);
  protected readonly pitchLabel = computed(() => {
    const p = this.step().pitch;
    return p > 0 ? `+${p}` : String(p);
  });

  /** Background / shadow / transform per the four states (design handoff). */
  protected readonly orb = computed<{ background: string; shadow: string; transform: string }>(
    () => {
      const main = this.main();
      const light = this.light();
      if (this.isHit()) {
        return {
          background: `radial-gradient(circle at 50% 36%, #fff, #F2C84B 34%, ${main})`,
          shadow: `0 0 22px 5px ${main}cc, 0 0 46px #F2C84B88`,
          transform: 'scale(1.22)',
        };
      }
      if (this.step().on) {
        return {
          background: `radial-gradient(circle at 50% 36%, ${light}, ${main})`,
          shadow: `0 0 16px ${main}99, inset 0 1px 1px rgba(255, 255, 255, 0.55)`,
          transform: 'none',
        };
      }
      if (this.isPlayhead()) {
        return {
          background: 'rgba(242, 200, 75, 0.22)',
          shadow: 'inset 0 0 0 1.5px #F2C84B, 0 0 12px rgba(242, 200, 75, 0.5)',
          transform: 'none',
        };
      }
      return { background: '#ffffff', shadow: 'var(--shadow-cell-off)', transform: 'none' };
    },
  );

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

function clampPitch(n: number): number {
  return Math.min(MAX_PITCH, Math.max(-MAX_PITCH, n));
}
