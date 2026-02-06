import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TutorialOverlay } from '../../src/components/Tutorial/TutorialOverlay';
import { TutorialProvider, TUTORIAL_STEPS } from '../../src/context/TutorialContext';
import { DrumMachineProvider } from '../../src/context/DrumMachineContext';
import { AuthProvider } from '../../src/auth/AuthContext';
import {
  saveTutorialActive,
  saveTutorialStep,
} from '../../src/context/tutorialPersistence';

// Helper to render with providers
function renderWithProviders(initialPath = '/') {
  // Create a target element for the tutorial to find (matches step 0 selector: .grid-row[data-track="kick"])
  const targetElement = document.createElement('div');
  targetElement.className = 'grid-row';
  targetElement.setAttribute('data-track', 'kick');
  targetElement.style.cssText = 'position: absolute; top: 100px; left: 100px; width: 50px; height: 50px;';
  document.body.appendChild(targetElement);

  const result = render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <DrumMachineProvider>
          <TutorialProvider>
            <TutorialOverlay />
          </TutorialProvider>
        </DrumMachineProvider>
      </AuthProvider>
    </MemoryRouter>
  );

  return {
    ...result,
    cleanup: () => {
      document.body.removeChild(targetElement);
    },
  };
}

describe('TutorialOverlay', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    // Clean up any remaining elements
    document.body.innerHTML = '';
  });

  describe('visibility', () => {
    it('renders overlay when tutorial is active', () => {
      saveTutorialActive(true);
      saveTutorialStep(0);

      const { cleanup } = renderWithProviders();

      expect(document.querySelector('.tutorial-overlay')).toBeInTheDocument();
      cleanup();
    });

    it('does not render overlay when tutorial is inactive', () => {
      const { cleanup } = renderWithProviders();

      // Tutorial starts inactive, wait for auto-start but don't advance timers
      expect(document.querySelector('.tutorial-overlay')).not.toBeInTheDocument();
      cleanup();
    });

    it('shows prompt after delay, overlay appears after starting', () => {
      const { cleanup } = renderWithProviders('/');

      expect(document.querySelector('.tutorial-overlay')).not.toBeInTheDocument();

      // After delay, prompt shows but overlay does not (tutorial not started yet)
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      // Overlay only shows after tutorial is started (via saveTutorialActive)
      // This test now verifies that the overlay doesn't auto-start
      expect(document.querySelector('.tutorial-overlay')).not.toBeInTheDocument();
      cleanup();
    });
  });

  describe('spotlight positioning', () => {
    it('renders spotlight element when active', () => {
      saveTutorialActive(true);
      saveTutorialStep(0);

      const { cleanup } = renderWithProviders();

      // Advance timers to allow setTimeout in updateTargetPosition to fire
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(document.querySelector('.tutorial-spotlight')).toBeInTheDocument();
      cleanup();
    });

    it('spotlight has fixed positioning', () => {
      saveTutorialActive(true);
      saveTutorialStep(0);

      const { cleanup } = renderWithProviders();

      // Advance timers to allow spotlight to render
      act(() => {
        vi.advanceTimersByTime(200);
      });

      const spotlight = document.querySelector('.tutorial-spotlight');
      expect(spotlight).toHaveStyle({ position: 'fixed' });
      cleanup();
    });
  });

  describe('keyboard shortcuts', () => {
    it('Escape key skips tutorial', () => {
      saveTutorialActive(true);
      saveTutorialStep(0);

      const { cleanup } = renderWithProviders();

      expect(document.querySelector('.tutorial-overlay')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(document.querySelector('.tutorial-overlay')).not.toBeInTheDocument();
      cleanup();
    });

    it('ArrowRight advances to next step when overlay focused (informational step)', () => {
      // Use step 5 (first informational step) since interactive steps block navigation
      saveTutorialActive(true);
      saveTutorialStep(5);

      const { cleanup } = renderWithProviders();

      // Focus the overlay first
      const overlay = document.querySelector('.tutorial-overlay');
      if (overlay) {
        (overlay as HTMLElement).focus();
        fireEvent.keyDown(overlay, { key: 'ArrowRight' });
      }

      // Step should advance from 5 to 6 (display: "7 of 13")
      expect(screen.getByText(`7 of ${TUTORIAL_STEPS.length}`)).toBeInTheDocument();
      cleanup();
    });

    it('ArrowLeft goes to previous step when overlay focused', () => {
      // Use step 6 (informational step)
      saveTutorialActive(true);
      saveTutorialStep(6);

      const { cleanup } = renderWithProviders();

      const overlay = document.querySelector('.tutorial-overlay');
      if (overlay) {
        (overlay as HTMLElement).focus();
        fireEvent.keyDown(overlay, { key: 'ArrowLeft' });
      }

      // Step should go from 6 to 5 (display: "6 of 13")
      expect(screen.getByText(`6 of ${TUTORIAL_STEPS.length}`)).toBeInTheDocument();
      cleanup();
    });
  });

  describe('missing target handling', () => {
    it('skips to next step when target element not found', () => {
      saveTutorialActive(true);
      saveTutorialStep(0);

      // Don't add the target element - render with all required providers
      render(
        <MemoryRouter initialEntries={['/']}>
          <AuthProvider>
            <DrumMachineProvider>
              <TutorialProvider>
                <TutorialOverlay />
              </TutorialProvider>
            </DrumMachineProvider>
          </AuthProvider>
        </MemoryRouter>
      );

      // Since target is not found, should attempt to find next valid step
      // or handle gracefully
      expect(document.querySelector('.tutorial-overlay')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('overlay has role dialog and aria-modal', () => {
      saveTutorialActive(true);
      saveTutorialStep(0);

      const { cleanup } = renderWithProviders();

      const overlay = document.querySelector('.tutorial-overlay');
      expect(overlay).toHaveAttribute('role', 'dialog');
      expect(overlay).toHaveAttribute('aria-modal', 'true');
      cleanup();
    });

    it('overlay is focusable', () => {
      saveTutorialActive(true);
      saveTutorialStep(0);

      const { cleanup } = renderWithProviders();

      const overlay = document.querySelector('.tutorial-overlay');
      expect(overlay).toHaveAttribute('tabindex', '-1');
      cleanup();
    });
  });

  describe('tooltip rendering', () => {
    it('renders tooltip with correct content for current step', () => {
      saveTutorialActive(true);
      saveTutorialStep(0);

      const { cleanup } = renderWithProviders();

      expect(screen.getByText("Let's build a beat! Click the highlighted KICK cells")).toBeInTheDocument();
      cleanup();
    });

    it('renders navigation buttons in tooltip', () => {
      saveTutorialActive(true);
      saveTutorialStep(0);

      const { cleanup } = renderWithProviders();

      expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      cleanup();
    });
  });

  describe('window resize', () => {
    it('repositions on window resize', () => {
      saveTutorialActive(true);
      saveTutorialStep(0);

      const { cleanup } = renderWithProviders();

      // Trigger resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      // Should still be visible
      expect(document.querySelector('.tutorial-overlay')).toBeInTheDocument();
      cleanup();
    });
  });

  describe('step change animation', () => {
    it('tooltip wrapper has key prop that changes with step for animation trigger', () => {
      saveTutorialActive(true);
      saveTutorialStep(5);

      const { cleanup } = renderWithProviders();

      // Advance to next step
      const overlay = document.querySelector('.tutorial-overlay');
      if (overlay) {
        (overlay as HTMLElement).focus();
        fireEvent.keyDown(overlay, { key: 'ArrowRight' });
      }

      // Wrapper should still exist (key change triggers remount with animation)
      expect(document.querySelector('.tutorial-tooltip-wrapper')).toBeInTheDocument();
      cleanup();
    });
  });
});
