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

export interface TutorialStep {
  target: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    target: '[data-testid="cell-kick-0"]',
    content: 'Click cells to add drum hits',
    position: 'bottom',
  },
  {
    target: '.play-button',
    content: 'Press Space or click to start playback',
    position: 'right',
  },
  {
    target: '.grid-row:first-child .track-label',
    content: 'Click any track name to hear a preview',
    position: 'right',
  },
  {
    target: '.grid-row:first-child .mute-button',
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
    content: 'Save your pattern for later',
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
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

const AUTO_START_DELAY = 1500;

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isMainRoute = location.pathname === '/';

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

  const nextStep = useCallback(() => {
    setIsContinuing(false);

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
  }, [currentStep]);

  const previousStep = useCallback(() => {
    setIsContinuing(false);

    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      saveTutorialStep(newStep);
    }
  }, [currentStep]);

  const skipTutorial = useCallback(() => {
    setIsActive(false);
    setIsSkipped(true);
    saveTutorialActive(false);
    saveTutorialSkipped(true);
  }, []);

  const resetTutorial = useCallback(() => {
    clearTutorialState();
    setCurrentStep(0);
    setIsActive(true);
    setIsCompleted(false);
    setIsSkipped(false);
    setIsContinuing(false);
    // Save new active state
    saveTutorialActive(true);
  }, []);

  const startTutorial = useCallback(() => {
    setShowPrompt(false);
    clearTutorialState();
    setCurrentStep(0);
    setIsActive(true);
    setIsCompleted(false);
    setIsSkipped(false);
    setIsContinuing(false);
    saveTutorialActive(true);
  }, []);

  const dismissPrompt = useCallback(() => {
    setShowPrompt(false);
    saveTutorialSkipped(true);
    setIsSkipped(true);
  }, []);

  const currentStepData = isActive && currentStep < TUTORIAL_STEPS.length
    ? TUTORIAL_STEPS[currentStep]
    : null;

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
