import { inject, Injectable, signal } from '@angular/core';
import { DEFAULT_BPM, MAX_BPM, MIN_BPM } from '../core/constants';
import { clamp } from '../core/util';
import { StorageService } from './storage.service';

/**
 * Single source of truth for transport state: play/stop, tempo, playhead.
 * Readonly signals out; mutations only via intent methods.
 */
@Injectable({ providedIn: 'root' })
export class TransportStore {
  private readonly _bpm = signal(DEFAULT_BPM);
  private readonly _isPlaying = signal(false);
  private readonly _currentStep = signal(0);

  readonly bpm = this._bpm.asReadonly();
  readonly isPlaying = this._isPlaying.asReadonly();
  readonly currentStep = this._currentStep.asReadonly();

  constructor() {
    const saved = inject(StorageService).restore();
    if (saved && Number.isFinite(saved.bpm)) this.setBpm(saved.bpm);
  }

  play(): void {
    this._isPlaying.set(true);
  }

  stop(): void {
    this._isPlaying.set(false);
    this._currentStep.set(0);
  }

  /** Set tempo, clamped to the allowed range. */
  setBpm(bpm: number): void {
    this._bpm.set(clamp(bpm, MIN_BPM, MAX_BPM));
  }

  /** Mirror the playhead position reported by the audio engine. */
  setCurrentStep(step: number): void {
    this._currentStep.set(step);
  }
}
