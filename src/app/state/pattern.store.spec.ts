import { TestBed } from '@angular/core/testing';
import { PatternStore } from './pattern.store';
import { getKit } from '../core/kits';
import { tracksFromKit } from '../core/kit';
import { installLocalStorageMock } from '../testing/local-storage-mock';

/** A valid v2 saved-tracks array built from a kit (steps as {on,pitch}). */
function savedTracksFromKit(kitId: 'musical8' | 'club' | 'lofi') {
  return tracksFromKit(getKit(kitId)).map((t) => ({
    voice: t.voice,
    steps: t.steps.map((s) => ({ on: s.on, pitch: s.pitch })),
    vol: t.vol,
    muted: false,
    soloed: false,
  }));
}

describe('PatternStore', () => {
  beforeEach(() => {
    installLocalStorageMock();
    TestBed.configureTestingModule({});
  });

  it('seeds the Musical 8 kit — 8 tracks, 16 steps, patterns included', () => {
    const store = TestBed.inject(PatternStore);
    const tracks = store.tracks();
    expect(tracks.length).toBe(8);
    expect(tracks[0].name).toBe('Kick');
    expect(tracks[7].name).toBe('Synth Stab');
    expect(tracks.every((t) => t.steps.length === 16)).toBe(true);
    expect(tracks[0].steps[0].on).toBe(true); // kick downbeat from the kit pattern
    expect(store.activeKit()).toBe('musical8');
  });

  it('toggleStep flips a step', () => {
    const store = TestBed.inject(PatternStore);
    expect(store.tracks()[0].steps[1].on).toBe(false);
    store.toggleStep(0, 1);
    expect(store.tracks()[0].steps[1].on).toBe(true);
  });

  it('toggleStep keeps the active kit (prototype parity)', () => {
    const store = TestBed.inject(PatternStore);
    store.toggleStep(0, 1);
    expect(store.activeKit()).toBe('musical8');
  });

  it('toggleMute flips the track mute', () => {
    const store = TestBed.inject(PatternStore);
    store.toggleMute(0);
    expect(store.tracks()[0].muted).toBe(true);
    expect(store.activeKit()).toBe('musical8');
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
    expect(store.activeKit()).toBe('musical8');
  });

  it('setStepPitch clamps to the −12…12 range', () => {
    const store = TestBed.inject(PatternStore);
    store.setStepPitch(0, 0, 99);
    expect(store.tracks()[0].steps[0].pitch).toBe(12);
    store.setStepPitch(0, 0, -99);
    expect(store.tracks()[0].steps[0].pitch).toBe(-12);
  });

  it('clear turns every step off but keeps settings and the active kit', () => {
    const store = TestBed.inject(PatternStore);
    store.setVolume(0, 0.4);
    store.clear();
    expect(store.tracks().every((t) => t.steps.every((s) => !s.on))).toBe(true);
    expect(store.tracks()[0].vol).toBe(0.4);
    expect(store.activeKit()).toBe('musical8');
  });

  it('loadKit replaces voices, patterns, and volumes and sets the active kit', () => {
    const store = TestBed.inject(PatternStore);
    store.loadKit('club');
    const tracks = store.tracks();
    expect(store.activeKit()).toBe('club');
    expect(tracks[3].voice).toBe('rimshot');
    expect(tracks[3].name).toBe('Rimshot');
    expect(tracks[0].vol).toBe(0.95);
    expect(tracks[0].steps[0].on).toBe(true); // club kick pattern
  });

  it('loadKit clears mutes, solos, and step pitches', () => {
    const store = TestBed.inject(PatternStore);
    store.toggleMute(0);
    store.toggleSolo(1);
    store.setStepPitch(0, 0, 7);
    store.loadKit('lofi');
    expect(store.tracks().every((t) => !t.muted && !t.soloed)).toBe(true);
    expect(store.tracks().every((t) => t.steps.every((s) => s.pitch === 0))).toBe(true);
  });

  it('setVoice swaps only the voice — steps, vol, mute, solo stay', () => {
    const store = TestBed.inject(PatternStore);
    store.setVolume(0, 0.42);
    store.toggleMute(0);
    const stepsBefore = store.tracks()[0].steps;
    store.setVoice(0, 'bell');
    const track = store.tracks()[0];
    expect(track.voice).toBe('bell');
    expect(track.steps).toEqual(stepsBefore);
    expect(track.vol).toBe(0.42);
    expect(track.muted).toBe(true);
  });

  it('setVoice re-derives name and colors from the voice library', () => {
    const store = TestBed.inject(PatternStore);
    store.setVoice(0, 'bell'); // tonal category
    const track = store.tracks()[0];
    expect(track.name).toBe('Bell');
    expect(track.main).toBe('#3FA9E8');
    expect(track.light).toBe('#9AD8F2');
  });

  it('setVoice marks the kit custom (activeKit null)', () => {
    const store = TestBed.inject(PatternStore);
    store.setVoice(2, 'shaker');
    expect(store.activeKit()).toBeNull();
  });

  it('hydrates voices and activeKit from a v2 saved state', () => {
    const tracks = savedTracksFromKit('club');
    localStorage.setItem(
      'pulse.state',
      JSON.stringify({ version: 2, bpm: 120, activeKit: 'club', tracks }),
    );
    const store = TestBed.inject(PatternStore);
    expect(store.activeKit()).toBe('club');
    expect(store.tracks()[7].voice).toBe('zap');
    expect(store.tracks()[7].name).toBe('Zap');
  });

  it('hydrates a custom kit (activeKit null) from a v2 saved state', () => {
    const tracks = savedTracksFromKit('musical8');
    tracks[0].voice = 'punch';
    localStorage.setItem(
      'pulse.state',
      JSON.stringify({ version: 2, bpm: 120, activeKit: null, tracks }),
    );
    const store = TestBed.inject(PatternStore);
    expect(store.activeKit()).toBeNull();
    expect(store.tracks()[0].voice).toBe('punch');
  });

  it('migrates a legacy v1 save — voices by index, kit custom', () => {
    localStorage.setItem(
      'pulse.state.v1',
      JSON.stringify({
        version: 1,
        bpm: 118,
        tracks: Array.from({ length: 8 }, (_, i) => ({
          steps: Array.from({ length: 16 }, (_, j) => ({ on: i === 0 && j === 0, pitch: 0 })),
          vol: 0.5,
          muted: false,
          soloed: false,
        })),
      }),
    );
    const store = TestBed.inject(PatternStore);
    expect(store.activeKit()).toBeNull();
    expect(store.tracks().map((t) => t.voice)).toEqual([
      'kick',
      'snare',
      'clap',
      'hatC',
      'hatO',
      'lowtom',
      'cowbell',
      'crash',
    ]);
    expect(store.tracks()[0].steps[0].on).toBe(true);
    expect(store.tracks()[0].steps[1].on).toBe(false);
  });

  it('falls back to the default kit when the saved track count mismatches', () => {
    localStorage.setItem(
      'pulse.state',
      JSON.stringify({
        version: 2,
        bpm: 118,
        activeKit: null,
        tracks: [{ voice: 'kick', steps: [], vol: 1, muted: false, soloed: false }],
      }),
    );
    const store = TestBed.inject(PatternStore);
    expect(store.tracks().length).toBe(8);
    expect(store.activeKit()).toBe('musical8');
    expect(store.tracks()[0].steps[0].on).toBe(true); // Musical 8 kick pattern
  });
});
