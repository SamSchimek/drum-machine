export interface VibesValues {
  reverb: number;
  warmth: number;
  lofi: number;
}

export class VibesEffects {
  private ctx: AudioContext;

  // Bypass routing
  private inputNode: GainNode;
  private outputNode: GainNode;
  private bypassGain: GainNode;
  private effectGain: GainNode;
  private bypassed = false;

  // Reverb nodes
  private reverbInput: GainNode;
  private reverbOutput: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private roomConvolver: ConvolverNode;
  private hallConvolver: ConvolverNode;
  private roomGain: GainNode;
  private hallGain: GainNode;

  // Room plate-style enhancement nodes
  private roomPreDelay: DelayNode;
  private roomModDelay: DelayNode;
  private roomModLFO: OscillatorNode;
  private roomModDepth: GainNode;
  private roomHPF: BiquadFilterNode;
  private roomLPF: BiquadFilterNode;

  // Hall enhancement nodes
  private hallHPF: BiquadFilterNode;

  // Warmth nodes
  private warmthShaper: WaveShaperNode;
  private warmthFilter: BiquadFilterNode;
  private warmthMakeup: GainNode;

  // Lo-fi nodes
  private lofiShaper: WaveShaperNode;
  private lofiFilter: BiquadFilterNode;
  private lofiMakeup: GainNode;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;

    // --- Bypass routing ---
    this.inputNode = ctx.createGain();
    this.outputNode = ctx.createGain();
    this.bypassGain = ctx.createGain();
    this.effectGain = ctx.createGain();
    // Default: effects active
    this.bypassGain.gain.value = 0;
    this.effectGain.gain.value = 1;
    // Bypass path: input → bypassGain → output
    this.inputNode.connect(this.bypassGain);
    this.bypassGain.connect(this.outputNode);

    // --- Reverb (parallel dry/wet with dual convolvers) ---
    this.reverbInput = ctx.createGain();
    this.reverbOutput = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    // Dual convolvers: room (short) and hall (long)
    this.roomConvolver = ctx.createConvolver();
    this.hallConvolver = ctx.createConvolver();
    this.roomGain = ctx.createGain();
    this.hallGain = ctx.createGain();

    this.roomConvolver.buffer = this.createImpulseResponse(1.0, 2, 0.35, 0);
    this.hallConvolver.buffer = this.createImpulseResponse(2, 2, 0.5, 0);

    // Default: room active
    this.roomGain.gain.value = 1;
    this.hallGain.gain.value = 0;

    // Effect path: input → reverbInput → ... → effectGain → output
    this.inputNode.connect(this.reverbInput);

    // dry path
    this.reverbInput.connect(this.dryGain);
    this.dryGain.connect(this.reverbOutput);

    // --- Room wet path (plate-style): reverbInput → preDelay → convolver → modDelay → HPF → LPF → roomGain → wetGain ---
    this.roomPreDelay = ctx.createDelay(0.1);
    this.roomPreDelay.delayTime.value = 0.02; // 20ms pre-delay preserves transient

    this.roomModDelay = ctx.createDelay(0.05);
    this.roomModDelay.delayTime.value = 0.007; // 7ms center for chorus-zone shimmer

    this.roomModLFO = ctx.createOscillator();
    this.roomModLFO.type = 'sine';
    this.roomModLFO.frequency.value = 1.2; // Slow, subtle movement

    this.roomModDepth = ctx.createGain();
    this.roomModDepth.gain.value = 0.002; // ±2ms pitch wobble

    this.roomHPF = ctx.createBiquadFilter();
    this.roomHPF.type = 'highpass' as any;
    this.roomHPF.frequency.value = 200;
    this.roomHPF.Q.value = 0.707; // Butterworth, no resonance

    this.roomLPF = ctx.createBiquadFilter();
    this.roomLPF.type = 'lowpass' as any;
    this.roomLPF.frequency.value = 6000;
    this.roomLPF.Q.value = 0.707;

    // LFO modulation chain
    this.roomModLFO.connect(this.roomModDepth);
    this.roomModDepth.connect(this.roomModDelay.delayTime);

    // Room signal chain
    this.reverbInput.connect(this.roomPreDelay);
    this.roomPreDelay.connect(this.roomConvolver);
    this.roomConvolver.connect(this.roomModDelay);
    this.roomModDelay.connect(this.roomHPF);
    this.roomHPF.connect(this.roomLPF);
    this.roomLPF.connect(this.roomGain);
    this.roomGain.connect(this.wetGain);

    // Start LFO after all connections are made (avoids initial click)
    this.roomModLFO.start();

    // --- Hall wet path (reduced boom): reverbInput → hallConvolver → hallHPF → hallGain → wetGain ---
    this.hallHPF = ctx.createBiquadFilter();
    this.hallHPF.type = 'highpass' as any;
    this.hallHPF.frequency.value = 200;
    this.hallHPF.Q.value = 0.707;

    this.reverbInput.connect(this.hallConvolver);
    this.hallConvolver.connect(this.hallHPF);
    this.hallHPF.connect(this.hallGain);
    this.hallGain.connect(this.wetGain);

    this.wetGain.connect(this.reverbOutput);

    // Send architecture: dry always 100%, knob controls wet level
    this.dryGain.gain.value = 1;
    this.wetGain.gain.value = 0;

    // --- Warmth (series: waveshaper → low-shelf → makeup) ---
    this.warmthShaper = ctx.createWaveShaper();
    this.warmthFilter = ctx.createBiquadFilter();
    this.warmthFilter.type = 'lowshelf' as any;
    this.warmthFilter.frequency.value = 200;
    this.warmthFilter.gain.value = 0;
    this.warmthShaper.curve = this.makeTanhCurve(0);
    this.warmthMakeup = ctx.createGain();
    this.warmthMakeup.gain.value = 1;

    this.reverbOutput.connect(this.warmthShaper);
    this.warmthShaper.connect(this.warmthFilter);
    this.warmthFilter.connect(this.warmthMakeup);

    // --- Lo-fi (series: staircase waveshaper → lowpass → makeup) ---
    this.lofiShaper = ctx.createWaveShaper();
    this.lofiFilter = ctx.createBiquadFilter();
    this.lofiFilter.type = 'lowpass' as any;
    this.lofiFilter.frequency.value = 22000;
    this.lofiShaper.curve = this.makeStaircaseCurve(65536);
    this.lofiMakeup = ctx.createGain();
    this.lofiMakeup.gain.value = 1;

    this.warmthMakeup.connect(this.lofiShaper);
    this.lofiShaper.connect(this.lofiFilter);
    this.lofiFilter.connect(this.lofiMakeup);

    // Effect chain output → effectGain → output
    this.lofiMakeup.connect(this.effectGain);
    this.effectGain.connect(this.outputNode);
  }

  getInput(): GainNode {
    return this.inputNode;
  }

  connect(destination: AudioNode): void {
    this.outputNode.connect(destination);
  }

  setBypassed(bypassed: boolean): void {
    this.bypassed = bypassed;
    // Smooth crossfade to avoid clicks (15ms ramp)
    const now = this.ctx.currentTime;
    const tau = 0.005; // ~15ms to reach target (3× tau)
    this.bypassGain.gain.setTargetAtTime(bypassed ? 1 : 0, now, tau);
    this.effectGain.gain.setTargetAtTime(bypassed ? 0 : 1, now, tau);
  }

  isBypassed(): boolean {
    return this.bypassed;
  }

  setReverbMode(mode: 'room' | 'hall'): void {
    const now = this.ctx.currentTime;
    const tau = 0.005; // ~15ms crossfade
    this.roomGain.gain.setTargetAtTime(mode === 'room' ? 1 : 0, now, tau);
    this.hallGain.gain.setTargetAtTime(mode === 'hall' ? 1 : 0, now, tau);
  }

  setReverb(value: number): void {
    const v = Math.max(0, Math.min(100, value)) / 100;
    // Send style: dry always at 100%, knob controls reverb send level
    this.wetGain.gain.value = v;
  }

  setWarmth(value: number): void {
    const v = Math.max(0, Math.min(100, value)) / 100;
    // Full tanh saturation range
    this.warmthShaper.curve = this.makeTanhCurve(v);
    this.warmthFilter.gain.value = v * 6; // 0 to +6 dB low-shelf
    // Compensate: saturation boosts RMS, shelf adds low-end energy
    // Reduce output proportionally to keep perceived volume stable
    this.warmthMakeup.gain.value = 1 / (1 + v * 1.0);
  }

  setLofi(value: number): void {
    const v = Math.max(0, Math.min(100, value)) / 100;
    // Steps: 65536 at 0 → 24 at 100 (heavy bit-crush)
    const steps = Math.round(65536 * Math.pow(24 / 65536, v));
    this.lofiShaper.curve = this.makeStaircaseCurve(steps);
    // Frequency: 22000 Hz at 0 → 2500 Hz at 100
    this.lofiFilter.frequency.value = 22000 * Math.pow(2500 / 22000, v);
    // Gentle compensation — lowpass removes energy, staircase adds harmonics
    this.lofiMakeup.gain.value = 1 / (1 + v * 0.15);
  }

  dispose(): void {
    this.inputNode.disconnect();
    this.bypassGain.disconnect();
    this.effectGain.disconnect();
    this.outputNode.disconnect();
    this.reverbInput.disconnect();
    this.dryGain.disconnect();
    this.roomConvolver.disconnect();
    this.hallConvolver.disconnect();
    this.roomGain.disconnect();
    this.hallGain.disconnect();
    this.wetGain.disconnect();
    this.roomPreDelay.disconnect();
    this.roomModDelay.disconnect();
    this.roomModLFO.stop();
    this.roomModLFO.disconnect();
    this.roomModDepth.disconnect();
    this.roomHPF.disconnect();
    this.roomLPF.disconnect();
    this.hallHPF.disconnect();
    this.reverbOutput.disconnect();
    this.warmthShaper.disconnect();
    this.warmthFilter.disconnect();
    this.warmthMakeup.disconnect();
    this.lofiShaper.disconnect();
    this.lofiFilter.disconnect();
    this.lofiMakeup.disconnect();
  }

  private createImpulseResponse(duration: number, channels: number, decay: number, damping = 0): AudioBuffer {
    const length = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(channels, length, this.ctx.sampleRate);
    // damping: 0 = bright (no filtering), 1 = very dark
    // Single-pole lowpass coefficient: higher = more HF rolloff
    const coeff = Math.max(0, Math.min(0.995, damping));
    for (let ch = 0; ch < channels; ch++) {
      const data = buffer.getChannelData(ch);
      let prev = 0;
      for (let i = 0; i < length; i++) {
        const noise = Math.random() * 2 - 1;
        // Apply single-pole lowpass: y[n] = coeff * y[n-1] + (1 - coeff) * x[n]
        const filtered = coeff * prev + (1 - coeff) * noise;
        prev = filtered;
        data[i] = filtered * Math.exp(-i / (this.ctx.sampleRate * decay));
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
