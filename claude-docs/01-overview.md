# Pulse — Project Overview & Spec

> Project codename: **Sequencer**. Product name: **Pulse** ("Audiovisual Sequencer").
> Document 1 of 7 in the planning set.
> Status: **Draft — design received, reconciling open points.** Last updated 2026-06-29.

## What Pulse is

Pulse is a **browser-based audiovisual step-sequencer drum machine**. It runs
entirely on the client (no backend in v1) as an Angular web app, and is designed
so it can later be wrapped for mobile (PWA → Capacitor; notes inline in tech-stack/architecture).

The user programs rhythmic patterns on a grid: each **element** (instrument) is a
horizontal row of **16 steps**, rendered as glowing gradient orbs. Toggling a step
on means that element's sound fires when the playhead reaches it. Press play and
the pattern loops at the set tempo — while a **live visualizer** reacts to the
sound. The "audiovisual" identity is core: visuals are a feature, not decoration.

## The core model

| Concept | Meaning |
| --- | --- |
| **Element / Track** | One percussion instrument (kick, snare, hat, …). Each owns one row. |
| **Step** | One of the 16 cells in a row. On = the element sounds at that position. Each step also carries a **pitch** value (default = none). |
| **Pattern** | The full grid: all tracks × 16 steps, plus per-track and per-step settings. |
| **Playhead** | The cursor that advances across the 16 steps in time with the tempo. |
| **Transport** | Global play / stop, **clear**, and tempo (BPM). |
| **Visualizer** | Live, reactive graphics (particle field + spectrum bar) driven by playback. |

The grid is the whole app: 8 rows by `16` columns, with the visualizer below it.

## Elements (v1) — fixed 8-track kit

v1 ships **eight fixed percussion tracks**, each triggering a **synthesized voice**
(generated in code, no audio files) and each with its own accent color:

1. **Kick**
2. **Snare**
3. **Clap**
4. **Closed Hat**
5. **Open Hat**
6. **Low Tom**
7. **Rim / Cowbell**
8. **Crash** (or Ride)

Every element is a fixed drum sound (no melodic voices). Adding/removing tracks is
a post-v1 direction.

> **Design note:** the supplied design was drawn for **3** rows ("3 SOUNDS · 16
> STEPS") with large, spacious orbs. Eight rows will require shrinking the orbs,
> tightening row spacing, and/or making the grid scroll while preserving the Pulse
> aesthetic. This needs to be reconciled in the visual design.

## Visualizer (v1) — the "audiovisual" half

A live visual layer reacts to the running pattern. From the design it has two
parts: a **floating particle field** (idle when stopped, animated when playing)
and a **bottom spectrum/step bar** of colored segments. It shows an **IDLE /
active state** indicator. Visuals are driven by the audio engine (step events
and/or a Web Audio analyser) — this is detailed in `03-audio-engine.md`.

## Sound source (v1)

**In-browser synthesis.** Each track's sound is generated live via Tone.js (no audio
files) using the per-voice synthesis from the design handoff (`06-design-handoff.md`).
No user uploads in v1. *(Decision 2026-07-02: synthesis replaces the earlier "samples
only" plan — the received design was tuned for synthesis and ships working voice math.)*

## Controls (v1 / MVP)

Included (locked):

- **Transport** — tempo (BPM, default 118, +/− stepper) and play / stop. *(essential)*
- **Clear** — wipe all active steps back to an empty pattern.
- **Per-track volume** — the level bar under each track name balances that element.
- **Per-track mute + solo** — the color swatch toggles mute; solo isolates one track.
- **Per-step pitch tweak** — each step can be re-tuned (pitch/tune). Exposed via a
  **single knob that appears when a step is selected** (tap-and-hold / select-then-
  tweak, "parameter-lock" style) — not 128 always-visible knobs. Scales to 8 tracks
  and stays mobile-friendly. Default pitch = no change; tweaked steps show a subtle
  indicator.
- **Visualizer** — reactive particles + spectrum bar tied to playback. **Headline
  feature** — the audiovisual experience is a core selling point, engineered with care.
- **Auto-save** — the current pattern persists to browser storage and reloads on return.

Deliberately **not** in v1 (deferred):

- **Per-step velocity / accent** — deferred; v1 uses per-track volume only. (The
  per-step knob in v1 controls **pitch**, not velocity.)
- Additional per-step parameters (filter, decay, pan, probability) — the knob is
  built to be extensible, but v1 ships pitch only.
- Swing / shuffle (rigid 16th-note timing for now)
- Multiple saved patterns
- Song mode (chaining patterns)
- User-uploaded samples

## Pattern scope (v1)

**A single 16-step pattern**, live in memory. One pattern at a time — the fastest
path to a working, demonstrable instrument.

## v1 success criteria (what "done" looks like)

1. An 8-track × 16-step grid of glowing orbs the user can toggle.
2. Play / stop with adjustable BPM, looping cleanly with **tight, audible timing**
   (no drift or stutter — this is the make-or-break quality bar).
3. Per-track volume, mute, and solo working; clear button empties the pattern.
   Selecting a step reveals a pitch knob that audibly re-tunes that hit.
4. Synthesized voices trigger reliably (per-track synthesis via Tone.js).
5. The visualizer reacts to playback and idles when stopped (headline-quality).
6. Pattern auto-saves and restores across reloads.
7. Visual fidelity matches the Pulse design (pastel, glassmorphism, glowing orbs).
8. Runs smoothly in a modern desktop browser; architected so mobile is a wrap,
   not a rewrite.

## Resolved decisions

All v1 scope questions are resolved (see Controls). The only remaining external
input is the **design** itself, now received; future visual details will be read
directly from it during the build.

## Future directions (post-v1, for context only)

Swing, multiple patterns, song mode, user-uploaded samples, pattern import/export,
and mobile packaging. Listed so architecture decisions made now don't paint us into
a corner later. *(In-browser synthesis was on this list; as of 2026-07-02 it is the
v1 sound source, not a future direction.)*
