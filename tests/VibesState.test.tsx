import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { DrumMachineProvider, useDrumMachine } from '../src/context/DrumMachineContext';
import { AuthProvider } from '../src/auth/AuthContext';

// Helper component to read context values
function VibesReader() {
  const { reverb, warmth, lofi, vibesOpen, reverbMode, setReverb, setWarmth, setLofi, setVibesOpen, setReverbMode } = useDrumMachine();
  return (
    <div>
      <span data-testid="reverb">{reverb}</span>
      <span data-testid="warmth">{warmth}</span>
      <span data-testid="lofi">{lofi}</span>
      <span data-testid="vibesOpen">{String(vibesOpen)}</span>
      <span data-testid="reverbMode">{reverbMode}</span>
      <button data-testid="setReverb50" onClick={() => setReverb(50)}>Set Reverb 50</button>
      <button data-testid="setWarmth75" onClick={() => setWarmth(75)}>Set Warmth 75</button>
      <button data-testid="setLofi100" onClick={() => setLofi(100)}>Set Lo-fi 100</button>
      <button data-testid="toggleOpen" onClick={() => setVibesOpen(true)}>Open</button>
      <button data-testid="setReverbNeg" onClick={() => setReverb(-10)}>Set Reverb -10</button>
      <button data-testid="setReverb150" onClick={() => setReverb(150)}>Set Reverb 150</button>
      <button data-testid="setModeHall" onClick={() => setReverbMode('hall')}>Set Hall</button>
      <button data-testid="setModeRoom" onClick={() => setReverbMode('room')}>Set Room</button>
    </div>
  );
}

function renderWithProviders() {
  return render(
    <AuthProvider>
      <DrumMachineProvider>
        <VibesReader />
      </DrumMachineProvider>
    </AuthProvider>
  );
}

describe('Vibes state management', () => {
  it('has correct initial values', () => {
    renderWithProviders();
    expect(screen.getByTestId('reverb').textContent).toBe('0');
    expect(screen.getByTestId('warmth').textContent).toBe('0');
    expect(screen.getByTestId('lofi').textContent).toBe('0');
    expect(screen.getByTestId('vibesOpen').textContent).toBe('false');
  });

  it('SET_REVERB updates reverb value', () => {
    renderWithProviders();
    act(() => { screen.getByTestId('setReverb50').click(); });
    expect(screen.getByTestId('reverb').textContent).toBe('50');
  });

  it('SET_WARMTH updates warmth value', () => {
    renderWithProviders();
    act(() => { screen.getByTestId('setWarmth75').click(); });
    expect(screen.getByTestId('warmth').textContent).toBe('75');
  });

  it('SET_LOFI updates lofi value', () => {
    renderWithProviders();
    act(() => { screen.getByTestId('setLofi100').click(); });
    expect(screen.getByTestId('lofi').textContent).toBe('100');
  });

  it('SET_VIBES_OPEN toggles panel open state', () => {
    renderWithProviders();
    act(() => { screen.getByTestId('toggleOpen').click(); });
    expect(screen.getByTestId('vibesOpen').textContent).toBe('true');
  });

  it('clamps values below 0', () => {
    renderWithProviders();
    act(() => { screen.getByTestId('setReverbNeg').click(); });
    expect(screen.getByTestId('reverb').textContent).toBe('0');
  });

  it('clamps values above 100', () => {
    renderWithProviders();
    act(() => { screen.getByTestId('setReverb150').click(); });
    expect(screen.getByTestId('reverb').textContent).toBe('100');
  });

  it('initial reverbMode is room', () => {
    renderWithProviders();
    expect(screen.getByTestId('reverbMode').textContent).toBe('room');
  });

  it('SET_REVERB_MODE updates to hall', () => {
    renderWithProviders();
    act(() => { screen.getByTestId('setModeHall').click(); });
    expect(screen.getByTestId('reverbMode').textContent).toBe('hall');
  });

  it('SET_REVERB_MODE updates back to room', () => {
    renderWithProviders();
    act(() => { screen.getByTestId('setModeHall').click(); });
    act(() => { screen.getByTestId('setModeRoom').click(); });
    expect(screen.getByTestId('reverbMode').textContent).toBe('room');
  });
});
