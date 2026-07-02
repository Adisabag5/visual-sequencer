import { Injectable } from '@angular/core';

export interface SavedStep {
  on: boolean;
  pitch: number;
}
export interface SavedTrack {
  steps: SavedStep[];
  vol: number;
  muted: boolean;
  soloed: boolean;
}
export interface SavedState {
  version: 1;
  bpm: number;
  tracks: SavedTrack[];
}

const KEY = 'pulse.state.v1';
const DEBOUNCE_MS = 300;

/** Persists the pattern + tempo to localStorage (debounced) and restores it. */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private timer?: ReturnType<typeof setTimeout>;

  /** Load saved state, or null if absent / unreadable / wrong version. */
  restore(): SavedState | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as SavedState;
      if (data?.version !== 1 || !Array.isArray(data.tracks)) return null;
      return data;
    } catch {
      return null;
    }
  }

  /** Debounced write. */
  save(state: SavedState): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.writeNow(state), DEBOUNCE_MS);
  }

  private writeNow(state: SavedState): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // ignore quota / unavailable storage
    }
  }
}
