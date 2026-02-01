import type { DrumSynth } from '../../types';

export class Cowbell implements DrumSynth {
  private context: AudioContext;
  private output: AudioNode;

  constructor(context: AudioContext, output: AudioNode) {
    this.context = context;
    this.output = output;
  }

  trigger(time: number, velocity: number = 1): void {
    // Two detuned square waves for metallic sound
    const frequencies = [560, 845];

    frequencies.forEach((freq) => {
      const osc = this.context.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;

      const bandpass = this.context.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = freq;
      bandpass.Q.value = 2;

      const gain = this.context.createGain();
      gain.gain.setValueAtTime(velocity * 0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

      osc.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.output);

      osc.start(time);
      osc.stop(time + 0.4);
    });
  }

  dispose(): void {
    // No persistent nodes to clean up
  }
}
