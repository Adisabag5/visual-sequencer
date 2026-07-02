/** Domain types. Glossary names only (see claude-docs/02-glossary.md). */

/** The synthesis routine a track uses. */
export type Voice = 'kick' | 'snare' | 'clap' | 'hat' | 'ohat' | 'tom' | 'cow' | 'crash';

/** One of the 16 positions in a track: on/off plus a per-step pitch offset. */
export interface Step {
  on: boolean;
  /** Semitone offset, −12…+12. Default 0 (no change). */
  pitch: number;
}

/** One instrument row: its voice, its 16 steps, and per-track settings. */
export interface Track {
  name: string;
  voice: Voice;
  steps: Step[];
  /** Per-track level, 0…1. */
  vol: number;
  muted: boolean;
  soloed: boolean;
  /** Main accent color (from the design handoff). */
  main: string;
  /** Lighter accent color (from the design handoff). */
  light: string;
}

/** The full pattern: every track and its settings. */
export type Pattern = Track[];
