import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { AudioEngine } from '../../../audio/audio-engine';
import { PatternStore } from '../../../state/pattern.store';
import { TransportStore } from '../../../state/transport.store';
import { StorageService } from '../../../state/storage.service';
import { TransportBar } from '../transport-bar/transport-bar';
import { Grid } from '../grid/grid';
import { Visualizer } from '../visualizer/visualizer';

/** Top-level screen. Coordinates stores ↔ audio engine. */
@Component({
  selector: 'app-sequencer-page',
  imports: [TransportBar, Grid, Visualizer],
  templateUrl: './sequencer-page.html',
  styleUrl: './sequencer-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SequencerPage {
  private readonly pattern = inject(PatternStore);
  private readonly transport = inject(TransportStore);
  private readonly engine = inject(AudioEngine);
  private readonly storage = inject(StorageService);

  constructor() {
    // Keep the engine's scheduler snapshot in sync with the pattern.
    effect(() => this.engine.loadPattern(this.pattern.tracks()));
    // Mirror the engine's playhead into the transport store (drives the UI).
    effect(() => this.transport.setCurrentStep(this.engine.currentStep()));
    // Keep the engine tempo in sync with the store.
    effect(() => this.engine.setBpm(this.transport.bpm()));
    // Auto-save the pattern + tempo (debounced inside the service).
    effect(() => {
      const tracks = this.pattern.tracks();
      const bpm = this.transport.bpm();
      this.storage.save({
        version: 1,
        bpm,
        tracks: tracks.map((t) => ({
          steps: t.steps.map((s) => ({ on: s.on, pitch: s.pitch })),
          vol: t.vol,
          muted: t.muted,
          soloed: t.soloed,
        })),
      });
    });
  }

  /** Toggle a step (instant) and audition it if it just turned on and is audible. */
  onToggleStep(e: { trackIndex: number; stepIndex: number }): void {
    this.pattern.toggleStep(e.trackIndex, e.stepIndex);
    const tracks = this.pattern.tracks();
    const anySoloed = tracks.some((t) => t.soloed);
    const track = tracks[e.trackIndex];
    const step = track.steps[e.stepIndex];
    const audible = anySoloed ? track.soloed : !track.muted;
    if (step.on && audible) {
      void this.engine
        .unlock()
        .then(() => this.engine.audition(track.voice, step.pitch, track.vol));
    }
  }

  async onTogglePlay(): Promise<void> {
    await this.engine.unlock();
    if (this.transport.isPlaying()) {
      this.transport.stop();
      this.engine.stop();
    } else {
      this.transport.play();
      this.engine.play();
    }
  }

  onToggleMute(trackIndex: number): void {
    this.pattern.toggleMute(trackIndex);
  }

  onToggleSolo(trackIndex: number): void {
    this.pattern.toggleSolo(trackIndex);
  }

  onClear(): void {
    this.pattern.clear();
  }

  onVolume(e: { trackIndex: number; value: number }): void {
    this.pattern.setVolume(e.trackIndex, e.value);
  }

  /** Set a step's pitch and audition it at the new pitch (if audible). */
  onPitch(e: { trackIndex: number; stepIndex: number; pitch: number }): void {
    this.pattern.setStepPitch(e.trackIndex, e.stepIndex, e.pitch);
    const tracks = this.pattern.tracks();
    const anySoloed = tracks.some((t) => t.soloed);
    const track = tracks[e.trackIndex];
    const step = track.steps[e.stepIndex];
    const audible = anySoloed ? track.soloed : !track.muted;
    if (step.on && audible) {
      void this.engine
        .unlock()
        .then(() => this.engine.audition(track.voice, step.pitch, track.vol));
    }
  }

  onBpmDelta(delta: number): void {
    this.transport.setBpm(this.transport.bpm() + delta);
  }
}
