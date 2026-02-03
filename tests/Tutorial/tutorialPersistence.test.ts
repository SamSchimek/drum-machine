import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TUTORIAL_STORAGE_KEYS,
  saveTutorialStep,
  loadTutorialStep,
  saveTutorialActive,
  loadTutorialActive,
  saveTutorialCompleted,
  loadTutorialCompleted,
  saveTutorialSkipped,
  loadTutorialSkipped,
  clearTutorialState,
} from '../../src/context/tutorialPersistence';

describe('tutorialPersistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('TUTORIAL_STORAGE_KEYS', () => {
    it('has correct key names', () => {
      expect(TUTORIAL_STORAGE_KEYS.STEP).toBe('drum-machine-tutorial-step');
      expect(TUTORIAL_STORAGE_KEYS.ACTIVE).toBe('drum-machine-tutorial-active');
      expect(TUTORIAL_STORAGE_KEYS.COMPLETED).toBe('drum-machine-tutorial-completed');
      expect(TUTORIAL_STORAGE_KEYS.SKIPPED).toBe('drum-machine-tutorial-skipped');
    });
  });

  describe('saveTutorialStep / loadTutorialStep', () => {
    it('saves and loads step correctly', () => {
      saveTutorialStep(5);
      expect(loadTutorialStep()).toBe(5);
    });

    it('returns 0 when no step saved', () => {
      expect(loadTutorialStep()).toBe(0);
    });

    it('handles corrupted data by returning 0', () => {
      localStorage.setItem(TUTORIAL_STORAGE_KEYS.STEP, 'invalid');
      expect(loadTutorialStep()).toBe(0);
    });

    it('handles negative values by returning 0', () => {
      localStorage.setItem(TUTORIAL_STORAGE_KEYS.STEP, '-5');
      expect(loadTutorialStep()).toBe(0);
    });
  });

  describe('saveTutorialActive / loadTutorialActive', () => {
    it('saves and loads active state correctly', () => {
      saveTutorialActive(true);
      expect(loadTutorialActive()).toBe(true);

      saveTutorialActive(false);
      expect(loadTutorialActive()).toBe(false);
    });

    it('returns false when no active state saved', () => {
      expect(loadTutorialActive()).toBe(false);
    });

    it('handles corrupted data by returning false', () => {
      localStorage.setItem(TUTORIAL_STORAGE_KEYS.ACTIVE, 'not-a-boolean');
      expect(loadTutorialActive()).toBe(false);
    });
  });

  describe('saveTutorialCompleted / loadTutorialCompleted', () => {
    it('saves and loads completed state correctly', () => {
      saveTutorialCompleted(true);
      expect(loadTutorialCompleted()).toBe(true);

      saveTutorialCompleted(false);
      expect(loadTutorialCompleted()).toBe(false);
    });

    it('returns false when no completed state saved', () => {
      expect(loadTutorialCompleted()).toBe(false);
    });
  });

  describe('saveTutorialSkipped / loadTutorialSkipped', () => {
    it('saves and loads skipped state correctly', () => {
      saveTutorialSkipped(true);
      expect(loadTutorialSkipped()).toBe(true);

      saveTutorialSkipped(false);
      expect(loadTutorialSkipped()).toBe(false);
    });

    it('returns false when no skipped state saved', () => {
      expect(loadTutorialSkipped()).toBe(false);
    });
  });

  describe('clearTutorialState', () => {
    it('clears all tutorial state', () => {
      saveTutorialStep(3);
      saveTutorialActive(true);
      saveTutorialCompleted(true);
      saveTutorialSkipped(true);

      clearTutorialState();

      expect(loadTutorialStep()).toBe(0);
      expect(loadTutorialActive()).toBe(false);
      expect(loadTutorialCompleted()).toBe(false);
      expect(loadTutorialSkipped()).toBe(false);
    });
  });

  describe('localStorage unavailable', () => {
    it('handles localStorage errors gracefully on save', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw
      expect(() => saveTutorialStep(5)).not.toThrow();
      expect(() => saveTutorialActive(true)).not.toThrow();
      expect(() => saveTutorialCompleted(true)).not.toThrow();
      expect(() => saveTutorialSkipped(true)).not.toThrow();

      localStorage.setItem = originalSetItem;
    });

    it('handles localStorage errors gracefully on load', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('SecurityError');
      });

      // Should return default values and not throw
      expect(loadTutorialStep()).toBe(0);
      expect(loadTutorialActive()).toBe(false);
      expect(loadTutorialCompleted()).toBe(false);
      expect(loadTutorialSkipped()).toBe(false);

      localStorage.getItem = originalGetItem;
    });

    it('handles localStorage errors gracefully on clear', () => {
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn(() => {
        throw new Error('SecurityError');
      });

      // Should not throw
      expect(() => clearTutorialState()).not.toThrow();

      localStorage.removeItem = originalRemoveItem;
    });
  });
});
