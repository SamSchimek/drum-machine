import type { DrumSynth } from '../../types';

export class Rimshot implements DrumSynth {
  private context: AudioContext;
  private output: AudioNode;

  constructor(context: AudioContext, output: AudioNode) {
    this.context = context;
    this.output = output;
  }

  trigger(time: number, velocity: number = 1): void {
    // Short noise burst
    const noiseBuffer = this.createNoiseBuffer();
    const noise = this.context.createBufferSource();
    noise.buffer = noiseBuffer;

    const highpass = this.context.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 2000;

    const noiseGain = this.context.createGain();
    noiseGain.gain.setValueAtTime(velocity * 0.4, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    noise.connect(highpass);
    highpass.connect(noiseGain);
    noiseGain.connect(this.output);

    // Sine component for body
    const osc = this.context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 350;

    const oscGain = this.context.createGain();
    oscGain.gain.setValueAtTime(velocity * 0.3, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(oscGain);
    oscGain.connect(this.output);

    noise.start(time);
    noise.stop(time + 0.05);
    osc.start(time);
    osc.stop(time + 0.05);
  }

  private createNoiseBuffer(): AudioBuffer {
    const bufferSize = this.context.sampleRate * 0.1;
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
