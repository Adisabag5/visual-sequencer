import * as Tone from 'tone';
import { Voice } from '../core/models';
import { semitonesToRate } from './pitch.util';

/**
 * The synthesized drum voices — approximations of the handoff recipes
 * (claude-docs/06-design-handoff.md). Exact tuning comes with the design pass.
 */
export interface VoiceKit {
  /** Trigger a voice. `time` = audio-clock seconds, or undefined for "now". */
  trigger(voice: Voice, time: number | undefined, pitch: number, vol: number): void;
  dispose(): void;
}

export function createVoices(destination: Tone.InputNode): VoiceKit {
  // kick — pitched membrane (sine sweep) ~150Hz base.
  const kickGain = new Tone.Gain(1).connect(destination);
  const kick = new Tone.MembraneSynth({
    octaves: 6,
    pitchDecay: 0.03,
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.05 },
  }).connect(kickGain);

  // snare — white noise through a highpass.
  const snareGain = new Tone.Gain(1).connect(destination);
  const snareHp = new Tone.Filter(1400, 'highpass').connect(snareGain);
  const snare = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.18, sustain: 0 },
  }).connect(snareHp);

  // clap — noise through a bandpass, triggered as 4 quick bursts.
  const clapGain = new Tone.Gain(1).connect(destination);
  const clapBp = new Tone.Filter({ frequency: 1500, type: 'bandpass', Q: 1.1 }).connect(clapGain);
  const clap = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.03, sustain: 0 },
  }).connect(clapBp);

  // hat (closed) — white noise, high highpass, very short.
  const hatGain = new Tone.Gain(1).connect(destination);
  const hatHp = new Tone.Filter(7000, 'highpass').connect(hatGain);
  const hat = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
  }).connect(hatHp);

  // open hat — like closed hat but a longer tail.
  const ohatGain = new Tone.Gain(1).connect(destination);
  const ohatHp = new Tone.Filter(6500, 'highpass').connect(ohatGain);
  const ohat = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.3, sustain: 0 },
  }).connect(ohatHp);

  // low tom — pitched membrane, lower than the kick.
  const tomGain = new Tone.Gain(1).connect(destination);
  const tom = new Tone.MembraneSynth({
    octaves: 4,
    pitchDecay: 0.06,
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.05 },
  }).connect(tomGain);

  // rim/cowbell — two square oscillators through an amplitude envelope.
  const cowGain = new Tone.Gain(1).connect(destination);
  const cowEnv = new Tone.AmplitudeEnvelope({
    attack: 0.001,
    decay: 0.16,
    sustain: 0,
    release: 0.02,
  }).connect(cowGain);
  const cowOsc1 = new Tone.Oscillator({ frequency: 540, type: 'square' }).connect(cowEnv);
  const cowOsc2 = new Tone.Oscillator({ frequency: 800, type: 'square' }).connect(cowEnv);
  cowOsc1.start();
  cowOsc2.start();

  // crash — white noise through a highpass, long tail.
  const crashGain = new Tone.Gain(1).connect(destination);
  const crashHp = new Tone.Filter(4000, 'highpass').connect(crashGain);
  const crash = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 1.0, sustain: 0 },
  }).connect(crashHp);

  // A monophonic synth cannot be retriggered at the same audio time, so keep each
  // voice's start strictly increasing (guards fast clicks + audition-during-playback).
  const lastStart = new Map<Voice, number>();
  const MIN_GAP = 0.003;

  function trigger(voice: Voice, time: number | undefined, pitch: number, vol: number): void {
    const rate = semitonesToRate(pitch);
    const requested = time ?? Tone.now();
    const at = Math.max(requested, (lastStart.get(voice) ?? 0) + MIN_GAP);
    switch (voice) {
      case 'kick':
        kickGain.gain.setValueAtTime(vol, at);
        kick.triggerAttackRelease(150 * rate, '8n', at);
        break;
      case 'snare':
        snareGain.gain.setValueAtTime(vol, at);
        snareHp.frequency.setValueAtTime(1400 * rate, at);
        snare.triggerAttackRelease('16n', at);
        break;
      case 'clap': {
        clapGain.gain.setValueAtTime(vol, at);
        clapBp.frequency.setValueAtTime(1500 * rate, at);
        const offsets = [0, 0.012, 0.024, 0.05];
        offsets.forEach((off, idx) => clap.triggerAttackRelease(idx === 3 ? 0.12 : 0.02, at + off));
        lastStart.set(voice, at + 0.05);
        return;
      }
      case 'hat':
        hatGain.gain.setValueAtTime(vol, at);
        hatHp.frequency.setValueAtTime(7000 * rate, at);
        hat.triggerAttackRelease('32n', at);
        break;
      case 'ohat':
        ohatGain.gain.setValueAtTime(vol, at);
        ohatHp.frequency.setValueAtTime(6500 * rate, at);
        ohat.triggerAttackRelease(0.3, at);
        break;
      case 'tom':
        tomGain.gain.setValueAtTime(vol, at);
        tom.triggerAttackRelease(110 * rate, '8n', at);
        break;
      case 'cow':
        cowGain.gain.setValueAtTime(vol, at);
        cowOsc1.frequency.setValueAtTime(540 * rate, at);
        cowOsc2.frequency.setValueAtTime(800 * rate, at);
        cowEnv.triggerAttackRelease(0.16, at);
        break;
      case 'crash':
        crashGain.gain.setValueAtTime(vol, at);
        crashHp.frequency.setValueAtTime(4000 * rate, at);
        crash.triggerAttackRelease(1.1, at);
        break;
      default:
        return;
    }
    lastStart.set(voice, at);
  }

  function dispose(): void {
    [
      kick,
      snare,
      clap,
      hat,
      ohat,
      tom,
      cowOsc1,
      cowOsc2,
      cowEnv,
      crash,
      snareHp,
      clapBp,
      hatHp,
      ohatHp,
      crashHp,
      kickGain,
      snareGain,
      clapGain,
      hatGain,
      ohatGain,
      tomGain,
      cowGain,
      crashGain,
    ].forEach((n) => n.dispose());
  }

  return { trigger, dispose };
}
