import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type { GridState, TrackId, Pattern } from '../types';
import { createEmptyGrid, TRACK_IDS } from '../types';
import { DEFAULT_TEMPO } from '../constants';
import { sequencer } from '../audio/Sequencer';
import { audioEngine } from '../audio/AudioEngine';
import { patternStorage as localPatternStorage } from '../storage/PatternStorage';
import { SupabaseStorage } from '../storage/SupabaseStorage';
import { StorageAdapter } from '../storage/StorageAdapter';
import { patternGenerator } from '../ml/PatternGenerator';
import { useAuth } from '../auth/AuthContext';
import type { MigrationResult } from '../storage/types';
import { getRandomStarterBeat } from '../presets/starterBeats';

type MutedTracks = Record<TrackId, boolean>;

function createInitialMutedTracks(): MutedTracks {
  return TRACK_IDS.reduce((acc, id) => {
    acc[id] = false;
    return acc;
  }, {} as MutedTracks);
}

interface DrumMachineState {
  grid: GridState;
  isPlaying: boolean;
  currentStep: number;
  tempo: number;
  volume: number;
  patterns: Pattern[];
  canGenerate: boolean;
  mutedTracks: MutedTracks;
  patternsLoading: boolean;
  patternError: string | null;
  lastStarterBeat: string | null;
}

type Action =
  | { type: 'TOGGLE_CELL'; trackId: TrackId; step: number }
  | { type: 'SET_PLAYING'; isPlaying: boolean }
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_TEMPO'; tempo: number }
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'SET_GRID'; grid: GridState }
  | { type: 'CLEAR_GRID' }
  | { type: 'LOAD_PATTERNS'; patterns: Pattern[] }
  | { type: 'SET_CAN_GENERATE'; canGenerate: boolean }
  | { type: 'TOGGLE_MUTE'; trackId: TrackId }
  | { type: 'SET_PATTERNS_LOADING'; loading: boolean }
  | { type: 'SET_PATTERN_ERROR'; error: string | null }
  | { type: 'LOAD_STARTER_BEAT'; grid: GridState; beatName: string };

const initialState: DrumMachineState = {
  grid: createEmptyGrid(),
  isPlaying: false,
  currentStep: 0,
  tempo: DEFAULT_TEMPO,
  volume: 0.8,
  patterns: [],
  canGenerate: false,
  mutedTracks: createInitialMutedTracks(),
  patternsLoading: true,
  patternError: null,
  lastStarterBeat: null,
};

function reducer(state: DrumMachineState, action: Action): DrumMachineState {
  switch (action.type) {
    case 'TOGGLE_CELL': {
      const newGrid = { ...state.grid };
      newGrid[action.trackId] = [...newGrid[action.trackId]];
      newGrid[action.trackId][action.step] = !newGrid[action.trackId][action.step];
      return { ...state, grid: newGrid };
    }
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.isPlaying };
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    case 'SET_TEMPO':
      return { ...state, tempo: action.tempo };
    case 'SET_VOLUME':
      return { ...state, volume: action.volume };
    case 'SET_GRID':
      return { ...state, grid: action.grid };
    case 'CLEAR_GRID':
      return { ...state, grid: createEmptyGrid() };
    case 'LOAD_PATTERNS':
      return { ...state, patterns: action.patterns };
    case 'SET_CAN_GENERATE':
      return { ...state, canGenerate: action.canGenerate };
    case 'TOGGLE_MUTE': {
      const newMutedTracks = { ...state.mutedTracks };
      newMutedTracks[action.trackId] = !newMutedTracks[action.trackId];
      return { ...state, mutedTracks: newMutedTracks };
    }
    case 'SET_PATTERNS_LOADING':
      return { ...state, patternsLoading: action.loading };
    case 'SET_PATTERN_ERROR':
      return { ...state, patternError: action.error };
    case 'LOAD_STARTER_BEAT':
      return { ...state, grid: action.grid, lastStarterBeat: action.beatName };
    default:
      return state;
  }
}

interface DrumMachineContextValue extends DrumMachineState {
  toggleCell: (trackId: TrackId, step: number) => void;
  play: () => void;
  stop: () => void;
  setTempo: (tempo: number) => void;
  setVolume: (volume: number) => void;
  setGrid: (grid: GridState) => void;
  clearGrid: () => void;
  savePattern: (name: string) => Promise<Pattern>;
  loadPattern: (id: string) => Promise<void>;
  deletePattern: (id: string) => Promise<void>;
  renamePattern: (id: string, newName: string) => Promise<void>;
  generatePattern: () => void;
  triggerSound: (trackId: TrackId) => void;
  toggleMute: (trackId: TrackId) => void;
  migrateToCloud: () => Promise<MigrationResult>;
  hasLocalPatterns: () => boolean;
  makePatternPublic: (id: string) => Promise<string | null>;
  makePatternPrivate: (id: string) => Promise<boolean>;
  refreshPatterns: () => Promise<void>;
  loadStarterBeat: () => void;
}

const DrumMachineContext = createContext<DrumMachineContextValue | null>(null);

// Create storage adapter instance (will be configured with/without Supabase based on auth)
const storageAdapter = new StorageAdapter(localPatternStorage, null);

export function DrumMachineProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const gridRef = useRef(state.grid);
  const mutedTracksRef = useRef(state.mutedTracks);
  const supabaseStorageRef = useRef<SupabaseStorage | null>(null);
  const { user } = useAuth();

  // Keep refs in sync
  useEffect(() => {
    gridRef.current = state.grid;
    sequencer.setGrid(state.grid);
  }, [state.grid]);

  useEffect(() => {
    mutedTracksRef.current = state.mutedTracks;
    sequencer.setMutedTracks(state.mutedTracks);
  }, [state.mutedTracks]);

  // Sync volume with audio engine
  useEffect(() => {
    audioEngine.setMasterVolume(state.volume);
  }, [state.volume]);

  // Configure storage based on auth state
  useEffect(() => {
    if (user) {
      // User logged in - use Supabase storage
      const supabaseStorage = new SupabaseStorage(user.id);
      storageAdapter.setSupabaseStorage(supabaseStorage);
      supabaseStorageRef.current = supabaseStorage;
    } else {
      // User logged out - use localStorage
      storageAdapter.setSupabaseStorage(null);
      supabaseStorageRef.current = null;
    }

    // Reload patterns with new storage
    loadPatterns();
  }, [user]);

  // Load patterns helper function
  const loadPatterns = useCallback(async () => {
    dispatch({ type: 'SET_PATTERNS_LOADING', loading: true });
    dispatch({ type: 'SET_PATTERN_ERROR', error: null });

    try {
      const patterns = await storageAdapter.getAllPatterns();
      dispatch({ type: 'LOAD_PATTERNS', patterns });
      patternGenerator.train(patterns);
      dispatch({ type: 'SET_CAN_GENERATE', canGenerate: patternGenerator.canGenerate() });
    } catch (error) {
      console.error('Error loading patterns:', error);
      dispatch({ type: 'SET_PATTERN_ERROR', error: 'Failed to load patterns' });
    } finally {
      dispatch({ type: 'SET_PATTERNS_LOADING', loading: false });
    }
  }, []);

  // Subscribe to sequencer step changes
  useEffect(() => {
    const unsubscribe = sequencer.onStep((step) => {
      dispatch({ type: 'SET_STEP', step });
    });
    return unsubscribe;
  }, []);

  // Sync tempo with sequencer
  useEffect(() => {
    sequencer.setTempo(state.tempo);
  }, [state.tempo]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger play/pause when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (state.isPlaying) {
          sequencer.stop();
          dispatch({ type: 'SET_PLAYING', isPlaying: false });
          dispatch({ type: 'SET_STEP', step: 0 });
        } else {
          sequencer.start().then(() => {
            dispatch({ type: 'SET_PLAYING', isPlaying: true });
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isPlaying]);

  const toggleCell = useCallback((trackId: TrackId, step: number) => {
    dispatch({ type: 'TOGGLE_CELL', trackId, step });
  }, []);

  const play = useCallback(async () => {
    await sequencer.start();
    dispatch({ type: 'SET_PLAYING', isPlaying: true });
  }, []);

  const stop = useCallback(() => {
    sequencer.stop();
    dispatch({ type: 'SET_PLAYING', isPlaying: false });
    dispatch({ type: 'SET_STEP', step: 0 });
  }, []);

  const setTempo = useCallback((tempo: number) => {
    dispatch({ type: 'SET_TEMPO', tempo });
  }, []);

  const setVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_VOLUME', volume });
  }, []);

  const setGrid = useCallback((grid: GridState) => {
    dispatch({ type: 'SET_GRID', grid });
  }, []);

  const clearGrid = useCallback(() => {
    dispatch({ type: 'CLEAR_GRID' });
  }, []);

  const savePattern = useCallback(async (name: string): Promise<Pattern> => {
    dispatch({ type: 'SET_PATTERNS_LOADING', loading: true });
    dispatch({ type: 'SET_PATTERN_ERROR', error: null });

    try {
      const pattern = await storageAdapter.savePattern({
        name,
        grid: gridRef.current,
        tempo: state.tempo,
      });
      const patterns = await storageAdapter.getAllPatterns();
      dispatch({ type: 'LOAD_PATTERNS', patterns });
      patternGenerator.train(patterns);
      dispatch({ type: 'SET_CAN_GENERATE', canGenerate: patternGenerator.canGenerate() });
      return pattern;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save pattern';
      dispatch({ type: 'SET_PATTERN_ERROR', error: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_PATTERNS_LOADING', loading: false });
    }
  }, [state.tempo]);

  const loadPatternById = useCallback(async (id: string): Promise<void> => {
    dispatch({ type: 'SET_PATTERNS_LOADING', loading: true });
    dispatch({ type: 'SET_PATTERN_ERROR', error: null });

    try {
      const pattern = await storageAdapter.loadPattern(id);
      if (pattern) {
        dispatch({ type: 'SET_GRID', grid: pattern.grid });
        dispatch({ type: 'SET_TEMPO', tempo: pattern.tempo });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load pattern';
      dispatch({ type: 'SET_PATTERN_ERROR', error: errorMessage });
    } finally {
      dispatch({ type: 'SET_PATTERNS_LOADING', loading: false });
    }
  }, []);

  const deletePattern = useCallback(async (id: string): Promise<void> => {
    dispatch({ type: 'SET_PATTERNS_LOADING', loading: true });
    dispatch({ type: 'SET_PATTERN_ERROR', error: null });

    try {
      await storageAdapter.deletePattern(id);
      const patterns = await storageAdapter.getAllPatterns();
      dispatch({ type: 'LOAD_PATTERNS', patterns });
      patternGenerator.train(patterns);
      dispatch({ type: 'SET_CAN_GENERATE', canGenerate: patternGenerator.canGenerate() });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete pattern';
      dispatch({ type: 'SET_PATTERN_ERROR', error: errorMessage });
    } finally {
      dispatch({ type: 'SET_PATTERNS_LOADING', loading: false });
    }
  }, []);

  const renamePattern = useCallback(async (id: string, newName: string): Promise<void> => {
    dispatch({ type: 'SET_PATTERN_ERROR', error: null });

    try {
      await storageAdapter.updatePattern(id, { name: newName.trim() });
      const patterns = await storageAdapter.getAllPatterns();
      dispatch({ type: 'LOAD_PATTERNS', patterns });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to rename pattern';
      dispatch({ type: 'SET_PATTERN_ERROR', error: errorMessage });
    }
  }, []);

  const generatePattern = useCallback(() => {
    if (patternGenerator.canGenerate()) {
      const grid = patternGenerator.generateBest();
      dispatch({ type: 'SET_GRID', grid });
    }
  }, []);

  const triggerSound = useCallback(async (trackId: TrackId) => {
    // Unlock audio synchronously (required for mobile - must happen before any await)
    audioEngine.unlock();
    await audioEngine.initialize();
    audioEngine.triggerSound(trackId);
  }, []);

  const toggleMute = useCallback((trackId: TrackId) => {
    dispatch({ type: 'TOGGLE_MUTE', trackId });
  }, []);

  const migrateToCloud = useCallback(async (): Promise<MigrationResult> => {
    dispatch({ type: 'SET_PATTERNS_LOADING', loading: true });
    dispatch({ type: 'SET_PATTERN_ERROR', error: null });

    try {
      const result = await storageAdapter.migrateToCloud();

      // Reload patterns after migration
      const patterns = await storageAdapter.getAllPatterns();
      dispatch({ type: 'LOAD_PATTERNS', patterns });
      patternGenerator.train(patterns);
      dispatch({ type: 'SET_CAN_GENERATE', canGenerate: patternGenerator.canGenerate() });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to migrate patterns';
      dispatch({ type: 'SET_PATTERN_ERROR', error: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_PATTERNS_LOADING', loading: false });
    }
  }, []);

  const hasLocalPatterns = useCallback((): boolean => {
    return storageAdapter.hasLocalPatterns();
  }, []);

  const makePatternPublic = useCallback(async (id: string): Promise<string | null> => {
    if (!supabaseStorageRef.current) {
      return null;
    }

    try {
      const shareSlug = await supabaseStorageRef.current.makePublic(id);
      if (shareSlug) {
        // Refresh patterns to update the UI
        const patterns = await storageAdapter.getAllPatterns();
        dispatch({ type: 'LOAD_PATTERNS', patterns });
      }
      return shareSlug;
    } catch (error) {
      console.error('Error making pattern public:', error);
      dispatch({ type: 'SET_PATTERN_ERROR', error: 'Failed to share pattern' });
      return null;
    }
  }, []);

  const makePatternPrivate = useCallback(async (id: string): Promise<boolean> => {
    if (!supabaseStorageRef.current) {
      return false;
    }

    try {
      const success = await supabaseStorageRef.current.makePrivate(id);
      if (success) {
        // Refresh patterns to update the UI
        const patterns = await storageAdapter.getAllPatterns();
        dispatch({ type: 'LOAD_PATTERNS', patterns });
      }
      return success;
    } catch (error) {
      console.error('Error making pattern private:', error);
      dispatch({ type: 'SET_PATTERN_ERROR', error: 'Failed to make pattern private' });
      return false;
    }
  }, []);

  const refreshPatterns = useCallback(async (): Promise<void> => {
    await loadPatterns();
  }, [loadPatterns]);

  const loadStarterBeat = useCallback(() => {
    const beat = getRandomStarterBeat(state.lastStarterBeat);
    dispatch({ type: 'LOAD_STARTER_BEAT', grid: beat.grid, beatName: beat.name });
  }, [state.lastStarterBeat]);

  const value: DrumMachineContextValue = {
    ...state,
    toggleCell,
    play,
    stop,
    setTempo,
    setVolume,
    setGrid,
    clearGrid,
    savePattern,
    loadPattern: loadPatternById,
    deletePattern,
    renamePattern,
    generatePattern,
    triggerSound,
    toggleMute,
    migrateToCloud,
    hasLocalPatterns,
    makePatternPublic,
    makePatternPrivate,
    refreshPatterns,
    loadStarterBeat,
  };

  return (
    <DrumMachineContext.Provider value={value}>
      {children}
    </DrumMachineContext.Provider>
  );
}

export function useDrumMachine() {
  const context = useContext(DrumMachineContext);
  if (!context) {
    throw new Error('useDrumMachine must be used within DrumMachineProvider');
  }
  return context;
}
