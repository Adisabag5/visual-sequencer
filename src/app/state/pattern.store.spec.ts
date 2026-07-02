import { TestBed } from '@angular/core/testing';
import { PatternStore } from './pattern.store';
import { createKit } from '../core/kit';
import { installLocalStorageMock } from '../testing/local-storage-mock';

describe('PatternStore', () => {
  beforeEach(() => {
    installLocalStorageMock();
    TestBed.configureTestingModule({});
  });

  it('seeds the full 8-track kit, each with 16 steps', () => {
    const store = TestBed.inject(PatternStore);
    const tracks = store.tracks();
    expect(tracks.length).toBe(8);
    expect(tracks[0].name).toBe('Kick');
    expect(tracks[7].name).toBe('Crash');
    expect(tracks.every((t) => t.steps.length === 16)).toBe(true);
  });

  it('toggleStep flips a step', () => {
    const store = TestBed.inject(PatternStore);
    expect(store.tracks()[0].steps[0].on).toBe(false);
    store.toggleStep(0, 0);
    expect(store.tracks()[0].steps[0].on).toBe(true);
  });

  it('toggleMute flips the track mute', () => {
    const store = TestBed.inject(PatternStore);
    store.toggleMute(0);
    expect(store.tracks()[0].muted).toBe(true);
  });

  it('toggleSolo flips the track solo', () => {
    const store = TestBed.inject(PatternStore);
    store.toggleSolo(1);
    expect(store.tracks()[1].soloed).toBe(true);
  });

  it('setVolume updates the track volume', () => {
    const store = TestBed.inject(PatternStore);
    store.setVolume(0, 0.5);
    expect(store.tracks()[0].vol).toBe(0.5);
  });

  it('setStepPitch clamps to the −12…12 range', () => {
    const store = TestBed.inject(PatternStore);
    store.setStepPitch(0, 0, 99);
    expect(store.tracks()[0].steps[0].pitch).toBe(12);
    store.setStepPitch(0, 0, -99);
    expect(store.tracks()[0].steps[0].pitch).toBe(-12);
  });

  it('clear turns every step off but keeps settings', () => {
    const store = TestBed.inject(PatternStore);
    store.toggleStep(0, 0);
    store.setVolume(0, 0.4);
    store.clear();
    expect(store.tracks()[0].steps.every((s) => !s.on)).toBe(true);
    expect(store.tracks()[0].vol).toBe(0.4);
  });

  it('hydrates from a saved state', () => {
    localStorage.setItem(
      'pulse.state.v1',
      JSON.stringify({
        version: 1,
        bpm: 118,
        tracks: createKit().map((t, i) => ({
          steps: t.steps.map((_, j) => ({ on: i === 0 && j === 0, pitch: 0 })),
          vol: t.vol,
          muted: false,
          soloed: false,
        })),
      }),
    );
    const store = TestBed.inject(PatternStore);
    expect(store.tracks()[0].steps[0].on).toBe(true);
  });

  it('falls back to the kit when the saved track count mismatches', () => {
    localStorage.setItem(
      'pulse.state.v1',
      JSON.stringify({
        version: 1,
        bpm: 118,
        tracks: [{ steps: [], vol: 1, muted: false, soloed: false }],
      }),
    );
    const store = TestBed.inject(PatternStore);
    expect(store.tracks().length).toBe(8);
    expect(store.tracks()[0].steps.every((s) => !s.on)).toBe(true);
  });
});
