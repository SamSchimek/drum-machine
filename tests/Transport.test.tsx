import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/auth/AuthContext';
import { DrumMachineProvider } from '../src/context/DrumMachineContext';
import { TutorialProvider } from '../src/context/TutorialContext';
import { Transport } from '../src/components/Transport';

function renderTransport() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <DrumMachineProvider>
          <TutorialProvider>
            <Transport />
          </TutorialProvider>
        </DrumMachineProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Transport Controls', () => {
  beforeEach(() => localStorage.clear());

  it('renders tempo and volume controls', () => {
    renderTransport();
    const tempoControl = document.querySelector('.tempo-control');
    const volumeControl = document.querySelector('.volume-control');
    expect(tempoControl).toBeInTheDocument();
    expect(volumeControl).toBeInTheDocument();
  });

  it('renders tempo slider with correct attributes', () => {
    renderTransport();
    const tempoSlider = document.querySelector('.tempo-slider') as HTMLInputElement;
    expect(tempoSlider).toBeInTheDocument();
    expect(tempoSlider.type).toBe('range');
  });

  it('renders volume slider with correct attributes', () => {
    renderTransport();
    const volumeSlider = document.querySelector('.volume-slider') as HTMLInputElement;
    expect(volumeSlider).toBeInTheDocument();
    expect(volumeSlider.type).toBe('range');
  });
});

describe('Play Button', () => {
  beforeEach(() => localStorage.clear());

  it('resets tempo to 120 on double-click', async () => {
    renderTransport();

    // Change tempo via slider
    const tempoSlider = document.querySelector('.tempo-slider') as HTMLInputElement;
    fireEvent.change(tempoSlider, { target: { value: '150' } });

    // Verify tempo changed
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    // Double-click play button
    const playButton = screen.getByRole('button', { name: /play|stop/i });
    fireEvent.doubleClick(playButton);

    // Tempo should reset to 120
    await waitFor(() => {
      expect(screen.getByText('120')).toBeInTheDocument();
    });
  });
});

describe('Swing Control', () => {
  beforeEach(() => localStorage.clear());

  it('renders swing slider', () => {
    renderTransport();
    expect(screen.getByRole('slider', { name: /swing/i })).toBeInTheDocument();
  });

  it('displays swing value as percentage', () => {
    renderTransport();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('updates swing value when slider changes', async () => {
    renderTransport();
    const swingSlider = screen.getByRole('slider', { name: /swing/i }) as HTMLInputElement;

    fireEvent.change(swingSlider, { target: { value: '50' } });

    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });
});
