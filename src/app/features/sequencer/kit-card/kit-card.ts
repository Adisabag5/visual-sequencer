import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Kit } from '../../../core/models';
import { VOICE_LIBRARY } from '../../../core/voice-library';

/**
 * One preset kit card (design handoff, "Kit Panel" → Presets view): name,
 * description, and the kit's 8 voices as category-colored chips. Renders +
 * emits only; loading is the parent's concern.
 */
@Component({
  selector: 'app-kit-card',
  imports: [],
  templateUrl: './kit-card.html',
  styleUrl: './kit-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitCard {
  readonly kit = input.required<Kit>();
  /** True when this kit is the loaded one (shows the LOADED badge). */
  readonly active = input(false);
  readonly loadKit = output<void>();

  /** Chip per slot: voice name + category (drives the `.cat-*` colors). */
  protected readonly chips = computed(() =>
    this.kit().slots.map((slot) => ({
      name: VOICE_LIBRARY[slot.voice].name,
      category: VOICE_LIBRARY[slot.voice].category,
    })),
  );
}
