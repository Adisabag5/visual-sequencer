# Pulse — Domain Glossary

> Document 2 of 7. The single source of truth for naming.
> Status: **Locked** (skim and veto any term you dislike). Last updated 2026-06-30.

**How to use this:** every term below has one agreed name. Use it consistently in
code (class names, variables, files), UI labels, and all other docs. The
"avoid" column lists synonyms that must **not** appear in the codebase — they are
the main cause of drift. If a new concept appears during the build, add it here
first, then write the code.

## Core model

| Term | Definition | Avoid calling it |
| --- | --- | --- |
| **Step** | One of the 16 positions in a track. Holds an on/off state and a pitch value. | cell, slot, beat, square |
| **Track** | One instrument row (e.g. Kick). Owns its synth voice, color, volume, mute, solo. | channel, lane, row (in code), instrument |
| **Pattern** | The full 8×16 grid plus all track/step settings. The unit that auto-saves. | song, sequence, grid (as data), project |
| **Grid** | The visual 8×16 layout of step orbs. UI term only — the data is the *pattern*. | board, matrix, table |
| **Kit** | The fixed set of 8 tracks/sounds loaded in v1. | bank, set, soundpack |
| **Pitch** | A per-step tuning offset (semitones or playback-rate). Default = none. | tune (in code), detune, note |

## Playback & timing

| Term | Definition | Avoid calling it |
| --- | --- | --- |
| **Transport** | Global controls: play, stop, clear, and BPM. | controls, toolbar, header |
| **BPM** | Tempo in beats per minute. Default 118. | tempo (in code), speed, rate |
| **Playhead** | The position currently sounding as playback advances across steps. | cursor, marker, position (alone) |
| **Tick / Step trigger** | The event "step *n* of track *t* fired." Drives both audio and visuals. | hit, pulse, fire (as a noun), event |
| **Scheduler** | The lookahead clock that queues step triggers ahead of time for tight timing. | timer, loop, clock (alone) |
| **Voice** | A single playing instance of a track's synthesized sound. Fast retriggers create multiple voices. | sound, instance, node (alone) |

## Per-step control

| Term | Definition | Avoid calling it |
| --- | --- | --- |
| **Parameter lock** (**p-lock**) | A per-step override of a parameter. v1 ships one: **pitch**. Extensible to filter/decay/probability later. | knob value, tweak, modifier, automation |
| **Step selection** | The UI state where one step is focused so its knob is shown. | active step (reserved for the playhead), edit mode |

## Per-track control

| Term | Definition | Avoid calling it |
| --- | --- | --- |
| **Volume** | Per-track level (the bar under the track name). | gain (in UI), level, amplitude |
| **Mute** | Track silenced. Toggled via the track's color swatch. | off, disable, hide |
| **Solo** | Isolate one track; all non-soloed tracks are silenced. | focus, isolate (in code as verb is fine) |

## Audiovisual layer

| Term | Definition | Avoid calling it |
| --- | --- | --- |
| **Visualizer** | The reactive graphics layer (particle field + spectrum bar). | animation, canvas (that's the tech), fx |
| **Idle / Active** | Visualizer states: idle when stopped, active when playing. | on/off, paused, running |
| **Spectrum bar** | The row of colored segments along the bottom of the visualizer. | equalizer, waveform, meter |
| **Particle field** | The floating reactive dots in the visualizer. | particles (alone is fine), confetti, dots |

## Persistence

| Term | Definition | Avoid calling it |
| --- | --- | --- |
| **Auto-save** | Writing the current pattern to browser storage on change. | sync, backup, cache |
| **Restore** | Loading the saved pattern on app start. | load (alone), hydrate (reserve for framework use) |

## Product naming

| Term | Definition |
| --- | --- |
| **Pulse** | The product name shown to users ("Audiovisual Sequencer"). |
| **Sequencer** | Internal project codename. Not shown in UI. |
