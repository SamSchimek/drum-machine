export interface VibesValues {
  reverb: number;
  warmth: number;
  lofi: number;
}

export class VibesEffects {
  private ctx: AudioContext;

  // Reverb nodes
  private reverbInput: GainNode;
  private reverbOutput: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private convolver: ConvolverNode;

  // Warmth nodes
  private warmthShaper: WaveShaperNode;
  private warmthFilter: BiquadFilterNode;

  // Lo-fi nodes
  private lofiShaper: WaveShaperNode;
  private lofiFilter: BiquadFilterNode;
  private lofiMakeup: GainNode;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;

    // --- Reverb (parallel dry/wet) ---
    this.reverbInput = ctx.createGain();
    this.reverbOutput = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();
    this.convolver = ctx.createConvolver();

    // Build impulse response
    this.convolver.buffer = this.createImpulseResponse(2, 2);

    // dry path
    this.reverbInput.connect(this.dryGain);
    this.dryGain.connect(this.reverbOutput);

    // wet path
    this.reverbInput.connect(this.convolver);
    this.convolver.connect(this.wetGain);
    this.wetGain.connect(this.reverbOutput);

    // Send architecture: dry always 100%, knob controls wet level
    this.dryGain.gain.value = 1;
    this.wetGain.gain.value = 0;

    // --- Warmth (series: waveshaper → low-shelf) ---
    this.warmthShaper = ctx.createWaveShaper();
    this.warmthFilter = ctx.createBiquadFilter();
    this.warmthFilter.type = 'lowshelf' as any;
    this.warmthFilter.frequency.value = 200;
    this.warmthFilter.gain.value = 0;
    this.warmthShaper.curve = this.makeTanhCurve(0);

    this.reverbOutput.connect(this.warmthShaper);
    this.warmthShaper.connect(this.warmthFilter);

    // --- Lo-fi (series: staircase waveshaper → lowpass → makeup gain) ---
    this.lofiShaper = ctx.createWaveShaper();
    this.lofiFilter = ctx.createBiquadFilter();
    this.lofiFilter.type = 'lowpass' as any;
    this.lofiFilter.frequency.value = 22000;
    this.lofiShaper.curve = this.makeStaircaseCurve(65536);
    this.lofiMakeup = ctx.createGain();
    this.lofiMakeup.gain.value = 1;

    this.warmthFilter.connect(this.lofiShaper);
    this.lofiShaper.connect(this.lofiFilter);
    this.lofiFilter.connect(this.lofiMakeup);
  }

  getInput(): GainNode {
    return this.reverbInput;
  }

  connect(destination: AudioNode): void {
    this.lofiMakeup.connect(destination);
  }

  setReverb(value: number): void {
    const v = Math.max(0, Math.min(100, value)) / 100;
    // Send style: dry always at 100%, knob controls reverb send level
    this.wetGain.gain.value = v * 0.7;
  }

  setWarmth(value: number): void {
    const v = Math.max(0, Math.min(100, value)) / 100;
    // Full tanh saturation range — tanh compresses peaks so compensate
    // with a slight gain boost to keep perceived volume steady
    const drive = v;
    this.warmthShaper.curve = this.makeTanhCurve(drive);
    this.warmthFilter.gain.value = v * 6; // 0 to +6 dB low-shelf
    // Tanh compression lowers peaks; shelf boost adds energy — roughly cancel out
  }

  setLofi(value: number): void {
    const v = Math.max(0, Math.min(100, value)) / 100;
    // Steps: 65536 at 0 → 24 at 100 (heavy bit-crush)
    const steps = Math.round(65536 * Math.pow(24 / 65536, v));
    this.lofiShaper.curve = this.makeStaircaseCurve(steps);
    // Frequency: 22000 Hz at 0 → 2500 Hz at 100
    this.lofiFilter.frequency.value = 22000 * Math.pow(2500 / 22000, v);
    // Makeup gain: compensate for energy loss from lowpass rolloff
    this.lofiMakeup.gain.value = 1 + v * 0.5;
  }

  dispose(): void {
    this.reverbInput.disconnect();
    this.dryGain.disconnect();
    this.convolver.disconnect();
    this.wetGain.disconnect();
    this.reverbOutput.disconnect();
    this.warmthShaper.disconnect();
    this.warmthFilter.disconnect();
    this.lofiShaper.disconnect();
    this.lofiFilter.disconnect();
    this.lofiMakeup.disconnect();
  }

  private createImpulseResponse(duration: number, channels: number): AudioBuffer {
    const length = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(channels, length, this.ctx.sampleRate);
    for (let ch = 0; ch < channels; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.5));
      }
    }
    return buffer;
  }

  private makeTanhCurve(intensity: number): Float32Array {
    const samples = 8192;
    const curve = new Float32Array(samples);
    // At intensity=0, linear passthrough. At intensity=1, aggressive tanh clipping.
    const drive = 1 + intensity * 5;
    for (let i = 0; i < samples; i++) {
      const x = (i / (samples - 1)) * 2 - 1;
      curve[i] = Math.tanh(x * drive);
    }
    return curve;
  }

  private makeStaircaseCurve(steps: number): Float32Array {
    const samples = 65536;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i / (samples - 1)) * 2 - 1;
      curve[i] = Math.round(x * steps) / steps;
    }
    return curve;
  }
}
