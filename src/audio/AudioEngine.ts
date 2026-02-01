import type { TrackId, DrumSynth } from '../types';
import {
  Kick,
  Snare,
  ClosedHH,
  OpenHH,
  Clap,
  TomLow,
  TomMid,
  TomHigh,
  Rimshot,
  Cowbell,
  Clave,
  Maracas,
} from './sounds';

export class AudioEngine {
  context: AudioContext | null = null;
  synths: Map<TrackId, DrumSynth> = new Map();
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  async initialize(): Promise<void> {
    if (this.context) {
      return;
    }

    this.context = new AudioContext();

    // Resume context if suspended (browser autoplay policy)
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    // Create master chain: synths -> compressor -> masterGain -> destination
    this.compressor = this.context.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.8;

    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);

    // Initialize all synths
    this.initializeSynths();
  }

  private initializeSynths(): void {
    if (!this.context || !this.compressor) {
      throw new Error('AudioEngine not initialized');
    }

    const output = this.compressor;

    this.synths.set('kick', new Kick(this.context, output));
    this.synths.set('snare', new Snare(this.context, output));
    this.synths.set('closedHH', new ClosedHH(this.context, output));
    this.synths.set('openHH', new OpenHH(this.context, output));
    this.synths.set('clap', new Clap(this.context, output));
    this.synths.set('tomLow', new TomLow(this.context, output));
    this.synths.set('tomMid', new TomMid(this.context, output));
    this.synths.set('tomHigh', new TomHigh(this.context, output));
    this.synths.set('rimshot', new Rimshot(this.context, output));
    this.synths.set('cowbell', new Cowbell(this.context, output));
    this.synths.set('clave', new Clave(this.context, output));
    this.synths.set('maracas', new Maracas(this.context, output));
  }

  triggerSound(trackId: TrackId, time?: number, velocity: number = 1): void {
    const synth = this.synths.get(trackId);
    if (synth && this.context) {
      synth.trigger(time ?? this.context.currentTime, velocity);
    }
  }

  getCurrentTime(): number {
    return this.context?.currentTime ?? 0;
  }

  setMasterVolume(value: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  dispose(): void {
    for (const synth of this.synths.values()) {
      synth.dispose();
    }
    this.synths.clear();

    if (this.context) {
      this.context.close();
      this.context = null;
    }

    this.masterGain = null;
    this.compressor = null;
  }
}

// Singleton instance
export const audioEngine = new AudioEngine();
