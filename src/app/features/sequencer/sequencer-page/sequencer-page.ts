import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { AudioEngine } from '../../../audio/audio-engine';
import { STEP_COUNT, TRACK_COUNT } from '../../../core/constants';
import { getKit } from '../../../core/kits';
import { isTrackAudible } from '../../../core/util';
import { KitPanelStore } from '../../../state/kit-panel.store';
import { PatternStore } from '../../../state/pattern.store';
import { TransportStore } from '../../../state/transport.store';
import { StorageService } from '../../../state/storage.service';
import { TransportBar } from '../transport-bar/transport-bar';
import { Grid } from '../grid/grid';
import { KitPanel } from '../kit-panel/kit-panel';
import { Visualizer } from '../visualizer/visualizer';

/** Top-level screen. Coordinates stores ↔ audio engine. */
@Component({
  selector: 'app-sequencer-page',
  imports: [TransportBar, Grid, KitPanel, Visualizer],
  templateUrl: './sequencer-page.html',
  styleUrl: './sequencer-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SequencerPage {
  protected readonly pattern = inject(PatternStore);
  protected readonly transport = inject(TransportStore);
  protected readonly kitPanel = inject(KitPanelStore);
  private readonly engine = inject(AudioEngine);
  private readonly storage = inject(StorageService);

  /** Header meta: "{kit name | Custom kit} · 8 · 16". */
  protected readonly kitLabel = computed(() => {
    const id = this.pattern.activeKit();
    const name = id === null ? 'Custom kit' : getKit(id).name;
    return `${name} · ${TRACK_COUNT} · ${STEP_COUNT}`;
  });

  constructor() {
    // Keep the engine's scheduler snapshot in sync with the pattern.
    effect(() => this.engine.loadPattern(this.pattern.tracks()));
    // Mirror the engine's playhead into the transport store (drives the UI).
    effect(() => this.transport.setCurrentStep(this.engine.currentStep()));
    // Keep the engine tempo in sync with the store.
    effect(() => this.engine.setBpm(this.transport.bpm()));
    // Auto-save (debounced inside the service, which owns the schema).
    effect(() =>
      this.storage.save({
        bpm: this.transport.bpm(),
        activeKit: this.pattern.activeKit(),
        tracks: this.pattern.tracks(),
      }),
    );
  }

  /** Toggle a step (instant) and audition it if it just turned on and is audible. */
  protected onToggleStep(e: { trackIndex: number; stepIndex: number }): void {
    this.pattern.toggleStep(e.trackIndex, e.stepIndex);
    this.auditionStep(e.trackIndex, e.stepIndex);
  }

  /** Set a step's pitch and audition it at the new pitch (if audible). */
  protected onPitch(e: { trackIndex: number; stepIndex: number; pitch: number }): void {
    this.pattern.setStepPitch(e.trackIndex, e.stepIndex, e.pitch);
    this.auditionStep(e.trackIndex, e.stepIndex);
  }

  protected async onTogglePlay(): Promise<void> {
    await this.engine.unlock();
    if (this.transport.isPlaying()) {
      this.transport.stop();
      this.engine.stop();
    } else {
      this.transport.play();
      this.engine.play();
    }
  }

  protected onBpmDelta(delta: number): void {
    this.transport.setBpm(this.transport.bpm() + delta);
  }

  /** Play a step's voice once, if the step is on and its track is audible. */
  private auditionStep(trackIndex: number, stepIndex: number): void {
    const tracks = this.pattern.tracks();
    const track = tracks[trackIndex];
    const step = track.steps[stepIndex];
    const anySoloed = tracks.some((t) => t.soloed);
    if (!step.on || !isTrackAudible(track, anySoloed)) return;
    void this.engine.unlock().then(() => this.engine.audition(track.voice, step.pitch, track.vol));
  }
}
