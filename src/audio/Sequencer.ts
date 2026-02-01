import type { GridState, TrackId } from '../types';
import { TRACK_IDS } from '../types';
import { STEPS_PER_PATTERN, LOOKAHEAD_TIME, SCHEDULE_INTERVAL } from '../constants';
import { audioEngine } from './AudioEngine';

export type StepCallback = (step: number) => void;
type MutedTracks = Record<TrackId, boolean>;

export class Sequencer {
  private tempo: number = 120;
  private isPlaying: boolean = false;
  private currentStep: number = 0;
  private nextStepTime: number = 0;
  private schedulerTimerId: number | null = null;
  private grid: GridState | null = null;
  private mutedTracks: MutedTracks | null = null;
  private stepCallbacks: Set<StepCallback> = new Set();

  setGrid(grid: GridState): void {
    this.grid = grid;
  }

  setMutedTracks(mutedTracks: MutedTracks): void {
    this.mutedTracks = mutedTracks;
  }

  setTempo(bpm: number): void {
    this.tempo = Math.max(40, Math.min(300, bpm));
  }

  getTempo(): number {
    return this.tempo;
  }

  getCurrentStep(): number {
    return this.currentStep;
  }

  isSequencerPlaying(): boolean {
    return this.isPlaying;
  }

  onStep(callback: StepCallback): () => void {
    this.stepCallbacks.add(callback);
    return () => this.stepCallbacks.delete(callback);
  }

  private notifyStepCallbacks(): void {
    for (const callback of this.stepCallbacks) {
      callback(this.currentStep);
    }
  }

  async start(): Promise<void> {
    if (this.isPlaying) return;

    await audioEngine.initialize();

    this.isPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = audioEngine.getCurrentTime();

    this.scheduleAhead();
    this.schedulerTimerId = window.setInterval(
      () => this.scheduleAhead(),
      SCHEDULE_INTERVAL
    );
  }

  stop(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.currentStep = 0;

    if (this.schedulerTimerId !== null) {
      clearInterval(this.schedulerTimerId);
      this.schedulerTimerId = null;
    }

    this.notifyStepCallbacks();
  }

  private scheduleAhead(): void {
    const currentTime = audioEngine.getCurrentTime();

    while (this.nextStepTime < currentTime + LOOKAHEAD_TIME) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.advanceStep();
    }
  }

  private scheduleStep(step: number, time: number): void {
    if (!this.grid) return;

    // Schedule all active sounds for this step (unless muted)
    for (const trackId of TRACK_IDS) {
      const isMuted = this.mutedTracks?.[trackId] ?? false;
      if (this.grid[trackId][step] && !isMuted) {
        audioEngine.triggerSound(trackId, time);
      }
    }

    // Schedule UI callback slightly before the audio
    const callbackDelay = Math.max(0, (time - audioEngine.getCurrentTime()) * 1000 - 10);
    setTimeout(() => {
      if (this.isPlaying) {
        this.notifyStepCallbacks();
      }
    }, callbackDelay);
  }

  private advanceStep(): void {
    const secondsPerBeat = 60 / this.tempo;
    const secondsPerStep = secondsPerBeat / 4; // 16th notes

    this.currentStep = (this.currentStep + 1) % STEPS_PER_PATTERN;
    this.nextStepTime += secondsPerStep;
  }
}

// Singleton instance
export const sequencer = new Sequencer();
