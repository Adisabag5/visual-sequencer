import { Kit, KitId } from './models';

/**
 * The three preset kits (claude-docs/06-design-handoff.md, v2).
 * Patterns are written in beat groups of four for readability.
 */

/** Parse a '1000 1000 …' beat string into a 16-entry 0/1 array. */
function pattern(beats: string): number[] {
  return [...beats.replace(/\s+/g, '')].map(Number);
}

export const KITS: readonly Kit[] = [
  {
    id: 'musical8',
    name: 'Musical 8',
    desc: 'Full backbone + 3 tonal voices — grooves and plays a tune.',
    slots: [
      { voice: 'kick', pattern: pattern('1000 1000 1000 1000'), vol: 0.9 },
      { voice: 'sub', pattern: pattern('1000 0010 1000 0010'), vol: 0.8 },
      { voice: 'snare', pattern: pattern('0000 1000 0000 1000'), vol: 0.8 },
      { voice: 'clap', pattern: pattern('0000 1000 0000 1001'), vol: 0.65 },
      { voice: 'hatC', pattern: pattern('1010 1010 1010 1010'), vol: 0.55 },
      { voice: 'hatO', pattern: pattern('0010 0010 0010 0110'), vol: 0.5 },
      { voice: 'lowtom', pattern: pattern('0000 0000 0010 0010'), vol: 0.6 },
      { voice: 'stab', pattern: pattern('1000 0000 0010 0000'), vol: 0.6 },
    ],
  },
  {
    id: 'club',
    name: 'Club / Techno',
    desc: 'Dry, hypnotic, four-on-the-floor. Fewer tonal slots.',
    slots: [
      { voice: 'kick', pattern: pattern('1000 1000 1000 1000'), vol: 0.95 },
      { voice: 'sub', pattern: pattern('1010 0010 1010 0010'), vol: 0.75 },
      { voice: 'clap', pattern: pattern('0000 1000 0000 1000'), vol: 0.7 },
      { voice: 'rimshot', pattern: pattern('0010 0010 0010 0010'), vol: 0.5 },
      { voice: 'hatC', pattern: pattern('1010 1010 1010 1010'), vol: 0.5 },
      { voice: 'hatO', pattern: pattern('0010 0010 0010 0010'), vol: 0.45 },
      { voice: 'ride', pattern: pattern('1000 1000 1000 1000'), vol: 0.4 },
      { voice: 'zap', pattern: pattern('0000 0000 0000 0010'), vol: 0.5 },
    ],
  },
  {
    id: 'lofi',
    name: 'Lo-fi / Organic',
    desc: 'Warm, sparse, characterful. Softer and human.',
    slots: [
      { voice: 'kick', pattern: pattern('1000 0000 1000 0000'), vol: 0.75 },
      { voice: 'synthbass', pattern: pattern('1000 0010 0010 0000'), vol: 0.7 },
      { voice: 'rimshot', pattern: pattern('0000 1000 0000 1000'), vol: 0.5 },
      { voice: 'brush', pattern: pattern('0000 0000 0000 1000'), vol: 0.55 },
      { voice: 'shaker', pattern: pattern('0010 1010 0010 1010'), vol: 0.45 },
      { voice: 'conga', pattern: pattern('0000 0010 0000 0010'), vol: 0.5 },
      { voice: 'bell', pattern: pattern('1000 0000 0000 0000'), vol: 0.45 },
      { voice: 'vinyl', pattern: pattern('1000 0000 1000 0000'), vol: 0.4 },
    ],
  },
];

/** The kit loaded on first run (no saved state). */
export const DEFAULT_KIT_ID: KitId = 'musical8';

/** Look up a kit by id. */
export function getKit(id: KitId): Kit {
  const kit = KITS.find((k) => k.id === id);
  if (!kit) throw new Error(`Unknown kit: ${id}`);
  return kit;
}

/** Validate an untrusted kit id (e.g. from a stale save). */
export function isKitId(id: unknown): id is KitId {
  return typeof id === 'string' && KITS.some((k) => k.id === id);
}
