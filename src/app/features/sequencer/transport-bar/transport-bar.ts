import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { TransportStore } from '../../../state/transport.store';
import { UiButton } from '../../../shared/ui-button/ui-button';

/** Transport controls: play/stop, clear, BPM. Reads transport state, emits intent. */
@Component({
  selector: 'app-transport-bar',
  imports: [UiButton],
  templateUrl: './transport-bar.html',
  styleUrl: './transport-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex items-center gap-[14px] border-b px-[30px] py-5',
  },
})
export class TransportBar {
  private readonly transport = inject(TransportStore);

  readonly bpm = this.transport.bpm;
  readonly isPlaying = this.transport.isPlaying;

  readonly togglePlay = output<void>();
  /** Emits a tempo change in BPM (+/−). */
  readonly bpmDelta = output<number>();
  readonly clearPattern = output<void>();
  /** Emits when the Kit button is pressed (page toggles the kit panel). */
  readonly kitToggle = output<void>();
}
