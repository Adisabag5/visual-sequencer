/** Domain types. Glossary names only (see claude-docs/02-glossary.md). */

/** One of the six voice groups; decides a track's colors. */
export type Category = 'low' | 'tonal' | 'snare' | 'hat' | 'perc' | 'fx';

/** Identifier of a voice in the voice library. */
export type VoiceId =
  | 'kick'
  | 'punch'
  | 'eight08'
  | 'sub'
  | 'synthbass'
  | 'pluck'
  | 'stab'
  | 'bell'
  | 'marimba'
  | 'snare'
  | 'clap'
  | 'rimshot'
  | 'brush'
  | 'hatC'
  | 'hatO'
  | 'shaker'
  | 'ride'
  | 'crash'
  | 'tamb'
  | 'lowtom'
  | 'midtom'
  | 'conga'
  | 'bongo'
  | 'cowbell'
  | 'clave'
  | 'woodblock'
  | 'zap'
  | 'blip'
  | 'sweep'
  | 'vinyl';

/** A named synthesized sound in the voice library. */
export interface VoiceDef {
  name: string;
  category: Category;
}

/** One of the 16 positions in a track: on/off plus a per-step pitch offset. */
export interface Step {
  on: boolean;
  /** Semitone offset, −12…+12. Default 0 (no change). */
  pitch: number;
}

/** One instrument row: points at a voice; its 16 steps and per-track settings. */
export interface Track {
  /** The voice this track plays. */
  voice: VoiceId;
  /** Display name — derived from the voice. Maintained by the store, never edited directly. */
  name: string;
  /** The voice's category — derived; drives the `.cat-*` color classes in CSS. */
  category: Category;
  steps: Step[];
  /** Per-track level, 0…1. */
  vol: number;
  muted: boolean;
  soloed: boolean;
  /** Main accent color — derived from the voice's category. */
  main: string;
  /** Lighter accent color — derived from the voice's category. */
  light: string;
}

/** The full pattern: every track and its settings. */
export type Pattern = Track[];

export type KitId = 'musical8' | 'club' | 'lofi';

/** One kit entry for a track: a voice, a 16-step pattern, and a volume. */
export interface KitSlot {
  voice: VoiceId;
  /** 16 steps, 0/1. */
  pattern: readonly number[];
  vol: number;
}

/** A named preset snapshot of all 8 tracks (voice + pattern + volume each). */
export interface Kit {
  id: KitId;
  name: string;
  desc: string;
  slots: readonly KitSlot[];
}
