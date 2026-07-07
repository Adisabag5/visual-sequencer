import { inject, Injectable, signal } from '@angular/core';
import { STEP_COUNT, TRACK_COUNT } from '../core/constants';
import { createTrack, tracksFromKit } from '../core/kit';
import { DEFAULT_KIT_ID, getKit } from '../core/kits';
import { KitId, Step, Track, VoiceId } from '../core/models';
import { clamp01, clampPitch } from '../core/util';
import { isVoiceId } from '../core/voice-library';
import { SavedTrack, StorageService } from './storage.service';

/**
 * Single source of truth for the pattern (tracks + steps) and the active kit.
 * Exposes readonly signals; mutations happen only via intent methods.
 */
@Injectable({ providedIn: 'root' })
export class PatternStore {
  // Fresh start: the default preset kit, patterns included.
  private readonly _tracks = signal<Track[]>(tracksFromKit(getKit(DEFAULT_KIT_ID)));
  private readonly _activeKit = signal<KitId | null>(DEFAULT_KIT_ID);

  /** All tracks in the pattern. */
  readonly tracks = this._tracks.asReadonly();

  /** The loaded preset kit; null once a voice is swapped (renders as "Custom kit"). */
  readonly activeKit = this._activeKit.asReadonly();

  constructor() {
    const saved = inject(StorageService).restore();
    if (saved) {
      const tracks = applySaved(saved.tracks);
      if (tracks) {
        this._tracks.set(tracks);
        this._activeKit.set(saved.activeKit);
      }
    }
  }

  /**
   * Load a preset kit: replaces every track's voice, pattern, and volume.
   * Step pitches reset to 0 and mutes are cleared (per the design handoff);
   * solos are cleared too, for consistency — a kit load is a full reset.
   */
  loadKit(id: KitId): void {
    this._tracks.set(tracksFromKit(getKit(id)));
    this._activeKit.set(id);
  }

  /**
   * Swap one track's voice, keeping its steps, volume, mute, and solo.
   * Name/colors are re-derived from the voice (createTrack is the one place
   * that derivation lives). Prototype parity: only a voice swap marks the
   * kit custom — step/mute/solo/volume/clear edits keep the active kit.
   */
  setVoice(trackIndex: number, voice: VoiceId): void {
    this.updateTrack(trackIndex, (track) => ({
      ...createTrack(voice, track.vol),
      steps: track.steps,
      muted: track.muted,
      soloed: track.soloed,
    }));
    this._activeKit.set(null);
  }

  /** Toggle a single step on/off. */
  toggleStep(trackIndex: number, stepIndex: number): void {
    this.updateStep(trackIndex, stepIndex, (step) => ({ ...step, on: !step.on }));
  }

  /** Toggle a track's mute flag. */
  toggleMute(trackIndex: number): void {
    this.updateTrack(trackIndex, (track) => ({ ...track, muted: !track.muted }));
  }

  /** Toggle a track's solo flag. */
  toggleSolo(trackIndex: number): void {
    this.updateTrack(trackIndex, (track) => ({ ...track, soloed: !track.soloed }));
  }

  /** Set a step's pitch offset (clamped to whole semitones, ±PITCH_RANGE). */
  setStepPitch(trackIndex: number, stepIndex: number, pitch: number): void {
    const p = clampPitch(pitch);
    this.updateStep(trackIndex, stepIndex, (step) => ({ ...step, pitch: p }));
  }

  /** Set a track's volume (0…1). */
  setVolume(trackIndex: number, vol: number): void {
    this.updateTrack(trackIndex, (track) => ({ ...track, vol }));
  }

  /** Turn every step off (keeps per-track settings and the active kit). */
  clear(): void {
    this._tracks.update((tracks) =>
      tracks.map((track) => ({
        ...track,
        steps: track.steps.map(() => ({ on: false, pitch: 0 })),
      })),
    );
  }

  /** Immutably replace one track. */
  private updateTrack(trackIndex: number, change: (track: Track) => Track): void {
    this._tracks.update((tracks) =>
      tracks.map((track, ti) => (ti === trackIndex ? change(track) : track)),
    );
  }

  /** Immutably replace one step of one track. */
  private updateStep(trackIndex: number, stepIndex: number, change: (step: Step) => Step): void {
    this.updateTrack(trackIndex, (track) => ({
      ...track,
      steps: track.steps.map((step, si) => (si === stepIndex ? change(step) : step)),
    }));
  }
}

/**
 * Rebuild tracks from validated saved state (voice + steps + settings).
 * Returns null when the shape doesn't fit — caller keeps the default kit.
 */
function applySaved(saved: SavedTrack[]): Track[] | null {
  if (!Array.isArray(saved) || saved.length !== TRACK_COUNT) return null;
  const tracks: Track[] = [];
  for (const s of saved) {
    if (!s || !Array.isArray(s.steps) || s.steps.length !== STEP_COUNT) return null;
    const voice: VoiceId = isVoiceId(s.voice) ? s.voice : 'kick';
    tracks.push({
      ...createTrack(voice, clamp01(Number(s.vol))),
      muted: !!s.muted,
      soloed: !!s.soloed,
      steps: s.steps.map((st) => ({ on: !!st.on, pitch: clampPitch(Number(st.pitch)) })),
    });
  }
  return tracks;
}
