import { STEP_COUNT, TRACK_COUNT } from './constants';
import { Kit, KitSlot, Step, Track, VoiceId } from './models';
import { VOICE_LIBRARY, voiceColors } from './voice-library';

/**
 * Track factories. A track's name and colors are always derived from its
 * voice (via the voice library + category colors) — never set by hand.
 */

function emptySteps(): Step[] {
  return Array.from({ length: STEP_COUNT }, () => ({ on: false, pitch: 0 }));
}

/** Build a track for a voice. Steps come from a 0/1 kit pattern, or all-off. */
export function createTrack(voice: VoiceId, vol: number, pattern?: readonly number[]): Track {
  const { main, light } = voiceColors(voice);
  return {
    voice,
    name: VOICE_LIBRARY[voice].name,
    category: VOICE_LIBRARY[voice].category,
    steps: pattern
      ? pattern.slice(0, STEP_COUNT).map((on) => ({ on: !!on, pitch: 0 }))
      : emptySteps(),
    vol,
    muted: false,
    soloed: false,
    main,
    light,
  };
}

/** Build all tracks from a kit's slots (used by loadKit). */
export function tracksFromKit(kit: Kit): Track[] {
  return kit.slots
    .slice(0, TRACK_COUNT)
    .map((slot: KitSlot) => createTrack(slot.voice, slot.vol, slot.pattern));
}

/**
 * The pre-v2 default track list (empty steps). Interim: the state layer
 * replaces this with a full Musical 8 kit load in the v2 pass.
 */
const LEGACY_DEFAULT_SLOTS: readonly { voice: VoiceId; vol: number }[] = [
  { voice: 'kick', vol: 0.9 },
  { voice: 'snare', vol: 0.8 },
  { voice: 'clap', vol: 0.7 },
  { voice: 'hatC', vol: 0.55 },
  { voice: 'hatO', vol: 0.5 },
  { voice: 'lowtom', vol: 0.65 },
  { voice: 'cowbell', vol: 0.5 },
  { voice: 'crash', vol: 0.55 },
];

/** Build a fresh, empty pattern (legacy default voices, no steps). */
export function createKit(): Track[] {
  return LEGACY_DEFAULT_SLOTS.map((s) => createTrack(s.voice, s.vol));
}
