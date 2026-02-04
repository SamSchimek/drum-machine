import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/auth/AuthContext';
import { DrumMachineProvider } from '../src/context/DrumMachineContext';
import { TutorialProvider } from '../src/context/TutorialContext';
import { Grid } from '../src/components/Grid';

function renderGrid() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <DrumMachineProvider>
          <TutorialProvider>
            <Grid />
          </TutorialProvider>
        </DrumMachineProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Grid', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the grid with all tracks', () => {
    renderGrid();
    expect(screen.getByText('Kick')).toBeInTheDocument();
    expect(screen.getByText('Snare')).toBeInTheDocument();
    expect(screen.getByText('Cl. HH')).toBeInTheDocument();
    expect(screen.getByText('Op. HH')).toBeInTheDocument();
  });

  it('toggles cell on click', () => {
    renderGrid();
    const cell = screen.getByTestId('cell-kick-0');

    expect(cell).not.toHaveClass('active');
    fireEvent.click(cell);
    expect(cell).toHaveClass('active');
    fireEvent.click(cell);
    expect(cell).not.toHaveClass('active');
  });

  it('renders 16 steps per track', () => {
    renderGrid();
    // Check that we have 16 cells for the kick track
    for (let i = 0; i < 16; i++) {
      expect(screen.getByTestId(`cell-kick-${i}`)).toBeInTheDocument();
    }
  });

  it('can toggle multiple cells independently', () => {
    renderGrid();
    const kickCell0 = screen.getByTestId('cell-kick-0');
    const snareCell4 = screen.getByTestId('cell-snare-4');

    fireEvent.click(kickCell0);
    fireEvent.click(snareCell4);

    expect(kickCell0).toHaveClass('active');
    expect(snareCell4).toHaveClass('active');

    fireEvent.click(kickCell0);
    expect(kickCell0).not.toHaveClass('active');
    expect(snareCell4).toHaveClass('active');
  });
});
