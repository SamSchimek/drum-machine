import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  saveTutorialStep,
  loadTutorialStep,
  saveTutorialActive,
  loadTutorialActive,
  saveTutorialCompleted,
  loadTutorialCompleted,
  saveTutorialSkipped,
  loadTutorialSkipped,
  clearTutorialState,
} from './tutorialPersistence';
import { useDrumMachine } from './DrumMachineContext';
import { DEFAULT_TEMPO } from '../constants';
import type { TrackId, GridState } from '../types';

// Step indices for special behavior
const LAST_INTERACTIVE_STEP_INDEX = 4;
const BPM_STEP_INDEX = 8;
const STARTER_BEAT_STEP_INDEX = 9;
const SAVE_STEP_INDEX = 10;

// Deep copy helper to prevent mutations affecting saved state
function deepCopyGrid(grid: GridState): GridState {
  return Object.fromEntries(
    Object.entries(grid).map(([key, value]) => [key, [...value]])
  ) as GridState;
}

export interface TutorialStep {
  target: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  requiredCells?: Array<{ trackId: TrackId; step: number }>;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  // Interactive beat-building (5 steps)
  {
    target: '.grid-row[data-track="kick"]',
    content: "Let's build a beat! Click the highlighted KICK cells",
    position: 'right',
    requiredCells: [
      { trackId: 'kick', step: 0 },
      { trackId: 'kick', step: 6 },
      { trackId: 'kick', step: 10 },
    ],
  },
  {
    target: '.grid-row[data-track="snare"]',
    content: 'Now add some SNARE',
    position: 'right',
    requiredCells: [
      { trackId: 'snare', step: 4 },
      { trackId: 'snare', step: 12 },
    ],
  },
  {
    target: '.grid-row[data-track="closedHH"]',
    content: 'Add HI-HAT for rhythm',
    position: 'right',
    requiredCells: [
      { trackId: 'closedHH', step: 2 },
      { trackId: 'closedHH', step: 3 },
      { trackId: 'closedHH', step: 8 },
      { trackId: 'closedHH', step: 14 },
    ],
  },
  {
    target: '.grid-row[data-track="clap"]',
    content: 'Drop in a CLAP',
    position: 'right',
    requiredCells: [
      { trackId: 'clap', step: 12 },
    ],
  },
  {
    target: '.grid-row[data-track="maracas"]',
    content: 'Finish with MARACAS',
    position: 'right',
    requiredCells: [
      { trackId: 'maracas', step: 0 },
      { trackId: 'maracas', step: 6 },
    ],
  },
  // Informational steps
  {
    target: '.play-button',
    content: 'Press Space or click to hear your beat!',
    position: 'right',
  },
  {
    target: '.grid-row[data-track="kick"] .track-label',
    content: 'Click any track name to hear a preview',
    position: 'right',
  },
  {
    target: '.grid-row[data-track="kick"] .mute-button',
    content: 'Mute tracks during playback',
    position: 'right',
  },
  {
    target: '.tempo-control',
    content: 'Adjust BPM from 40-300',
    position: 'bottom',
  },
  {
    target: '.starter-beat-button',
    content: 'Load random patterns for inspiration',
    position: 'bottom',
  },
  {
    target: '.save-button',
    content: 'Save your first beat! Click Save to keep it',
    position: 'left',
  },
  {
    target: '.pattern-bank',
    content: 'Share your beats with friends via unique links',
    position: 'left',
  },
  {
    target: '.generate-panel',
    content: 'Save 5+ patterns to unlock AI generation inspired by your beats',
    position: 'left',
  },
];

interface TutorialContextValue {
  currentStep: number;
  isActive: boolean;
  isCompleted: boolean;
  isSkipped: boolean;
  isContinuing: boolean;
  showPrompt: boolean;
  currentStepData: TutorialStep | null;
  totalSteps: number;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  resetTutorial: () => void;
  startTutorial: () => void;
  dismissPrompt: () => void;
  isCellRequired: (trackId: string, step: number) => boolean;
  onCellToggle: (trackId: string, step: number, isNowActive: boolean) => void;
  isInteractiveStep: boolean;
  isStepComplete: boolean;
  isSaveStep: boolean;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

const AUTO_START_DELAY = 1500;

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isMainRoute = location.pathname === '/';
  const { grid, clearGrid, triggerSound, setTempo, setGrid, play, stop, isPlaying } = useDrumMachine();

  // Ref to save grid state before starter beat step
  const savedGridBeforeStarterStep = useRef<GridState | null>(null);
  // Ref to skip auto-advance when navigating backward
  const skipAutoAdvance = useRef(false);

  // Initialize state from localStorage
  const [currentStep, setCurrentStep] = useState(() => loadTutorialStep());
  const [isActive, setIsActive] = useState(() => loadTutorialActive());
  const [isCompleted, setIsCompleted] = useState(() => loadTutorialCompleted());
  const [isSkipped, setIsSkipped] = useState(() => loadTutorialSkipped());
  const [isContinuing, setIsContinuing] = useState(() => {
    // isContinuing is true if we're resuming from a saved active state
    return loadTutorialActive() && loadTutorialStep() > 0;
  });
  const [showPrompt, setShowPrompt] = useState(false);

  const hasAutoStarted = useRef(false);

  // Show tutorial prompt after delay for first-time visitors on main route
  useEffect(() => {
    if (hasAutoStarted.current) return;
    if (!isMainRoute) return;
    if (isCompleted || isSkipped) return;
    if (isActive) return; // Already active (resuming)

    const timer = setTimeout(() => {
      hasAutoStarted.current = true;
      setShowPrompt(true);
    }, AUTO_START_DELAY);

    return () => clearTimeout(timer);
  }, [isMainRoute, isCompleted, isSkipped, isActive]);

  // Check if current step is an interactive step (has required cells)
  const isInteractiveStep = isActive && currentStep < TUTORIAL_STEPS.length
    ? !!TUTORIAL_STEPS[currentStep].requiredCells
    : false;

  // Auto-play during interactive steps so users hear their beat building
  useEffect(() => {
    if (isInteractiveStep && !isPlaying) {
      play();
    }
  }, [isInteractiveStep, isPlaying, play]);

  // Check if all required cells for the current step are active in the grid
  const checkInteractiveStepComplete = useCallback((gridState: GridState): boolean => {
    const stepData = TUTORIAL_STEPS[currentStep];
    if (!stepData?.requiredCells) return true; // Non-interactive step

    // Check if all required cells are currently ON in the grid
    return stepData.requiredCells.every(
      cell => gridState[cell.trackId][cell.step] === true
    );
  }, [currentStep]);

  // Check if the current step is complete (for UI feedback)
  const isStepComplete = !isInteractiveStep || checkInteractiveStepComplete(grid);

  // Auto-advance when all required cells are filled
  useEffect(() => {
    if (!isActive) return;
    const stepData = TUTORIAL_STEPS[currentStep];
    if (!stepData?.requiredCells) return;

    // Skip auto-advance if user just navigated backward
    if (skipAutoAdvance.current) {
      skipAutoAdvance.current = false;
      return;
    }

    if (checkInteractiveStepComplete(grid)) {
      // Small delay before advancing to show completion
      const timer = setTimeout(() => {
        // Re-verify cells are still active (prevents race condition if user toggles off)
        if (!checkInteractiveStepComplete(grid)) return;

        // Stop playback after last interactive step so "Press Space to play" makes sense
        if (currentStep === LAST_INTERACTIVE_STEP_INDEX) {
          stop();
        }

        setIsContinuing(false);
        if (currentStep >= TUTORIAL_STEPS.length - 1) {
          setIsActive(false);
          setIsCompleted(true);
          saveTutorialActive(false);
          saveTutorialCompleted(true);
          saveTutorialStep(0);
        } else {
          const newStep = currentStep + 1;
          setCurrentStep(newStep);
          saveTutorialStep(newStep);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [grid, currentStep, isActive, checkInteractiveStepComplete, stop]);

  const nextStep = useCallback(() => {
    // Block navigation on interactive steps unless complete
    if (isInteractiveStep && !checkInteractiveStepComplete(grid)) {
      return;
    }

    setIsContinuing(false);

    // Save grid when ENTERING starter beat step (leaving BPM step)
    if (currentStep === BPM_STEP_INDEX) {
      savedGridBeforeStarterStep.current = deepCopyGrid(grid);
      // Reset tempo to default when leaving BPM step
      setTempo(DEFAULT_TEMPO);
    }

    // Restore grid when LEAVING starter beat step
    if (currentStep === STARTER_BEAT_STEP_INDEX && savedGridBeforeStarterStep.current) {
      setGrid(deepCopyGrid(savedGridBeforeStarterStep.current));
    }

    if (currentStep >= TUTORIAL_STEPS.length - 1) {
      // Complete tutorial
      setIsActive(false);
      setIsCompleted(true);
      saveTutorialActive(false);
      saveTutorialCompleted(true);
      saveTutorialStep(0);
    } else {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      saveTutorialStep(newStep);
    }
  }, [currentStep, isInteractiveStep, checkInteractiveStepComplete, grid, setTempo, setGrid]);

  const previousStep = useCallback(() => {
    setIsContinuing(false);
    // Prevent auto-advance when navigating backward to completed interactive steps
    skipAutoAdvance.current = true;

    // Restore grid when leaving step 9 backward
    if (currentStep === STARTER_BEAT_STEP_INDEX && savedGridBeforeStarterStep.current) {
      setGrid(deepCopyGrid(savedGridBeforeStarterStep.current));
    }

    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      saveTutorialStep(newStep);
    }
  }, [currentStep, setGrid]);

  const skipTutorial = useCallback(() => {
    setIsActive(false);
    setIsSkipped(true);
    saveTutorialActive(false);
    saveTutorialSkipped(true);
  }, []);

  const resetTutorial = useCallback(() => {
    clearTutorialState();
    clearGrid();
    setCurrentStep(0);
    setIsActive(true);
    setIsCompleted(false);
    setIsSkipped(false);
    setIsContinuing(false);
    // Clear saved grid state
    savedGridBeforeStarterStep.current = null;
    // Save new active state
    saveTutorialActive(true);
  }, [clearGrid]);

  const startTutorial = useCallback(() => {
    setShowPrompt(false);
    clearTutorialState();
    clearGrid();
    setCurrentStep(0);
    setIsActive(true);
    setIsCompleted(false);
    setIsSkipped(false);
    setIsContinuing(false);
    saveTutorialActive(true);
  }, [clearGrid]);

  const dismissPrompt = useCallback(() => {
    setShowPrompt(false);
    saveTutorialSkipped(true);
    setIsSkipped(true);
  }, []);

  // Check if a specific cell is required for the current step
  const isCellRequired = useCallback((trackId: string, step: number): boolean => {
    if (!isActive) return false;
    const stepData = TUTORIAL_STEPS[currentStep];
    if (!stepData?.requiredCells) return false;

    return stepData.requiredCells.some(
      cell => cell.trackId === trackId && cell.step === step
    );
  }, [isActive, currentStep]);

  // Handle cell toggle - trigger sound on correct cell click (only when not playing)
  const onCellToggle = useCallback((trackId: string, step: number, isNowActive: boolean) => {
    if (!isActive) return;

    // Don't trigger individual sounds during interactive steps - the playing beat handles it
    if (isPlaying) return;

    // Play sound when activating a required cell (fallback if not playing)
    if (isNowActive && isCellRequired(trackId, step)) {
      triggerSound(trackId as TrackId);
    }
  }, [isActive, isPlaying, isCellRequired, triggerSound]);

  const currentStepData = isActive && currentStep < TUTORIAL_STEPS.length
    ? TUTORIAL_STEPS[currentStep]
    : null;

  const isSaveStep = isActive && currentStep === SAVE_STEP_INDEX;

  const value: TutorialContextValue = {
    currentStep,
    isActive,
    isCompleted,
    isSkipped,
    isContinuing,
    showPrompt,
    currentStepData,
    totalSteps: TUTORIAL_STEPS.length,
    nextStep,
    previousStep,
    skipTutorial,
    resetTutorial,
    startTutorial,
    dismissPrompt,
    isCellRequired,
    onCellToggle,
    isInteractiveStep,
    isStepComplete,
    isSaveStep,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial(): TutorialContextValue {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
}
