import { inject, Injectable, signal } from '@angular/core';
import { DEFAULT_BPM, MAX_BPM, MIN_BPM } from '../core/constants';
import { clamp } from '../core/util';
import { Playhead } from '../audio/playhead';
import { StorageService } from './storage.service';

/**
 * Single source of truth for transport state: play/stop, tempo, playhead.
 * Readonly signals out; mutations only via intent methods.
 */
@Injectable({ providedIn: 'root' })
export class TransportStore {
  private readonly playhead = inject(Playhead);

  private readonly _bpm = signal(DEFAULT_BPM);
  private readonly _isPlaying = signal(false);

  readonly bpm = this._bpm.asReadonly();
  readonly isPlaying = this._isPlaying.asReadonly();

  /**
   * The playhead, read straight from the engine rather than copied into a
   * signal of our own. It belongs to the audio clock — the engine sets it from
   * inside the scheduled tick, which is the only place that knows where the
   * music actually is. Keeping a second copy in step meant an effect writing
   * state, and a copy that can lag or drift; this cannot.
   *
   * Read from the Playhead holder rather than from AudioEngine directly: the
   * holder imports nothing but Angular, so transport state does not drag
   * Tone.js into every test that touches it.
   */
  readonly currentStep = this.playhead.step;

  constructor() {
    const saved = inject(StorageService).restore();
    if (saved && Number.isFinite(saved.bpm)) this.setBpm(saved.bpm);
  }

  play(): void {
    this._isPlaying.set(true);
  }

  stop(): void {
    this._isPlaying.set(false);
    // the engine rewinds its own playhead in stop(); nothing to mirror
  }

  /** Set tempo, clamped to the allowed range. */
  setBpm(bpm: number): void {
    this._bpm.set(clamp(bpm, MIN_BPM, MAX_BPM));
  }
}
