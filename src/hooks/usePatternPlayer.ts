import { useState, useEffect, useRef, useCallback } from 'react';
import type { GridState, TrackId } from '../types';
import { TRACK_IDS } from '../types';
import { STEPS_PER_PATTERN, LOOKAHEAD_TIME, SCHEDULE_INTERVAL } from '../constants';
import { AudioEngine } from '../audio/AudioEngine';

interface UsePatternPlayerOptions {
  grid: GridState;
  tempo: number;
}

interface UsePatternPlayerReturn {
  isPlaying: boolean;
  currentStep: number;
  play: () => Promise<void>;
  stop: () => void;
}

/**
 * Lightweight hook for standalone pattern playback.
 * Creates its own AudioEngine instance (no DrumMachineContext dependency).
 */
export function usePatternPlayer({ grid, tempo }: UsePatternPlayerOptions): UsePatternPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const schedulerTimerRef = useRef<number | null>(null);
  const nextStepTimeRef = useRef<number>(0);
  const currentStepRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  // Keep refs in sync with latest values
  const gridRef = useRef(grid);
  const tempoRef = useRef(tempo);
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);
  useEffect(() => {
    tempoRef.current = tempo;
  }, [tempo]);

  const scheduleStep = useCallback((step: number, time: number, engine: AudioEngine) => {
    const currentGrid = gridRef.current;

    // Schedule all active sounds for this step
    for (const trackId of TRACK_IDS) {
      if (currentGrid[trackId][step]) {
        engine.triggerSound(trackId as TrackId, time);
      }
    }

    // Schedule UI callback slightly before the audio
    const callbackDelay = Math.max(0, (time - engine.getCurrentTime()) * 1000 - 10);
    setTimeout(() => {
      if (isPlayingRef.current) {
        setCurrentStep(step);
      }
    }, callbackDelay);
  }, []);

  const scheduleAhead = useCallback((engine: AudioEngine) => {
    const currentTime = engine.getCurrentTime();
    const secondsPerBeat = 60 / tempoRef.current;
    const secondsPerStep = secondsPerBeat / 4; // 16th notes

    while (nextStepTimeRef.current < currentTime + LOOKAHEAD_TIME) {
      scheduleStep(currentStepRef.current, nextStepTimeRef.current, engine);
      currentStepRef.current = (currentStepRef.current + 1) % STEPS_PER_PATTERN;
      nextStepTimeRef.current += secondsPerStep;
    }
  }, [scheduleStep]);

  const play = useCallback(async () => {
    if (isPlayingRef.current) return;

    // Initialize audio engine on first play (handles user gesture requirement)
    if (!audioEngineRef.current) {
      audioEngineRef.current = new AudioEngine();
    }

    await audioEngineRef.current.initialize();

    isPlayingRef.current = true;
    setIsPlaying(true);
    currentStepRef.current = 0;
    nextStepTimeRef.current = audioEngineRef.current.getCurrentTime();

    scheduleAhead(audioEngineRef.current);
    schedulerTimerRef.current = window.setInterval(() => {
      if (audioEngineRef.current) {
        scheduleAhead(audioEngineRef.current);
      }
    }, SCHEDULE_INTERVAL);
  }, [scheduleAhead]);

  const stop = useCallback(() => {
    if (!isPlayingRef.current) return;

    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentStep(-1);
    currentStepRef.current = 0;

    if (schedulerTimerRef.current !== null) {
      clearInterval(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (schedulerTimerRef.current !== null) {
        clearInterval(schedulerTimerRef.current);
      }
      if (audioEngineRef.current) {
        audioEngineRef.current.dispose();
        audioEngineRef.current = null;
      }
    };
  }, []);

  return {
    isPlaying,
    currentStep,
    play,
    stop,
  };
}
