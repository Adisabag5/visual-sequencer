import { semitonesToRate } from './pitch.util';

describe('semitonesToRate', () => {
  it('is 1 at 0 semitones', () => {
    expect(semitonesToRate(0)).toBe(1);
  });

  it('doubles an octave up', () => {
    expect(semitonesToRate(12)).toBeCloseTo(2);
  });

  it('halves an octave down', () => {
    expect(semitonesToRate(-12)).toBeCloseTo(0.5);
  });
});
