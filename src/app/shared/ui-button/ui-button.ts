import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type UiButtonVariant = 'circle' | 'pill' | 'stepper';

/** Reusable button. Variant picks the Pulse shape; content is projected. */
@Component({
  selector: 'app-ui-button',
  imports: [],
  templateUrl: './ui-button.html',
  styleUrl: './ui-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiButton {
  readonly variant = input<UiButtonVariant>('pill');
  readonly ariaLabel = input<string>('');
  readonly press = output<void>();

  protected readonly classes = computed(() => `ui-btn ui-btn-${this.variant()}`);
}
