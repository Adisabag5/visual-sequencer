# Pulse — Audio Engine Design

> Document 3 of 7. The technical heart of Pulse.
> Status: **Decided** (Tone.js, wrapped; **synthesized voices**). Last updated 2026-07-02.
> Sound source is **in-browser synthesis**, not samples (decided 2026-07-02) — the per-voice
> synthesis math lives in `06-design-handoff.md` under "Audio engine".

## Why this doc exists

A step sequencer lives or dies on **timing**. If the beat drifts or stutters, the
product fails no matter how good it looks. This document fixes how Pulse keeps time,
plays sounds, applies per-step pitch, and feeds the visualizer — and isolates all
of it from the Angular UI.

## The timing principle (non-negotiable)

JavaScript timers (`setInterval` / `setTimeout`) are too jittery for music. The
correct approach, used by every serious web sequencer, is a **lookahead scheduler**:

- A coarse JS timer wakes up frequently (e.g. every ~25 ms).
- On each wake, it looks a short window ahead (e.g. ~100 ms) and **schedules any
  steps falling in that window** against Web Audio's precise hardware clock.
- The sounds then fire sample-accurately, independent of JS jitter.

We do **not** hand-roll this. **Tone.js** already implements it via `Tone.Transport`.

## Decision: Tone.js, behind our own wrapper

- **Library:** [Tone.js](https://tonejs.github.io/) `^15` (stable 15.1.22 at time of
  writing). Provides `Transport`, synth voices (oscillators + noise), sample-accurate
  scheduling, filters, gain/volume nodes, effects, and an analyser — all sequencer plumbing.
- **Wrapper:** the UI never imports Tone directly. All audio goes through a single
  `AudioEngine` interface (an Angular service). Benefits:
  - UI and audio can be built/changed independently (key for parallel agent work).
  - Tone.js could be swapped for raw Web Audio later by rewriting only the wrapper.
  - The rest of the app depends on **our** vocabulary (see glossary), not Tone's.

```
UI (Angular components/signals)
        │  calls methods, reads state
        ▼
   AudioEngine  ← the ONLY file that imports Tone.js
        │
        ▼
   Tone.js  →  Web Audio API  →  speakers
```

## AudioEngine interface (the contract)

This is the surface the UI relies on. Names follow the glossary.

```ts
interface AudioEngine {
  // lifecycle
  init(): Promise<void>;          // build graph + voices, pre-gen noise buffer
  unlock(): Promise<void>;        // resume AudioContext on first user gesture

  // transport
  play(): void;
  stop(): void;
  setBpm(bpm: number): void;      // default 118
  readonly isPlaying: Signal<boolean>;
  readonly currentStep: Signal<number>;   // 0..15, drives the playhead UI

  // pattern application (engine reads the pattern; UI owns the data)
  setStep(track: number, step: number, on: boolean): void;
  setStepPitch(track: number, step: number, semitones: number): void;
  loadPattern(pattern: Pattern): void;     // e.g. on restore / clear

  // per-track
  setVolume(track: number, value: number): void;  // 0..1
  setMute(track: number, muted: boolean): void;
  setSolo(track: number, soloed: boolean): void;

  // visualizer feed
  onStepTrigger(cb: (e: StepTrigger) => void): void;  // which tracks fired, when
  getSpectrum(): Float32Array;     // FFT magnitudes for the spectrum bar
}

interface StepTrigger { step: number; tracks: number[]; time: number; }
```

The UI owns the **pattern data** (Angular signals — see architecture doc); the
engine is told about changes and is responsible for *sounding* them.

## The synthesized kit (no samples)

- All 8 voices are **generated in code** — no audio files ship. Each `voice`
  (`kick`, `snare`, `clap`, `hat`, `ohat`, `tom`, `cow`, `crash`) is a small
  oscillator/noise + filter + envelope graph. The exact per-voice recipe (frequencies,
  envelope times, filter cutoffs) is specified in `06-design-handoff.md` → "Audio engine".
- `init()` builds the reusable pieces once: the master/track gain chain and a single
  pre-generated **0.4 s white-noise buffer** shared by the noise voices.
- **No load/decode step** — there's nothing to fetch, so transport is ready immediately
  (a win over the old sample plan: zero assets, tiny bundle, instant start).
- Envelopes use `setValueAtTime` + `exponentialRampToValueAtTime` (never ramp to exactly
  0 — use `0.0001`). Each trigger builds a short-lived voice graph scaled by the track's volume.

## Per-step pitch

- Implemented as a **frequency scale** on the voice when that step fires: multiply every
  frequency node in the voice by `2^(semitones/12)` — the kick's start+end sweep, the tom
  sweep, the cowbell squares, the snare body, and the noise-filter cutoffs for hats/clap/crash
  (so timbre tracks pitch, not just tone). Musically effective (re-tuned kicks, rising toms).
- Default per step = 0 semitones (no change); range **−12…+12**. Stored on the **step** as a
  semitone offset; the engine applies the multiplier at trigger time. Click-audition uses the
  step's stored pitch too.
- Designed to generalize: the same per-step mechanism can later carry filter, decay, or
  probability (see overview "deferred"). Keep the path extensible.

## Signal graph & routing

```
 each Track:  Voice (osc/noise + filter + env, pitch-scaled) → Track Gain (volume) → Mute/Solo gate ┐
                                                                                                    ├→ Master Gain → Analyser → Destination
            (×8 tracks all sum into the master bus)                                                ┘
```

- **Volume** = per-track gain (0..1).
- **Mute** = gate that track to silence.
- **Solo** = if any track is soloed, gate all non-soloed tracks to silence.
- **Analyser** sits on the master bus so the spectrum bar reflects the full mix.

## Driving the visualizer

The "audiovisual" identity (a headline feature) is fed two ways, both sourced from
the engine so visuals are genuinely tied to sound:

1. **Spectrum bar** ← `AnalyserNode` FFT magnitudes, polled each animation frame.
2. **Particle bursts** ← `onStepTrigger` events (a burst when steps fire, colored
   by which tracks hit).

Idle vs active visualizer state follows `isPlaying`.

## Audio context unlock (browser requirement)

Browsers start the `AudioContext` **suspended** until a user gesture. Pulse must
call `unlock()` on the **first tap/click** (e.g. the play button) to resume it.
This is the most common "no sound" bug, and is *especially* strict on iOS Safari —
flagged again in the mobile doc.

## Voices & retriggers

A fast retrigger of the same track (two close steps) builds a **new voice graph**
rather than cutting the previous one abruptly, unless the sound is a choke group (e.g.
closed hat chokes open hat — optional, post-v1). v1: allow natural overlap; keep
it simple. (Voice graphs are cheap to spin up and are disposed when their envelope ends.)

## Performance notes

- No assets to load; pre-generate the shared noise buffer once at `init()`.
- Build voice graphs at trigger time and dispose them when the envelope completes — avoid
  leaking nodes on fast sequences.
- Poll the analyser at most once per animation frame (~60 fps), not per audio tick.
- The scheduler lookahead/interval are Tone defaults unless we measure a problem.

## Locked decisions

- Tone.js `^15`, isolated behind `AudioEngine`.
- Lookahead scheduling via `Tone.Transport` (not hand-rolled).
- **Synthesized voices** (no samples); per-voice recipes in `06-design-handoff.md`.
- Per-step pitch via frequency scaling `2^(n/12)` on every frequency node; stored as a
  semitone offset (−12…+12) on the step.
- Master-bus `AnalyserNode` for the spectrum; step-trigger events for particles.
- `unlock()` on first user gesture.

## Open / deferred

- Fine-tuning of the voice recipes (envelope/filter values) during the audio build.
- Choke groups, swing, additional p-lock parameters → post-v1.
