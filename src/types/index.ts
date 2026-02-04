// Track IDs for the 12 drum sounds
export type TrackId =
  | 'kick'
  | 'snare'
  | 'closedHH'
  | 'openHH'
  | 'clap'
  | 'tomLow'
  | 'tomMid'
  | 'tomHigh'
  | 'rimshot'
  | 'cowbell'
  | 'clave'
  | 'maracas';

// Array of all track IDs in order
export const TRACK_IDS: TrackId[] = [
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

// Display names for tracks
export const TRACK_NAMES: Record<TrackId, string> = {
  kick: 'Kick',
  snare: 'Snare',
  closedHH: 'Closed HH',
  openHH: 'Open HH',
  clap: 'Clap',
  tomLow: 'Tom Low',
  tomMid: 'Tom Mid',
  tomHigh: 'Tom High',
  rimshot: 'Rimshot',
  cowbell: 'Cowbell',
  clave: 'Clave',
  maracas: 'Maracas',
};

// Grid state: 12 tracks × 16 steps, true = active
export type GridState = Record<TrackId, boolean[]>;

// Create an empty grid state
export function createEmptyGrid(): GridState {
  return TRACK_IDS.reduce((acc, trackId) => {
    acc[trackId] = new Array(16).fill(false);
    return acc;
  }, {} as GridState);
}

// Pattern with metadata
export interface Pattern {
  id: string;
  name: string;
  grid: GridState;
  tempo: number;
  swing?: number;
  createdAt: number;
  updatedAt: number;
  // Optional cloud fields (present when synced to Supabase)
  userId?: string;
  isPublic?: boolean;
  shareSlug?: string | null;
  showCreatorName?: boolean;
}

// Sequencer state
export interface SequencerState {
  isPlaying: boolean;
  currentStep: number;
  tempo: number; // BPM
}

// Audio engine interface
export interface DrumSynth {
  trigger(time: number, velocity?: number): void;
  dispose(): void;
}

// Pattern storage interface
export interface PatternStorageInterface {
  savePattern(pattern: Omit<Pattern, 'id' | 'createdAt' | 'updatedAt'>): Pattern;
  loadPattern(id: string): Pattern | null;
  getAllPatterns(): Pattern[];
  deletePattern(id: string): boolean;
  updatePattern(id: string, updates: Partial<Omit<Pattern, 'id' | 'createdAt'>>): Pattern | null;
}

// Markov chain transition matrix type
export type TransitionMatrix = Map<string, Map<string, number>>;

// Musical rule result
export interface RuleResult {
  allowed: boolean;
  probability: number;
  reason?: string;
}
