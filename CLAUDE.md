# CLAUDE.md — Angular project

Project conventions for this Angular workspace (Angular 21+, standalone, Vite + Vitest).
Lives at the repo root so it only loads for Angular work.

## Architecture
- **Standalone only.** No NgModules, ever.
- **Zoneless.** Bootstrap with `provideZonelessChangeDetection()`. Do **not** depend on
  zone.js. Never use `setTimeout` / `requestAnimationFrame` tricks to force change
  detection — drive every UI update through signals.
- Components are signal-driven. Set `changeDetection: ChangeDetectionStrategy.OnPush`
  explicitly for clarity and forward-compat.
- Bootstrap via `bootstrapApplication(App, appConfig)`; providers live in `app.config.ts`.

## Reactivity
- Use `signal` / `computed` / `effect` for all local and shared state.
- Prefer signals over RxJS for state. Use RxJS only for genuine event streams or complex
  async, and bridge into the component with `toSignal()`.
- Inputs: `input()` / `input.required()`. Outputs: `output()`. Queries: `viewChild()` /
  `contentChild()`. **No** `@Input` / `@Output` / `@ViewChild` decorators.

## Dependency injection
- Always use the `inject()` function. **Never** constructor-parameter injection.

## State management
- The state approach (plain service signals, a facade, a store, etc.) is a **per-project**
  decision — pick what each app needs; nothing is imposed here.
- Whatever you choose: expose state as `readonly` signals (`.asReadonly()` + `computed()`)
  and mutate only through explicit methods — never expose a writable signal.

## Structure — core / features / shared
```
src/app/
  core/        # app-wide singletons: config, interceptors, guards, root services
  features/    # one folder per feature; lazy-loaded; owns its components (+ any state/data access it needs)
  shared/      # dumb, reusable components/directives/pipes — no feature dependencies
```
- Lazy-load features with `loadComponent` / `loadChildren` and route-level `providers`.
- Use barrel `index.ts` files sparingly (public surface of a feature/shared only).

## Templates
- **New control flow only:** `@if` / `@for` / `@switch`. Never `*ngIf` / `*ngFor`.
  Every `@for` must have a `track`.
- Bind signals directly in templates; avoid the `async` pipe where a signal does the job.

## Styling
- SCSS. Design tokens (colors, type, spacing, radii, shadows) live in a **single**
  `src/styles/_tokens.scss` as CSS custom properties — never duplicate token values.
- Component styles reference `var(--token)`; no hardcoded hex, px spacing, or shadows.

## Testing
- Vitest. Co-locate `*.spec.ts`. Cover service/state logic; smoke-test components.

## TypeScript
- `strict: true`, plus `noImplicitOverride`, `noPropertyAccessFromIndexSignature`,
  `noImplicitReturns`, `noFallthroughCasesInSwitch`.
- Angular: `strictTemplates: true`, `strictInjectionParameters: true`.

## Tooling & enforcement
- **angular-eslint + stylelint + prettier**, enforced by **husky** `pre-commit` running
  **lint-staged**. A commit that fails lint/format is rejected.
- `angular.json` schematics defaults: `style: scss`, `changeDetection: OnPush`.
- Key ESLint rules to keep on: `@angular-eslint/prefer-inject`,
  `@angular-eslint/prefer-standalone`,
  `@angular-eslint/prefer-on-push-component-change-detection`,
  `@angular-eslint/use-lifecycle-interface`,
  template `@angular-eslint/template/prefer-control-flow`.

## Naming
- **Angular 21 flat naming — no `.component` suffix.** A component lives in
  `<name>.ts` / `<name>.html` / `<name>.scss`; the class is `<Name>` (no `Component`
  suffix). e.g. `hero.ts` → `export class Hero`, selector `app-hero`.
- Files: kebab-case. Services `*.service.ts`, directives `*.directive.ts`, pipes `*.pipe.ts`.
- Component selectors: project prefix (e.g. `app-`), kebab-case.
