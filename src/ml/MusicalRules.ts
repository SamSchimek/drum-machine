import type { GridState, TrackId, RuleResult } from '../types';
import { STEPS_PER_PATTERN, TRACK_DENSITY } from '../constants';

export class MusicalRules {
  // Evaluate if a hit at the given position is allowed/desirable
  evaluateHit(
    currentPattern: GridState,
    trackId: TrackId,
    step: number
  ): RuleResult {
    const results: RuleResult[] = [];

    // Apply relevant rules based on track type
    switch (trackId) {
      case 'snare':
        results.push(this.snareNotOnOne(step));
        break;
      case 'kick':
        results.push(this.consecutiveKickLimit(currentPattern, step));
        results.push(this.kickBackbeat(step));
        break;
      case 'closedHH':
        results.push(this.hiHatMutualExclusion(currentPattern, 'openHH', step));
        results.push(this.hiHatFoundation(step));
        break;
      case 'openHH':
        results.push(this.hiHatMutualExclusion(currentPattern, 'closedHH', step));
        break;
    }

    // Apply density control for all tracks
    results.push(this.densityControl(currentPattern, trackId, step));

    // Combine results
    return this.combineResults(results);
  }

  // Snare rarely on beat 1 (step 0) - 10% probability
  private snareNotOnOne(step: number): RuleResult {
    if (step === 0) {
      return { allowed: true, probability: 0.1, reason: 'Snare on beat 1 discouraged' };
    }
    // Boost snare on backbeats (steps 4 and 12, i.e., beats 2 and 4)
    if (step === 4 || step === 12) {
      return { allowed: true, probability: 1.2, reason: 'Snare on backbeat encouraged' };
    }
    return { allowed: true, probability: 1.0 };
  }

  // Max 2 kicks in a row - hard block on 3rd
  private consecutiveKickLimit(pattern: GridState, step: number): RuleResult {
    if (step < 2) {
      return { allowed: true, probability: 1.0 };
    }

    const prev1 = pattern.kick[step - 1];
    const prev2 = pattern.kick[step - 2];

    if (prev1 && prev2) {
      return {
        allowed: false,
        probability: 0,
        reason: 'Max 2 consecutive kicks',
      };
    }

    // Slightly discourage 2 in a row
    if (prev1) {
      return { allowed: true, probability: 0.7 };
    }

    return { allowed: true, probability: 1.0 };
  }

  // Kick on beats 1 and 3 encouraged
  private kickBackbeat(step: number): RuleResult {
    // Beats 1 and 3 are steps 0 and 8
    if (step === 0 || step === 8) {
      return { allowed: true, probability: 1.3, reason: 'Kick on downbeat encouraged' };
    }
    return { allowed: true, probability: 1.0 };
  }

  // Hi-hats on even steps encouraged
  private hiHatFoundation(step: number): RuleResult {
    if (step % 2 === 0) {
      return { allowed: true, probability: 1.2, reason: 'Hi-hat on even step encouraged' };
    }
    return { allowed: true, probability: 0.8 };
  }

  // Never both open and closed hi-hat on same step - hard block
  private hiHatMutualExclusion(
    pattern: GridState,
    otherHiHat: 'closedHH' | 'openHH',
    step: number
  ): RuleResult {
    if (pattern[otherHiHat][step]) {
      return {
        allowed: false,
        probability: 0,
        reason: 'Hi-hat mutual exclusion',
      };
    }
    return { allowed: true, probability: 1.0 };
  }

  // Keep tracks within ideal hit density
  private densityControl(
    pattern: GridState,
    trackId: TrackId,
    step: number
  ): RuleResult {
    const [minDensity, maxDensity] = TRACK_DENSITY[trackId];
    const currentHits = pattern[trackId].slice(0, step).filter(Boolean).length;
    const remainingSteps = STEPS_PER_PATTERN - step;

    // Calculate what adding a hit would do to final density
    const potentialFinalHits = currentHits + 1;
    const potentialMinFinalDensity = potentialFinalHits / STEPS_PER_PATTERN;

    // If we'd exceed max density, discourage
    if (potentialMinFinalDensity > maxDensity) {
      return { allowed: true, probability: 0.3, reason: 'Above ideal density' };
    }

    // If we're below min and running out of steps, encourage
    const minHitsNeeded = Math.ceil(minDensity * STEPS_PER_PATTERN);
    const hitsStillNeeded = minHitsNeeded - currentHits;
    if (hitsStillNeeded > 0 && remainingSteps <= hitsStillNeeded * 2) {
      return { allowed: true, probability: 1.3, reason: 'Below ideal density' };
    }

    return { allowed: true, probability: 1.0 };
  }

  private combineResults(results: RuleResult[]): RuleResult {
    // If any rule blocks, the hit is blocked
    for (const result of results) {
      if (!result.allowed) {
        return result;
      }
    }

    // Multiply probabilities for allowed hits
    let finalProbability = 1.0;
    const reasons: string[] = [];

    for (const result of results) {
      finalProbability *= result.probability;
      if (result.reason) {
        reasons.push(result.reason);
      }
    }

    return {
      allowed: true,
      probability: Math.min(finalProbability, 1.5), // Cap boost
      reason: reasons.length > 0 ? reasons.join(', ') : undefined,
    };
  }

  // Post-process pattern to ensure minimum validity
  enforceHardRules(pattern: GridState): GridState {
    const result = { ...pattern };

    // Ensure hi-hat mutual exclusion
    for (let step = 0; step < STEPS_PER_PATTERN; step++) {
      if (result.closedHH[step] && result.openHH[step]) {
        // Randomly pick one to keep
        if (Math.random() > 0.5) {
          result.closedHH[step] = false;
        } else {
          result.openHH[step] = false;
        }
      }
    }

    // Ensure max 2 consecutive kicks
    for (let step = 2; step < STEPS_PER_PATTERN; step++) {
      if (result.kick[step] && result.kick[step - 1] && result.kick[step - 2]) {
        result.kick[step] = false;
      }
    }

    return result;
  }
}
