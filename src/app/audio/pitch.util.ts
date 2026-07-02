/** Convert a semitone offset to a frequency multiplier: 2^(n/12). */
export function semitonesToRate(semitones: number): number {
  return Math.pow(2, semitones / 12);
}
