import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  TutorialProvider,
  useTutorial,
  TUTORIAL_STEPS,
} from '../../src/context/TutorialContext';
import { DrumMachineProvider } from '../../src/context/DrumMachineContext';
import { AuthProvider } from '../../src/auth/AuthContext';
import {
  saveTutorialCompleted,
  saveTutorialSkipped,
  saveTutorialStep,
  saveTutorialActive,
  loadTutorialStep,
  loadTutorialCompleted,
  loadTutorialSkipped,
} from '../../src/context/tutorialPersistence';

// Test component to access context
function TestConsumer() {
  const ctx = useTutorial();
  return (
    <div>
      <span data-testid="step">{ctx.currentStep}</span>
      <span data-testid="active">{ctx.isActive.toString()}</span>
      <span data-testid="completed">{ctx.isCompleted.toString()}</span>
      <span data-testid="skipped">{ctx.isSkipped.toString()}</span>
      <span data-testid="continuing">{ctx.isContinuing.toString()}</span>
      <span data-testid="showPrompt">{ctx.showPrompt.toString()}</span>
      <span data-testid="isInteractiveStep">{ctx.isInteractiveStep.toString()}</span>
      <span data-testid="isStepComplete">{ctx.isStepComplete.toString()}</span>
      <span data-testid="isCellRequired-kick-0">{ctx.isCellRequired('kick', 0).toString()}</span>
      <span data-testid="isCellRequired-kick-1">{ctx.isCellRequired('kick', 1).toString()}</span>
      <button data-testid="next" onClick={ctx.nextStep}>Next</button>
      <button data-testid="prev" onClick={ctx.previousStep}>Previous</button>
      <button data-testid="skip" onClick={ctx.skipTutorial}>Skip</button>
      <button data-testid="reset" onClick={ctx.resetTutorial}>Reset</button>
      <button data-testid="start" onClick={ctx.startTutorial}>Start</button>
      <button data-testid="dismiss" onClick={ctx.dismissPrompt}>Dismiss</button>
      <button data-testid="onCellToggle-kick-0" onClick={() => ctx.onCellToggle('kick', 0, true)}>Toggle Kick 0</button>
    </div>
  );
}

function renderWithRouter(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <DrumMachineProvider>
          <TutorialProvider>
            <TestConsumer />
          </TutorialProvider>
        </DrumMachineProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('TutorialContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('TUTORIAL_STEPS', () => {
    it('has 13 tutorial steps', () => {
      expect(TUTORIAL_STEPS).toHaveLength(13);
    });

    it('each step has required properties', () => {
      TUTORIAL_STEPS.forEach((step) => {
        expect(step.target).toBeDefined();
        expect(step.content).toBeDefined();
        expect(step.position).toMatch(/^(top|bottom|left|right)$/);
      });
    });

    it('first 5 steps are interactive with requiredCells', () => {
      for (let i = 0; i < 5; i++) {
        expect(TUTORIAL_STEPS[i].requiredCells).toBeDefined();
        expect(TUTORIAL_STEPS[i].requiredCells!.length).toBeGreaterThan(0);
      }
    });

    it('remaining steps are informational (no requiredCells)', () => {
      for (let i = 5; i < TUTORIAL_STEPS.length; i++) {
        expect(TUTORIAL_STEPS[i].requiredCells).toBeUndefined();
      }
    });
  });

  describe('initial state for first-time visitors', () => {
    it('starts inactive initially', () => {
      renderWithRouter();
      expect(screen.getByTestId('active').textContent).toBe('false');
      expect(screen.getByTestId('step').textContent).toBe('0');
    });

    it('is not completed or skipped initially', () => {
      renderWithRouter();
      expect(screen.getByTestId('completed').textContent).toBe('false');
      expect(screen.getByTestId('skipped').textContent).toBe('false');
    });
  });

  describe('prompt behavior', () => {
    it('shows prompt after 1.5s delay on main route', () => {
      renderWithRouter('/');

      expect(screen.getByTestId('showPrompt').textContent).toBe('false');
      expect(screen.getByTestId('active').textContent).toBe('false');

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(screen.getByTestId('showPrompt').textContent).toBe('true');
      expect(screen.getByTestId('active').textContent).toBe('false');
    });

    it('does NOT show prompt on non-main routes', () => {
      renderWithRouter('/p/some-slug');

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByTestId('showPrompt').textContent).toBe('false');
    });

    it('does NOT show prompt if already completed', () => {
      saveTutorialCompleted(true);
      renderWithRouter('/');

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByTestId('showPrompt').textContent).toBe('false');
    });

    it('does NOT show prompt if already skipped', () => {
      saveTutorialSkipped(true);
      renderWithRouter('/');

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByTestId('showPrompt').textContent).toBe('false');
    });

    it('does NOT show prompt when resuming active tutorial', () => {
      saveTutorialActive(true);
      saveTutorialStep(2);
      renderWithRouter('/');

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByTestId('showPrompt').textContent).toBe('false');
      expect(screen.getByTestId('active').textContent).toBe('true');
    });

    it('dismissPrompt sets skipped and hides prompt', () => {
      renderWithRouter('/');

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(screen.getByTestId('showPrompt').textContent).toBe('true');

      act(() => {
        screen.getByTestId('dismiss').click();
      });

      expect(screen.getByTestId('showPrompt').textContent).toBe('false');
      expect(screen.getByTestId('skipped').textContent).toBe('true');
      expect(loadTutorialSkipped()).toBe(true);
    });

    it('startTutorial closes prompt and starts tutorial', () => {
      renderWithRouter('/');

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(screen.getByTestId('showPrompt').textContent).toBe('true');

      act(() => {
        screen.getByTestId('start').click();
      });

      expect(screen.getByTestId('showPrompt').textContent).toBe('false');
      expect(screen.getByTestId('active').textContent).toBe('true');
      expect(screen.getByTestId('step').textContent).toBe('0');
    });
  });

  describe('navigation', () => {
    it('nextStep increments current step (on informational step)', () => {
      // Start at step 5 (first informational step) since interactive steps block navigation
      saveTutorialStep(5);
      saveTutorialActive(true);

      renderWithRouter('/');

      expect(screen.getByTestId('active').textContent).toBe('true');
      expect(screen.getByTestId('step').textContent).toBe('5');

      act(() => {
        screen.getByTestId('next').click();
      });

      expect(screen.getByTestId('step').textContent).toBe('6');
    });

    it('previousStep decrements current step', () => {
      // Start at step 7 (informational step)
      saveTutorialStep(7);
      saveTutorialActive(true);

      renderWithRouter('/');

      expect(screen.getByTestId('active').textContent).toBe('true');
      expect(screen.getByTestId('step').textContent).toBe('7');

      act(() => {
        screen.getByTestId('prev').click();
      });

      expect(screen.getByTestId('step').textContent).toBe('6');
    });

    it('previousStep does not go below 0', () => {
      renderWithRouter('/');

      act(() => {
        screen.getByTestId('start').click();
      });

      expect(screen.getByTestId('active').textContent).toBe('true');

      act(() => {
        screen.getByTestId('prev').click();
        screen.getByTestId('prev').click();
      });

      expect(screen.getByTestId('step').textContent).toBe('0');
    });

    it('nextStep on last step completes tutorial', () => {
      // Start at second-to-last step (step 11, informational)
      saveTutorialStep(TUTORIAL_STEPS.length - 2);
      saveTutorialActive(true);

      renderWithRouter('/');

      expect(screen.getByTestId('active').textContent).toBe('true');
      expect(screen.getByTestId('step').textContent).toBe(String(TUTORIAL_STEPS.length - 2));

      // Go to last step
      act(() => {
        screen.getByTestId('next').click();
      });

      expect(screen.getByTestId('step').textContent).toBe(String(TUTORIAL_STEPS.length - 1));

      // Click next on last step
      act(() => {
        screen.getByTestId('next').click();
      });

      expect(screen.getByTestId('active').textContent).toBe('false');
      expect(screen.getByTestId('completed').textContent).toBe('true');
    });
  });

  describe('skipTutorial', () => {
    it('sets isSkipped and deactivates tutorial', () => {
      renderWithRouter('/');

      act(() => {
        screen.getByTestId('start').click();
      });

      expect(screen.getByTestId('active').textContent).toBe('true');

      act(() => {
        screen.getByTestId('skip').click();
      });

      expect(screen.getByTestId('active').textContent).toBe('false');
      expect(screen.getByTestId('skipped').textContent).toBe('true');
    });

    it('persists skipped state', () => {
      renderWithRouter('/');

      act(() => {
        screen.getByTestId('start').click();
      });

      expect(screen.getByTestId('active').textContent).toBe('true');

      act(() => {
        screen.getByTestId('skip').click();
      });

      expect(loadTutorialSkipped()).toBe(true);
    });
  });

  describe('resetTutorial', () => {
    it('resets all state and starts fresh', () => {
      saveTutorialCompleted(true);
      saveTutorialStep(5);

      renderWithRouter('/');

      expect(screen.getByTestId('completed').textContent).toBe('true');

      act(() => {
        screen.getByTestId('reset').click();
      });

      expect(screen.getByTestId('active').textContent).toBe('true');
      expect(screen.getByTestId('step').textContent).toBe('0');
      expect(screen.getByTestId('completed').textContent).toBe('false');
      expect(screen.getByTestId('skipped').textContent).toBe('false');
    });

    it('clears persisted state', () => {
      saveTutorialCompleted(true);
      saveTutorialSkipped(true);
      saveTutorialStep(3);

      renderWithRouter('/');

      act(() => {
        screen.getByTestId('reset').click();
      });

      expect(loadTutorialCompleted()).toBe(false);
      expect(loadTutorialSkipped()).toBe(false);
      expect(loadTutorialStep()).toBe(0);
    });
  });

  describe('persistence', () => {
    it('persists step on navigation', () => {
      // Start at informational step where navigation works
      saveTutorialStep(5);
      saveTutorialActive(true);

      renderWithRouter('/');

      expect(screen.getByTestId('active').textContent).toBe('true');

      act(() => {
        screen.getByTestId('next').click();
      });
      act(() => {
        screen.getByTestId('next').click();
      });

      expect(loadTutorialStep()).toBe(7);
    });

    it('persists completed state', () => {
      // Start at last step so we can complete the tutorial
      saveTutorialStep(TUTORIAL_STEPS.length - 1);
      saveTutorialActive(true);

      renderWithRouter('/');

      expect(screen.getByTestId('active').textContent).toBe('true');

      // Click next on last step to complete
      act(() => {
        screen.getByTestId('next').click();
      });

      expect(loadTutorialCompleted()).toBe(true);
    });
  });

  describe('resume from saved step', () => {
    it('resumes from saved step with isContinuing flag', () => {
      saveTutorialStep(3);
      saveTutorialActive(true);

      renderWithRouter('/');

      // Should resume immediately since active was saved
      expect(screen.getByTestId('active').textContent).toBe('true');
      expect(screen.getByTestId('step').textContent).toBe('3');
      expect(screen.getByTestId('continuing').textContent).toBe('true');
    });

    it('isContinuing becomes false after first navigation', () => {
      // Start at informational step (step 6) where navigation works
      saveTutorialStep(6);
      saveTutorialActive(true);

      renderWithRouter('/');

      expect(screen.getByTestId('continuing').textContent).toBe('true');

      act(() => {
        screen.getByTestId('next').click();
      });

      expect(screen.getByTestId('continuing').textContent).toBe('false');
    });
  });

  describe('startTutorial', () => {
    it('starts tutorial manually', () => {
      saveTutorialCompleted(true);

      renderWithRouter('/');

      expect(screen.getByTestId('active').textContent).toBe('false');

      act(() => {
        screen.getByTestId('start').click();
      });

      expect(screen.getByTestId('active').textContent).toBe('true');
      expect(screen.getByTestId('step').textContent).toBe('0');
    });
  });

  describe('useTutorial outside provider', () => {
    it('throws error when used outside TutorialProvider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useTutorial must be used within TutorialProvider');

      consoleError.mockRestore();
    });
  });

  describe('interactive steps', () => {
    it('isInteractiveStep is true on first step (kick)', () => {
      renderWithRouter('/');

      act(() => {
        screen.getByTestId('start').click();
      });

      expect(screen.getByTestId('isInteractiveStep').textContent).toBe('true');
      expect(screen.getByTestId('step').textContent).toBe('0');
    });

    it('nextStep is blocked on interactive step', () => {
      renderWithRouter('/');

      act(() => {
        screen.getByTestId('start').click();
      });

      // Step 0 is interactive, should not advance
      act(() => {
        screen.getByTestId('next').click();
      });

      expect(screen.getByTestId('step').textContent).toBe('0');
    });

    it('isInteractiveStep is false on informational step', () => {
      // Start at step 5 (first informational step)
      saveTutorialStep(5);
      saveTutorialActive(true);

      renderWithRouter('/');

      expect(screen.getByTestId('isInteractiveStep').textContent).toBe('false');
    });

    it('nextStep works on informational step', () => {
      // Start at step 5 (first informational step)
      saveTutorialStep(5);
      saveTutorialActive(true);

      renderWithRouter('/');

      act(() => {
        screen.getByTestId('next').click();
      });

      expect(screen.getByTestId('step').textContent).toBe('6');
    });
  });

  describe('isCellRequired', () => {
    it('returns true for required cells on current step', () => {
      renderWithRouter('/');

      act(() => {
        screen.getByTestId('start').click();
      });

      // Step 0 requires kick at steps 0, 6, 10
      expect(screen.getByTestId('isCellRequired-kick-0').textContent).toBe('true');
    });

    it('returns false for non-required cells on current step', () => {
      renderWithRouter('/');

      act(() => {
        screen.getByTestId('start').click();
      });

      // Step 0 requires kick at 0, 6, 10 - but not at 1
      expect(screen.getByTestId('isCellRequired-kick-1').textContent).toBe('false');
    });

    it('returns false when tutorial is not active', () => {
      renderWithRouter('/');

      // Tutorial not started, so nothing is required
      expect(screen.getByTestId('isCellRequired-kick-0').textContent).toBe('false');
    });
  });

  describe('isStepComplete', () => {
    it('returns false when interactive step has unfilled required cells', () => {
      renderWithRouter('/');

      act(() => {
        screen.getByTestId('start').click();
      });

      // Step 0 is interactive and cells are not filled
      expect(screen.getByTestId('isStepComplete').textContent).toBe('false');
    });

    it('returns true on informational step', () => {
      saveTutorialStep(5);
      saveTutorialActive(true);

      renderWithRouter('/');

      // Step 5 is informational, always complete
      expect(screen.getByTestId('isStepComplete').textContent).toBe('true');
    });
  });

  describe('onCellToggle', () => {
    it('does not throw when called', () => {
      renderWithRouter('/');

      act(() => {
        screen.getByTestId('start').click();
      });

      // Should not throw
      expect(() => {
        act(() => {
          screen.getByTestId('onCellToggle-kick-0').click();
        });
      }).not.toThrow();
    });

    it('does nothing when tutorial is not active', () => {
      renderWithRouter('/');

      // Tutorial not started
      expect(() => {
        act(() => {
          screen.getByTestId('onCellToggle-kick-0').click();
        });
      }).not.toThrow();
    });
  });
});
