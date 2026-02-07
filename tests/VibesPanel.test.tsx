import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { DrumMachineProvider } from '../src/context/DrumMachineContext';
import { AuthProvider } from '../src/auth/AuthContext';
import { VibesPanel } from '../src/components/VibesPanel';

function renderWithProviders() {
  return render(
    <AuthProvider>
      <DrumMachineProvider>
        <VibesPanel />
      </DrumMachineProvider>
    </AuthProvider>
  );
}

describe('VibesPanel', () => {
  it('renders the VIBES door button', () => {
    renderWithProviders();
    expect(screen.getByText('VIBES')).toBeInTheDocument();
  });

  it('door is closed by default — knobs not visible', () => {
    renderWithProviders();
    const knobsContainer = screen.getByTestId('vibes-knobs');
    expect(knobsContainer.getAttribute('aria-hidden')).toBe('true');
  });

  it('clicking door opens — 3 knobs become visible', () => {
    renderWithProviders();
    const door = screen.getByRole('button', { name: /vibes/i });
    act(() => { door.click(); });
    const knobsContainer = screen.getByTestId('vibes-knobs');
    expect(knobsContainer.getAttribute('aria-hidden')).toBe('false');
    expect(screen.getByLabelText('Reverb')).toBeInTheDocument();
    expect(screen.getByLabelText('Warmth')).toBeInTheDocument();
    expect(screen.getByLabelText('Lo-fi')).toBeInTheDocument();
  });

  it('clicking again closes the panel', () => {
    vi.useFakeTimers();
    renderWithProviders();
    const door = screen.getByRole('button', { name: /vibes/i });
    act(() => { door.click(); });
    // Advance past the 750ms toggle debounce lock
    act(() => { vi.advanceTimersByTime(800); });
    act(() => { door.click(); });
    const knobsContainer = screen.getByTestId('vibes-knobs');
    expect(knobsContainer.getAttribute('aria-hidden')).toBe('true');
    vi.useRealTimers();
  });

  it('has correct aria-expanded on door button', () => {
    renderWithProviders();
    const door = screen.getByRole('button', { name: /vibes/i });
    expect(door.getAttribute('aria-expanded')).toBe('false');
    act(() => { door.click(); });
    expect(door.getAttribute('aria-expanded')).toBe('true');
  });

  it('knobs start at value 0', () => {
    renderWithProviders();
    const door = screen.getByRole('button', { name: /vibes/i });
    act(() => { door.click(); });
    const sliders = screen.getAllByRole('slider');
    for (const slider of sliders) {
      expect(slider.getAttribute('aria-valuenow')).toBe('0');
    }
  });
});
