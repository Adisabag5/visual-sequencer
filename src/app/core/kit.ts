import { STEP_COUNT } from './constants';
import { Step, Track, Voice } from './models';

/** Static definition of one kit voice (colors from claude-docs/06-design-handoff.md). */
interface KitVoiceDef {
  name: string;
  voice: Voice;
  vol: number;
  main: string;
  light: string;
}

/**
 * The kit. Wireframe stage ships **Kick only**; the other 7 tracks are one
 * line each to add here (data-driven, nothing else changes).
 */
const KIT_DEFS: readonly KitVoiceDef[] = [
  { name: 'Kick', voice: 'kick', vol: 0.9, main: '#9E86E8', light: '#C7B8F5' },
  { name: 'Snare', voice: 'snare', vol: 0.8, main: '#3FA9E8', light: '#9AD8F2' },
  { name: 'Clap', voice: 'clap', vol: 0.7, main: '#7C66D6', light: '#B3A0EE' },
  { name: 'Closed Hat', voice: 'hat', vol: 0.55, main: '#2FCB97', light: '#9BE8C8' },
  { name: 'Open Hat', voice: 'ohat', vol: 0.5, main: '#EBA92E', light: '#F6D885' },
  { name: 'Low Tom', voice: 'tom', vol: 0.65, main: '#3FA9E8', light: '#9AD8F2' },
  { name: 'Rim/Cowbell', voice: 'cow', vol: 0.5, main: '#2FCB97', light: '#9BE8C8' },
  { name: 'Crash', voice: 'crash', vol: 0.55, main: '#9E86E8', light: '#C7B8F5' },
];

function emptySteps(): Step[] {
  return Array.from({ length: STEP_COUNT }, () => ({ on: false, pitch: 0 }));
}

/** Build a fresh, empty pattern from the kit definition. */
export function createKit(): Track[] {
  return KIT_DEFS.map((def) => ({
    name: def.name,
    voice: def.voice,
    steps: emptySteps(),
    vol: def.vol,
    muted: false,
    soloed: false,
    main: def.main,
    light: def.light,
  }));
}
