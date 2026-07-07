import { inject, Injectable, signal } from '@angular/core';
import { PatternStore } from './pattern.store';

/** Which view the kit panel shows: preset kit cards or per-track voice pickers. */
export type KitMode = 'presets' | 'custom';

/**
 * UI state for the slide-out kit panel (design handoff, "Kit Panel").
 * Readonly signals out; mutations only via intent methods.
 */
@Injectable({ providedIn: 'root' })
export class KitPanelStore {
  private readonly _panelOpen = signal(true);
  // Start on the view that matches the pattern: presets when a kit is active.
  private readonly _kitMode = signal<KitMode>(
    inject(PatternStore).activeKit() !== null ? 'presets' : 'custom',
  );

  /** Whether the panel is slid in. Starts open. */
  readonly panelOpen = this._panelOpen.asReadonly();

  /** The panel view currently showing. */
  readonly kitMode = this._kitMode.asReadonly();

  openPanel(): void {
    this._panelOpen.set(true);
  }

  closePanel(): void {
    this._panelOpen.set(false);
  }

  togglePanel(): void {
    this._panelOpen.update((open) => !open);
  }

  setKitMode(mode: KitMode): void {
    this._kitMode.set(mode);
  }
}
