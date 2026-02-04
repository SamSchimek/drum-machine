import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TutorialPrompt } from '../../src/components/Tutorial/TutorialPrompt';
import { TutorialProvider } from '../../src/context/TutorialContext';
import { DrumMachineProvider } from '../../src/context/DrumMachineContext';
import { AuthProvider } from '../../src/auth/AuthContext';
import { loadTutorialSkipped } from '../../src/context/tutorialPersistence';

// Helper to render with all required providers
function renderWithProviders(ui: React.ReactElement, initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <DrumMachineProvider>
          <TutorialProvider>
            {ui}
          </TutorialProvider>
        </DrumMachineProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('TutorialPrompt', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders after delay on main route', () => {
    renderWithProviders(<TutorialPrompt />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Welcome to 808 Drum Machine')).toBeInTheDocument();
  });

  it('dismisses on Escape key', () => {
    renderWithProviders(<TutorialPrompt />);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('dismisses on backdrop click and sets skipped', () => {
    renderWithProviders(<TutorialPrompt />);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    fireEvent.click(document.querySelector('.tutorial-prompt-backdrop')!);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(loadTutorialSkipped()).toBe(true);
  });

  it('does not dismiss when clicking dialog content', () => {
    renderWithProviders(<TutorialPrompt />);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    fireEvent.click(document.querySelector('.tutorial-prompt')!);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('focuses start button on open', () => {
    renderWithProviders(<TutorialPrompt />);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(document.activeElement).toBe(screen.getByText('Take the tour'));
  });

  it('handles double dismiss gracefully', () => {
    renderWithProviders(<TutorialPrompt />);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    fireEvent.click(screen.getByText('No thanks'));
    // Second dismiss should not throw
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has correct aria attributes', () => {
    renderWithProviders(<TutorialPrompt />);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'tutorial-prompt-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'tutorial-prompt-description');
  });

  it('does not render when showPrompt is false', () => {
    renderWithProviders(<TutorialPrompt />);

    // Before the delay
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Welcome to 808 Drum Machine')).not.toBeInTheDocument();
  });
});
