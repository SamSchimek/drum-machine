import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase module - must be before any imports that use it
vi.mock('../src/lib/supabase', () => {
  // Inline mock to avoid hoisting issues
  const createQueryBuilder = () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    return builder;
  };

  const queryBuilder = createQueryBuilder();

  const mockSupabase = {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null
      }),
      signInWithOAuth: vi.fn().mockResolvedValue({
        data: { url: 'https://oauth.example.com', provider: 'google' },
        error: null
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
      resetPasswordForEmail: vi.fn().mockResolvedValue({
        data: {},
        error: null
      }),
      updateUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null
      }),
    },
    from: vi.fn(() => queryBuilder),
    _queryBuilder: queryBuilder,
  };

  return { supabase: mockSupabase };
});

// Mock Web Audio API
class MockAudioContext {
  state: string = 'running';
  currentTime: number = 0;
  sampleRate: number = 44100;
  destination: AudioDestinationNode = {} as AudioDestinationNode;

  createOscillator() {
    return {
      type: 'sine',
      frequency: { value: 440, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  createGain() {
    return {
      gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    };
  }

  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: { value: 350 },
      Q: { value: 1 },
      connect: vi.fn(),
    };
  }

  createDynamicsCompressor() {
    return {
      threshold: { value: -24 },
      knee: { value: 30 },
      ratio: { value: 4 },
      attack: { value: 0.003 },
      release: { value: 0.25 },
      connect: vi.fn(),
    };
  }

  createBuffer(channels: number, length: number, sampleRate: number) {
    return {
      getChannelData: () => new Float32Array(length),
    };
  }

  createBufferSource() {
    return {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  resume() {
    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }
}

// @ts-ignore
global.AudioContext = MockAudioContext;

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem(key: string) {
    return this.store[key] ?? null;
  },
  setItem(key: string, value: string) {
    this.store[key] = value;
  },
  removeItem(key: string) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});
