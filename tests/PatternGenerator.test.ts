import { describe, it, expect, beforeEach } from 'vitest';
import { PatternGenerator } from '../src/ml/PatternGenerator';
import { createEmptyGrid } from '../src/types';
import type { Pattern, GridState } from '../src/types';
import { STEPS_PER_PATTERN } from '../src/constants';

function createTestPattern(overrides: Partial<GridState> = {}): Pattern {
  const grid = createEmptyGrid();

  // Create a basic pattern with kick on 1 and 3, snare on 2 and 4
  grid.kick[0] = true;
  grid.kick[8] = true;
  grid.snare[4] = true;
  grid.snare[12] = true;

  // Some hi-hats
  for (let i = 0; i < 16; i += 2) {
    grid.closedHH[i] = true;
  }

  // Apply overrides
  for (const [trackId, steps] of Object.entries(overrides)) {
    grid[trackId as keyof GridState] = steps;
  }

  return {
    id: Math.random().toString(),
    name: 'Test Pattern',
    grid,
    tempo: 120,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function createTrainingPatterns(count: number): Pattern[] {
  return Array.from({ length: count }, () => {
    const grid = createEmptyGrid();

    // Random but musically valid patterns
    grid.kick[0] = true;
    grid.kick[8] = Math.random() > 0.3;
    if (Math.random() > 0.5) grid.kick[4] = true;

    grid.snare[4] = true;
    grid.snare[12] = true;

    for (let i = 0; i < 16; i += 2) {
      if (Math.random() > 0.3) {
        grid.closedHH[i] = true;
      }
    }

    // Sometimes add open hi-hat, but never when closed is active
    for (let i = 0; i < 16; i++) {
      if (!grid.closedHH[i] && Math.random() > 0.85) {
        grid.openHH[i] = true;
      }
    }

    return {
      id: Math.random().toString(),
      name: `Pattern ${Math.random()}`,
      grid,
      tempo: 120,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });
}

describe('PatternGenerator', () => {
  let generator: PatternGenerator;

  beforeEach(() => {
    generator = new PatternGenerator();
  });

  describe('Training', () => {
    it('cannot generate without training data', () => {
      expect(generator.canGenerate()).toBe(false);
    });

    it('cannot generate with less than 5 patterns', () => {
      generator.train(createTrainingPatterns(4));
      expect(generator.canGenerate()).toBe(false);
    });

    it('can generate with 5 or more patterns', () => {
      generator.train(createTrainingPatterns(5));
      expect(generator.canGenerate()).toBe(true);
    });

    it('reports correct trained pattern count', () => {
      generator.train(createTrainingPatterns(7));
      expect(generator.getTrainedPatternCount()).toBe(7);
    });
  });

  describe('Generation', () => {
    beforeEach(() => {
      generator.train(createTrainingPatterns(10));
    });

    it('generates a valid grid state', () => {
      const pattern = generator.generate();

      expect(pattern).toBeDefined();
      expect(pattern.kick).toHaveLength(16);
      expect(pattern.snare).toHaveLength(16);
      expect(pattern.closedHH).toHaveLength(16);
    });

    it('enforces hi-hat mutual exclusion', () => {
      // Generate multiple patterns to ensure rule is consistently enforced
      for (let attempt = 0; attempt < 20; attempt++) {
        const pattern = generator.generate();

        for (let step = 0; step < STEPS_PER_PATTERN; step++) {
          const bothActive = pattern.closedHH[step] && pattern.openHH[step];
          expect(bothActive).toBe(false);
        }
      }
    });

    it('limits consecutive kicks to 2', () => {
      // Generate multiple patterns to ensure rule is consistently enforced
      for (let attempt = 0; attempt < 20; attempt++) {
        const pattern = generator.generate();

        for (let step = 2; step < STEPS_PER_PATTERN; step++) {
          const threeConsecutive =
            pattern.kick[step] && pattern.kick[step - 1] && pattern.kick[step - 2];
          expect(threeConsecutive).toBe(false);
        }
      }
    });
  });

  describe('generateBest', () => {
    beforeEach(() => {
      generator.train(createTrainingPatterns(10));
    });

    it('generates a pattern using best-of-N selection', () => {
      const pattern = generator.generateBest(5);
      expect(pattern).toBeDefined();
      expect(pattern.kick).toHaveLength(16);
    });

    it('enforces rules in best pattern', () => {
      const pattern = generator.generateBest(10);

      // Hi-hat mutual exclusion
      for (let step = 0; step < STEPS_PER_PATTERN; step++) {
        expect(pattern.closedHH[step] && pattern.openHH[step]).toBe(false);
      }

      // Consecutive kick limit
      for (let step = 2; step < STEPS_PER_PATTERN; step++) {
        const threeConsecutive =
          pattern.kick[step] && pattern.kick[step - 1] && pattern.kick[step - 2];
        expect(threeConsecutive).toBe(false);
      }
    });
  });
});
