# CLAUDE.md — Working rules for Pulse

> This file steers any AI coding agent (and human) working in this repo.
> Read it before writing code. It is short on purpose. Keep it current.
> Project codename: **Sequencer** · Product: **Pulse** (Audiovisual Sequencer).

## What Pulse is (one paragraph)

An Angular web app: an 8-track × 16-step audiovisual drum-machine sequencer.
Built-in samples, tempo/transport, per-track volume/mute/solo, per-step pitch
(select-then-tweak knob), and a headline reactive visualizer. The sequencer itself
still works offline and auto-saves to the browser. Designed to wrap to mobile later
(PWA → Capacitor). Full spec in `claude-docs/01-overview.md`.

**Accounts (added 2026-08-22).** Pulse now has a backend: `~/DEV/nest-server`, a NestJS +
MySQL API providing sign up / sign in, profiles, collections and saved **beats**. This
replaced the original "client-only, no backend" scope. The pattern still auto-saves
locally; the server is what lets a person keep named beats across devices.

## Golden rules (do not break these)

1. **Respect the layers.** Dependencies flow downward only:
   `UI → State → {Audio | API} → Core`. Audio and API sit side by side and never import
   each other. UI never reaches past State to the engine's internals; nothing lower
   imports anything higher. (See `claude-docs/05-architecture.md`.)
2. **Tone.js lives in exactly one place:** `src/app/audio/`. No other file imports
   `tone`. The rest of the app uses the `AudioEngine` interface only.
3. **`HttpClient` lives in exactly one place:** `src/app/api/`. Components and stores
   never call it directly — they go through `ApiClient`. Same quarantine logic as Tone.js:
   one folder to change, and the whole server is trivially fakeable in tests.
4. **Stores are the single source of truth.** Components never own canonical state.
   Pattern/transport/selection live in signal stores; components render + emit.
5. **Use the glossary names** (`claude-docs/02-glossary.md`). One name per concept, in
   code and UI. No synonyms (`step` not `cell/slot`; `track` not `channel/lane`).
6. **No magic numbers.** `STEP_COUNT`, `TRACK_COUNT`, `DEFAULT_BPM`, etc. live in
   `core/constants.ts`.
7. **Timing is sacred.** Never schedule audio with `setInterval`/`setTimeout`. Use
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
- The **server** stores a beat's pattern as that same versioned `SavedState` blob,
  opaquely. `StorageService` remains the owner of that schema and its migrations — the
  API just carries it.

## Session handling

- The **access token is held in memory only** (a signal in `AuthStore`), never in
  `localStorage`. Anything readable by JavaScript is readable by an XSS.
- The **refresh token is an httpOnly cookie** the browser sends automatically, scoped to
  `/auth`. Every API call needs `withCredentials: true` or the cookie never leaves.
- A session survives reload by calling `POST /auth/refresh` on boot, not by persisting
  the token. On failure, the person is simply signed out.
- Access tokens last 15 minutes, so a 401 mid-session is normal: the interceptor refreshes
  once and retries. Two 401s in a row means sign in again.

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

## Out of scope (do not build)

Per-step velocity, swing, song mode, user uploads, add/remove tracks.
(See `claude-docs/01-overview.md` "deferred".)
Note: v1 **uses** in-browser synthesis (Tone.js) as its sound source — decided 2026-07-02.

**No longer out of scope:** accounts/backend, and multiple patterns — a saved **beat** is
a titled pattern, and a person can have many. Decided 2026-08-22.

Still deliberately absent on the auth side: social/Google sign-in (needs a Google Cloud
project and an account-linking design), password reset, and email verification.

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
