import { inject, Injectable, signal } from '@angular/core';
import { createKit } from '../core/kit';
import { Track } from '../core/models';
import { SavedTrack, StorageService } from './storage.service';

/**
 * Single source of truth for the pattern (tracks + steps).
 * Exposes readonly signals; mutations happen only via intent methods.
 */
@Injectable({ providedIn: 'root' })
export class PatternStore {
  private readonly _tracks = signal<Track[]>(createKit());

  /** All tracks in the pattern. */
  readonly tracks = this._tracks.asReadonly();

  constructor() {
    const saved = inject(StorageService).restore();
    if (saved) this._tracks.set(applySaved(saved.tracks));
  }

  /** Toggle a single step on/off. */
  toggleStep(trackIndex: number, stepIndex: number): void {
    this._tracks.update((tracks) =>
      tracks.map((track, ti) =>
        ti !== trackIndex
          ? track
          : {
              ...track,
              steps: track.steps.map((step, si) =>
                si !== stepIndex ? step : { ...step, on: !step.on },
              ),
            },
      ),
    );
  }

  /** Toggle a track's mute flag. */
  toggleMute(trackIndex: number): void {
    this._tracks.update((tracks) =>
      tracks.map((track, ti) => (ti !== trackIndex ? track : { ...track, muted: !track.muted })),
    );
  }

  /** Toggle a track's solo flag. */
  toggleSolo(trackIndex: number): void {
    this._tracks.update((tracks) =>
      tracks.map((track, ti) => (ti !== trackIndex ? track : { ...track, soloed: !track.soloed })),
    );
  }

  /** Set a step's pitch offset (clamped −12…+12 semitones). */
  setStepPitch(trackIndex: number, stepIndex: number, pitch: number): void {
    const p = Math.min(12, Math.max(-12, Math.round(pitch)));
    this._tracks.update((tracks) =>
      tracks.map((track, ti) =>
        ti !== trackIndex
          ? track
          : {
              ...track,
              steps: track.steps.map((step, si) =>
                si !== stepIndex ? step : { ...step, pitch: p },
              ),
            },
      ),
    );
  }

  /** Set a track's volume (0…1). */
  setVolume(trackIndex: number, vol: number): void {
    this._tracks.update((tracks) =>
      tracks.map((track, ti) => (ti !== trackIndex ? track : { ...track, vol })),
    );
  }

  /** Turn every step off (keeps per-track settings). */
  clear(): void {
    this._tracks.update((tracks) =>
      tracks.map((track) => ({
        ...track,
        steps: track.steps.map(() => ({ on: false, pitch: 0 })),
      })),
    );
  }
}

/** Overlay validated saved per-track state onto a fresh kit (by index). */
function applySaved(saved: SavedTrack[]): Track[] {
  const kit = createKit();
  if (!Array.isArray(saved) || saved.length !== kit.length) return kit;
  return kit.map((track, i) => {
    const s = saved[i];
    if (!s || !Array.isArray(s.steps) || s.steps.length !== track.steps.length) return track;
    return {
      ...track,
      vol: clamp01(Number(s.vol)),
      muted: !!s.muted,
      soloed: !!s.soloed,
      steps: s.steps.map((st) => ({ on: !!st.on, pitch: clampPitch(Number(st.pitch)) })),
    };
  });
}

function clamp01(n: number): number {
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}

function clampPitch(n: number): number {
  return Number.isFinite(n) ? Math.min(12, Math.max(-12, Math.round(n))) : 0;
}
