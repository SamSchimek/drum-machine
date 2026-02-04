import type { TrackId } from '../types';

// Grid dimensions
export const STEPS_PER_PATTERN = 16;
export const NUM_TRACKS = 12;

// Timing
export const DEFAULT_TEMPO = 120;
export const MIN_TEMPO = 40;
export const MAX_TEMPO = 300;

// Audio
export const LOOKAHEAD_TIME = 0.1; // How far ahead to schedule audio (seconds)
export const SCHEDULE_INTERVAL = 25; // How often to call scheduling function (ms)

// Swing
export const DEFAULT_SWING = 0;
export const MIN_SWING = 0;
export const MAX_SWING = 100;

// ML Generation
export const MIN_PATTERNS_FOR_GENERATION = 5;
export const MARKOV_WEIGHT = 0.6;
export const RULES_WEIGHT = 0.4;

// Track colors for the grid (808-inspired palette)
export const TRACK_COLORS: Record<TrackId, string> = {
  kick: '#ff5722',     // Deep orange
  snare: '#ffeb3b',    // Yellow
  closedHH: '#4caf50', // Green
  openHH: '#8bc34a',   // Light green
  clap: '#e91e63',     // Pink
  tomLow: '#9c27b0',   // Purple
  tomMid: '#673ab7',   // Deep purple
  tomHigh: '#3f51b5',  // Indigo
  rimshot: '#00bcd4',  // Cyan
  cowbell: '#ff9800',  // Orange
  clave: '#795548',    // Brown
  maracas: '#607d8b',  // Blue grey
};

// Track order for generation (dependencies)
export const GENERATION_ORDER: TrackId[] = [
  'kick',
  'snare',
  'closedHH',
  'openHH',
  'clap',
  'tomLow',
  'tomMid',
  'tomHigh',
  'rimshot',
  'cowbell',
  'clave',
  'maracas',
];

// Ideal density ranges for each track (min, max as percentage of steps)
export const TRACK_DENSITY: Record<TrackId, [number, number]> = {
  kick: [0.15, 0.35],
  snare: [0.1, 0.25],
  closedHH: [0.25, 0.75],
  openHH: [0.05, 0.2],
  clap: [0.05, 0.2],
  tomLow: [0.0, 0.15],
  tomMid: [0.0, 0.15],
  tomHigh: [0.0, 0.15],
  rimshot: [0.0, 0.15],
  cowbell: [0.05, 0.25],
  clave: [0.1, 0.3],
  maracas: [0.1, 0.4],
};
