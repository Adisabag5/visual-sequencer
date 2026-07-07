/** Fixed sequencer dimensions & tempo bounds. No magic numbers elsewhere. */
export const STEP_COUNT = 16;
export const TRACK_COUNT = 8;

export const DEFAULT_BPM = 118;
export const MIN_BPM = 60;
export const MAX_BPM = 180;

/** Per-step pitch range: ±12 semitones (two octaves total). */
export const PITCH_RANGE = 12;

/** Steps per beat group — the grid renders 4 groups of 4. */
export const STEPS_PER_BEAT = 4;
/** Indices 0…3, shared by the ruler and track rows for the 4×4 beat layout. */
export const BEAT_INDICES: readonly number[] = Array.from({ length: STEPS_PER_BEAT }, (_, i) => i);
