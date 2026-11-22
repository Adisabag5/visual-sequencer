import { TestBed } from '@angular/core/testing';
import { TransportStore } from './transport.store';
import { installLocalStorageMock } from '../testing/local-storage-mock';
import { Playhead } from '../audio/playhead';

describe('TransportStore', () => {
  let store: TransportStore;
  let playhead: Playhead;

  beforeEach(() => {
    installLocalStorageMock();
    TestBed.configureTestingModule({});
    store = TestBed.inject(TransportStore);
    playhead = TestBed.inject(Playhead);
  });

  it('defaults to 118 bpm, stopped', () => {
    expect(store.bpm()).toBe(118);
    expect(store.isPlaying()).toBe(false);
  });

  it('clamps bpm to the 60…180 range', () => {
    store.setBpm(999);
    expect(store.bpm()).toBe(180);
    store.setBpm(1);
    expect(store.bpm()).toBe(60);
  });

  it('play/stop toggles playing', () => {
    store.play();
    expect(store.isPlaying()).toBe(true);
    store.stop();
    expect(store.isPlaying()).toBe(false);
  });

  describe('the playhead', () => {
    it("reads the engine's position rather than a copy of it", () => {
      // The engine writes Playhead from inside the scheduled tick. Mirroring it
      // into a second signal needed an effect to keep the two in step, and the
      // copy could lag; reading through cannot.
      playhead.set(7);

      expect(store.currentStep()).toBe(7);
    });

    it('does not rewind on stop — the engine owns that', () => {
      playhead.set(11);
      store.stop();

      // AudioEngine.stop() sets the playhead back to 0. If the store reset it
      // too, whichever ran last would win, which is the kind of race a single
      // owner removes.
      expect(store.currentStep()).toBe(11);
    });
  });
});
