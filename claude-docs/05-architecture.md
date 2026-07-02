# Pulse — Architecture & Folder Structure

> Document 5 of 7. Where everything lives and how the layers relate.
> Status: **Decided.** Last updated 2026-06-30.

## Layering (the one rule that matters most)

Pulse has four layers. Dependencies flow **downward only** — an upper layer may use
the one below it, never the reverse, and never skip the engine to touch Tone.js.

```
┌───────────────────────────────────────────────┐
│  UI layer        components (grid, transport,  │  Angular standalone components
│                  track, step, visualizer)      │  thin: render + emit, no logic
├───────────────────────────────────────────────┤
│  State layer     PatternStore, TransportStore, │  signals; single source of truth
│                  SelectionStore                 │  owns pattern data + persistence
├───────────────────────────────────────────────┤
│  Audio layer     AudioEngine (the ONLY file    │  wraps Tone.js; sounds the pattern
│                  that imports Tone.js)          │
├───────────────────────────────────────────────┤
│  Core / domain   types, constants, kit defs    │  framework-free, pure TS
└───────────────────────────────────────────────┘
```

Why this is the highest-leverage decision for fast, safe agent work:

- **UI ↔ Audio are decoupled** — Claude Code can build the grid while the engine is
  stubbed, or tune the engine without touching components.
- **Tone.js is quarantined** in one file. Swapping audio libs = rewrite one file.
- **Stores are the single source of truth** — components never hold canonical state,
  so there's no "two places disagree" class of bug.

## Folder structure

```
pulse/
├─ public/
│  └─ fonts/              # self-hosted Fredoka + Space Mono (offline/PWA); no audio assets — voices are synthesized
├─ src/
│  ├─ app/
│  │  ├─ core/                      # framework-free domain
│  │  │  ├─ models/                 # Pattern, Track, Step, StepTrigger types
│  │  │  ├─ constants.ts            # STEP_COUNT=16, TRACK_COUNT=8, DEFAULT_BPM=118
│  │  │  └─ kit.ts                  # the 8-track kit definition (name, voice, colors, default vol)
│  │  │
│  │  ├─ audio/                     # AUDIO LAYER — only place Tone.js is imported
│  │  │  ├─ audio-engine.ts         # AudioEngine service (the contract from Doc 3)
│  │  │  ├─ audio-engine.spec.ts
│  │  │  └─ pitch.util.ts           # semitones → playbackRate
│  │  │
│  │  ├─ state/                     # STATE LAYER — signals, single source of truth
│  │  │  ├─ pattern.store.ts        # the 8×16 pattern + per-track/step settings
│  │  │  ├─ transport.store.ts      # isPlaying, bpm, currentStep
│  │  │  ├─ selection.store.ts      # selected step (drives the pitch knob)
│  │  │  └─ storage.service.ts      # localStorage auto-save / restore (versioned)
│  │  │
│  │  ├─ features/                  # UI LAYER — the screen, composed of components
│  │  │  └─ sequencer/
│  │  │     ├─ sequencer-page.ts    # top-level layout, wires stores ↔ engine
│  │  │     ├─ transport-bar/       # play, stop, clear, BPM stepper
│  │  │     ├─ grid/                # the 8×16 grid container
│  │  │     ├─ track-row/           # one track: label, color/mute, volume, 16 steps
│  │  │     ├─ step-orb/            # a single step (on/off, pitch indicator)
│  │  │     ├─ pitch-knob/          # the select-then-tweak knob
│  │  │     └─ visualizer/          # Canvas 2D particle field + spectrum bar
│  │  │
│  │  ├─ shared/                    # reusable UI bits (knob, button) + Tailwind tokens
│  │  └─ app.ts                     # root standalone component
│  ├─ styles/                       # Tailwind entry + design tokens (CSS variables)
│  └─ main.ts                       # bootstrap (zoneless)
├─ angular.json  ·  package.json  ·  tsconfig*.json  ·  tailwind config
└─ CLAUDE.md                        # agent rules (Doc 6)
```

## Component tree (the Pulse screen)

```
SequencerPage
├─ TransportBar        (play/stop · clear · BPM ±)
├─ Grid
│  └─ TrackRow ×8
│     ├─ track label · color/mute swatch · volume bar
│     └─ StepOrb ×16   (toggle on/off; shows pitch tweak; opens PitchKnob when selected)
├─ PitchKnob           (appears for the selected step)
└─ Visualizer          (idle/active · particle field · spectrum bar)
```

Components are **thin**: they render store signals and emit user intent (toggle
step, change bpm, select step). They do not own canonical state and do not call
Tone.js — they call stores; stores and the page coordinate the engine.

## Data flow (one cycle)

1. **User toggles a step** → component calls `PatternStore.toggleStep()`.
2. Store updates its signal → `StorageService` auto-saves (debounced) and the
   `StepOrb` re-renders from the signal.
3. The `SequencerPage` `effect` syncs the change into `AudioEngine.setStep()`.
4. **On play**, the engine's scheduler advances; each tick it (a) sounds the step,
   (b) updates `TransportStore.currentStep` (playhead), and (c) emits a
   `StepTrigger` the `Visualizer` consumes.
5. The `Visualizer` also polls the engine analyser each animation frame for the
   spectrum bar.

State is the source of truth; the engine sounds it; the visualizer reflects it.

## Initialization order

1. Bootstrap Angular (zoneless).
2. `StorageService.restore()` → load saved pattern or empty default.
3. `AudioEngine.init()` → build the gain graph + 8 synth voices, pre-gen the noise buffer (no assets to load).
4. First user gesture → `AudioEngine.unlock()` (resume AudioContext).
5. Ready: transport enabled.

## Conventions (full set in Doc 6)

- One component per folder; `*.ts`, `*.html`, `*.css/scss`, `*.spec.ts` together.
- Stores expose **readonly signals** + intent methods; no public mutable state.
- All cross-layer types come from `core/models` (glossary names only).
- Constants (16 steps, 8 tracks, 118 BPM) live in `core/constants.ts` — never
  magic numbers in components.

## Mobile-readiness

The layering already supports it: the UI layer is the only thing that changes for a
responsive/touch layout; audio, state, and core are platform-agnostic and carry
straight into a PWA/Capacitor wrapper.

## Locked decisions

Four layers, downward-only deps · Tone.js isolated in `audio/` · signal stores as
single source of truth · feature-folder component structure · thin components.
