import type { DrumSynth } from '../../types';

export class Snare implements DrumSynth {
  private context: AudioContext;
  private output: AudioNode;

  constructor(context: AudioContext, output: AudioNode) {
    this.context = context;
    this.output = output;
  }

  trigger(time: number, velocity: number = 1): void {
    // Noise component
    const noiseBuffer = this.createNoiseBuffer();
    const noise = this.context.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.context.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 3000;
    noiseFilter.Q.value = 1;

    const noiseGain = this.context.createGain();
    noiseGain.gain.setValueAtTime(velocity * 0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.output);

    // Tone component
    const osc = this.context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 180;

    const oscGain = this.context.createGain();
    oscGain.gain.setValueAtTime(velocity * 0.4, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.output);

    noise.start(time);
    noise.stop(time + 0.15);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  private createNoiseBuffer(): AudioBuffer {
    const bufferSize = this.context.sampleRate * 0.2;
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
