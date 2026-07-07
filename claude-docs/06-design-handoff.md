# Pulse — Design Handoff (Visual Source of Record)

> Document 6 of the planning set.
> Status: **Received — high-fidelity, "Pastel v2" (Kit system).** Last updated 2026-07-06.
> Source: Claude Design handoff bundle **v2** (`design_handoff_step_sequencer 3/`), received
> 2026-07-06, authored outside the code repo. **v2 supersedes the earlier single-kit "Pastel"
> handoff** (`design_handoff_step_sequencer/`, 2026-07-02); the canonical design file is now
> `Sequencer - Pastel v2.dc.html`. This doc is the faithful, glossary-mapped transcription
> of that handoff.

**What this doc is.** The single source of truth for **how Pulse looks and feels** — exact
colors, type, spacing, radii, glows, all step-cell states, and (new in v2) the **Kit system**:
the voice library, preset kits, and the slide-out **Kit panel**. Where this doc and the other
planning docs disagree on *visuals*, **this doc wins** (per the CLAUDE.md conflict rule:
"design wins for visuals, docs win for architecture/scope"). Where they disagree on *scope or
architecture*, the repo docs win **until Adi rules** — see "Reconciliation" below.

**Naming.** The handoff calls the instrument parts "row" and "cell". This doc uses the
glossary (`02-glossary.md`) names instead: **track** (row) and **step** (cell). The v2 Kit
terms are already in the glossary (2026-07-06): **voice**, **voice library**, **category**,
**kit**, **slot**, **active kit**, **kit panel**, **voice picker**. The exact visual values
are preserved verbatim.

---

## Reconciliation with the existing docs

| # | Topic | Repo docs (`01`/`CLAUDE.md`) | Design handoff | Status |
|---|---|---|---|---|
| 1 | **Sound source** | Built-in samples only (original line). | **Web-Audio synthesis** per voice. | **Resolved: synthesis** (Adi, 2026-07-02). v2 expands this to the full **~30-voice library** below — still no sample assets. |
| 2 | **Stack** | Angular 22 + Tone.js (docs win). | v2 again recommends React + raw Web Audio + plain CSS. | **Resolved: stay Angular/Tone** (re-confirmed for v2). Handoff applies to visuals + synth *math* only. Tone stays inside `src/app/audio/`. |
| 3 | **Per-step pitch (p-lock knob)** | Headline v1 control. | Fully specified (2026-07-02); unchanged in v2. v2's `voice()` already takes a `pitch` arg. | **Resolved: in v1, design supplied.** See "Headline v1 features". |
| 4 | **Per-track solo** | v1 control. | Fully specified (2026-07-02); unchanged in v2. | **Resolved: in v1, design supplied.** See "Headline v1 features". |
| 5 | **Default BPM** | 118. | v2 still says **112** (`bpm` starts 112). | **Resolved: 118** — Adi ruled 118 on 2026-07-02 and **re-confirmed 2026-07-06**. `DEFAULT_BPM = 118` in `core/constants.ts`. |
| 6 | **BPM stepper increment** | (unspecified) | **±2 per click**, clamp 60–180. | **Design wins** — visual/interaction detail; adopt ±2. |
| 7 | **Track count** | 8. | Natively 8 tracks; fixed for v1, designed to go dynamic later. | **Resolved — 8 tracks**, now fully data-driven (track = `voiceId`). |
| 8 | **Kit system / voice library** | Not in the v1 handoff or scope docs. | **The core of v2**: preset kits + Custom voice swapping + Kit panel. | **Adopted** — glossary terms added 2026-07-06. Kits/voices are part of v1. |
| 9 | **Fixed 8-track color table** | (was the v1 handoff's spec, transcribed in the previous revision of this doc) | Tracks have **no fixed identity** — name + colors derive from the voice's **category**. | **Superseded by v2.** See "Tracks, the Kit system & the Voice Library". |
| 10 | **Persistence** | Versioned schema via `StorageService`, debounced auto-save (CLAUDE.md). | Raw `localStorage` key **`pulseSeqV2`**, save on every mutation. | **Resolved: keep the versioned `StorageService` schema** (decided 2026-07-06). The handoff's key/shape is reference only — do **not** adopt `pulseSeqV2`. Its *behavioral* rules (restore on load, validate voice ids, fall back to Musical 8, never touch unrelated keys) are adopted. |

### README ↔ v2 prototype file discrepancies (minor, flagged not hidden)

The v2 README and `Sequencer - Pastel v2.dc.html` disagree on a few small values. The
prototype file is the working design; where it differs, the file's values are noted inline
below and are the safer pick:

- **Track-label column:** README's grid section says `104px`; the v2 file (and the README's
  own solo note) uses **`112px`**. Use 112px.
- **Transport gap:** README says `gap: 18px`; the v2 file uses **`14px`** (it fits the extra
  Kit button). Use 14px.
- **Track name size:** README says Fredoka `600 15px`; the v2 file uses **`600 14.5px`**
  (with `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` for long voice names).
- **Track row spacing:** the v2 file stacks the 8 tracks with `gap: 14px`.
- **Visualizer palette:** README says the **4**-color candy palette cycles; the v2 file cycles
  **5** colors — the 4 plus **pink `#E86FA6`**.
- **Visualizer energy divisor:** README says `min(1, sum/2.1)`; the v2 file uses `/2.4`.

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

**One screen**: the instrument — single centered column, `max-width: 980px`, full-height
page — **plus a slide-out Kit panel** fixed to the left edge (see "Kit Panel").

### Page
- Background: `radial-gradient(125% 110% at 50% -8%, #FBF7FF 0%, #F1E9FF 55%, #E9DEFB 100%)`
- Padding `48px 32px 64px`; content centered (`flex-direction: column; align-items: center`).

### Header (above the card) — flex row, `space-between`, `align-items: flex-end`, `margin-bottom: 26px`
- **Left, eyebrow:** `AUDIOVISUAL SEQUENCER` — Fredoka `600`, `12px`, `letter-spacing .2em`,
  uppercase, `#9E86E8`, `margin-bottom 8px`.
- **Left, title:** `Pulse` — Fredoka `700`, `38px`, `line-height 1`, `letter-spacing -.02em`, `#2C2545`.
- **Right, meta (changed in v2 — now dynamic):** the **kit label** — Space Mono `700`,
  `10.5px`, `letter-spacing .16em`, uppercase, `#A99AC9`. Text is
  **`{active kit name} · 8 · 16`** (e.g. `Musical 8 · 8 · 16`), or **`Custom kit · 8 · 16`**
  when `activeKit` is `null`. *(v1's static `8 sounds · 16 steps` is superseded.)*

### Instrument card (wraps transport + grid + visualizer)
- `border-radius: 24px`, `overflow: hidden`.
- `background: rgba(255,255,255,.6)`.
- `box-shadow: 0 30px 70px -34px rgba(120,95,200,.5), inset 0 0 0 1px rgba(158,134,232,.16)`.
- Three stacked regions: **Transport bar → Step grid → Visualizer**.

### Footer note (below card) — text changed in v2
Space Mono `400`, `12.5px`, `line-height 1.5`, `#A99AC9`, `margin: 18px 4px 0`. Text:
*"Open the Kit panel (left) to load a preset or build your own · hit Play · click cells to
program · your kit & pattern are saved across refreshes."*
*(v1's "Hit Play to start the audio … Synth voices: kick, snare, hi-hat." is superseded.)*

---

## Region 1 — Transport bar

Flex row, `align-items: center`, `padding: 20px 30px`,
`border-bottom: 1px solid rgba(158,134,232,.16)`, `background: rgba(255,255,255,.5)`.
Gap: v2 file `14px` (README says 18px — see discrepancies). Left-to-right in the v2 file:
**Play → Kit → Clear → BPM**.

1. **Play / Stop** — `52×52px` circle, no border.
   - `background: linear-gradient(120deg, #8FD3F4, #A98BEE 52%, #5FE0B0)` (the signature gradient).
   - `box-shadow: 0 0 24px -3px rgba(140,120,235,.7)`.
   - Icon **stopped**: white right triangle (`border-top:10px transparent; border-bottom:10px
     transparent; border-left:16px solid #fff; margin-left:4px`).
   - Icon **playing**: white `14×14px` square, `border-radius 3px`.
2. **Kit button (new in v2)** — pill that toggles the Kit panel. `height 42px`,
   `padding 0 18px`, `border-radius 999px`, same white surface as Clear
   (`background #fff`, `border 1px solid rgba(158,134,232,.22)`,
   `box-shadow 0 1px 2px rgba(130,105,205,.1)`). Contents: a **hamburger icon** (three
   `13×2px` bars, `border-radius 2px`, `background #9E86E8`, column `gap 2.5px`) + text
   `KIT` — Fredoka `600` `12px` `letter-spacing .04em` uppercase, `#6B5BA8`; flex row `gap 8px`.
3. **Clear** — pill. `height 42px`, `padding 0 20px`, `border-radius 999px`, `background #fff`,
   `border 1px solid rgba(158,134,232,.22)`, `box-shadow 0 1px 2px rgba(130,105,205,.1)`.
   Text `CLEAR` Fredoka `600` `12px` `letter-spacing .06em` uppercase, `#6B5BA8`.
4. **BPM control** — `margin-left: auto`; flex row `gap 12px`:
   - **Readout** (right-aligned): number Space Mono `700` `28px` `#2C2545`; label `BPM` Fredoka
     `500` `9px` `letter-spacing .2em` `#A99AC9`.
   - **Stepper** (column `gap 5px`): two `24×20px` buttons `+` / `–` (en-dash), `border-radius 6px`,
     white surface as Clear, Fredoka `600` `14px`, `#6B5BA8`. `+` = **+2 BPM**, `–` = **−2 BPM**
     (design wins on the ±2 increment). Clamp **60–180**.
   - *(Default value: **118** per repo decision — the handoff's 112 is overruled; see
     reconciliation #5.)*

---

## Region 2 — Step grid

`padding: 26px 30px`. A step ruler, then 8 tracks (v2 file: tracks stacked with `gap 14px`).

**Every track (and the ruler)** is a CSS grid: `grid-template-columns: 112px 1fr; gap: 18px;
align-items: center`. The `112px` column is the track label; the `1fr` column holds 16 steps.
*(v2 value — the old 104px is superseded; the solo toggle may push this to ~120px, see
"Headline v1 features".)*

**The 16-step track** is `grid-template-columns: repeat(16, 1fr); gap: 9px`. **Beat grouping:**
steps at indices **4, 8, 12** get `margin-left: 12px` → four visual groups of four.

### Ruler (above tracks, `margin-bottom: 12px`)
Label column empty. The 16-slot column shows the beat number (`1 2 3 4`) on steps 0/4/8/12 and a
`·` on the rest. Space Mono `700` `10px`. Colors: **current playhead** column `#E0A93B` (amber);
beat markers `#A99AC9`; in-between dots `transparent`. (While playing, the beat number under the
playhead lights amber.)

### Track label (the `112px` column) — flex row `gap 11px`
- **Mute toggle** — `22×22px`, `border-radius 7px`, no border.
  - **Un-muted:** `background #2FCB97` (green), `box-shadow 0 0 11px rgba(47,203,151,.55)`.
  - **Muted:** `background #fff`, `box-shadow inset 0 0 0 1.5px rgba(158,134,232,.28)`.
  - Muted track: skipped by audio; its on-steps dim to `opacity .3`; the whole label block fades
    to `opacity .45`.
- **Name + volume** (column `gap 6px`):
  - Name: Fredoka `600` `15px` (v2 file: `14.5px`), `letter-spacing -.01em`, `#2C2545`;
    v2 file adds `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` (voice names
    can be long, e.g. "Vinyl Crackle"). **The name is derived from the track's voice** — it is
    not a fixed label (see the Kit system below).
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

`<track.main>` / `<track.light>` = the track's two colors — **in v2 these come from the
track's voice category**, not from a fixed per-track table (see below). `99`/`cc`/`88` are
hex-alpha suffixes. A muted on-step also gets `opacity: .3`.

---

## Region 3 — Visualizer (first-class element, not decoration)

`height: 196px`, `overflow: hidden`, `border-top: 1px solid rgba(158,134,232,.16)`,
`background: linear-gradient(180deg, #F4EEFF, #ECE2FB)`. Layered contents:

- **Energy glow** — full-bleed absolute layer. Per step, `energy = min(1, sum(vol of active,
  un-muted steps at that step) / 2.1)` *(v2 file divides by `2.4` — see discrepancies)*. Glow =
  `radial-gradient(58% 130% at 50% 135%, rgba(242,200,75, 0.05 + energy*0.4), transparent 70%)`,
  `transition: background .12s`. Bottom-center swells yellow on loud beats.
- **Particle field** — ~13 circles (`5–11px`), scattered, cycling the palette,
  `opacity .7`, `box-shadow 0 0 12px <color>`, each drifting on a `floaty` keyframe
  (`2.4–4.2s`), **only while playing**.
- **Spectrum bar** — 44 bars, `align-items: flex-end`, `gap 5px`, inset `left/right 26px, top 34px,
  bottom 20px`. Each `flex: 1`, `border-radius 4px 4px 2px 2px`,
  `background linear-gradient(180deg, <c>, <c>99)` cycling the palette, `box-shadow 0 0 10px <c>66`,
  `eq` keyframe (`scaleY .18 → 1 → .18`) at varied durations/delays, **only while playing** (near-flat when stopped).
- **Palette cycled by bars/particles:** README says the 4 candy colors; the **v2 file cycles 5** —
  `#9E86E8`, `#3FA9E8`, `#2FCB97`, `#F2C84B`, **`#E86FA6`** (pink, matching the new `fx` category).
- **Labels** — top-left `VISUALIZER` (Space Mono `700` `10px` `.22em` `#A99AC9`); top-right a
  status dot + `LIVE`/`IDLE`. Dot `8px`, green `#2FCB97` + glow when playing, else `#C9BEE3`.

**Production note (matches `03-audio-engine.md`):** replace the CSS `eq` fake with a real
`<canvas>` driven by an `AnalyserNode` (FFT). Route `master → analyser → destination`; per frame
read `getByteFrequencyData`, draw bars in the palette gradient, and drive particles + energy glow
from real audio energy (ideally per-hit `StepTrigger` events). Keep the exact visual style — this
is only swapping the data source.

---

## Tracks, the Kit system & the Voice Library (v2 — the core change)

The grid is **8 tracks**. **A track is not hard-wired to a sound** — every track holds a
**`voiceId`** pointing into the shared **voice library**, and the track's name and
`main`/`light` colors are **derived** from that voice's **category** (not stored on the track).
The user changes what a track *is* at runtime, either by loading a whole **preset kit** or by
swapping a single track's voice in the Kit panel's **Custom** view. Track count is fixed at 8
for v1 (designed to go dynamic later).

> **Superseded:** the v1 handoff's fixed 8-track table (Kick/Snare/Clap/… with per-track
> colors and one default groove) is **replaced** by the category-derived colors and the three
> preset kits below. Do not implement fixed track identities.

### Category → colors (six categories)

| Category | id | main | light |
|---|---|---|---|
| **Low end** | `low` | `#9E86E8` | `#C7B8F5` (purple) |
| **Bass / tonal** | `tonal` | `#3FA9E8` | `#9AD8F2` (blue) |
| **Snare family** | `snare` | `#7C66D6` | `#B3A0EE` (deep purple) |
| **Hats / cymbals** | `hat` | `#2FCB97` | `#9BE8C8` (green) |
| **Toms / perc** | `perc` | `#EBA92E` | `#F6D885` (amber) |
| **FX / texture** | `fx` | `#E86FA6` | `#F4AECB` (pink) |

The category decides the track's step-cell gradient, volume-bar gradient, slot swatch, and
preset-card chip colors — so the grid stays legible no matter what kit is loaded.

### The voice library (30 voices, all real Web-Audio synthesis)

Every voice is `voiceId → { name, category }` plus a synth routine (see "Audio engine").
Grouped by category (the same grouping the voice picker's `<optgroup>`s use):

- **Low end:** `kick` (Kick), `punch` (Punch Kick), `eight08` (808 Kick)
- **Bass / tonal:** `sub` (Sub Bass), `synthbass` (Synth Bass), `pluck` (Pluck), `stab` (Synth Stab),
  `bell` (Bell), `marimba` (Marimba)
- **Snare family:** `snare` (Snare), `clap` (Clap), `rimshot` (Rimshot), `brush` (Brush Snare)
- **Hats / cymbals:** `hatC` (Closed Hat), `hatO` (Open Hat), `shaker` (Shaker), `ride` (Ride),
  `crash` (Crash), `tamb` (Tambourine)
- **Toms / perc:** `lowtom` (Low Tom), `midtom` (Mid Tom), `conga` (Conga), `bongo` (Bongo),
  `cowbell` (Cowbell), `clave` (Clave), `woodblock` (Woodblock)
- **FX / texture:** `zap` (Zap), `blip` (Blip), `sweep` (Noise Sweep), `vinyl` (Vinyl Crackle)

*(The README says "~29"; the file defines exactly 30. The glossary's "~30" matches.)*

### Preset kits

A **kit** is a named snapshot: `{ name, desc, slots: [{ voice, pattern: number[16], vol }] × 8 }`.
Loading a kit replaces **all 8 tracks' voices, patterns, and volumes** at once (and **clears
mutes** — and solos, once solo exists), then marks itself the **active kit**. After loading,
editing any single slot silently flips the header to **"Custom kit"** (`activeKit → null`) —
presets and custom are the same mechanism, not separate machines. Three kits ship:

**1. Musical 8** — *"Full backbone + 3 tonal voices — grooves and plays a tune."*

| # | Voice | Pattern | Vol |
|---|---|---|---|
| 1 | `kick` (Kick) | `1000 1000 1000 1000` | .9 |
| 2 | `sub` (Sub Bass) | `1000 0010 1000 0010` | .8 |
| 3 | `snare` (Snare) | `0000 1000 0000 1000` | .8 |
| 4 | `clap` (Clap) | `0000 1000 0000 1001` | .65 |
| 5 | `hatC` (Closed Hat) | `1010 1010 1010 1010` | .55 |
| 6 | `hatO` (Open Hat) | `0010 0010 0010 0110` | .5 |
| 7 | `lowtom` (Low Tom) | `0000 0000 0010 0010` | .6 |
| 8 | `stab` (Synth Stab) | `1000 0000 0010 0000` | .6 |

**2. Club / Techno** — *"Dry, hypnotic, four-on-the-floor. Fewer tonal slots."*

| # | Voice | Pattern | Vol |
|---|---|---|---|
| 1 | `kick` (Kick) | `1000 1000 1000 1000` | .95 |
| 2 | `sub` (Sub Bass) | `1010 0010 1010 0010` | .75 |
| 3 | `clap` (Clap) | `0000 1000 0000 1000` | .7 |
| 4 | `rimshot` (Rimshot) | `0010 0010 0010 0010` | .5 |
| 5 | `hatC` (Closed Hat) | `1010 1010 1010 1010` | .5 |
| 6 | `hatO` (Open Hat) | `0010 0010 0010 0010` | .45 |
| 7 | `ride` (Ride) | `1000 1000 1000 1000` | .4 |
| 8 | `zap` (Zap) | `0000 0000 0000 0010` | .5 |

**3. Lo-fi / Organic** — *"Warm, sparse, characterful. Softer and human."*

| # | Voice | Pattern | Vol |
|---|---|---|---|
| 1 | `kick` (Kick) | `1000 0000 1000 0000` | .75 |
| 2 | `synthbass` (Synth Bass) | `1000 0010 0010 0000` | .7 |
| 3 | `rimshot` (Rimshot) | `0000 1000 0000 1000` | .5 |
| 4 | `brush` (Brush Snare) | `0000 0000 0000 1000` | .55 |
| 5 | `shaker` (Shaker) | `0010 1010 0010 1010` | .45 |
| 6 | `conga` (Conga) | `0000 0010 0000 0010` | .5 |
| 7 | `bell` (Bell) | `1000 0000 0000 0000` | .45 |
| 8 | `vinyl` (Vinyl Crackle) | `1000 0000 1000 0000` | .4 |

**Default state on first load (no saved data): Musical 8** (kit panel open, Presets view).

---

## Kit Panel (slide-out, left) — new in v2

A fixed panel on the **left edge**, `width 330px` (`position: fixed; left/top/bottom: 0`,
`z-index 50`), `padding 26px 22px`, `overflow-y: auto`. It slides in/out on
`transform: translateX(0 / -100%)` over `.35s cubic-bezier(.2,.7,.2,1)`.

**Surface:** `background rgba(251,249,255,.92)` with `backdrop-filter: blur(16px)`; right
hairline `border-right 1px solid rgba(158,134,232,.2)`; when open, soft violet shadow
`box-shadow 24px 0 60px -30px rgba(120,95,200,.55)` (none when closed). Scrollbar: `8px`
wide, thumb `rgba(158,134,232,.3)`, `border-radius 99px`.

**Open/close** (`panelOpen`, **starts open**):
- **KIT edge tab** — a vertical button fixed to the left edge (`top 50%`,
  `translateY(-50%)`, `z-index 45`), visible **only when the panel is closed**
  (`opacity 0` + `pointer-events: none` when open, `transition: opacity .25s`); click opens.
  Style: `padding 16px 9px`, `border-radius 0 14px 14px 0`,
  `background linear-gradient(160deg, #A98BEE, #8FD3F4)`,
  `box-shadow 6px 0 20px -8px rgba(140,120,235,.7)`. Contents (column, `gap 8px`): a white
  hamburger (three `14×2.5px` bars, `border-radius 2px`, column `gap 3px`) + vertical `KIT`
  (Space Mono `700` `10px` `.15em`, white, `writing-mode: vertical-rl`).
- The **Kit button** in the transport bar toggles it too (see Region 1).
- An **✕ button** top-right of the panel closes it — `32×32px`, `border-radius 50%`,
  `border 1px solid rgba(158,134,232,.25)`, `background #fff`, `#6B5BA8`, `16px`.

**Panel header** (row, `space-between`, `margin-bottom 18px`):
- Eyebrow `KIT` — Space Mono `700` `11px` `letter-spacing .2em` `#9E86E8`.
- Title `Sound library` — Fredoka `600` `22px` `letter-spacing -.01em` `#2C2545`.

**Segmented control** — `Presets | Custom` (`kitMode`). Container: flex `gap 6px`,
`padding 4px`, `border-radius 12px`, `background rgba(158,134,232,.12)`, `margin-bottom 18px`.
Each segment: `flex 1`, `border-radius 9px`, `padding 8px 0`, Fredoka `600` `12.5px` `.03em`,
`transition all .15s`. **Active:** white text on
`linear-gradient(120deg, #A98BEE, #8FD3F4)`, `box-shadow 0 4px 12px -4px rgba(140,120,235,.6)`.
**Inactive:** `#6B5BA8` on transparent.

### Presets view — the 3 kit cards (column, `gap 12px`)

Each card is a full-width button: `text-align left`, `padding 14px 15px`, `border-radius 16px`,
`transition all .15s`. Clicking a card loads that kit.
- **Active (loaded) kit:** `background linear-gradient(180deg, #FBF7FF, #F3ECFF)`,
  `border 1.5px solid #9E86E8` (lavender),
  `box-shadow 0 0 0 3px rgba(158,134,232,.15), 0 8px 20px -10px rgba(120,95,200,.5)`.
- **Inactive:** `background #fff`, `border 1.5px solid rgba(158,134,232,.2)`,
  `box-shadow 0 1px 2px rgba(130,105,205,.08)`.

Card contents:
- **Name row** (`space-between`, `margin-bottom 6px`): kit name Fredoka `600` `15px` `#2C2545`;
  on the right a badge — active: **`LOADED`** (Space Mono `700` `9px` `.12em`, white on
  `#9E86E8`, `border-radius 999px`, `padding 3px 8px`); inactive: **`LOAD →`** (Space Mono
  `700` `9px` `.1em`, `#9E86E8`, no pill).
- **Description:** Space Mono `400` `11.5px`, `line-height 1.4`, `#A99AC9`, `margin-bottom 10px`.
- **Voice chips:** the kit's 8 voices as small **category-colored chips** (flex-wrap, `gap 5px`):
  Fredoka `500` `10px`, text `#4A4266`, `background <cat.light>55`,
  `border 1px solid <cat.main>55`, `border-radius 999px`, `padding 2px 8px`, `white-space nowrap`.

### Custom view — 8 slot rows + voice picker

A one-line hint first — Space Mono `400` `11px`, `line-height 1.5`, `#A99AC9`,
`margin 0 2px 12px`: *"Assign any voice to each of the 8 tracks. Your grid pattern stays —
only the sound changes."* Then **8 slot rows** (column, `gap 8px`).

Each **slot row**: flex, `gap 10px`, `padding 8px 10px`, `border-radius 12px`,
`background #fff`, `border 1px solid rgba(158,134,232,.18)`. Contents:
- **Category swatch** — `22×22px`, `border-radius 7px`,
  `background radial-gradient(circle at 50% 35%, <cat.light>, <cat.main>)`,
  `box-shadow 0 0 8px <cat.main>88`.
- **Track number** — Space Mono `700` `10px` `#C9BEE3`, `width 16px`.
- **Voice picker** — a styled field showing the current voice name + a **▾** chevron, with a
  **transparent native `<select>` layered on top**. Field: Fredoka `600` `13px` `#2C2545`,
  `background #F7F4FE`, `border 1px solid rgba(158,134,232,.25)`, `border-radius 9px`,
  `padding 8px 10px`; name truncates with ellipsis; chevron `#9E86E8` `10px`. The `<select>`
  is absolutely positioned over the field (`opacity 0`, full size), grouped into
  **`<optgroup>`s by category** (labels: Low end / Bass / tonal / Snare family /
  Hats / cymbals / Toms / perc / FX / texture).
- Changing it calls **`setVoice(trackIndex, voiceId)`** — swaps only that track's sound
  (**keeps its pattern & volume**), **auditions** the new voice once, and flips
  `activeKit → null` (header reads "Custom kit").

> Handoff implementation note: the transparent-native-select-over-a-styled-field pattern is
> used because it renders the chosen value reliably and styles consistently across browsers.
> In our Angular build a controlled select (or a custom listbox) is fine — just keep the
> grouped-by-category options and the category swatch.

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
- **Load kit** (Presets card) → replaces all 8 tracks' voices/patterns/volumes, clears mutes,
  sets `activeKit`; header shows the kit name.
- **Swap voice** (Custom picker) → changes one track's `voiceId` only; pattern & volume kept;
  auditions once; `activeKit → null` ("Custom kit").
- **Kit panel** → opened by the KIT edge tab or the transport Kit button; closed by ✕ or the
  Kit button; **starts open**.
- **Playhead** sweeps left→right one step at a time, wraps 15→0, only while playing. The current
  step drives playhead/hit states, the amber ruler number, and the visualizer.

## Local state (handoff's shape — reconcile with our signal stores)

- `step` (0–15) — current playhead position.
- `playing` (bool) — starts `false`.
- `bpm` (number) — handoff starts `112`; **repo decision: `DEFAULT_BPM = 118`** (reconciliation #5).
- `panelOpen` (bool) — kit panel open; starts `true`.
- `kitMode` (`'presets' | 'custom'`) — which panel view is showing.
- `activeKit` (kit id or `null`) — the loaded preset, or `null` once the user edits a slot
  ("Custom kit").
- `tracks[]` — each `{ voiceId, steps: Array<{on, pitch}>[16], vol, muted, soloed }`.
  **Name and `main`/`light` colors are derived** from `voiceId` via the voice library +
  category colors — never stored on the track. *(The prototype's flat `pattern: number[16]`
  is the pre-pitch shape; pitch + solo come from the headline-features spec below — migrate
  from flat arrays.)*
- Non-reactive audio refs: `audioContext`, `masterGain`, pre-generated noise buffer;
  production adds `analyser` + per-track `GainNode`s.

*(Our architecture keeps canonical state in signal stores, not components — see
`05-architecture.md`. The shape above maps onto the pattern/transport/selection stores.)*

## Persistence (handoff spec vs. repo decision)

**Repo decision (2026-07-06): keep the versioned schema in `StorageService`** — debounced
auto-save with a schema `version` field, per CLAUDE.md. The handoff's raw **`pulseSeqV2`**
localStorage key and unversioned shape
(`{ kit: activeKit|null, bpm, rows: [{ v, p, m, vol }] }`) are **not adopted**.

These handoff behaviors **are** adopted (they match our persistence rules):
- Save after every mutation (ours: debounced): toggle step, clear, mute, BPM change, load kit,
  swap voice — the **active kit id and per-track `voiceId`s are part of the saved pattern**.
- On startup, restore; if a kit id was saved, open the panel's Presets view, else Custom.
- **Validate voice ids against the library on load** (unknown id → fall back to `kick`) so a
  stale save can't break the grid.
- If absent or invalid, fall back to loading **Musical 8**.
- **Never** clear or overwrite unrelated storage keys.

## Timing / clock

- Prototype: `setInterval` at `60000 / bpm / 4` ms (16th notes).
- **Production (already our rule):** Web-Audio **lookahead scheduler** — `setInterval(~25ms)`
  that looks ~100ms ahead and schedules `start()` times against `audioContext.currentTime`.
  Keep UI `step` roughly in sync for visuals. (See `03-audio-engine.md` — this matches.)

---

## Audio engine — working synthesis (portable math, all 30 voices)

> **Decided (2026-07-02, unchanged for v2):** v1 uses **this synthesis** (not samples). The
> routines below are the handoff's working Web-Audio code; they port into our Tone.js-hosted
> `AudioEngine` (Tone lives only in `src/app/audio/`).

One `AudioContext`; `masterGain` (≈0.85) → destination. A **0.5s** white-noise `AudioBuffer`
is pre-generated once and reused by noise voices. `voice(id, t, g, pitch)` builds a tiny graph
per hit, scaled by the track's `vol` (`g`); the **`pitch` arg** (semitone offset, default 0)
multiplies every oscillator frequency by `2^(pitch/12)` — already wired for the p-lock feature.

Helper shape used throughout: `_g(t, peak, attack, decay)` returns a gain node with a
`setValueAtTime(0.0001) → exponentialRampToValueAtTime(peak) → exponentialRampToValueAtTime(0.0001)`
envelope; noise voices are `noise → biquad filter → _g → master`. **Never** ramp exponentially
to exactly 0 — use `0.0001`. This is real, working code in `Sequencer - Pastel v2.dc.html` —
copy the graph construction from the `voice()` switch.

- **Low end** — **kick** sine `150→48Hz`/120ms, env decay ~340ms · **punch** sine `260→60Hz`/60ms
  + a highpassed-noise click · **eight08** sine `95→42Hz`/160ms, long ~600ms decay.
- **Bass/tonal** — **sub** sine `55Hz`, ~280ms · **synthbass** saw `65Hz` → `lowpass 700` ·
  **pluck** saw `330Hz` → lowpass sweep `4000→500Hz` · **stab** three saws `220/261.6/329.6Hz`
  (A-minor) → `lowpass 2600` · **bell** two sines `880 + 1320Hz`, ~500ms · **marimba** sines
  `440 + 880Hz`, woody ~180ms.
- **Snare** — **snare** noise `hp 1400` + tri `185Hz` body · **clap** `bandpass 1500` four bursts
  at `0/12/24/50ms` · **rimshot** tri `1700Hz` click + hp-noise · **brush** noise `lowpass 3000`,
  soft ~200ms.
- **Hats/cymbals** — **hatC** noise `hp 7000`, ~50ms · **hatO** noise `hp 6500`, ~320ms ·
  **shaker** noise `bandpass 5000` · **ride** noise `hp 8000` + sine `520Hz` ping · **crash**
  noise `hp 4000`, ~1.1s · **tamb** two `bandpass 8000` bursts.
- **Toms/perc** — **lowtom** sine `220→98Hz` · **midtom** sine `330→150Hz` · **conga** sine
  `300→210Hz` · **bongo** sine `520→380Hz` · **cowbell** squares `540 + 800Hz` · **clave** sine
  `2500Hz`, ~50ms · **woodblock** square `1200Hz`, ~40ms.
- **FX** — **zap** saw `1200→80Hz` sweep · **blip** sine `880Hz`, ~80ms · **sweep** noise
  `lowpass 200→6000Hz` · **vinyl** noise `lowpass 9000`, low-level crackle.

---

## Design tokens (the exact palette)

**Palette ("candy" colors cycled in the visualizer):**
`#9E86E8` purple · `#3FA9E8` blue · `#2FCB97` green · `#F2C84B` yellow — the v2 file adds
**`#E86FA6` pink** as a fifth cycled color.

**Track colors:** derived from the six **category** colors (see the category table above) —
each track = its voice's category `main` + `light`. *(The v1 fixed per-track color table is
superseded.)*

**Accent / playhead:** `#F2C84B` yellow (playhead ring, hit-step core, energy glow).

**Ink / text:** title/label `#2C2545`; secondary/mono `#A99AC9`; button text `#6B5BA8`; amber
playhead number `#E0A93B`; chip text `#4A4266`; slot number / idle dot `#C9BEE3`.

**Green (mute-on / status live):** `#2FCB97`, glow `rgba(47,203,151,.55)`.

**Backgrounds:** page `radial-gradient(125% 110% at 50% -8%, #FBF7FF, #F1E9FF 55%, #E9DEFB)`;
card `rgba(255,255,255,.6)`; transport `rgba(255,255,255,.5)`; visualizer
`linear-gradient(180deg, #F4EEFF, #ECE2FB)`; kit panel `rgba(251,249,255,.92)` +
`backdrop-filter: blur(16px)`; picker field `#F7F4FE`; active preset card
`linear-gradient(180deg, #FBF7FF, #F3ECFF)`.

**Signature gradients:** play button `linear-gradient(120deg, #8FD3F4, #A98BEE 52%, #5FE0B0)`;
segmented-control active `linear-gradient(120deg, #A98BEE, #8FD3F4)`; KIT edge tab
`linear-gradient(160deg, #A98BEE, #8FD3F4)`.

**Borders / hairlines:** `rgba(158,134,232,.16)` dividers · `rgba(158,134,232,.18)` slot row ·
`rgba(158,134,232,.2)` panel edge / inactive card · `rgba(158,134,232,.22)` step ring / button
border · `rgba(158,134,232,.25)` picker field / ✕ · `rgba(158,134,232,.28)` muted-mute inset.

**Shadows (soft, violet-tinted — never hard black):**
- card `0 30px 70px -34px rgba(120,95,200,.5)`
- step off `inset 0 0 0 1.5px rgba(158,134,232,.22), 0 2px 5px rgba(130,105,205,.12)`
- play glow `0 0 24px -3px rgba(140,120,235,.7)`
- button `0 1px 2px rgba(130,105,205,.1)`
- kit panel (open) `24px 0 60px -30px rgba(120,95,200,.55)`
- KIT tab `6px 0 20px -8px rgba(140,120,235,.7)`
- active preset card `0 0 0 3px rgba(158,134,232,.15), 0 8px 20px -10px rgba(120,95,200,.5)`

**Radii:** steps / status dots fully round (`50%`; `7px` for the square mute + slot swatch);
card `24px`; preset card `16px`; pills / Clear / Kit / chips / badges `999px`; KIT tab
`0 14px 14px 0`; panel segmented container `12px` / segment `9px`; slot row `12px`; picker
field `9px`; small buttons `6px`; volume track `999px`.

**Typography:**
- Display / labels / buttons: **Fredoka** (400–700). Title `700 38px / -.02em`; panel title
  `600 22px`; track name `600 15px` (v2 file `14.5px`); kit-card name `600 15px`; buttons
  `600 12–14px`; segments `600 12.5px`; picker `600 13px`; chips `500 10px`; eyebrow
  `600 12px / .2em / uppercase`.
- Numeric / mono: **Space Mono** (400/700). BPM `700 28px`; ruler `700 10px`; meta / kit
  label `700 10–10.5px / .16–.22em`; panel eyebrow `700 11px / .2em`; badges `700 9px`;
  card desc `400 11.5px`; Custom hint `400 11px`; footer `400 12.5px`.
- *(The design system's body face is Plus Jakarta Sans; this instrument intentionally uses the
  rounder **Fredoka** for a "toy" feel — keep Fredoka.)*

**Spacing:** page pad `48px 32px 64px`; card content pads `20–26px 30px`; grid gaps `9px`
(steps) / `18px` (label↔track) / `12px` (beat-group offset); column `max-width 980px`;
panel pad `26px 22px`.

**Sizes:** step `40px`; play `52px`; mute / slot swatch `22px`; BPM stepper `24×20px`;
volume track `64×5px`; visualizer `196px` tall, 44 bars; **kit panel `330px` wide**; panel
✕ `32×32px`.

**Keyframes:** `eq` = `scaleY(.18) ↔ scaleY(1)` (bars); `floaty` = translate `(0,0) → (6px,-16px)
→ (0,0)` (particles). Both run **only while playing**. Panel slide: `transform .35s
cubic-bezier(.2,.7,.2,1)`; KIT tab fade `opacity .25s`; cards/segments `all .15s`.

**Assets:** none external — all glyphs (play triangle/square, +/–, hamburger, ▾, ✕) are
CSS/geometry or text. Fonts are Google Fonts **Fredoka** + **Space Mono**.

---

## Headline v1 features (handoff update 2026-07-02, re-stated unchanged in the v2 README)

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
stored pitch too. *(v2's `voice(id, t, g, pitch)` already takes the `pitch` arg.)*

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
- The label column is `112px` in v2 — bump to ~`120px` (or tighten the `gap`) if two toggles +
  name feel cramped.

---

## Suggested build order (from the v2 handoff)

1. **Static layout** — page bg, header, card shell, transport bar, 8 empty tracks, ruler,
   visualizer box.
2. **Voice library as data** (`voiceId → {name, category}`) + the six category colors; derive
   each track's name/colors from its `voiceId`.
3. **Track + step components**, data-driven from `tracks[]`; the four step states.
4. **Click-to-toggle + Clear + mute**; wire the four states to `step`/`playing`.
5. **Audio engine** (the `voice()` switch — all voices) + click-audition.
6. **Lookahead scheduler + playhead**; Play/Stop gesture-gated context; BPM stepper.
7. **Kit system:** preset kits (load = replace all tracks' voice/pattern/vol), the slide-out
   **Kit panel** with Presets cards + Custom voice pickers (`setVoice`), and the header
   `activeKit`/"Custom kit" label.
8. **Persistence** — auto-save after every mutation via `StorageService` (versioned schema —
   not the handoff's raw key), restore on load, fall back to Musical 8.
9. **Interactive per-track volume** (GainNodes / Tone volume).
10. **Per-track solo** (`soloed` flag + audibility predicate + "S" toggle) — small; do it
    alongside mute.
11. **Per-step pitch / p-lock** (step objects with `pitch`, drag-knob interaction, `2^(n/12)` in
    voices — the `voice()` signature already takes a `pitch` arg — at-rest cell indicator).
12. **Canvas visualizer** off a real `AnalyserNode` (replace the CSS-bar placeholder).
13. **Dynamic tracks / "Add a sound"** affordance (tracks already data-driven for extension).

## Source bundle (reference only — do not ship the wrapper)

Bundle: `design_handoff_step_sequencer 3/` (received 2026-07-06).

- **`Sequencer - Pastel v2.dc.html`** — the **current, canonical** design; the one to rebuild.
  Bright pastel, 8 tracks, working Web Audio, the 30-voice library, the slide-out Kit panel
  (Presets + Custom), and localStorage persistence. Everything in this doc describes this file.
- `Sequencer - Pastel.dc.html` — the previous single-kit version (8 fixed tracks).
  **Superseded by v2**; kept for reference.
- `Sequencer — Neon.dc.html` — earlier dark exploration; context only.
- `Sequencer Directions.dc.html` — the 3-direction comparison; context only.
- `README.md` — the handoff's own self-sufficient description (source for this doc).

The `.dc.html` files preview in a browser, but the outer `<x-dc>` / `support.js` wrapper is
design-tool-specific — read them for markup/styles/state/audio, reimplement in Angular, never
ship the wrapper.
