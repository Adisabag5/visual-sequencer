import { Injectable, signal } from '@angular/core';

/**
 * UI state for the slide-out Library panel — the Kit panel's counterpart on the
 * right. Starts closed: the Kit panel opens on load because picking sounds is
 * where a new pattern begins, whereas the Library only matters once something
 * has been saved.
 */
@Injectable({ providedIn: 'root' })
export class LibraryPanelStore {
  private readonly _panelOpen = signal(false);

  readonly panelOpen = this._panelOpen.asReadonly();

  openPanel(): void {
    this._panelOpen.set(true);
  }

  closePanel(): void {
    this._panelOpen.set(false);
  }

  togglePanel(): void {
    this._panelOpen.update((open) => !open);
  }
}
