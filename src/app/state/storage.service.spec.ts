import { vi } from 'vitest';
import { createTrack } from '../core/kit';
import { SavedState, StorageService } from './storage.service';
import { installLocalStorageMock } from '../testing/local-storage-mock';

function v2State(overrides: Partial<SavedState> = {}): SavedState {
  return {
    version: 2,
    bpm: 100,
    activeKit: 'musical8',
    tracks: [
      {
        voice: 'kick',
        steps: [{ on: true, pitch: 0 }],
        vol: 0.9,
        muted: false,
        soloed: false,
      },
    ],
    ...overrides,
  };
}

describe('StorageService', () => {
  let svc: StorageService;

  beforeEach(() => {
    installLocalStorageMock();
    svc = new StorageService();
  });

  it('returns null when nothing is saved', () => {
    expect(svc.restore()).toBeNull();
  });

  it('round-trips a domain snapshot after the debounce', () => {
    vi.useFakeTimers();
    svc.save({ bpm: 123, activeKit: 'club', tracks: [createTrack('marimba', 0.7)] });
    vi.advanceTimersByTime(300);
    vi.useRealTimers();
    const restored = svc.restore();
    expect(restored?.version).toBe(2);
    expect(restored?.bpm).toBe(123);
    expect(restored?.activeKit).toBe('club');
    expect(restored?.tracks[0].voice).toBe('marimba');
    expect(restored?.tracks[0].vol).toBe(0.7);
    // Only schema fields are persisted — derived name/colors are not.
    const raw = JSON.parse(localStorage.getItem('pulse.state')!) as Record<string, unknown>;
    expect(Object.keys((raw['tracks'] as object[])[0])).toEqual([
      'voice',
      'steps',
      'vol',
      'muted',
      'soloed',
    ]);
  });

  it('rejects a wrong schema version on the v2 key', () => {
    localStorage.setItem('pulse.state', JSON.stringify({ version: 3, tracks: [] }));
    expect(svc.restore()).toBeNull();
  });

  it('rejects corrupt JSON', () => {
    localStorage.setItem('pulse.state', '{not json');
    expect(svc.restore()).toBeNull();
  });

  it('falls back an unknown voice id to kick', () => {
    const state = v2State();
    localStorage.setItem(
      'pulse.state',
      JSON.stringify({ ...state, tracks: [{ ...state.tracks[0], voice: 'kazoo' }] }),
    );
    expect(svc.restore()?.tracks[0].voice).toBe('kick');
  });

  it('falls back an invalid activeKit to null', () => {
    localStorage.setItem('pulse.state', JSON.stringify({ ...v2State(), activeKit: 'megakit' }));
    expect(svc.restore()?.activeKit).toBeNull();
  });

  it('migrates a legacy v1 save — voices by index, activeKit null', () => {
    localStorage.setItem(
      'pulse.state.v1',
      JSON.stringify({
        version: 1,
        bpm: 111,
        tracks: Array.from({ length: 8 }, () => ({
          steps: [{ on: false, pitch: 0 }],
          vol: 0.5,
          muted: true,
          soloed: false,
        })),
      }),
    );
    const restored = svc.restore();
    expect(restored?.version).toBe(2);
    expect(restored?.bpm).toBe(111);
    expect(restored?.activeKit).toBeNull();
    expect(restored?.tracks.map((t) => t.voice)).toEqual([
      'kick',
      'snare',
      'clap',
      'hatC',
      'hatO',
      'lowtom',
      'cowbell',
      'crash',
    ]);
    expect(restored?.tracks[0].muted).toBe(true);
    // Migration must not delete the legacy key.
    expect(localStorage.getItem('pulse.state.v1')).not.toBeNull();
  });

  it('prefers the v2 key over a lingering legacy save', () => {
    localStorage.setItem('pulse.state', JSON.stringify(v2State({ bpm: 140 })));
    localStorage.setItem('pulse.state.v1', JSON.stringify({ version: 1, bpm: 60, tracks: [] }));
    expect(svc.restore()?.bpm).toBe(140);
  });
});
