import type { GridState, TrackId, TransitionMatrix } from '../types';
import { TRACK_IDS } from '../types';
import { STEPS_PER_PATTERN } from '../constants';

// State encoding: previous step's state -> current step's probability
// State is encoded as string of 0s and 1s representing which tracks were active

export class MarkovChain {
  private transitionMatrices: Map<TrackId, TransitionMatrix> = new Map();
  private initialProbabilities: Map<TrackId, number> = new Map();
  private trainedPatternCount: number = 0;

  constructor() {
    // Initialize empty matrices for each track
    for (const trackId of TRACK_IDS) {
      this.transitionMatrices.set(trackId, new Map());
      this.initialProbabilities.set(trackId, 0);
    }
  }

  train(patterns: GridState[]): void {
    this.trainedPatternCount = patterns.length;

    if (patterns.length === 0) {
      return;
    }

    // Reset matrices
    for (const trackId of TRACK_IDS) {
      this.transitionMatrices.set(trackId, new Map());
    }

    // Count transitions for each track
    const transitionCounts: Map<TrackId, Map<string, Map<string, number>>> = new Map();
    const initialCounts: Map<TrackId, { on: number; total: number }> = new Map();

    for (const trackId of TRACK_IDS) {
      transitionCounts.set(trackId, new Map());
      initialCounts.set(trackId, { on: 0, total: 0 });
    }

    for (const pattern of patterns) {
      for (const trackId of TRACK_IDS) {
        const track = pattern[trackId];

        // Count initial state (step 0)
        const counts = initialCounts.get(trackId)!;
        counts.total++;
        if (track[0]) {
          counts.on++;
        }

        // Count transitions
        const trackTransitions = transitionCounts.get(trackId)!;

        for (let step = 1; step < STEPS_PER_PATTERN; step++) {
          const prevState = this.encodeContext(pattern, trackId, step - 1);
          const currState = track[step] ? '1' : '0';

          if (!trackTransitions.has(prevState)) {
            trackTransitions.set(prevState, new Map());
          }

          const stateTransitions = trackTransitions.get(prevState)!;
          const count = stateTransitions.get(currState) ?? 0;
          stateTransitions.set(currState, count + 1);
        }
      }
    }

    // Convert counts to probabilities
    for (const trackId of TRACK_IDS) {
      const matrix = this.transitionMatrices.get(trackId)!;
      const trackTransitions = transitionCounts.get(trackId)!;

      for (const [prevState, transitions] of trackTransitions) {
        const total = Array.from(transitions.values()).reduce((a, b) => a + b, 0);
        const probabilities = new Map<string, number>();

        for (const [nextState, count] of transitions) {
          probabilities.set(nextState, count / total);
        }

        matrix.set(prevState, probabilities);
      }

      // Set initial probabilities
      const counts = initialCounts.get(trackId)!;
      this.initialProbabilities.set(
        trackId,
        counts.total > 0 ? counts.on / counts.total : 0
      );
    }
  }

  getTransitionProbability(
    currentPattern: GridState,
    trackId: TrackId,
    step: number
  ): number {
    if (step === 0) {
      return this.initialProbabilities.get(trackId) ?? 0;
    }

    const matrix = this.transitionMatrices.get(trackId);
    if (!matrix) {
      return 0.5;
    }

    const prevContext = this.encodeContext(currentPattern, trackId, step - 1);
    const transitions = matrix.get(prevContext);

    if (!transitions) {
      // No training data for this context, return uniform probability
      return 0.5;
    }

    return transitions.get('1') ?? 0;
  }

  private encodeContext(
    pattern: GridState,
    trackId: TrackId,
    step: number
  ): string {
    // Encode the context: current track's previous state + related tracks' states
    const parts: string[] = [];

    // Own previous state
    parts.push(pattern[trackId][step] ? '1' : '0');

    // For kick and snare, they influence each other
    if (trackId === 'kick') {
      parts.push(pattern.snare[step] ? '1' : '0');
    } else if (trackId === 'snare') {
      parts.push(pattern.kick[step] ? '1' : '0');
    }

    // Hi-hats influence each other
    if (trackId === 'closedHH') {
      parts.push(pattern.openHH[step] ? '1' : '0');
    } else if (trackId === 'openHH') {
      parts.push(pattern.closedHH[step] ? '1' : '0');
    }

    return parts.join('');
  }

  isTrainedSufficiently(): boolean {
    return this.trainedPatternCount >= 5;
  }

  getTrainedPatternCount(): number {
    return this.trainedPatternCount;
  }
}
