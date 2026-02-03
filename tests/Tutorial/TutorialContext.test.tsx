import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  TutorialProvider,
  useTutorial,
  TUTORIAL_STEPS,
} from '../../src/context/TutorialContext';
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
      <button data-testid="next" onClick={ctx.nextStep}>Next</button>
      <button data-testid="prev" onClick={ctx.previousStep}>Previous</button>
      <button data-testid="skip" onClick={ctx.skipTutorial}>Skip</button>
      <button data-testid="reset" onClick={ctx.resetTutorial}>Reset</button>
      <button data-testid="start" onClick={ctx.startTutorial}>Start</button>
    </div>
  );
}

function renderWithRouter(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <TutorialProvider>
        <TestConsumer />
      </TutorialProvider>
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
    it('has 9 tutorial steps', () => {
      expect(TUTORIAL_STEPS).toHaveLength(9);
    });

    it('each step has required properties', () => {
      TUTORIAL_STEPS.forEach((step) => {
        expect(step.target).toBeDefined();
        expect(step.content).toBeDefined();
        expect(step.position).toMatch(/^(top|bottom|left|right)$/);
      });
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

  describe('auto-start behavior', () => {
    it('auto-starts after 1.5s delay on main route', () => {
      renderWithRouter('/');

      expect(screen.getByTestId('active').textContent).toBe('false');

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(screen.getByTestId('active').textContent).toBe('true');
    });

    it('does NOT auto-start on non-main routes', () => {
      renderWithRouter('/p/some-slug');

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByTestId('active').textContent).toBe('false');
    });

    it('does NOT auto-start if already completed', () => {
      saveTutorialCompleted(true);
      renderWithRouter('/');

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByTestId('active').textContent).toBe('false');
    });

    it('does NOT auto-start if already skipped', () => {
      saveTutorialSkipped(true);
      renderWithRouter('/');

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByTestId('active').textContent).toBe('false');
    });
  });

  describe('navigation', () => {
    it('nextStep increments current step', () => {
      renderWithRouter('/');

      // Start tutorial
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(screen.getByTestId('active').textContent).toBe('true');
      expect(screen.getByTestId('step').textContent).toBe('0');

      act(() => {
        screen.getByTestId('next').click();
      });

      expect(screen.getByTestId('step').textContent).toBe('1');
    });

    it('previousStep decrements current step', () => {
      renderWithRouter('/');

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(screen.getByTestId('active').textContent).toBe('true');

      // Go to step 2
      act(() => {
        screen.getByTestId('next').click();
      });
      act(() => {
        screen.getByTestId('next').click();
      });

      expect(screen.getByTestId('step').textContent).toBe('2');

      act(() => {
        screen.getByTestId('prev').click();
      });

      expect(screen.getByTestId('step').textContent).toBe('1');
    });

    it('previousStep does not go below 0', () => {
      renderWithRouter('/');

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(screen.getByTestId('active').textContent).toBe('true');

      act(() => {
        screen.getByTestId('prev').click();
        screen.getByTestId('prev').click();
      });

      expect(screen.getByTestId('step').textContent).toBe('0');
    });

    it('nextStep on last step completes tutorial', () => {
      renderWithRouter('/');

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(screen.getByTestId('active').textContent).toBe('true');

      // Go to last step (step 7, index-based)
      for (let i = 0; i < TUTORIAL_STEPS.length - 1; i++) {
        act(() => {
          screen.getByTestId('next').click();
        });
      }

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
        vi.advanceTimersByTime(1500);
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
        vi.advanceTimersByTime(1500);
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
      renderWithRouter('/');

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(screen.getByTestId('active').textContent).toBe('true');

      act(() => {
        screen.getByTestId('next').click();
      });
      act(() => {
        screen.getByTestId('next').click();
      });

      expect(loadTutorialStep()).toBe(2);
    });

    it('persists completed state', () => {
      renderWithRouter('/');

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(screen.getByTestId('active').textContent).toBe('true');

      // Complete tutorial
      for (let i = 0; i < TUTORIAL_STEPS.length; i++) {
        act(() => {
          screen.getByTestId('next').click();
        });
      }

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
      saveTutorialStep(3);
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
});
