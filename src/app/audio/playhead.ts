import { Injectable, signal } from '@angular/core';

/**
 * Where the music currently is: the step the audio clock is sounding.
 *
 * Its own holder rather than a signal inside AudioEngine, for the same reason
 * AccessTokenHolder sits in the API layer: the State layer needs to read it,
 * and importing AudioEngine to get at it would drag Tone.js into everything
 * that touches transport state — including tests that replace `tone` with
 * fakes. This file imports nothing but Angular.
 *
 * The engine is the only writer. It sets this from inside the scheduled tick,
 * which is the only place that knows where the music actually is; everyone
 * else reads it through TransportStore.
 */
@Injectable({ providedIn: 'root' })
export class Playhead {
  private readonly _step = signal(0);

  readonly step = this._step.asReadonly();

  set(step: number): void {
    this._step.set(step);
  }
}
