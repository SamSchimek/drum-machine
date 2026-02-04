import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TutorialPrompt } from '../../src/components/Tutorial/TutorialPrompt';
import { TutorialProvider } from '../../src/context/TutorialContext';
import { loadTutorialSkipped } from '../../src/context/tutorialPersistence';

describe('TutorialPrompt', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders after delay on main route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TutorialProvider>
          <TutorialPrompt />
        </TutorialProvider>
      </MemoryRouter>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Welcome to 808 Drum Machine')).toBeInTheDocument();
  });

  it('dismisses on Escape key', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TutorialProvider>
          <TutorialPrompt />
        </TutorialProvider>
      </MemoryRouter>
    );

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('dismisses on backdrop click and sets skipped', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TutorialProvider>
          <TutorialPrompt />
        </TutorialProvider>
      </MemoryRouter>
    );

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    fireEvent.click(document.querySelector('.tutorial-prompt-backdrop')!);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(loadTutorialSkipped()).toBe(true);
  });

  it('does not dismiss when clicking dialog content', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TutorialProvider>
          <TutorialPrompt />
        </TutorialProvider>
      </MemoryRouter>
    );

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    fireEvent.click(document.querySelector('.tutorial-prompt')!);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('focuses start button on open', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TutorialProvider>
          <TutorialPrompt />
        </TutorialProvider>
      </MemoryRouter>
    );

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(document.activeElement).toBe(screen.getByText('Take the tour'));
  });

  it('handles double dismiss gracefully', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TutorialProvider>
          <TutorialPrompt />
        </TutorialProvider>
      </MemoryRouter>
    );

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    fireEvent.click(screen.getByText('No thanks'));
    // Second dismiss should not throw
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has correct aria attributes', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TutorialProvider>
          <TutorialPrompt />
        </TutorialProvider>
      </MemoryRouter>
    );

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'tutorial-prompt-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'tutorial-prompt-description');
  });

  it('does not render when showPrompt is false', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TutorialProvider>
          <TutorialPrompt />
        </TutorialProvider>
      </MemoryRouter>
    );

    // Before the delay
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Welcome to 808 Drum Machine')).not.toBeInTheDocument();
  });
});
