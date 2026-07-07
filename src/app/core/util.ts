import { PITCH_RANGE } from './constants';

/** Clamp a number into [min, max]. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Clamp to 0…1; non-finite input becomes 0 (guards untrusted saves). */
export function clamp01(n: number): number {
  return Number.isFinite(n) ? clamp(n, 0, 1) : 0;
}

/** Clamp to whole semitones in ±PITCH_RANGE; non-finite input becomes 0. */
export function clampPitch(n: number): number {
  return Number.isFinite(n) ? clamp(Math.round(n), -PITCH_RANGE, PITCH_RANGE) : 0;
}

/**
 * The single audibility predicate (design handoff, "Per-track solo"):
 * while any track is soloed only soloed tracks sound; otherwise mute rules apply.
 * Used by the scheduler, click-audition, and the row dimming so audio and
 * visuals always agree.
 */
export function isTrackAudible(
  track: { muted: boolean; soloed: boolean },
  anySoloed: boolean,
): boolean {
  return anySoloed ? track.soloed : !track.muted;
}
