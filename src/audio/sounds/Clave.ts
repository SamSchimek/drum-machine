import type { DrumSynth } from '../../types';

export class Clave implements DrumSynth {
  private context: AudioContext;
  private output: AudioNode;

  constructor(context: AudioContext, output: AudioNode) {
    this.context = context;
    this.output = output;
  }

  trigger(time: number, velocity: number = 1): void {
    const osc = this.context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 2500;

    const bandpass = this.context.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 2500;
    bandpass.Q.value = 5;

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(velocity * 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

    osc.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.output);

    osc.start(time);
    osc.stop(time + 0.02);
  }

  dispose(): void {
    // No persistent nodes to clean up
  }
}
