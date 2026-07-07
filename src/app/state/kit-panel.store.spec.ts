import { TestBed } from '@angular/core/testing';
import { KitPanelStore } from './kit-panel.store';
import { getKit } from '../core/kits';
import { tracksFromKit } from '../core/kit';
import { installLocalStorageMock } from '../testing/local-storage-mock';

/** Seed a valid v2 save so PatternStore restores the given activeKit. */
function seedSave(activeKit: 'musical8' | 'club' | 'lofi' | null): void {
  const tracks = tracksFromKit(getKit(activeKit ?? 'musical8')).map((t) => ({
    voice: t.voice,
    steps: t.steps.map((s) => ({ on: s.on, pitch: s.pitch })),
    vol: t.vol,
    muted: false,
    soloed: false,
  }));
  localStorage.setItem('pulse.state', JSON.stringify({ version: 2, bpm: 112, activeKit, tracks }));
}

describe('KitPanelStore', () => {
  beforeEach(() => {
    installLocalStorageMock();
    TestBed.configureTestingModule({});
  });

  it('starts open, in presets mode on a fresh start (default kit active)', () => {
    const store = TestBed.inject(KitPanelStore);
    expect(store.panelOpen()).toBe(true);
    expect(store.kitMode()).toBe('presets');
  });

  it('starts in custom mode when the restored save has no active kit', () => {
    seedSave(null);
    const store = TestBed.inject(KitPanelStore);
    expect(store.kitMode()).toBe('custom');
  });

  it('starts in presets mode when the restored save has an active kit', () => {
    seedSave('club');
    const store = TestBed.inject(KitPanelStore);
    expect(store.kitMode()).toBe('presets');
  });

  it('openPanel / closePanel / togglePanel drive panelOpen', () => {
    const store = TestBed.inject(KitPanelStore);
    store.closePanel();
    expect(store.panelOpen()).toBe(false);
    store.openPanel();
    expect(store.panelOpen()).toBe(true);
    store.togglePanel();
    expect(store.panelOpen()).toBe(false);
  });

  it('setKitMode switches the panel view', () => {
    const store = TestBed.inject(KitPanelStore);
    store.setKitMode('custom');
    expect(store.kitMode()).toBe('custom');
    store.setKitMode('presets');
    expect(store.kitMode()).toBe('presets');
  });
});
