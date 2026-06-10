---
name: angular-feature
description: Scaffold a new standalone Angular component feature (OnPush, signals, new control flow, SCSS tokens) into this workspace's features folder, with a lazy route wired in. Use when the user says "scaffold a feature", "create a new feature", "add a feature", "new page/section", or names a feature to build out in an Angular project.
---

# Angular feature scaffolder

Generates a feature under `src/app/features/<name>/` following this repo's conventions
(see `CLAUDE.md`): a standalone, OnPush, signal-driven component using Angular-21 flat
naming and `var(--token)` styling, plus a lazy route.

## Usage

From the project root:

```bash
node .claude/skills/angular-feature/scaffold-feature.mjs "user profile"
```

Produces:

```
src/app/features/user-profile/
  user-profile.ts      # standalone, OnPush, signals
  user-profile.html    # @if / @for control flow
  user-profile.scss    # var(--token) styles
```

…and registers a lazy route in `src/app/app.routes.ts` via `loadComponent`.

## After scaffolding
1. Build out the component's markup and state.
2. Run `npm run lint` and `ng build`.

## Conventions this enforces
- Standalone, OnPush, `inject()` (no constructor DI), no NgModules.
- Templates use `@if` / `@for` (with `track`), never `*ngIf` / `*ngFor`.
- Styles reference `var(--token)`; no hardcoded colors.

> State management (a facade, a store, plain service signals, etc.) is a per-project
> decision — add it where the project calls for it, not by default.
