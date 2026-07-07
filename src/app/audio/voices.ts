import * as Tone from 'tone';
import { VoiceId } from '../core/models';
import { semitonesToRate } from './pitch.util';

/**
 * The 30 synthesized drum voices — a 1:1 port of the design handoff's working
 * Web Audio `voice()` switch ("Sequencer - Pastel v2", see
 * claude-docs/06-design-handoff.md "Audio engine"). Each trigger builds a tiny
 * disposable node graph (source → filter → envelope → destination), schedules
 * it against the given audio-clock time, and tears it down after its tail.
 */
export interface VoiceKit {
  /** Trigger a voice. `time` = audio-clock seconds, or undefined for "now". */
  trigger(voice: VoiceId, time: number | undefined, pitch: number, vol: number): void;
  dispose(): void;
}

/** Length of the shared white-noise buffer (prototype pre-generates 0.5s). */
const NOISE_BUFFER_SECONDS = 0.5;
/** Noise sources keep running slightly past their envelope (prototype's +0.05s). */
const NOISE_STOP_PAD = 0.05;
/** Envelope floor — never exponential-ramp to exactly 0. */
const ENV_FLOOR = 0.0001;
/** Minimum envelope peak (prototype's `Math.max(0.0005, peak)`). */
const ENV_MIN_PEAK = 0.0005;
/** Frequency sweeps never ramp below this (prototype's `Math.max(20, f1)`). */
const SWEEP_FLOOR_HZ = 20;

/** Oscillator shapes the recipes use. */
type OscShape = 'sine' | 'square' | 'sawtooth' | 'triangle';

/** Anything we own for the duration of one hit. */
interface DisposableNode {
  dispose(): unknown;
}

/** A live per-trigger graph, so dispose() can tear down in-flight hits. */
interface Hit {
  teardown(): void;
}

export function createVoices(destination: Tone.InputNode): VoiceKit {
  // Shared white-noise buffer, generated once and reused by every noise voice.
  const noiseLength = Math.floor(Tone.getContext().sampleRate * NOISE_BUFFER_SECONDS);
  const noiseData = new Float32Array(noiseLength);
  for (let k = 0; k < noiseLength; k++) noiseData[k] = Math.random() * 2 - 1;
  const noiseBuffer = Tone.ToneAudioBuffer.fromArray(noiseData);

  const activeHits = new Set<Hit>();
  let disposed = false;

  function trigger(voice: VoiceId, time: number | undefined, pitch: number, vol: number): void {
    if (disposed) return;
    /** Pitch factor: multiplies EVERY frequency (osc, sweep ends, filter cutoffs). */
    const P = semitonesToRate(pitch);
    const t = time ?? Tone.now();

    // ---- per-hit graph plumbing (nodes self-dispose after the tail) --------
    const nodes: DisposableNode[] = [];
    let liveSources = 0;
    const hit: Hit = {
      teardown(): void {
        if (!activeHits.delete(hit)) return; // already torn down
        nodes.forEach((n) => n.dispose());
      },
    };
    activeHits.add(hit);

    const own = <T extends DisposableNode>(node: T): T => {
      nodes.push(node);
      return node;
    };
    /** Called from each source's stop callback; last one out disposes the graph. */
    const finishOne = (): void => {
      liveSources -= 1;
      if (liveSources === 0) hit.teardown();
    };

    // ---- recipe helpers (mirror the prototype's _g/_filt/_sweepOsc/noiseInto)
    /** `_g`: gain 0.0001 → exp-ramp to peak over `attack` → exp-ramp back down over `decay`. */
    const env = (at: number, peak: number, attack: number, decay: number): Tone.Gain => {
      const g = own(new Tone.Gain(ENV_FLOOR));
      const p = Math.max(ENV_MIN_PEAK, peak);
      g.gain.setValueAtTime(ENV_FLOOR, at);
      g.gain.exponentialRampToValueAtTime(p, at + attack);
      g.gain.exponentialRampToValueAtTime(ENV_FLOOR, at + attack + decay);
      return g;
    };

    const filt = (type: BiquadFilterType, frequency: number, q?: number): Tone.BiquadFilter =>
      own(new Tone.BiquadFilter(q === undefined ? { type, frequency } : { type, frequency, Q: q }));

    const osc = (type: OscShape, frequency: number): Tone.Oscillator =>
      own(new Tone.Oscillator({ type, frequency }));

    /** `_sweepOsc`: exponential frequency sweep f0→f1 (pitched) over `dur` seconds. */
    const sweepOsc = (type: OscShape, f0: number, f1: number, dur: number): Tone.Oscillator => {
      const o = own(new Tone.Oscillator({ type }));
      o.frequency.setValueAtTime(f0 * P, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(SWEEP_FLOOR_HZ, f1 * P), t + dur);
      return o;
    };

    const startOsc = (o: Tone.Oscillator, start: number, stop: number): void => {
      liveSources += 1;
      o.onstop = finishOne;
      o.start(start);
      o.stop(stop);
    };

    const startNoise = (n: Tone.ToneBufferSource, start: number, stop: number): void => {
      liveSources += 1;
      n.onended = finishOne;
      n.start(start);
      n.stop(stop);
    };

    /** Oscillator → envelope → destination, with an explicit stop time. */
    const oscInto = (
      o: Tone.Oscillator,
      peak: number,
      attack: number,
      decay: number,
      stop: number,
    ): void => {
      const e = env(t, peak, attack, decay);
      o.connect(e);
      e.connect(destination);
      startOsc(o, t, stop);
    };

    /** `noiseInto`: shared-buffer noise → filter → envelope → destination. */
    const noiseInto = (
      f: Tone.BiquadFilter,
      peak: number,
      attack: number,
      decay: number,
      offset = 0,
    ): void => {
      const n = own(new Tone.ToneBufferSource(noiseBuffer));
      const e = env(t + offset, peak, attack, decay);
      n.connect(f);
      f.connect(e);
      e.connect(destination);
      startNoise(n, t + offset, t + offset + attack + decay + NOISE_STOP_PAD);
    };

    // ---- the recipes (values verbatim from the handoff prototype) ----------
    switch (voice) {
      // Low end -------------------------------------------------------------
      case 'kick':
        oscInto(sweepOsc('sine', 150, 48, 0.12), vol, 0.004, 0.32, t + 0.36);
        break;
      case 'punch':
        oscInto(sweepOsc('sine', 260, 60, 0.06), vol, 0.003, 0.2, t + 0.24);
        noiseInto(filt('highpass', 3500 * P), vol * 0.4, 0.001, 0.02); // the click
        break;
      case 'eight08':
        oscInto(sweepOsc('sine', 95, 42, 0.16), vol, 0.005, 0.6, t + 0.66);
        break;

      // Bass / tonal ----------------------------------------------------------
      case 'sub':
        oscInto(osc('sine', 55 * P), vol, 0.01, 0.28, t + 0.32);
        break;
      case 'synthbass': {
        const o = osc('sawtooth', 65 * P);
        const lp = filt('lowpass', 700 * P);
        const e = env(t, vol * 0.9, 0.006, 0.3);
        o.connect(lp);
        lp.connect(e);
        e.connect(destination);
        startOsc(o, t, t + 0.36);
        break;
      }
      case 'pluck': {
        const o = osc('sawtooth', 330 * P);
        const lp = filt('lowpass', 4000 * P);
        lp.frequency.setValueAtTime(4000 * P, t);
        lp.frequency.exponentialRampToValueAtTime(500 * P, t + 0.16);
        const e = env(t, vol * 0.8, 0.002, 0.18);
        o.connect(lp);
        lp.connect(e);
        e.connect(destination);
        startOsc(o, t, t + 0.22);
        break;
      }
      case 'stab': {
        const lp = filt('lowpass', 2600 * P);
        const e = env(t, vol * 0.7, 0.005, 0.22);
        lp.connect(e);
        e.connect(destination);
        // A-minor triad.
        [220, 261.63, 329.63].forEach((f) => {
          const o = osc('sawtooth', f * P);
          o.connect(lp);
          startOsc(o, t, t + 0.26);
        });
        break;
      }
      case 'bell':
        [880, 1320].forEach((f, i) =>
          oscInto(osc('sine', f * P), vol * (i ? 0.35 : 0.55), 0.002, i ? 0.35 : 0.5, t + 0.55),
        );
        break;
      case 'marimba':
        [440, 880].forEach((f, i) =>
          oscInto(osc('sine', f * P), vol * (i ? 0.25 : 0.6), 0.002, i ? 0.1 : 0.18, t + 0.2),
        );
        break;

      // Snare family ----------------------------------------------------------
      case 'snare':
        noiseInto(filt('highpass', 1400 * P), vol * 0.9, 0.001, 0.18);
        oscInto(osc('triangle', 185 * P), vol * 0.5, 0.001, 0.12, t + 0.14); // the body
        break;
      case 'clap': {
        const bp = filt('bandpass', 1500 * P, 1.1);
        bp.connect(destination);
        // Four bursts; the last is louder and rings out.
        [0, 0.012, 0.024, 0.05].forEach((off, k) => {
          const n = own(new Tone.ToneBufferSource(noiseBuffer));
          const peak = Math.max(0.03, vol * (k === 3 ? 0.6 : 0.45));
          const e = env(t + off, peak, 0.002, (k === 3 ? 0.12 : 0.03) - 0.002);
          n.connect(e);
          e.connect(bp);
          startNoise(n, t + off, t + off + 0.16);
        });
        break;
      }
      case 'rimshot':
        oscInto(osc('triangle', 1700 * P), vol * 0.8, 0.001, 0.03, t + 0.05);
        noiseInto(filt('highpass', 2000 * P), vol * 0.4, 0.001, 0.02);
        break;
      case 'brush':
        noiseInto(filt('lowpass', 3000 * P), vol * 0.5, 0.01, 0.2);
        break;

      // Hats / cymbals ---------------------------------------------------------
      case 'hatC':
        noiseInto(filt('highpass', 7000 * P), vol * 0.5, 0.001, 0.05);
        break;
      case 'hatO':
        noiseInto(filt('highpass', 6500 * P), vol * 0.5, 0.001, 0.32);
        break;
      case 'shaker':
        noiseInto(filt('bandpass', 5000 * P, 1), vol * 0.45, 0.008, 0.12);
        break;
      case 'ride':
        noiseInto(filt('highpass', 8000 * P), vol * 0.35, 0.002, 0.4);
        oscInto(osc('sine', 520 * P), vol * 0.2, 0.002, 0.3, t + 0.34); // the ping
        break;
      case 'crash':
        noiseInto(filt('highpass', 4000 * P), vol * 0.5, 0.002, 1.1);
        break;
      case 'tamb':
        // Two staggered jingle bursts (handoff: "two bandpass 8000 bursts").
        [0, 0.03].forEach((off) =>
          noiseInto(filt('bandpass', 8000 * P, 3), vol * 0.4, 0.001, 0.09, off),
        );
        break;

      // Toms / perc -----------------------------------------------------------
      case 'lowtom':
        oscInto(sweepOsc('sine', 220, 98, 0.18), vol, 0.005, 0.3, t + 0.34);
        break;
      case 'midtom':
        oscInto(sweepOsc('sine', 330, 150, 0.16), vol, 0.005, 0.28, t + 0.32);
        break;
      case 'conga':
        oscInto(sweepOsc('sine', 300, 210, 0.1), vol, 0.004, 0.18, t + 0.22);
        break;
      case 'bongo':
        oscInto(sweepOsc('sine', 520, 380, 0.07), vol, 0.003, 0.12, t + 0.16);
        break;
      case 'cowbell': {
        const e = env(t, vol * 0.6, 0.002, 0.16);
        e.connect(destination);
        [540, 800].forEach((f) => {
          const o = osc('square', f * P);
          o.connect(e);
          startOsc(o, t, t + 0.17);
        });
        break;
      }
      case 'clave':
        oscInto(osc('sine', 2500 * P), vol * 0.7, 0.001, 0.05, t + 0.06);
        break;
      case 'woodblock':
        oscInto(osc('square', 1200 * P), vol * 0.6, 0.001, 0.04, t + 0.05);
        break;

      // FX / texture -----------------------------------------------------------
      case 'zap':
        oscInto(sweepOsc('sawtooth', 1200, 80, 0.12), vol * 0.7, 0.002, 0.14, t + 0.18);
        break;
      case 'blip':
        oscInto(osc('sine', 880 * P), vol * 0.6, 0.002, 0.08, t + 0.1);
        break;
      case 'sweep': {
        const n = own(new Tone.ToneBufferSource(noiseBuffer));
        const lp = filt('lowpass', 200 * P);
        lp.frequency.setValueAtTime(200 * P, t);
        lp.frequency.exponentialRampToValueAtTime(6000 * P, t + 0.3);
        const e = env(t, vol * 0.5, 0.05, 0.3);
        n.connect(lp);
        lp.connect(e);
        e.connect(destination);
        startNoise(n, t, t + 0.4);
        break;
      }
      case 'vinyl':
        noiseInto(filt('lowpass', 9000 * P), vol * 0.25, 0.01, 0.28);
        break;

      default: {
        // Compile-time exhaustiveness; at runtime an unknown id (stale save) is a no-op.
        const exhaustive: never = voice;
        void exhaustive;
        break;
      }
    }

    // Nothing was scheduled (unreachable for valid ids) — don't leak the hit.
    if (liveSources === 0) hit.teardown();
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    [...activeHits].forEach((h) => h.teardown());
    noiseBuffer.dispose();
  }

  return { trigger, dispose };
}
