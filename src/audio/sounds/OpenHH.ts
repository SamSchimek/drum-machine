import type { DrumSynth } from '../../types';

export class OpenHH implements DrumSynth {
  private context: AudioContext;
  private output: AudioNode;

  constructor(context: AudioContext, output: AudioNode) {
    this.context = context;
    this.output = output;
  }

  trigger(time: number, velocity: number = 1): void {
    const noiseBuffer = this.createNoiseBuffer();
    const noise = this.context.createBufferSource();
    noise.buffer = noiseBuffer;

    const highpass = this.context.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 6000;

    const bandpass = this.context.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 9000;
    bandpass.Q.value = 0.8;

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(velocity * 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    noise.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.output);

    noise.start(time);
    noise.stop(time + 0.3);
  }

  private createNoiseBuffer(): AudioBuffer {
    const bufferSize = this.context.sampleRate * 0.4;
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
