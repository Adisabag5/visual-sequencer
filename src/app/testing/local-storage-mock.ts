import { vi } from 'vitest';

/** Install a clean in-memory localStorage for a test (the jsdom stub is partial). */
export function installLocalStorageMock(): void {
  const store: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => Object.keys(store).forEach((k) => delete store[k]),
    key: () => null,
    length: 0,
  });
}
