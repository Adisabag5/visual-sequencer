import { Injectable } from '@angular/core';
import { isKitId } from '../core/kits';
import { KitId, Track, VoiceId } from '../core/models';
import { isVoiceId } from '../core/voice-library';

/** What the app persists, in domain terms. The service owns the schema mapping. */
export interface PersistedSnapshot {
  bpm: number;
  activeKit: KitId | null;
  tracks: readonly Track[];
}

export interface SavedStep {
  on: boolean;
  pitch: number;
}
export interface SavedTrack {
  /** Which voice the track plays; validated on restore (unknown → 'kick'). */
  voice: VoiceId;
  steps: SavedStep[];
  vol: number;
  muted: boolean;
  soloed: boolean;
}
export interface SavedState {
  version: 2;
  bpm: number;
  /** The loaded preset kit, or null for a custom kit. */
  activeKit: KitId | null;
  tracks: SavedTrack[];
}

const KEY = 'pulse.state';
/** Pre-kit schema key. Read-only for migration; never written or deleted. */
const LEGACY_KEY = 'pulse.state.v1';
const DEBOUNCE_MS = 300;

/** The fixed voice each v1 track index played, for v1 → v2 migration. */
const V1_VOICES: readonly VoiceId[] = [
  'kick',
  'snare',
  'clap',
  'hatC',
  'hatO',
  'lowtom',
  'cowbell',
  'crash',
];

/** Persists the pattern + kit + tempo to localStorage (debounced) and restores it. */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private timer?: ReturnType<typeof setTimeout>;

  /**
   * Load saved state, or null if absent / unreadable / wrong version.
   * Reads the v2 key first; if it is absent, migrates a legacy v1 save
   * (the legacy key is left in place).
   */
  restore(): SavedState | null {
    const raw = readRaw(KEY);
    if (raw !== null) return sanitizeV2(parseJson(raw));
    const legacy = readRaw(LEGACY_KEY);
    if (legacy !== null) return migrateV1(parseJson(legacy));
    return null;
  }

  /** Debounced write. Callers pass domain values; the schema stays in here. */
  save(snapshot: PersistedSnapshot): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.writeNow(toSavedState(snapshot)), DEBOUNCE_MS);
  }

  private writeNow(state: SavedState): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // ignore quota / unavailable storage
    }
  }
}

/** Domain snapshot → the version-2 wire shape. */
function toSavedState(s: PersistedSnapshot): SavedState {
  return {
    version: 2,
    bpm: s.bpm,
    activeKit: s.activeKit,
    tracks: s.tracks.map((t) => ({
      voice: t.voice,
      steps: t.steps.map(({ on, pitch }) => ({ on, pitch })),
      vol: t.vol,
      muted: t.muted,
      soloed: t.soloed,
    })),
  };
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Accept only a version-2 shape; coerce untrusted ids to safe values. */
function sanitizeV2(data: unknown): SavedState | null {
  if (!isRecord(data) || data['version'] !== 2 || !Array.isArray(data['tracks'])) return null;
  return {
    version: 2,
    bpm: Number(data['bpm']),
    activeKit: isKitId(data['activeKit']) ? data['activeKit'] : null,
    tracks: data['tracks'].map((t: unknown) => sanitizeTrack(t, 'kick')),
  };
}

/** Migrate a version-1 save: voices come from the fixed v1 track lineup, kit is custom. */
function migrateV1(data: unknown): SavedState | null {
  if (!isRecord(data) || data['version'] !== 1 || !Array.isArray(data['tracks'])) return null;
  return {
    version: 2,
    bpm: Number(data['bpm']),
    // A v1 pattern predates presets — it is a custom kit.
    activeKit: null,
    tracks: data['tracks'].map((t: unknown, i: number) => sanitizeTrack(t, V1_VOICES[i] ?? 'kick')),
  };
}

/** Shape one saved track; unknown voice ids fall back to the given default. */
function sanitizeTrack(t: unknown, fallbackVoice: VoiceId): SavedTrack {
  const rec = isRecord(t) ? t : {};
  const voice = rec['voice'];
  return {
    voice: isVoiceId(voice) ? voice : fallbackVoice,
    steps: Array.isArray(rec['steps']) ? (rec['steps'] as SavedStep[]) : [],
    vol: Number(rec['vol']),
    muted: !!rec['muted'],
    soloed: !!rec['soloed'],
  };
}
