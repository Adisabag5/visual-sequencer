import { Injectable, signal } from '@angular/core';
import * as Tone from 'tone';
import { DEFAULT_BPM, STEP_COUNT } from '../core/constants';
import { Track, VoiceId } from '../core/models';
import { isTrackAudible } from '../core/util';
import { createVoices, VoiceKit } from './voices';

/** Emitted when a step fires: which step, its energy, and the colors that hit. */
export interface StepTrigger {
  step: number;
  energy: number;
  colors: string[];
}

/** Plain, non-reactive snapshot of a track for the audio scheduler. */
interface MirrorTrack {
  voice: VoiceId;
  muted: boolean;
  soloed: boolean;
  vol: number;
  main: string;
  steps: { on: boolean; pitch: number }[];
}

/**
 * The audio layer. The ONLY file that imports Tone.js. Owns the voices, the
 * lookahead scheduler, and the analyser that feeds the visualizer.
 */
@Injectable({ providedIn: 'root' })
export class AudioEngine {
  private started = false;
  private master?: Tone.Gain;
  private analyser?: Tone.Analyser;
  private voices?: VoiceKit;

  /** Non-reactive mirror of the pattern the scheduler reads on each tick. */
  private mirror: MirrorTrack[] = [];
  private currentBpm = DEFAULT_BPM;
  private stepIndex = 0;
  private repeatId?: number;
  private stepTriggerCb?: (e: StepTrigger) => void;

  private readonly _currentStep = signal(0);
  /** Playhead position, updated in sync with the audio clock. */
  readonly currentStep = this._currentStep.asReadonly();

  /** Resume the AudioContext and build the graph. Must run inside a user gesture. */
  async unlock(): Promise<void> {
    if (this.started) return;
    await Tone.start();
    this.master = new Tone.Gain(0.85).toDestination();
    this.analyser = new Tone.Analyser('fft', 64);
    this.master.connect(this.analyser); // parallel tap; audio still reaches destination
    this.voices = createVoices(this.master);
    Tone.getTransport().bpm.value = this.currentBpm;
    this.started = true;
  }

  /** Update the scheduler's snapshot of the pattern. */
  loadPattern(tracks: readonly Track[]): void {
    this.mirror = tracks.map((t) => ({
      voice: t.voice,
      muted: t.muted,
      soloed: t.soloed,
      vol: t.vol,
      main: t.main,
      steps: t.steps.map((s) => ({ on: s.on, pitch: s.pitch })),
    }));
  }

  setBpm(bpm: number): void {
    this.currentBpm = bpm;
    if (this.started) Tone.getTransport().bpm.value = bpm;
  }

  /** Play a single voice immediately (click-audition). */
  audition(voice: VoiceId, pitch = 0, vol = 1): void {
    this.voices?.trigger(voice, undefined, pitch, vol);
  }

  /** FFT magnitudes (dB) for the spectrum bars; empty until unlocked. */
  getSpectrum(): Float32Array {
    return this.analyser ? (this.analyser.getValue() as Float32Array) : new Float32Array(0);
  }

  /** Register the visualizer's per-step callback (fired on the audio clock). */
  onStepTrigger(cb: (e: StepTrigger) => void): void {
    this.stepTriggerCb = cb;
  }

  /** Start the loop: schedule 16th-note ticks against the audio clock. */
  play(): void {
    if (!this.voices) return;
    const transport = Tone.getTransport();
    transport.bpm.value = this.currentBpm;
    this.stepIndex = 0;
    this.repeatId = transport.scheduleRepeat((time) => {
      const i = this.stepIndex;
      const anySoloed = this.mirror.some((t) => t.soloed);
      let sum = 0;
      const colors: string[] = [];
      for (const track of this.mirror) {
        const step = track.steps[i];
        if (step?.on && isTrackAudible(track, anySoloed)) {
          this.voices?.trigger(track.voice, time, step.pitch, track.vol);
          sum += track.vol;
          colors.push(track.main);
        }
      }
      const energy = Math.min(1, sum / 2.4);
      // Update playhead + visualizer exactly when this tick sounds.
      Tone.getDraw().schedule(() => {
        this._currentStep.set(i);
        this.stepTriggerCb?.({ step: i, energy, colors });
      }, time);
      this.stepIndex = (i + 1) % STEP_COUNT;
    }, '16n');
    transport.start();
  }

  stop(): void {
    const transport = Tone.getTransport();
    transport.stop();
    if (this.repeatId !== undefined) {
      transport.clear(this.repeatId);
      this.repeatId = undefined;
    }
    this.stepIndex = 0;
    this._currentStep.set(0);
  }
}
