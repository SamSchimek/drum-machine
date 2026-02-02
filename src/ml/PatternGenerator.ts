import type { GridState, TrackId, Pattern } from '../types';
import { TRACK_IDS, createEmptyGrid } from '../types';
import { STEPS_PER_PATTERN, GENERATION_ORDER } from '../constants';
import { MarkovChain } from './MarkovChain';
import { MusicalRules } from './MusicalRules';

export class PatternGenerator {
  private markovChain: MarkovChain;
  private musicalRules: MusicalRules;

  constructor() {
    this.markovChain = new MarkovChain();
    this.musicalRules = new MusicalRules();
  }

  train(patterns: Pattern[]): void {
    const grids = patterns.map((p) => p.grid);
    this.markovChain.train(grids);
  }

  canGenerate(): boolean {
    return this.markovChain.isTrainedSufficiently();
  }

  getTrainedPatternCount(): number {
    return this.markovChain.getTrainedPatternCount();
  }

  generate(): GridState {
    if (!this.canGenerate()) {
      throw new Error('Insufficient training data. Need at least 5 patterns.');
    }

    let pattern = createEmptyGrid();

    // Generate track by track in dependency order
    for (const trackId of GENERATION_ORDER) {
      pattern = this.generateTrack(pattern, trackId);
    }

    // Post-process to ensure hard rules are met
    pattern = this.musicalRules.enforceHardRules(pattern);

    return pattern;
  }

  private generateTrack(pattern: GridState, trackId: TrackId): GridState {
    const result = { ...pattern };
    result[trackId] = [...pattern[trackId]];

    for (let step = 0; step < STEPS_PER_PATTERN; step++) {
      const probability = this.calculateHitProbability(result, trackId, step);
      result[trackId][step] = Math.random() < probability;
    }

    return result;
  }

  private calculateHitProbability(
    pattern: GridState,
    trackId: TrackId,
    step: number
  ): number {
    // Get Markov chain probability
    const markovProb = this.markovChain.getTransitionProbability(
      pattern,
      trackId,
      step
    );

    // Get rule-based evaluation
    const ruleResult = this.musicalRules.evaluateHit(pattern, trackId, step);

    // If hard blocked by rules, return 0
    if (!ruleResult.allowed) {
      return 0;
    }

    // Markov provides base probability from learned patterns
    // Rules provide multipliers that boost (>1.0) or reduce (<1.0) probability
    // Apply rule multiplier directly to preserve intended musical adjustments
    const finalProb = markovProb * ruleResult.probability;

    // Clamp to valid probability range
    return Math.max(0, Math.min(1, finalProb));
  }

  // Generate multiple patterns and pick the most musical one
  generateBest(attempts: number = 5): GridState {
    if (!this.canGenerate()) {
      throw new Error('Insufficient training data. Need at least 5 patterns.');
    }

    let bestPattern: GridState | null = null;
    let bestScore = -Infinity;

    for (let i = 0; i < attempts; i++) {
      const pattern = this.generate();
      const score = this.scorePattern(pattern);

      if (score > bestScore) {
        bestScore = score;
        bestPattern = pattern;
      }
    }

    return bestPattern!;
  }

  private scorePattern(pattern: GridState): number {
    let score = 0;

    // Score based on having a good kick/snare foundation
    const kickHits = pattern.kick.filter(Boolean).length;
    const snareHits = pattern.snare.filter(Boolean).length;

    // Prefer patterns with some kick and snare (scaled for 32 steps)
    if (kickHits >= 4 && kickHits <= 12) score += 10;
    if (snareHits >= 2 && snareHits <= 8) score += 10;

    // Prefer snare on backbeats (steps 4 and 12 for 16-step grid)
    if (pattern.snare[4]) score += 5;
    if (pattern.snare[12]) score += 5;

    // Prefer kick on downbeats (steps 0 and 8 for 16-step grid)
    if (pattern.kick[0]) score += 5;
    if (pattern.kick[8]) score += 3;

    // Score hi-hat consistency (scaled for 32 steps)
    const closedHHHits = pattern.closedHH.filter(Boolean).length;
    if (closedHHHits >= 8 && closedHHHits <= 24) score += 5;

    // Penalize too sparse or too dense overall
    const totalHits = TRACK_IDS.reduce(
      (sum, id) => sum + pattern[id].filter(Boolean).length,
      0
    );
    const maxHits = TRACK_IDS.length * STEPS_PER_PATTERN;
    const density = totalHits / maxHits;

    if (density < 0.1 || density > 0.5) score -= 10;
    if (density >= 0.15 && density <= 0.35) score += 10;

    return score;
  }
}

// Singleton instance
export const patternGenerator = new PatternGenerator();
