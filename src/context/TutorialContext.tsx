import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
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
import { useAuth } from '../auth/AuthContext';
import { DEFAULT_TEMPO } from '../constants';
import type { TrackId, GridState } from '../types';

// Fire celebratory confetti with music-themed icons and colors
function fireConfetti() {
  const musicColors = ['#c4b0e0', '#e0b0c8', '#e0c8a8', '#98d0b0', '#d8c8f0'];

  // Create music emoji shapes (with fallback for test environments)
  const musicEmojis = ['🎵', '🎶', '🎸', '🥁', '🎹', '🎤'];
  let emojiShapes: ReturnType<typeof confetti.shapeFromText>[] | undefined;
  try {
    if (typeof confetti.shapeFromText === 'function') {
      emojiShapes = musicEmojis.map(emoji => confetti.shapeFromText({ text: emoji, scalar: 2 }));
    }
  } catch {
    // shapeFromText may not work in test environments without canvas
  }

  // Fire regular confetti from both sides
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: 0.1, y: 0.6 },
    colors: musicColors,
  });
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: 0.9, y: 0.6 },
    colors: musicColors,
  });

  // Fire music emoji confetti (if shapes were created successfully)
  if (emojiShapes) {
    confetti({
      particleCount: 30,
      spread: 100,
      origin: { y: 0.6 },
      shapes: emojiShapes,
      scalar: 2,
    });
  }

  // Second burst with different timing for dynamic effect
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: musicColors,
    });
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: musicColors,
    });
    // More emoji confetti (if shapes were created successfully)
    if (emojiShapes) {
      confetti({
        particleCount: 20,
        spread: 80,
        origin: { y: 0.7 },
        shapes: emojiShapes,
        scalar: 2,
      });
    }
  }, 250);
}

// Step indices for special behavior
const LAST_INTERACTIVE_STEP_INDEX = 4;
const PLAY_STEP_INDEX = 5;
const PREVIEW_STEP_INDEX = 6;
const MUTE_STEP_INDEX = 7;
const BPM_STEP_INDEX = 8;
const SWING_STEP_INDEX = 9;
const STARTER_BEAT_STEP_INDEX = 10;
const SAVE_STEP_INDEX = 11;
const SIGNUP_STEP_INDEX = 12;
const SHARE_STEP_INDEX = 13;

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
    content: 'Groovey! Click any track name to hear a preview',
    position: 'right',
  },
  {
    target: '.grid-row[data-track="kick"] .mute-button',
    content: 'Mute tracks during playback',
    position: 'right',
  },
  {
    target: '.tempo-control',
    content: 'Speed up or slow down with the tempo knob. Double-click to reset.',
    position: 'bottom',
  },
  {
    target: '.swing-knob-wrapper',
    content: 'Use this knob to add swing feel.',
    position: 'top',
  },
  {
    target: '.starter-beat-button',
    content: 'Load simple patterns to help get started',
    position: 'bottom',
  },
  {
    target: '.save-button',
    content: 'Click Save Current to save your beat',
    position: 'left',
  },
  {
    target: '.user-menu-signin-button',
    content: 'Sign up to save your beats, unlock sharing mode, and earn upvotes from friends',
    position: 'left',
  },
  {
    target: '.pattern-item:first-child .share-button',
    content: 'Share your beats with friends and earn their upvotes.',
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
  onTrackPreview: () => void;
  onPatternSaved: () => void;
  onAuthComplete: () => void;
  onMuteToggle: () => void;
  onTempoReset: () => void;
  onSwingReset: () => void;
  isInteractiveStep: boolean;
  isStepComplete: boolean;
  isSaveStep: boolean;
  isSignupStep: boolean;
  isShareStep: boolean;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

const AUTO_START_DELAY = 1500;

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isMainRoute = location.pathname === '/';
  const { grid, clearGrid, triggerSound, setTempo, setGrid, play, stop, isPlaying } = useDrumMachine();
  const { user } = useAuth();

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

  // Auto-skip signup step if user is already logged in (handles resume scenario)
  useEffect(() => {
    if (!isActive) return;
    if (currentStep !== SIGNUP_STEP_INDEX) return;
    if (!user) return;

    // User is logged in at signup step - skip to share step
    setCurrentStep(SHARE_STEP_INDEX);
    saveTutorialStep(SHARE_STEP_INDEX);
  }, [isActive, currentStep, user]);

  // Auto-advance play step when user starts playing
  useEffect(() => {
    if (!isActive) return;
    if (currentStep !== PLAY_STEP_INDEX) return;
    if (!isPlaying) return;

    // User started playing - advance after brief delay
    const timer = setTimeout(() => {
      setCurrentStep(currentStep + 1);
      saveTutorialStep(currentStep + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [isActive, currentStep, isPlaying]);

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
          fireConfetti();
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

    // Reset tempo to default when leaving BPM step
    if (currentStep === BPM_STEP_INDEX) {
      setTempo(DEFAULT_TEMPO);
    }

    // Save grid when ENTERING starter beat step (leaving swing step)
    if (currentStep === SWING_STEP_INDEX) {
      savedGridBeforeStarterStep.current = deepCopyGrid(grid);
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
      fireConfetti();
    } else {
      let newStep = currentStep + 1;
      // Auto-skip signup step if user is already logged in
      if (newStep === SIGNUP_STEP_INDEX && user) {
        newStep = SHARE_STEP_INDEX;
      }
      setCurrentStep(newStep);
      saveTutorialStep(newStep);
    }
  }, [currentStep, isInteractiveStep, checkInteractiveStepComplete, grid, setTempo, setGrid, user]);

  const previousStep = useCallback(() => {
    setIsContinuing(false);
    // Prevent auto-advance when navigating backward to completed interactive steps
    skipAutoAdvance.current = true;

    // Restore grid when leaving starter beat step backward
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

  // Handle track preview click - auto-advance on preview step
  const onTrackPreview = useCallback(() => {
    if (!isActive) return;
    if (currentStep !== PREVIEW_STEP_INDEX) return;

    // User previewed a track - advance after brief delay
    setTimeout(() => {
      setCurrentStep(currentStep + 1);
      saveTutorialStep(currentStep + 1);
    }, 500);
  }, [isActive, currentStep]);

  // Handle pattern saved - auto-advance on save step
  // If user is logged in, skip signup step and go to share step
  const onPatternSaved = useCallback(() => {
    if (!isActive) return;
    if (currentStep !== SAVE_STEP_INDEX) return;

    // User saved a pattern - advance after brief delay
    setTimeout(() => {
      // If user is logged in, skip signup step (11) and go to share step (12)
      const nextStepIndex = user ? SHARE_STEP_INDEX : currentStep + 1;
      setCurrentStep(nextStepIndex);
      saveTutorialStep(nextStepIndex);
    }, 300);
  }, [isActive, currentStep, user]);

  // Handle auth complete - called when user signs up during signup step
  const onAuthComplete = useCallback(() => {
    if (!isActive) return;
    if (currentStep !== SIGNUP_STEP_INDEX) return;

    // User completed signup - advance to share step
    setTimeout(() => {
      setCurrentStep(SHARE_STEP_INDEX);
      saveTutorialStep(SHARE_STEP_INDEX);
    }, 300);
  }, [isActive, currentStep]);

  // Handle mute toggle - auto-advance on mute step
  const onMuteToggle = useCallback(() => {
    if (!isActive) return;
    if (currentStep !== MUTE_STEP_INDEX) return;

    // User toggled mute - advance after brief delay
    setTimeout(() => {
      setCurrentStep(currentStep + 1);
      saveTutorialStep(currentStep + 1);
    }, 300);
  }, [isActive, currentStep]);

  // Handle tempo reset - auto-advance on tempo step
  const onTempoReset = useCallback(() => {
    if (!isActive) return;
    if (currentStep !== BPM_STEP_INDEX) return;

    // User reset tempo - advance after brief delay
    setTimeout(() => {
      setCurrentStep(currentStep + 1);
      saveTutorialStep(currentStep + 1);
    }, 300);
  }, [isActive, currentStep]);

  // Handle swing reset - auto-advance on swing step
  const onSwingReset = useCallback(() => {
    if (!isActive) return;
    if (currentStep !== SWING_STEP_INDEX) return;

    // User reset swing - advance after brief delay
    setTimeout(() => {
      setCurrentStep(currentStep + 1);
      saveTutorialStep(currentStep + 1);
    }, 300);
  }, [isActive, currentStep]);

  const currentStepData = isActive && currentStep < TUTORIAL_STEPS.length
    ? TUTORIAL_STEPS[currentStep]
    : null;

  const isSaveStep = isActive && currentStep === SAVE_STEP_INDEX;
  const isSignupStep = isActive && currentStep === SIGNUP_STEP_INDEX && !user;
  const isShareStep = isActive && currentStep === SHARE_STEP_INDEX;

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
    onTrackPreview,
    onPatternSaved,
    onAuthComplete,
    onMuteToggle,
    onTempoReset,
    onSwingReset,
    isInteractiveStep,
    isStepComplete,
    isSaveStep,
    isSignupStep,
    isShareStep,
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
