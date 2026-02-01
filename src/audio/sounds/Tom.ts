import type { DrumSynth } from '../../types';

export class Tom implements DrumSynth {
  private context: AudioContext;
  private output: AudioNode;
  private baseFrequency: number;

  constructor(context: AudioContext, output: AudioNode, frequency: number) {
    this.context = context;
    this.output = output;
    this.baseFrequency = frequency;
  }

  trigger(time: number, velocity: number = 1): void {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(this.baseFrequency * 1.5, time);
    osc.frequency.exponentialRampToValueAtTime(this.baseFrequency, time + 0.05);

    gain.gain.setValueAtTime(velocity * 0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(gain);
    gain.connect(this.output);

    osc.start(time);
    osc.stop(time + 0.25);
  }

  dispose(): void {
    // No persistent nodes to clean up
  }
}

// Factory functions for different tom types
export class TomLow extends Tom {
  constructor(context: AudioContext, output: AudioNode) {
    super(context, output, 80);
  }
}

export class TomMid extends Tom {
  constructor(context: AudioContext, output: AudioNode) {
    super(context, output, 120);
  }
}

export class TomHigh extends Tom {
  constructor(context: AudioContext, output: AudioNode) {
    super(context, output, 180);
  }
}
