import { TestBed } from '@angular/core/testing';
import { AudioEngine } from './audio-engine';
import { createKit } from '../core/kit';

/**
 * These tests avoid runtime audio (no AudioContext in jsdom): they cover the
 * pure/mirror surface. unlock()/play()/audition() are exercised manually / e2e.
 */
describe('AudioEngine', () => {
  let engine: AudioEngine;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    engine = TestBed.inject(AudioEngine);
  });

  it('starts with the playhead at 0', () => {
    expect(engine.currentStep()).toBe(0);
  });

  it('setBpm before start does not throw', () => {
    expect(() => engine.setBpm(140)).not.toThrow();
  });

  it('loadPattern accepts the kit', () => {
    expect(() => engine.loadPattern(createKit())).not.toThrow();
  });

  it('getSpectrum returns an empty buffer before unlock', () => {
    expect(engine.getSpectrum()).toBeInstanceOf(Float32Array);
    expect(engine.getSpectrum().length).toBe(0);
  });

  it('onStepTrigger registers without throwing', () => {
    expect(() => engine.onStepTrigger(() => undefined)).not.toThrow();
  });
});
