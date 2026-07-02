# Pulse — Design Handoff (Visual Source of Record)

> Document 6 of the planning set.
> Status: **Received — high-fidelity, chosen direction ("Pastel").** Last updated 2026-07-02.
> Source: Claude Design handoff bundle (`design_handoff_step_sequencer/`), authored outside
> the code repo. This doc is the faithful, glossary-mapped transcription of that handoff.

**What this doc is.** The single source of truth for **how Pulse looks and feels** — exact
colors, type, spacing, radii, glows, and all step-cell states. Where this doc and the other
planning docs disagree on *visuals*, **this doc wins** (per the CLAUDE.md conflict rule:
"design wins for visuals, docs win for architecture/scope"). Where they disagree on *scope or
architecture* (e.g. synthesis vs. samples), the scope docs win **until Adi rules** — see
"Reconciliation" at the bottom.

**Naming.** The handoff calls the instrument parts "row" and "cell". This doc uses the
glossary (`02-glossary.md`) names instead: **track** (row) and **step** (cell). The exact
visual values are preserved verbatim.

---

## Reconciliation with the existing docs (open decisions for Adi)

| # | Topic | Existing docs (`01`/`CLAUDE.md`) | Design handoff | Status |
|---|---|---|---|---|
| 1 | **Sound source** | Built-in **samples** only; *no in-browser synthesis*. | **Web-Audio synthesis** per voice; no samples. | **Resolved: synthesis.** The handoff's voice math is ported into the Tone.js-hosted `AudioEngine`. No sample assets. Supersedes the docs' "samples only" line. |
| 2 | **Stack** | Angular 22 + Tone.js (docs win). | Recommends React + raw Web Audio. | **Resolved: stay Angular/Tone.** Handoff applies to visuals + synth *math* only. |
| 3 | **Per-step pitch (p-lock knob)** | Headline v1 control. | Now **fully specified** (handoff update 2026-07-02). | **Resolved: in v1, design supplied.** See "Headline v1 features" below. |
| 4 | **Per-track solo** | v1 control. | Now **fully specified** (handoff update 2026-07-02). | **Resolved: in v1, design supplied.** See "Headline v1 features" below. |
| 5 | **Default BPM** | 118. | 112. | **Resolved: 118** (docs). |
| 6 | **Track count** | Was drawn for 3, flagged for reconcile. | **Natively 8 tracks.** | **Resolved — 8 tracks, spacious.** |

All six items are now resolved (decided by Adi, 2026-07-02). Items 3/4 stay in v1 scope with
design to follow — the step states and track label in this doc are the visual base they'll extend.

---

## Design language

A **custom instrument surface** built from the *Adi Sabag Design System* tokens (soft pastel
SaaS: palette, rounded radii, soft violet shadows) — but **none of that system's portfolio
components** (buttons/cards/nav) apply. Build the instrument from the tokens below only.

Mood: **bright, pastel, playful, glowing.** Light-violet background, white circular pads that
light up in candy colors, a yellow playhead, soft diffuse glows (never hard black shadows),
rounded friendly type. It must **screenshot well** — it's a portfolio piece.

**Fidelity: high.** Colors, type, spacing, radii, glows, and every step-cell state are final —
reproduce them exactly. The only deliberately-unfinished areas: the **visualizer rendering**
(CSS-bar placeholder → real Canvas + FFT `AnalyserNode`) and **timing** (`setInterval` →
Web-Audio lookahead scheduler). Both already match our architecture docs (`03-audio-engine.md`).

---

## Layout

**One screen**: the instrument. Single centered column, `max-width: 980px`, full-height page.

### Page
- Background: `radial-gradient(125% 110% at 50% -8%, #FBF7FF 0%, #F1E9FF 55%, #E9DEFB 100%)`
- Padding `48px 32px 64px`; content centered (`flex-direction: column; align-items: center`).

### Header (above the card) — flex row, `space-between`, `align-items: flex-end`, `margin-bottom: 26px`
- **Left, eyebrow:** `AUDIOVISUAL SEQUENCER` — Fredoka `600`, `12px`, `letter-spacing .2em`,
  uppercase, `#9E86E8`, `margin-bottom 8px`.
- **Left, title:** `Pulse` — Fredoka `700`, `38px`, `line-height 1`, `letter-spacing -.02em`, `#2C2545`.
- **Right, meta:** `8 sounds · 16 steps` — Space Mono `700`, `10.5px`, `letter-spacing .16em`,
  uppercase, `#A99AC9`.

### Instrument card (wraps transport + grid + visualizer)
- `border-radius: 24px`, `overflow: hidden`.
- `background: rgba(255,255,255,.6)`.
- `box-shadow: 0 30px 70px -34px rgba(120,95,200,.5), inset 0 0 0 1px rgba(158,134,232,.16)`.
- Three stacked regions: **Transport bar → Step grid → Visualizer**.

### Footer note (below card)
Space Mono `400`, `12.5px`, `line-height 1.5`, `#A99AC9`, `margin: 18px 4px 0`.
*"Hit Play to start the audio · click cells to program · clear · ±BPM · mute per row.
Synth voices: kick, snare, hi-hat."*

---

## Region 1 — Transport bar

Flex row, `align-items: center`, `gap: 18px`, `padding: 20px 30px`,
`border-bottom: 1px solid rgba(158,134,232,.16)`, `background: rgba(255,255,255,.5)`.

1. **Play / Stop** — `52×52px` circle, no border.
   - `background: linear-gradient(120deg, #8FD3F4, #A98BEE 52%, #5FE0B0)` (the signature gradient).
   - `box-shadow: 0 0 24px -3px rgba(140,120,235,.7)`.
   - Icon **stopped**: white right triangle (`border-top:10px transparent; border-bottom:10px
     transparent; border-left:16px solid #fff; margin-left:4px`).
   - Icon **playing**: white `14×14px` square, `border-radius 3px`.
2. **Clear** — pill. `height 42px`, `padding 0 20px`, `border-radius 999px`, `background #fff`,
   `border 1px solid rgba(158,134,232,.22)`, `box-shadow 0 1px 2px rgba(130,105,205,.1)`.
   Text `CLEAR` Fredoka `600` `12px` `letter-spacing .06em` uppercase, `#6B5BA8`.
3. **BPM control** — `margin-left: auto`; flex row `gap 12px`:
   - **Readout** (right-aligned): number Space Mono `700` `28px` `#2C2545`; label `BPM` Fredoka
     `500` `9px` `letter-spacing .2em` `#A99AC9`.
   - **Stepper** (column `gap 5px`): two `24×20px` buttons `+` / `–` (en-dash), `border-radius 6px`,
     white surface as Clear, Fredoka `600` `14px`, `#6B5BA8`. `+` = **+2 BPM**, `–` = **−2 BPM**.
     Clamp **60–180**.

---

## Region 2 — Step grid

`padding: 26px 30px`. A step ruler, then 8 tracks.

**Every track (and the ruler)** is a CSS grid: `grid-template-columns: 104px 1fr; gap: 18px;
align-items: center`. The `104px` column is the track label; the `1fr` column holds 16 steps.

**The 16-step track** is `grid-template-columns: repeat(16, 1fr); gap: 9px`. **Beat grouping:**
steps at indices **4, 8, 12** get `margin-left: 12px` → four visual groups of four.

### Ruler (above tracks, `margin-bottom: 12px`)
Label column empty. The 16-slot column shows the beat number (`1 2 3 4`) on steps 0/4/8/12 and a
`·` on the rest. Space Mono `700` `10px`. Colors: **current playhead** column `#E0A93B` (amber);
beat markers `#A99AC9`; in-between dots `transparent`. (While playing, the beat number under the
playhead lights amber.)

### Track label (the `104px` column) — flex row `gap 11px`
- **Mute toggle** — `22×22px`, `border-radius 7px`, no border.
  - **Un-muted:** `background #2FCB97` (green), `box-shadow 0 0 11px rgba(47,203,151,.55)`.
  - **Muted:** `background #fff`, `box-shadow inset 0 0 0 1.5px rgba(158,134,232,.28)`.
  - Muted track: skipped by audio; its on-steps dim to `opacity .3`; the whole label block fades
    to `opacity .45`.
- **Name + volume** (column `gap 6px`):
  - Name: Fredoka `600` `15px`, `letter-spacing -.01em`, `#2C2545`.
  - Volume mini-bar: track `64×5px`, `border-radius 999px`, `background rgba(158,134,232,.16)`.
    Fill width `= vol × 100%`, `border-radius 999px`,
    `background linear-gradient(90deg, <track.light>, <track.main>)`.
    *(Prototype: display-only. Production: interactive slider → per-track `GainNode` /
    Tone volume.)*

### Step cell — `40×40px` circle (`border-radius 50%`, `margin: 0 auto`), `transition: all .1s ease`, `cursor: pointer`
Four states — **the heart of the design, get these exact**:

| State | When | Style |
|---|---|---|
| **Off** | step = 0 | `background #FFFFFF`; `box-shadow: inset 0 0 0 1.5px rgba(158,134,232,.22), 0 2px 5px rgba(130,105,205,.12)` |
| **Playhead** | step = 0 **and** current **and** playing | `background rgba(242,200,75,.22)`; `box-shadow: inset 0 0 0 1.5px #F2C84B, 0 0 12px rgba(242,200,75,.5)` |
| **On** | step = 1 | `background radial-gradient(circle at 50% 36%, <track.light>, <track.main>)`; `box-shadow: 0 0 16px <track.main>99, inset 0 1px 1px rgba(255,255,255,.55)` |
| **Hit** | step = 1 **and** current **and** playing **and** not muted | `background radial-gradient(circle at 50% 36%, #fff, #F2C84B 34%, <track.main>)`; `box-shadow: 0 0 22px 5px <track.main>cc, 0 0 46px #F2C84B88`; **`transform: scale(1.22)`** — the satisfying pop |

`<track.main>` / `<track.light>` = the track's two colors; `99`/`cc`/`88` are hex-alpha
suffixes. A muted on-step also gets `opacity: .3`.

---

## Region 3 — Visualizer (first-class element, not decoration)

`height: 196px`, `overflow: hidden`, `border-top: 1px solid rgba(158,134,232,.16)`,
`background: linear-gradient(180deg, #F4EEFF, #ECE2FB)`. Layered contents:

- **Energy glow** — full-bleed absolute layer. Per step, `energy = min(1, sum(vol of active,
  un-muted steps at that step) / 2.1)`. Glow =
  `radial-gradient(58% 130% at 50% 135%, rgba(242,200,75, 0.05 + energy*0.4), transparent 70%)`,
  `transition: background .12s`. Bottom-center swells yellow on loud beats.
- **Particle field** — ~13 circles (`5–11px`), scattered, cycling the 4-color palette,
  `opacity .7`, `box-shadow 0 0 12px <color>`, each drifting on a `floaty` keyframe
  (`2.4–4.2s`), **only while playing**.
- **Spectrum bar** — 44 bars, `align-items: flex-end`, `gap 5px`, inset `left/right 26px, top 34px,
  bottom 20px`. Each `flex: 1`, `border-radius 4px 4px 2px 2px`,
  `background linear-gradient(180deg, <c>, <c>99)` cycling the palette, `box-shadow 0 0 10px <c>66`,
  `eq` keyframe (`scaleY .18 → 1 → .18`) at varied durations/delays, **only while playing** (near-flat when stopped).
- **Labels** — top-left `VISUALIZER` (Space Mono `700` `10px` `.22em` `#A99AC9`); top-right a
  status dot + `LIVE`/`IDLE`. Dot `8px`, green `#2FCB97` + glow when playing, else `#C9BEE3`.

**Production note (matches `03-audio-engine.md`):** replace the CSS `eq` fake with a real
`<canvas>` driven by an `AnalyserNode` (FFT). Route `master → analyser → destination`; per frame
read `getByteFrequencyData`, draw bars in the palette gradient, and drive particles + energy glow
from real audio energy (ideally per-hit `StepTrigger` events). Keep the exact visual style — this
is only swapping the data source.

---

## The 8 tracks (top → bottom)

`main`/`light` are the step/volume colors; `voice` is the synthesis routine.

| # | Track | voice | main | light | default vol |
|---|---|---|---|---|---|
| 1 | **Kick** | `kick` | `#9E86E8` | `#C7B8F5` (purple) | `.9` |
| 2 | **Snare** | `snare` | `#3FA9E8` | `#9AD8F2` (blue) | `.8` |
| 3 | **Clap** | `clap` | `#7C66D6` | `#B3A0EE` (deep purple) | `.7` |
| 4 | **Closed Hat** | `hat` | `#2FCB97` | `#9BE8C8` (green) | `.55` |
| 5 | **Open Hat** | `ohat` | `#EBA92E` | `#F6D885` (yellow) | `.5` |
| 6 | **Low Tom** | `tom` | `#3FA9E8` | `#9AD8F2` (blue) | `.65` |
| 7 | **Rim/Cowbell** | `cow` | `#2FCB97` | `#9BE8C8` (green) | `.5` |
| 8 | **Crash** | `crash` | `#9E86E8` | `#C7B8F5` (purple) | `.55` |

Default patterns (16 steps, `1` = on) — a usable starting groove:

```
Kick:        1000 1000 1000 1000
Snare:       0000 1000 0000 1000
Clap:        0000 1000 0000 1001
Closed Hat:  1010 1010 1010 1010
Open Hat:    0010 0010 0010 0110
Low Tom:     0000 0000 0010 0010
Rim/Cowbell: 0010 0010 0010 0010
Crash:       1000 0000 0000 0000
```

Built to **extend** — a 9th+ track should Just Work if tracks are data-driven.

---

## Interactions

- **Click a step** → toggles on/off. On toggle-on (if not muted), it **auditions** immediately
  (plays that voice once) — why steps feel tactile even when stopped.
- **Play/Stop** → toggles playback. **Audio context is created/resumed inside this first user
  gesture** (browsers block `AudioContext` until a gesture). Instrument **starts stopped**; first
  Play (or first step click) lazily creates + resumes the context (`unlock()` in our docs).
- **Clear** → all steps of all tracks → 0.
- **± BPM** → ±2, clamp 60–180, re-arm the clock.
- **Mute** → per track; muted tracks silent, on-steps dim.
- **Playhead** sweeps left→right one step at a time, wraps 15→0, only while playing. The current
  step drives playhead/hit states, the amber ruler number, and the visualizer.

## Local state (handoff's shape — reconcile with our signal stores)

- `step` (0–15) — current playhead position.
- `playing` (bool) — starts `false`.
- `bpm` (number) — starts `112` *(docs say 118 — pick one)*.
- `tracks[]` — each `{ name, voice, steps: Array<{on, pitch}>[16], vol, main, light, muted, soloed }`.
  *(Pitch + solo added by the 2026-07-02 update — see "Headline v1 features". The prototype's
  flat `pattern: number[16]` is the pre-pitch shape; migrate from it.)*
- Non-reactive audio refs: `audioContext`, `masterGain`, pre-generated noise buffer;
  production adds `analyser` + per-track `GainNode`s.

*(Our architecture keeps canonical state in signal stores, not components — see
`05-architecture.md`. The shape above maps onto the pattern/transport/selection stores.)*

## Timing / clock

- Prototype: `setInterval` at `60000 / bpm / 4` ms (16th notes).
- **Production (already our rule):** Web-Audio **lookahead scheduler** — `setInterval(~25ms)`
  that looks ~100ms ahead and schedules `start()` times against `audioContext.currentTime`.
  Keep UI `step` roughly in sync for visuals. (See `03-audio-engine.md` — this matches.)

---

## Audio engine — working synthesis (portable math)

> **Decided (2026-07-02):** v1 uses **this synthesis** (not samples — decision #1 above). The
> routines below are the handoff's working Web-Audio code; they port into our Tone.js-hosted
> `AudioEngine` (Tone lives only in `src/app/audio/`).

One `AudioContext`; `masterGain` (≈0.85) → destination. A `0.4s` white-noise `AudioBuffer` is
pre-generated once and reused by noise voices. Each voice builds a tiny graph scaled by the
track's `vol`. Envelopes use `setValueAtTime` + `exponentialRampToValueAtTime` (never ramp to
exactly 0 — use `0.0001`).

- **kick** — sine, `155→48Hz` exp over 120ms; gain attack ~4ms to `vol`, exp decay to ~0 by 340ms.
- **snare** — white noise → `highpass 1400Hz` (env → 0 by 180ms) **plus** `triangle 185Hz` body
  (env → 0 by 120ms).
- **clap** — `bandpass 1500Hz, Q 1.1`; four noise bursts at `0, 12, 24, 50ms`, last with a 120ms tail.
- **hat** (closed) — white noise → `highpass 7000Hz`, env → 0 by ~50ms.
- **ohat** (open) — white noise → `highpass ~6500Hz`, long env → 0 by ~320ms.
- **tom** (low) — sine `220→98Hz` over 180ms, env → 0 by 300ms.
- **cow** (rim/cowbell) — two `square` osc (`540Hz` + `800Hz`) → one gain, env → 0 by 160ms.
- **crash** — white noise → `highpass 4000Hz`, long env → 0 by ~1.1s.

---

## Design tokens (the exact palette)

**Palette (4 "candy" colors cycled in the visualizer):**
`#9E86E8` purple · `#3FA9E8` blue · `#2FCB97` green · `#F2C84B` yellow.

**Accent / playhead:** `#F2C84B` yellow (playhead ring, hit-step core, energy glow).

**Ink / text:** title/label `#2C2545`; secondary/mono `#A99AC9`; button text `#6B5BA8`; amber
playhead number `#E0A93B`.

**Green (mute-on / status live):** `#2FCB97`, glow `rgba(47,203,151,.55)`.

**Backgrounds:** page `radial-gradient(125% 110% at 50% -8%, #FBF7FF, #F1E9FF 55%, #E9DEFB)`;
card `rgba(255,255,255,.6)`; transport `rgba(255,255,255,.5)`; visualizer
`linear-gradient(180deg, #F4EEFF, #ECE2FB)`.

**Signature gradient (play):** `linear-gradient(120deg, #8FD3F4, #A98BEE 52%, #5FE0B0)`.

**Borders / hairlines:** `rgba(158,134,232,.16)` dividers · `rgba(158,134,232,.22)` step ring /
button border · `rgba(158,134,232,.28)` muted-mute inset.

**Shadows (soft, violet-tinted — never hard black):**
- card `0 30px 70px -34px rgba(120,95,200,.5)`
- step off `inset 0 0 0 1.5px rgba(158,134,232,.22), 0 2px 5px rgba(130,105,205,.12)`
- play glow `0 0 24px -3px rgba(140,120,235,.7)`
- button `0 1px 2px rgba(130,105,205,.1)`

**Radii:** steps / mute-dot fully round (`50%`; `7px` for the square mute); card `24px`; pills
`999px`; small buttons `6px`; volume track `999px`.

**Typography:**
- Display / labels / buttons: **Fredoka** (400–700). Title `700 38px / -.02em`; track name
  `600 15px`; buttons `600 12–14px`; eyebrow `600 12px / .2em / uppercase`.
- Numeric / mono: **Space Mono** (400/700). BPM `700 28px`; ruler `700 10px`; meta labels
  `700 10–10.5px / .16–.22em`.
- *(The design system's body face is Plus Jakarta Sans; this instrument intentionally uses the
  rounder **Fredoka** for a "toy" feel — keep Fredoka.)*

**Spacing:** page pad `48px 32px 64px`; card content pads `20–26px 30px`; grid gaps `9px` (steps) /
`18px` (label↔track) / `12px` (beat-group offset); column `max-width 980px`.

**Sizes:** step `40px`; play `52px`; mute `22px`; BPM stepper `24×20px`; volume track `64×5px`;
visualizer `196px` tall, 44 bars.

**Keyframes:** `eq` = `scaleY(.18) ↔ scaleY(1)` (bars); `floaty` = translate `(0,0) → (6px,-16px)
→ (0,0)` (particles). Both run **only while playing**.

**Assets:** none external — all glyphs (play triangle/square, +/–) are CSS/geometry. Fonts are
Google Fonts **Fredoka** + **Space Mono**.

---

## Headline v1 features (handoff update 2026-07-02)

These two are **in v1** — they're what make Pulse feel like a real instrument, not a toy grid.
Not in the prototype; build from these specs. Both **extend** the data model, replacing nothing.
(Glossary: these are the **p-lock / pitch** and **solo** terms from `02-glossary.md`.)

### 1. Per-step pitch — the p-lock knob (glossary: **Parameter lock / Pitch**)

Any **on**-step can carry its own pitch offset, so one track can play a melody/tom-run instead of
one repeated note (Elektron parameter-lock idea).

**Data model.** Each step becomes an object: `{ on: boolean, pitch: number }`, where `pitch` is a
**semitone offset**, range **−12…+12** (two octaves), default `0`. *(This supersedes the
`pattern: number[16]` shape noted earlier in this doc — keep a migration path from old `0/1`
arrays; see persistence/versioning in `05-architecture.md`.)*

**Audio.** Apply the offset as `freq × 2^(pitch/12)` on **every** frequency node in the voice —
the kick's start+end sweep, the tom sweep, the cowbell squares, the snare body, and the
noise-filter cutoffs for hats/clap/crash (so timbre tracks pitch). Click-audition uses the step's
stored pitch too.

**Interaction (edit in-place — that's the p-lock feel; no separate panel):**
- **Primary:** hover an on-step → a small **rotary knob** affordance appears (or the step itself
  becomes the knob); **click-drag vertically** (or scroll) to change pitch. Up = higher. Snap to
  whole semitones. (Optional later: modifier for fine/continuous.)
- While dragging, show the value as a tiny Space Mono readout (`+5`, `-3`, `0`).
- **At rest**, an on-step with pitch ≠ 0 shows a subtle **notch/tick** rotated by the pitch amount
  (map −12…+12 → roughly −135°…+135°, same convention as the Eurorack BPM knob in
  `Sequencer Directions.dc.html`), and/or a faint `+n`/`-n` label. Off-steps show nothing.
- **Reset** a step to `0` via double-click (or right-click "reset").
- On-brand: knob tick in accent yellow `#F2C84B`; glow consistent with the step's own track color.

**State.** Only `steps[i].pitch` is added — no new global state. On **Clear**, reset pitch to `0`
so a re-enabled step starts neutral.

### 2. Per-track solo (glossary: **Solo**)

Standard mixer solo, complementing the existing per-track mute.

**Data model.** Add `soloed: boolean` per track (default `false`).

**Behavior.** If **any** track is soloed, only soloed tracks are audible (non-soloed tracks
silenced regardless of their own mute). If none are soloed, normal mute rules apply. Single
audibility predicate — use it in both the step trigger and the visualizer energy sum so audio and
visuals agree:

```
audible = anySoloed ? track.soloed : !track.muted
```

Solo and mute are independent flags: solo wins while any solo is active, but a track's own mute
still applies once solo mode ends.

**UI.** A second `22×22px`, `border-radius 7px` toggle in the track label, next to the green mute
square — an **"S"** button (Fredoka `600`, ~`11px`):
- **Soloed:** filled accent yellow `#F2C84B`, warm glow `box-shadow 0 0 11px rgba(242,200,75,.55)`,
  letter `#2C2545`.
- **Inactive:** white with the mute-inactive hairline `inset 0 0 0 1.5px rgba(158,134,232,.28)`,
  letter `#A99AC9`.
- When **another** track's solo is silencing this one, dim this track's label block like muting does
  (`opacity .45` / on-steps `opacity .3`) so it's obviously not sounding.
- Optionally relabel mute as "M" for symmetry (designer's call) — keep both toggles same size/aligned.
- The `104px` label column may need ~`120px` (or a tighter `gap`) to fit two toggles + name.

---

## Suggested build order (from the handoff)

1. **Static layout** — page bg, header, card shell, transport bar, 8 empty tracks, ruler,
   visualizer box.
2. **Track + step components**, data-driven from `tracks[]`; the four step states.
3. **Click-to-toggle + Clear + mute**; wire the four states to `step`/`playing`.
4. **Audio engine** (voices) + click-audition.
5. **Lookahead scheduler + playhead**; Play/Stop gesture-gated context; BPM stepper.
6. **Interactive per-track volume** (GainNodes / Tone volume).
7. **Per-track solo** (`soloed` flag + audibility predicate + "S" toggle) — small; do it alongside mute.
8. **Per-step pitch / p-lock** (step objects with `pitch`, drag-knob interaction, `2^(n/12)` in
   voices, at-rest cell indicator) — the bigger of the two; do after grid + audio are solid.
9. **Canvas visualizer** off a real `AnalyserNode` (replace the CSS-bar placeholder).
10. **"Add a sound"** affordance (tracks already data-driven).

## Source bundle (reference only — do not ship the wrapper)

- `Sequencer - Pastel.dc.html` — the **chosen** design; the reference to rebuild.
- `Sequencer — Neon.dc.html` — earlier dark exploration; context only.
- `Sequencer Directions.dc.html` — the 3-direction comparison; context only.

The `.dc.html` files preview in a browser, but the outer `<x-dc>` / `support.js` wrapper is
design-tool-specific — read them for markup/styles/state/audio, reimplement in Angular, never
ship the wrapper.
