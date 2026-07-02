import { vi } from 'vitest';
import { StorageService } from './storage.service';
import { installLocalStorageMock } from '../testing/local-storage-mock';

describe('StorageService', () => {
  let svc: StorageService;

  beforeEach(() => {
    installLocalStorageMock();
    svc = new StorageService();
  });

  it('returns null when nothing is saved', () => {
    expect(svc.restore()).toBeNull();
  });

  it('round-trips a saved state after the debounce', () => {
    vi.useFakeTimers();
    svc.save({ version: 1, bpm: 100, tracks: [] });
    vi.advanceTimersByTime(300);
    vi.useRealTimers();
    expect(svc.restore()?.bpm).toBe(100);
  });

  it('rejects a wrong schema version', () => {
    localStorage.setItem('pulse.state.v1', JSON.stringify({ version: 2, tracks: [] }));
    expect(svc.restore()).toBeNull();
  });

  it('rejects corrupt JSON', () => {
    localStorage.setItem('pulse.state.v1', '{not json');
    expect(svc.restore()).toBeNull();
  });
});
