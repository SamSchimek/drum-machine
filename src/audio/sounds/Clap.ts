import type { DrumSynth } from '../../types';

export class Clap implements DrumSynth {
  private context: AudioContext;
  private output: AudioNode;

  constructor(context: AudioContext, output: AudioNode) {
    this.context = context;
    this.output = output;
  }

  trigger(time: number, velocity: number = 1): void {
    // Create multiple layered noise bursts for clap effect
    const delays = [0, 0.01, 0.02, 0.03];

    delays.forEach((delay, index) => {
      const noiseBuffer = this.createNoiseBuffer();
      const noise = this.context.createBufferSource();
      noise.buffer = noiseBuffer;

      const bandpass = this.context.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1200;
      bandpass.Q.value = 0.5;

      const highpass = this.context.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 1000;

      const gain = this.context.createGain();
      const attackTime = time + delay;
      const amplitude = velocity * 0.3 * (index === delays.length - 1 ? 1 : 0.5);

      gain.gain.setValueAtTime(0, attackTime);
      gain.gain.linearRampToValueAtTime(amplitude, attackTime + 0.002);

      if (index === delays.length - 1) {
        // Last burst has longer decay
        gain.gain.exponentialRampToValueAtTime(0.001, attackTime + 0.15);
      } else {
        gain.gain.exponentialRampToValueAtTime(0.001, attackTime + 0.02);
      }

      noise.connect(bandpass);
      bandpass.connect(highpass);
      highpass.connect(gain);
      gain.connect(this.output);

      noise.start(attackTime);
      noise.stop(attackTime + 0.2);
    });
  }

  private createNoiseBuffer(): AudioBuffer {
    const bufferSize = this.context.sampleRate * 0.3;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  dispose(): void {
    // No persistent nodes to clean up
  }
}
