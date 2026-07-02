import { TestBed } from '@angular/core/testing';
import { TransportStore } from './transport.store';
import { installLocalStorageMock } from '../testing/local-storage-mock';

describe('TransportStore', () => {
  let store: TransportStore;

  beforeEach(() => {
    installLocalStorageMock();
    TestBed.configureTestingModule({});
    store = TestBed.inject(TransportStore);
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

  it('play/stop toggles playing and stop resets the playhead', () => {
    store.play();
    expect(store.isPlaying()).toBe(true);
    store.stop();
    expect(store.isPlaying()).toBe(false);
    expect(store.currentStep()).toBe(0);
  });
});
