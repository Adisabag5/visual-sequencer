import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Track, VoiceId } from '../../../core/models';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  isVoiceId,
  VOICE_IDS,
  VOICE_LIBRARY,
} from '../../../core/voice-library';

/** Voice-picker options for one category (rendered as an optgroup). */
interface VoiceGroup {
  label: string;
  voices: { id: VoiceId; name: string }[];
}

/** The full library grouped by category, in display order (static — built once). */
const VOICE_GROUPS: readonly VoiceGroup[] = CATEGORY_ORDER.map((category) => ({
  label: CATEGORY_LABELS[category],
  voices: VOICE_IDS.filter((id) => VOICE_LIBRARY[id].category === category).map((id) => ({
    id,
    name: VOICE_LIBRARY[id].name,
  })),
}));

/**
 * One Custom-view slot row (glossary: "voice picker"): category swatch, track
 * number, and the grouped voice select — a styled field with a transparent
 * native <select> on top (renders reliably across browsers). The host is the
 * row. Renders + emits only; swapping the voice is the parent's concern.
 */
@Component({
  selector: 'app-voice-picker',
  imports: [],
  templateUrl: './voice-picker.html',
  styleUrl: './voice-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex items-center gap-[10px] rounded-xl bg-white px-[10px] py-2',
  },
})
export class VoicePicker {
  readonly track = input.required<Track>();
  /** 1-based track number shown in the row. */
  readonly trackNumber = input.required<number>();
  readonly voiceChange = output<VoiceId>();

  protected readonly voiceGroups = VOICE_GROUPS;

  protected onChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (isVoiceId(value)) this.voiceChange.emit(value);
  }
}
