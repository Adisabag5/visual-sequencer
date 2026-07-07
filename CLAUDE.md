# CLAUDE.md — Working rules for Pulse

> This file steers any AI coding agent (and human) working in this repo.
> Read it before writing code. It is short on purpose. Keep it current.
> Project codename: **Sequencer** · Product: **Pulse** (Audiovisual Sequencer).

## What Pulse is (one paragraph)

A client-only Angular web app: an 8-track × 16-step audiovisual drum-machine
sequencer. Built-in samples, tempo/transport, per-track volume/mute/solo, per-step
pitch (select-then-tweak knob), and a headline reactive visualizer. No backend;
auto-saves to the browser. Designed to wrap to mobile later (PWA → Capacitor).
Full spec in `claude-docs/01-overview.md`.

## Golden rules (do not break these)

1. **Respect the layers.** Dependencies flow downward only:
   `UI → State → Audio → Core`. UI never reaches past State to the engine's
   internals; nothing lower imports anything higher. (See `claude-docs/05-architecture.md`.)
2. **Tone.js lives in exactly one place:** `src/app/audio/`. No other file imports
   `tone`. The rest of the app uses the `AudioEngine` interface only.
3. **Stores are the single source of truth.** Components never own canonical state.
   Pattern/transport/selection live in signal stores; components render + emit.
4. **Use the glossary names** (`claude-docs/02-glossary.md`). One name per concept, in
   code and UI. No synonyms (`step` not `cell/slot`; `track` not `channel/lane`).
5. **No magic numbers.** `STEP_COUNT`, `TRACK_COUNT`, `DEFAULT_BPM`, etc. live in
   `core/constants.ts`.
6. **Timing is sacred.** Never schedule audio with `setInterval`/`setTimeout`. Use
   the engine's Tone-based lookahead scheduler (`claude-docs/03-audio-engine.md`).

## Angular conventions (this is an Angular 22 project)

- **Standalone components only** — no NgModules.
- **Signals for all reactive state** — `signal`, `computed`, `effect`. No
  RxJS `BehaviorSubject` for app state.
- **Zoneless** — do not add `zone.js`; do not rely on Zone-based change detection.
- **New control flow** in templates — `@if`, `@for`, `@switch`. Never `*ngIf`/`*ngFor`.
- **OnPush** change detection on every component.
- Stores expose **readonly** signals + intent methods (`toggleStep()`, `setBpm()`).
  No public mutable fields.
- One component per folder: `name.ts` / `name.html` / `name.css` / `name.spec.ts`.
- Prefer small, composable components (see the component tree in Doc 5).

## Styling

- **Tailwind CSS v4** utilities for layout/most styling.
- Pull colors, radii, blur, and glow from **design tokens** (CSS variables in
  `src/styles/`). Do not hardcode hex values in components.
- Component SCSS only for things utilities do poorly (orb gradients/glows).
- **No inline styles — ever** (decided 2026-07-07). Templates must not contain
  `style="…"` attributes or `[style.*]`/`[ngStyle]` bindings. All CSS rules live in
  stylesheet files (component SCSS or `src/styles/`). Dynamic values cross into CSS
  only as CSS custom properties or classes set from the component class (host
  bindings / `[class.x]`); the rules that consume them live in the stylesheet.
- Match the Pulse design: pastel, glassmorphism, glowing gradient orbs, rounded font.

## Audio & visualizer

- All sound goes through `AudioEngine` (`claude-docs/03-audio-engine.md`).
- Per-step **pitch** = playback-rate/detune from a semitone offset on the step.
  Keep the per-step parameter path **extensible** (filter/decay/probability later).
- Resume the AudioContext on the **first user gesture** (`unlock()`).
- Visualizer = **Canvas 2D** + one `requestAnimationFrame` loop. Spectrum bar reads
  the engine analyser; particles consume `StepTrigger` events. Pause the loop when
  idle.

## Persistence

- Auto-save the pattern to `localStorage` via `StorageService`, **debounced**.
- Include a schema `version` field for safe migrations. Restore on startup; fall
  back to an empty pattern.

## Testing & quality

- **Vitest** unit tests for stores, the engine wrapper, and pitch/util logic.
  The scheduler/timing and pitch math especially must have tests.
- **Playwright** e2e for the core flow: toggle steps → play → hear/inspect → clear
  → reload restores.
- Lint with **angular-eslint**, format with **Prettier**. Code must pass both.
- TypeScript is **strict**. No `any` without a written reason.
- Every new domain concept goes into the glossary **before** it gets code.

## Commands (pnpm)

```bash
pnpm install
pnpm start        # dev server (Angular CLI)
pnpm test         # unit tests (Vitest)
pnpm e2e          # Playwright
pnpm lint         # angular-eslint
pnpm build        # production build
```

(Exact scripts live in `package.json`; this file is the source for toolchain rules.)

## How to work in this repo (human-in-the-loop)

**The human (Adi) is the gatekeeper. The agent proposes; Adi decides.** Do not make
big or irreversible moves alone — consult first, in plain language, and wait for a
clear go-ahead. When unsure whether something is "big," treat it as big and ask.

### The loop for every task

1. **Restate** what you're about to do in one or two sentences, in plain English.
2. **Plan** — list the files you'll add/change and the approach. Keep it short.
3. **Checkpoint** — for anything beyond a trivial change, **pause and get Adi's
   approval before writing code.** Trivial = a small fix fully inside one file with
   no interface or scope impact; that you may just do, then report.
4. **Build** in small, reviewable steps, each green (lint + tests pass).
5. **Report back** — say what changed, what you saw, and the next suggested step.
   End by asking how to proceed; don't auto-chain into the next big task.

### Always consult Adi BEFORE (do not do these on your own)

- Adding, removing, or upgrading a dependency.
- Changing an interface/contract (e.g. `AudioEngine`, a store's public API).
- Anything that touches scope — adding a feature, or changing what v1 includes.
- Changing architecture, the layering, or the folder structure.
- Editing these planning docs or the design intent.
- Deleting files, large refactors, or anything hard to undo.
- Any decision where there's a real trade-off or more than one reasonable option —
  present the options and a recommendation, then let Adi choose.

### You may proceed without asking (then report)

- Small bug fixes contained to one file.
- Adding tests, comments, or formatting/lint fixes.
- Work Adi has already explicitly approved in this session.

### Tone of communication

- Keep updates **short and in plain language** — no walls of text, no jargon dumps.
- Surface decisions **early**, while they're cheap to change, not after building.
- When stuck or when reality differs from the plan, **stop and say so** rather than
  guessing or pushing ahead.

### Conflict rules

- Design vs. docs: **design wins for visuals**, **docs win for architecture/scope**.
  Flag the conflict to Adi rather than silently picking.
- Keep these docs updated when decisions change. Stale docs are worse than none.

## Out of scope for v1 (do not build)

Per-step velocity, swing, multiple patterns, song mode, user uploads,
add/remove tracks, accounts/backend. (See `claude-docs/01-overview.md` "deferred".)
Note: v1 **uses** in-browser synthesis (Tone.js) as its sound source — decided 2026-07-02.

## Doc map

- `claude-docs/01-overview.md` — what Pulse is, v1 scope.
- `claude-docs/02-glossary.md` — naming. **Read this.**
- `claude-docs/03-audio-engine.md` — timing, Tone.js, pitch, visualizer feed.
- `claude-docs/04-tech-stack.md` — versions and choices.
- `claude-docs/05-architecture.md` — layers, folders, component tree.
- `claude-docs/06-design-handoff.md` — **visual source of record**: exact tokens, step-cell
  states, layout, the received Pastel design. Design wins for visuals.
- `CLAUDE.md` — **this file**: rules, conventions, toolchain, workflow.

Mobile-readiness (PWA → Capacitor) is covered inline in the tech-stack and
architecture docs; no separate mobile doc for now.
