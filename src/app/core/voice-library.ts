import { Category, VoiceDef, VoiceId } from './models';

/** Category → track colors (claude-docs/06-design-handoff.md, v2). */
export const CATEGORY_COLORS: Record<Category, { main: string; light: string }> = {
  low: { main: '#9E86E8', light: '#C7B8F5' },
  tonal: { main: '#3FA9E8', light: '#9AD8F2' },
  snare: { main: '#7C66D6', light: '#B3A0EE' },
  hat: { main: '#2FCB97', light: '#9BE8C8' },
  perc: { main: '#EBA92E', light: '#F6D885' },
  fx: { main: '#E86FA6', light: '#F4AECB' },
};

/** Category display labels (kit-panel voice-picker groups). */
export const CATEGORY_LABELS: Record<Category, string> = {
  low: 'Low end',
  tonal: 'Bass / tonal',
  snare: 'Snare family',
  hat: 'Hats / cymbals',
  perc: 'Toms / perc',
  fx: 'FX / texture',
};

/** Display order of the categories. */
export const CATEGORY_ORDER: readonly Category[] = ['low', 'tonal', 'snare', 'hat', 'perc', 'fx'];

/** The voice library: every voice, id → display name + category. */
export const VOICE_LIBRARY: Record<VoiceId, VoiceDef> = {
  kick: { name: 'Kick', category: 'low' },
  punch: { name: 'Punch Kick', category: 'low' },
  eight08: { name: '808 Kick', category: 'low' },
  sub: { name: 'Sub Bass', category: 'tonal' },
  synthbass: { name: 'Synth Bass', category: 'tonal' },
  pluck: { name: 'Pluck', category: 'tonal' },
  stab: { name: 'Synth Stab', category: 'tonal' },
  bell: { name: 'Bell', category: 'tonal' },
  marimba: { name: 'Marimba', category: 'tonal' },
  snare: { name: 'Snare', category: 'snare' },
  clap: { name: 'Clap', category: 'snare' },
  rimshot: { name: 'Rimshot', category: 'snare' },
  brush: { name: 'Brush Snare', category: 'snare' },
  hatC: { name: 'Closed Hat', category: 'hat' },
  hatO: { name: 'Open Hat', category: 'hat' },
  shaker: { name: 'Shaker', category: 'hat' },
  ride: { name: 'Ride', category: 'hat' },
  crash: { name: 'Crash', category: 'hat' },
  tamb: { name: 'Tambourine', category: 'hat' },
  lowtom: { name: 'Low Tom', category: 'perc' },
  midtom: { name: 'Mid Tom', category: 'perc' },
  conga: { name: 'Conga', category: 'perc' },
  bongo: { name: 'Bongo', category: 'perc' },
  cowbell: { name: 'Cowbell', category: 'perc' },
  clave: { name: 'Clave', category: 'perc' },
  woodblock: { name: 'Woodblock', category: 'perc' },
  zap: { name: 'Zap', category: 'fx' },
  blip: { name: 'Blip', category: 'fx' },
  sweep: { name: 'Noise Sweep', category: 'fx' },
  vinyl: { name: 'Vinyl Crackle', category: 'fx' },
};

/** All voice ids, in library order. */
export const VOICE_IDS = Object.keys(VOICE_LIBRARY) as readonly VoiceId[];

/** Validate an untrusted id (e.g. from a stale save). */
export function isVoiceId(id: unknown): id is VoiceId {
  return typeof id === 'string' && id in VOICE_LIBRARY;
}

/** A voice's colors, from its category. */
export function voiceColors(voice: VoiceId): { main: string; light: string } {
  return CATEGORY_COLORS[VOICE_LIBRARY[voice].category];
}
