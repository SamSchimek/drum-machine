import type { GridState } from '../types';
import { createEmptyGrid } from '../types';

export interface StarterBeat {
  name: string;
  grid: GridState;
}

function createBeatGrid(patterns: Partial<Record<keyof GridState, number[]>>): GridState {
  const grid = createEmptyGrid();
  for (const [track, steps] of Object.entries(patterns)) {
    for (const step of steps) {
      if (step >= 0 && step < 16) {
        grid[track as keyof GridState][step] = true;
      }
    }
  }
  return grid;
}

export const STARTER_BEATS: StarterBeat[] = [
  {
    name: 'Four-on-Floor',
    grid: createBeatGrid({
      kick: [0, 4, 8, 12],
      closedHH: [0, 2, 4, 6, 8, 10, 12, 14],
    }),
  },
  {
    name: 'Basic Rock',
    grid: createBeatGrid({
      kick: [0, 8],
      snare: [4, 12],
      closedHH: [0, 2, 4, 6, 8, 10, 12, 14],
    }),
  },
  {
    name: 'Funk Groove',
    grid: createBeatGrid({
      kick: [0, 5, 8, 13],
      snare: [4, 12],
      closedHH: [0, 2, 4, 8, 10, 12, 14],
      openHH: [6],
    }),
  },
  {
    name: 'Hip-Hop',
    grid: createBeatGrid({
      kick: [0, 3, 8, 11],
      snare: [4, 12],
      closedHH: [0, 2, 4, 6, 8, 10, 12, 14],
    }),
  },
  {
    name: 'Disco',
    grid: createBeatGrid({
      kick: [0, 4, 8, 12],
      snare: [4, 12],
      openHH: [0, 2, 4, 6, 8, 10, 12, 14],
    }),
  },
];

/**
 * Returns a random starter beat, excluding the last beat name to prevent repeats.
 * Falls back to any beat if filtering removes all options.
 */
export function getRandomStarterBeat(lastBeatName?: string | null): StarterBeat {
  if (STARTER_BEATS.length === 0) {
    throw new Error('No starter beats available');
  }

  const available = lastBeatName
    ? STARTER_BEATS.filter((b) => b.name !== lastBeatName)
    : STARTER_BEATS;

  // Fallback to all beats if filtering removed everything
  const selection = available.length > 0 ? available : STARTER_BEATS;
  return selection[Math.floor(Math.random() * selection.length)];
}
