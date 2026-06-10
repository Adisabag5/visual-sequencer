---
name: angular-build
description: Guided, convention-grounded way to build work in this Angular project. Reads CLAUDE.md as the binding rulebook, builds in stages with brief confirmation checkpoints, and finishes with a self code-review against the conventions plus a lint + build sanity gate. Use when the user wants to build, implement, or scaffold something here — e.g. "build the new project", "create the site from the design", "add/implement a feature", "let's build this", "start building".
---

# Guided Angular build

A disciplined way to build in this repo that keeps you involved at the joints and
guarantees the result holds up. The goal isn't raw speed — it's that "done" means
"reviewed and building."

## Ground rules
- **Read `CLAUDE.md` at the repo root first and treat it as binding.** It defines the
  stack, architecture, and the do/don't list. Don't recite it back — just follow it.
- **Checkpoints are plain confirmations.** At each one, briefly state what's done and
  what's next, then ask "Good to continue?" and wait. No multiple-choice, no options —
  one simple question.
- **Between checkpoints, work autonomously.** Don't ask about small decisions; make the
  call the conventions imply and keep moving.
- **If something conflicts with `CLAUDE.md`, or is genuinely ambiguous, stop and ask** —
  even outside the normal checkpoints.

## Stages

**1. Confirm the brief.**
Restate what you're about to build — scope, the pages/features, and (for a new project)
which design and which template. Then checkpoint.

**2. Foundation.** *(new project only — skip when working in an existing app)*
Start from the starter template, wire the design tokens into `src/styles/_tokens.scss`,
apply the base styles, and confirm the zoneless bootstrap is in place. Show the bare
styled shell. Then checkpoint.

**3. Plan the structure.**
Propose the page/feature breakdown mapped onto `core / features / shared`. Checkpoint
before generating anything.

**4. Build, feature by feature.**
Implement one feature/section at a time, following the conventions: standalone, zoneless,
signals, `inject()`, `@if`/`@for`, `var(--token)` styling, flat Angular-21 naming (no
`.component` suffix), co-located Vitest specs. Pause after each. Checkpoint.

**5. Review + sanity gate, then done.**
- **Self code-review:** re-read everything you wrote and check it against `CLAUDE.md`
  point by point — standalone only, no NgModules, zoneless / no zone.js, signals, no
  constructor DI, no decorator I/O, `@if`/`@for` only, tokens not hardcoded, flat naming.
  Report what you checked and fix anything that fails.
- **Sanity gate:** run `npm run lint` and `ng build`. Both must pass. Report the result.
- Only once both are green, tell the user it's done.

## Notes
- For component boilerplate you may use the `angular-feature` scaffolder if present, or
  write the files directly — either way the output must match the conventions.
- State management (facade, store, service signals) is a per-project decision; it is not
  imposed here. Follow whatever the project's `CLAUDE.md` specifies.
