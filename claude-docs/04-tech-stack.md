# Pulse — Tech Stack & Decisions

> Document 4 of 7. The concrete list of what we build with and why.
> Status: **Decided.** Last updated 2026-06-30.

## Summary table

| Concern | Choice | Version | Why |
| --- | --- | --- | --- |
| Framework | Angular | `^22` | Client-only SPA, signals-first, zoneless default, your stack of choice. |
| Language | TypeScript (strict) | bundled | Type safety keeps an AI agent honest; strict catches drift early. |
| Audio | Tone.js | `^15` | Sequencer plumbing done right (see Doc 3), behind `AudioEngine`. |
| State | Angular **signals** (in services) | built-in | Right-sized; no external state lib needed for v1. |
| Persistence | `localStorage` (JSON) | browser | Pattern is tiny; auto-save/restore without a DB. |
| Styling | Tailwind CSS | `^4` | Fast, custom glassmorphism look; agent-friendly; design tokens. |
| Visualizer | Canvas 2D + `requestAnimationFrame` | browser | Smooth at this scale, no dependency, small bundle. |
| Package manager | pnpm | `^9`+ | Fast, disk-efficient, deterministic. |
| Build/dev | Angular CLI (esbuild/Vite) | bundled | Default toolchain; fast HMR, optimized builds. |

No backend in v1. Everything runs in the browser.

## Framework: Angular 22

- **Standalone components** (no NgModules).
- **Signals** for all reactive state — `signal`, `computed`, `effect`. Stable and
  the default idiom in Angular 22.
- **Zoneless** change detection (Angular 21+ default). Pairs naturally with signals
  and removes zone.js overhead — good for a 60fps UI next to an audio loop.
- **New control flow** in templates: `@if`, `@for`, `@switch` (not `*ngIf`/`*ngFor`).
- **OnPush** everywhere (the modern default); signals drive precise updates.
- Routing: Angular Router only if we add views later; v1 is effectively one screen,
  so routing is optional/minimal.

## State management: signals in services, no NgRx

Pulse's state is small and local (one pattern, transport, UI selection). A
**signal-based store service** is the right size:

- `PatternStore` — the 8×16 pattern, per-track settings, per-step pitch. Source of
  truth for the UI, serialized for auto-save.
- `TransportStore` — isPlaying, bpm, currentStep.
- `SelectionStore` — which step is selected (drives the pitch knob).

No NgRx / external state library in v1 — it would add ceremony without payoff. If
the app grows (multiple patterns, song mode), revisit then. The `AudioEngine`
reads from these stores; the UI binds to them.

## Persistence: localStorage

- The pattern serializes to a small JSON blob (well under any storage limit).
- **Auto-save**: write on change, **debounced** (~300–500 ms) to avoid thrashing.
- **Restore**: read and load on app start; fall back to an empty pattern.
- Wrapped in a `StorageService` so the mechanism (localStorage now, IndexedDB later
  if needed) is swappable. Include a small schema `version` field for safe
  future migrations.

## Styling: Tailwind CSS v4

- Utility-first for fast, custom UI that matches the Pulse design.
- **Design tokens** (CSS variables) for the pastel palette, track colors, glass
  blur, radii, and glow — defined once, used everywhere, so the look stays
  consistent and is easy to retheme.
- Component-scoped SCSS only for the few things utilities handle poorly (complex
  gradients/glows on the orbs).
- **Typography**: the design uses a rounded, bold geometric typeface. Pick a
  rounded sans (e.g. Nunito / Quicksand-style) and self-host it for offline/PWA.

## Visualizer: Canvas 2D

- A single `<canvas>` driven by one `requestAnimationFrame` loop.
- Reads FFT magnitudes from the engine's analyser for the **spectrum bar**, and
  consumes **step-trigger events** for **particle bursts** (see Doc 3).
- Sized to device pixel ratio for crispness; pauses the loop when idle to save
  battery (important on mobile).
- Kept behind a `Visualizer` component so it's decoupled from sequencer logic.

## Tooling (headline; full rules in CLAUDE.md)

- **pnpm** for installs.
- **angular-eslint** + **Prettier** for lint/format.
- **Vitest** for unit tests, **Playwright** for end-to-end (confirmed in tooling doc).
- Angular CLI for serve/build.

## Deliberately avoided

- **NgRx / external state libs** — overkill for v1.
- **Angular Material / component kits** — fight the custom aesthetic.
- **WebGL libs (three/Pixi)** — unnecessary weight for this visualizer.
- **Backend / database / accounts** — out of scope; client-only.
- **Date/util megalibraries** (moment, etc.) — not needed.

## Mobile-readiness ties

- Client-only + static assets = trivially wrappable (PWA → Capacitor).
- Self-hosted fonts and **synthesized audio** (no sample files) = works offline, zero audio assets.
- Canvas loop pauses when idle; synthesis adds no download weight (good for cellular).
- Audio-unlock-on-gesture is mandatory on mobile (Doc 3).

## Locked decisions

Angular 22 (signals, zoneless, standalone) · Tone.js 15 behind `AudioEngine` ·
signals-in-services state · localStorage auto-save · Tailwind 4 + design tokens ·
Canvas 2D visualizer · pnpm.

## Reconciliation status (2026-06-30)

The project was bootstrapped from Adi's `angular-stater-template` and reconciled to
this stack. Verified green: production build, lint, and unit tests all pass.

| Item | Installed |
| --- | --- |
| Angular | 22.0.4 |
| TypeScript | ~6.0.3 (bumped by `ng update`) |
| Tone.js | 15.1.22 |
| Tailwind CSS | 4.3.x via `@tailwindcss/postcss` (+ `.postcssrc.json`) |
| Unit tests | Vitest 4 (`@angular/build:unit-test`) — already in template |
| E2E | Playwright 1.61 (`e2e/`, `playwright.config.ts`, `pnpm e2e`) |
| Package manager | pnpm 11.9 (via corepack); `pnpm-workspace.yaml` allows native builds |
| Lint/format | angular-eslint 22, Prettier, Stylelint, husky + lint-staged |

Notes:
- **SSR removed** — template shipped SSR/Express; stripped to a pure client-only SPA
  (no `server.ts`, `@angular/ssr`, `platform-server`, or `express`).
- **Global stylesheet is `src/styles.css`** (not `.scss`) so Tailwind v4's
  `@import 'tailwindcss';` is processed by PostCSS. Component styles remain SCSS.
- **E2E browsers** aren't pre-installed here; run `pnpm exec playwright install`
  locally before `pnpm e2e`.

## Sources

- [Angular 22 — current release & features](https://www.angulararchitects.io/en/blog/angular-22-the-most-important-new-features-at-a-glance/)
- [Tone.js (npm)](https://www.npmjs.com/package/tone)
