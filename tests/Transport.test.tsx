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

  it('renders tempo knob', () => {
    renderTransport();
    expect(screen.getByRole('slider', { name: /tempo/i })).toBeInTheDocument();
  });

  it('renders volume slider with correct attributes', () => {
    renderTransport();
    const volumeSlider = document.querySelector('.volume-slider') as HTMLInputElement;
    expect(volumeSlider).toBeInTheDocument();
    expect(volumeSlider.type).toBe('range');
  });
});

describe('Tempo Knob', () => {
  beforeEach(() => localStorage.clear());

  it('displays initial tempo value', () => {
    renderTransport();
    // Default tempo is 120
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  it('resets tempo to 120 on double-click of knob wrapper', async () => {
    renderTransport();

    // Change tempo via keyboard
    const tempoKnob = screen.getByRole('slider', { name: /tempo/i });
    fireEvent.keyDown(tempoKnob, { key: 'PageUp' }); // +10
    fireEvent.keyDown(tempoKnob, { key: 'PageUp' }); // +10
    fireEvent.keyDown(tempoKnob, { key: 'PageUp' }); // +10

    // Verify tempo changed
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    // Double-click tempo knob wrapper
    const tempoWrapper = document.querySelector('.tempo-knob-wrapper');
    fireEvent.doubleClick(tempoWrapper!);

    // Tempo should reset to 120
    await waitFor(() => {
      expect(screen.getByText('120')).toBeInTheDocument();
    });
  });

  it('does not reset tempo on double-click of play button', async () => {
    renderTransport();

    // Change tempo via keyboard
    const tempoKnob = screen.getByRole('slider', { name: /tempo/i });
    fireEvent.keyDown(tempoKnob, { key: 'PageUp' }); // +10
    fireEvent.keyDown(tempoKnob, { key: 'PageUp' }); // +10
    fireEvent.keyDown(tempoKnob, { key: 'PageUp' }); // +10

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    // Double-click play button
    const playButton = screen.getByRole('button', { name: /play|stop/i });
    fireEvent.doubleClick(playButton);

    // Tempo should NOT reset
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });

  it('responds to keyboard controls', async () => {
    renderTransport();
    const tempoKnob = screen.getByRole('slider', { name: /tempo/i });

    // ArrowUp increases by 1
    fireEvent.keyDown(tempoKnob, { key: 'ArrowUp' });
    await waitFor(() => {
      expect(screen.getByText('121')).toBeInTheDocument();
    });

    // ArrowDown decreases by 1
    fireEvent.keyDown(tempoKnob, { key: 'ArrowDown' });
    await waitFor(() => {
      expect(screen.getByText('120')).toBeInTheDocument();
    });
  });
});

describe('Volume Control', () => {
  beforeEach(() => localStorage.clear());

  it('resets volume to 80% on double-click of volume control', async () => {
    renderTransport();

    // Get volume slider and change it
    const volumeSlider = document.querySelector('.volume-slider') as HTMLInputElement;
    fireEvent.change(volumeSlider, { target: { value: '0.5' } });

    // Verify volume changed
    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    // Double-click volume control wrapper
    const volumeControl = document.querySelector('.volume-control');
    fireEvent.doubleClick(volumeControl!);

    // Volume should reset to 80%
    await waitFor(() => {
      expect(screen.getByText('80%')).toBeInTheDocument();
    });
  });
});

describe('Swing Control', () => {
  beforeEach(() => localStorage.clear());

  it('renders swing knob', () => {
    renderTransport();
    expect(screen.getByRole('slider', { name: /swing/i })).toBeInTheDocument();
  });

  it('renders all four swing preset buttons', () => {
    renderTransport();
    expect(screen.getByRole('button', { name: 'Str' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Light' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trip' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Heavy' })).toBeInTheDocument();
  });

  it('clicking Str button sets swing to 0', async () => {
    renderTransport();
    const swingKnob = screen.getByRole('slider', { name: /swing/i });

    fireEvent.click(screen.getByRole('button', { name: 'Str' }));

    await waitFor(() => {
      expect(swingKnob).toHaveAttribute('aria-valuenow', '0');
    });
  });

  it('clicking Trip button sets swing to 66', async () => {
    renderTransport();
    const swingKnob = screen.getByRole('slider', { name: /swing/i });

    fireEvent.click(screen.getByRole('button', { name: 'Trip' }));

    await waitFor(() => {
      expect(swingKnob).toHaveAttribute('aria-valuenow', '66');
    });
  });

  it('updates swing value via keyboard', async () => {
    renderTransport();
    const swingKnob = screen.getByRole('slider', { name: /swing/i });

    // PageUp increases by 10
    fireEvent.keyDown(swingKnob, { key: 'PageUp' });

    await waitFor(() => {
      expect(swingKnob).toHaveAttribute('aria-valuenow', '10');
    });
  });
});
