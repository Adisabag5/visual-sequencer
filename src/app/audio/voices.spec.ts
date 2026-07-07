import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VoiceId } from '../core/models';
import { VOICE_IDS } from '../core/voice-library';
import { createVoices, VoiceKit } from './voices';

/**
 * jsdom has no AudioContext, so `tone` is replaced with lightweight fakes that
 * record the graph each trigger builds (nodes, params, start/stop times). This
 * lets us assert the recipe wiring — pitch factors, volume peaks, scheduling —
 * without real audio.
 */
const h = vi.hoisted(() => {
  interface ParamEvent {
    kind: 'set' | 'ramp';
    value: number;
    time: number;
  }

  class FakeParam {
    events: ParamEvent[] = [];
    constructor(public value = 0) {}
    setValueAtTime(value: number, time: number): this {
      this.events.push({ kind: 'set', value, time });
      this.value = value;
      return this;
    }
    exponentialRampToValueAtTime(value: number, time: number): this {
      this.events.push({ kind: 'ramp', value, time });
      return this;
    }
  }

  class FakeNode {
    targets: unknown[] = [];
    disposed = false;
    connect(target: unknown): this {
      this.targets.push(target);
      return this;
    }
    dispose(): this {
      this.disposed = true;
      return this;
    }
  }

  const created = {
    gains: [] as FakeGain[],
    oscillators: [] as FakeOscillator[],
    filters: [] as FakeBiquadFilter[],
    noiseSources: [] as FakeToneBufferSource[],
    buffers: [] as FakeToneAudioBuffer[],
  };

  class FakeGain extends FakeNode {
    gain: FakeParam;
    constructor(value = 1) {
      super();
      this.gain = new FakeParam(value);
      created.gains.push(this);
    }
  }

  class FakeOscillator extends FakeNode {
    type: string;
    frequency: FakeParam;
    onstop: (() => void) | undefined;
    startTime: number | undefined;
    stopTime: number | undefined;
    constructor(opts: { type?: string; frequency?: number } = {}) {
      super();
      this.type = opts.type ?? 'sine';
      this.frequency = new FakeParam(opts.frequency ?? 440);
      created.oscillators.push(this);
    }
    start(time?: number): this {
      this.startTime = time;
      return this;
    }
    stop(time?: number): this {
      this.stopTime = time;
      return this;
    }
  }

  class FakeBiquadFilter extends FakeNode {
    type: string;
    frequency: FakeParam;
    Q: FakeParam;
    constructor(opts: { type?: string; frequency?: number; Q?: number } = {}) {
      super();
      this.type = opts.type ?? 'lowpass';
      this.frequency = new FakeParam(opts.frequency ?? 350);
      this.Q = new FakeParam(opts.Q ?? 1);
      created.filters.push(this);
    }
  }

  class FakeToneAudioBuffer {
    disposed = false;
    constructor(public array?: Float32Array) {}
    static fromArray(array: Float32Array): FakeToneAudioBuffer {
      const b = new FakeToneAudioBuffer(array);
      created.buffers.push(b);
      return b;
    }
    dispose(): this {
      this.disposed = true;
      return this;
    }
  }

  class FakeToneBufferSource extends FakeNode {
    onended: (() => void) | undefined;
    startTime: number | undefined;
    stopTime: number | undefined;
    constructor(public buffer?: unknown) {
      super();
      created.noiseSources.push(this);
    }
    start(time?: number): this {
      this.startTime = time;
      return this;
    }
    stop(time?: number): this {
      this.stopTime = time;
      return this;
    }
  }

  const reset = (): void => {
    created.gains.length = 0;
    created.oscillators.length = 0;
    created.filters.length = 0;
    created.noiseSources.length = 0;
    created.buffers.length = 0;
  };

  return {
    created,
    reset,
    tone: {
      Gain: FakeGain,
      Oscillator: FakeOscillator,
      BiquadFilter: FakeBiquadFilter,
      ToneAudioBuffer: FakeToneAudioBuffer,
      ToneBufferSource: FakeToneBufferSource,
      getContext: () => ({ sampleRate: 8000 }),
      now: () => 0,
    },
  };
});

vi.mock('tone', () => h.tone);

/** Count of node-creating constructor calls since the last reset. */
function nodeCount(): number {
  return (
    h.created.gains.length +
    h.created.oscillators.length +
    h.created.filters.length +
    h.created.noiseSources.length
  );
}

function sourcesStarted(): number {
  return (
    h.created.oscillators.filter((o) => o.startTime !== undefined).length +
    h.created.noiseSources.filter((n) => n.startTime !== undefined).length
  );
}

describe('createVoices', () => {
  let destination: { targets: unknown[] };
  let kit: VoiceKit;

  beforeEach(() => {
    h.reset();
    destination = { targets: [] };
    kit = createVoices(destination as never);
  });

  it('pre-generates one shared 0.5s noise buffer', () => {
    expect(h.created.buffers.length).toBe(1);
    expect(h.created.buffers[0].array?.length).toBe(4000); // 8000 Hz × 0.5 s
  });

  it('triggers every voice in the library without throwing, starting at least one source', () => {
    for (const id of VOICE_IDS) {
      const before = sourcesStarted();
      expect(() => kit.trigger(id, 1, 0, 0.8)).not.toThrow();
      expect(sourcesStarted(), `voice "${id}" started no source`).toBeGreaterThan(before);
    }
  });

  it('schedules against the given time (kick: start t, stop t+0.36)', () => {
    kit.trigger('kick', 2, 0, 1);
    const o = h.created.oscillators[0];
    expect(o.startTime).toBe(2);
    expect(o.stopTime).toBeCloseTo(2.36);
  });

  it('uses Tone.now() when time is undefined', () => {
    kit.trigger('blip', undefined, 0, 1);
    expect(h.created.oscillators[0].startTime).toBe(0);
  });

  it('applies pitch as 2^(semitones/12) to fixed oscillator frequencies (sub 55 Hz)', () => {
    kit.trigger('sub', 0, 0, 1);
    kit.trigger('sub', 0, 12, 1);
    expect(h.created.oscillators[0].frequency.value).toBeCloseTo(55);
    expect(h.created.oscillators[1].frequency.value).toBeCloseTo(110);
  });

  it('applies pitch to both ends of a frequency sweep (kick 150→48 Hz)', () => {
    kit.trigger('kick', 0, 12, 1);
    const events = h.created.oscillators[0].frequency.events;
    expect(events).toEqual([
      { kind: 'set', value: 300, time: 0 },
      { kind: 'ramp', value: 96, time: 0.12 },
    ]);
  });

  it('applies pitch to noise-filter cutoffs so timbre tracks pitch (hatC hp 7000 Hz)', () => {
    kit.trigger('hatC', 0, 12, 1);
    const f = h.created.filters[0];
    expect(f.type).toBe('highpass');
    expect(f.frequency.value).toBeCloseTo(14000);
  });

  it('scales the envelope peak by vol (kick full gain; hatC peaks at vol×0.5)', () => {
    kit.trigger('kick', 0, 0, 0.5);
    const kickEnv = h.created.gains[0];
    expect(kickEnv.gain.events).toEqual([
      { kind: 'set', value: 0.0001, time: 0 },
      { kind: 'ramp', value: 0.5, time: 0.004 },
      { kind: 'ramp', value: 0.0001, time: expect.closeTo(0.324) as unknown as number },
    ]);

    h.reset();
    kit.trigger('hatC', 0, 0, 0.8);
    const hatEnv = h.created.gains[0];
    expect(hatEnv.gain.events[1]).toEqual({ kind: 'ramp', value: 0.4, time: 0.001 });
  });

  it('builds the clap as four staggered noise bursts through one bandpass', () => {
    kit.trigger('clap', 1, 0, 1);
    expect(h.created.filters.length).toBe(1);
    expect(h.created.filters[0].type).toBe('bandpass');
    const starts = h.created.noiseSources.map((n) => n.startTime);
    expect(starts.length).toBe(4);
    [1, 1.012, 1.024, 1.05].forEach((expected, k) => expect(starts[k]).toBeCloseTo(expected, 6));
  });

  it('disposes the per-hit graph once all its sources have stopped', () => {
    kit.trigger('snare', 0, 0, 1); // noise + triangle body = 2 sources
    const osc = h.created.oscillators[0];
    const noise = h.created.noiseSources[0];
    expect(h.created.gains.some((g) => g.disposed)).toBe(false);

    noise.onended?.();
    expect(h.created.gains.some((g) => g.disposed)).toBe(false); // osc still live

    osc.onstop?.();
    expect(h.created.gains.every((g) => g.disposed)).toBe(true);
    expect(h.created.filters.every((f) => f.disposed)).toBe(true);
    expect(osc.disposed).toBe(true);
    expect(noise.disposed).toBe(true);
  });

  it('dispose() tears down in-flight hits, frees the noise buffer, and mutes further triggers', () => {
    kit.trigger('crash', 0, 0, 1);
    kit.dispose();
    expect(h.created.gains.every((g) => g.disposed)).toBe(true);
    expect(h.created.buffers[0].disposed).toBe(true);

    const before = nodeCount();
    kit.trigger('kick', 0, 0, 1);
    expect(nodeCount()).toBe(before); // no-op after dispose
  });

  it('covers the full VoiceId union (compile-time exhaustiveness backstop)', () => {
    // If VoiceId gains a member without a recipe, voices.ts fails to compile
    // (never-default). This runtime check just pins the library size.
    const ids: readonly VoiceId[] = VOICE_IDS;
    expect(ids.length).toBe(30);
  });
});
