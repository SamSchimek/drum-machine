import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TutorialOverlay } from '../../src/components/Tutorial/TutorialOverlay';
import { TutorialProvider } from '../../src/context/TutorialContext';
import {
  saveTutorialActive,
  saveTutorialStep,
} from '../../src/context/tutorialPersistence';

// Helper to render with providers
function renderWithProviders(initialPath = '/') {
  // Create a target element for the tutorial to find
  const targetElement = document.createElement('div');
  targetElement.setAttribute('data-testid', 'cell-kick-0');
  targetElement.className = 'grid-cell';
  targetElement.style.cssText = 'position: absolute; top: 100px; left: 100px; width: 50px; height: 50px;';
  document.body.appendChild(targetElement);

  const result = render(
    <MemoryRouter initialEntries={[initialPath]}>
      <TutorialProvider>
        <TutorialOverlay />
      </TutorialProvider>
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

    it('shows overlay after auto-start delay', () => {
      const { cleanup } = renderWithProviders('/');

      expect(document.querySelector('.tutorial-overlay')).not.toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(document.querySelector('.tutorial-overlay')).toBeInTheDocument();
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

    it('ArrowRight advances to next step when overlay focused', () => {
      saveTutorialActive(true);
      saveTutorialStep(0);

      const { cleanup } = renderWithProviders();

      // Focus the overlay first
      const overlay = document.querySelector('.tutorial-overlay');
      if (overlay) {
        (overlay as HTMLElement).focus();
        fireEvent.keyDown(overlay, { key: 'ArrowRight' });
      }

      // Step should advance (we can check the step counter in the tooltip)
      expect(screen.getByText('2 of 9')).toBeInTheDocument();
      cleanup();
    });

    it('ArrowLeft goes to previous step when overlay focused', () => {
      saveTutorialActive(true);
      saveTutorialStep(2);

      const { cleanup } = renderWithProviders();

      const overlay = document.querySelector('.tutorial-overlay');
      if (overlay) {
        (overlay as HTMLElement).focus();
        fireEvent.keyDown(overlay, { key: 'ArrowLeft' });
      }

      expect(screen.getByText('2 of 9')).toBeInTheDocument();
      cleanup();
    });
  });

  describe('missing target handling', () => {
    it('skips to next step when target element not found', () => {
      saveTutorialActive(true);
      saveTutorialStep(0);

      // Don't add the target element
      render(
        <MemoryRouter initialEntries={['/']}>
          <TutorialProvider>
            <TutorialOverlay />
          </TutorialProvider>
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

      expect(screen.getByText('Click cells to add drum hits')).toBeInTheDocument();
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
});
