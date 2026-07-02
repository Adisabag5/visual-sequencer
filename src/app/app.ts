import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SequencerPage } from './features/sequencer/sequencer-page/sequencer-page';

@Component({
  selector: 'app-root',
  imports: [SequencerPage],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
