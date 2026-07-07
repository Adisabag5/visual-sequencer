import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AudioEngine } from '../../../audio/audio-engine';
import { KITS } from '../../../core/kits';
import { KitId, VoiceId } from '../../../core/models';
import { KitMode, KitPanelStore } from '../../../state/kit-panel.store';
import { PatternStore } from '../../../state/pattern.store';
import { KitCard } from '../kit-card/kit-card';
import { VoicePicker } from '../voice-picker/voice-picker';

/**
 * Slide-out kit panel (design handoff v2, "Kit Panel"): the shell — edge tab,
 * header, Presets|Custom segmented control — composing kit cards and voice
 * pickers. Owns the store/engine wiring for both views.
 */
@Component({
  selector: 'app-kit-panel',
  imports: [KitCard, VoicePicker],
  templateUrl: './kit-panel.html',
  styleUrl: './kit-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitPanel {
  private readonly pattern = inject(PatternStore);
  private readonly engine = inject(AudioEngine);
  protected readonly panel = inject(KitPanelStore);

  protected readonly kits = KITS;
  protected readonly tracks = this.pattern.tracks;
  protected readonly activeKit = this.pattern.activeKit;

  protected setMode(mode: KitMode): void {
    this.panel.setKitMode(mode);
  }

  protected loadKit(id: KitId): void {
    this.pattern.loadKit(id);
  }

  /** Swap one track's voice, then audition it once (unlock inside the gesture). */
  protected onVoiceChange(trackIndex: number, voice: VoiceId): void {
    this.pattern.setVoice(trackIndex, voice);
    const vol = this.pattern.tracks()[trackIndex].vol;
    void this.engine.unlock().then(() => this.engine.audition(voice, 0, vol));
  }
}
