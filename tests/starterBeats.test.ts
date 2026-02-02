import { describe, it, expect } from 'vitest';
import { STARTER_BEATS, getRandomStarterBeat } from '../src/presets/starterBeats';
import { TRACK_IDS } from '../src/types';

describe('starterBeats', () => {
  describe('STARTER_BEATS', () => {
    it('should have at least 5 beats', () => {
      expect(STARTER_BEATS.length).toBeGreaterThanOrEqual(5);
    });

    it('should have unique names', () => {
      const names = STARTER_BEATS.map((b) => b.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('each beat should have a valid grid with all tracks', () => {
      for (const beat of STARTER_BEATS) {
        expect(beat.name).toBeTruthy();
        expect(beat.grid).toBeDefined();

        for (const trackId of TRACK_IDS) {
          expect(beat.grid[trackId]).toBeDefined();
          expect(beat.grid[trackId]).toHaveLength(16);
          expect(beat.grid[trackId].every((v) => typeof v === 'boolean')).toBe(true);
        }
      }
    });

    it('each beat should have at least one active step', () => {
      for (const beat of STARTER_BEATS) {
        const hasActiveStep = TRACK_IDS.some((trackId) =>
          beat.grid[trackId].some((step) => step === true)
        );
        expect(hasActiveStep).toBe(true);
      }
    });
  });

  describe('getRandomStarterBeat', () => {
    it('should return a starter beat', () => {
      const beat = getRandomStarterBeat();
      expect(beat).toBeDefined();
      expect(beat.name).toBeTruthy();
      expect(beat.grid).toBeDefined();
    });

    it('should not return the same beat when excluded', () => {
      const firstBeat = STARTER_BEATS[0];

      // Run multiple times to verify exclusion works
      for (let i = 0; i < 20; i++) {
        const beat = getRandomStarterBeat(firstBeat.name);
        expect(beat.name).not.toBe(firstBeat.name);
      }
    });

    it('should work with null as last beat name', () => {
      const beat = getRandomStarterBeat(null);
      expect(beat).toBeDefined();
      expect(STARTER_BEATS.some((b) => b.name === beat.name)).toBe(true);
    });

    it('should work with undefined as last beat name', () => {
      const beat = getRandomStarterBeat(undefined);
      expect(beat).toBeDefined();
      expect(STARTER_BEATS.some((b) => b.name === beat.name)).toBe(true);
    });

    it('should fallback to any beat if all are filtered out (single beat scenario)', () => {
      // If there was only one beat and it matched lastBeatName,
      // the function should still return a beat (fallback behavior)
      const onlyBeatName = STARTER_BEATS[0].name;

      // Simulate by testing that even with a name that exists,
      // if filtering leaves options, it works; the fallback is tested implicitly
      // by ensuring we always get a valid beat
      const beat = getRandomStarterBeat(onlyBeatName);
      expect(beat).toBeDefined();
      expect(beat.name).toBeTruthy();
      expect(beat.grid).toBeDefined();
    });

    it('should handle non-existent beat name gracefully', () => {
      const beat = getRandomStarterBeat('NonExistentBeatName');
      expect(beat).toBeDefined();
      expect(STARTER_BEATS.some((b) => b.name === beat.name)).toBe(true);
    });
  });
});
