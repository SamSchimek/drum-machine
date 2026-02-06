import { useDrumMachine } from '../../context/DrumMachineContext';
import { MIN_PATTERNS_FOR_GENERATION } from '../../constants';
import './GeneratePanel.css';

export function GeneratePanel() {
  const { canGenerate, patterns, generatePattern } = useDrumMachine();
  const patternsNeeded = MIN_PATTERNS_FOR_GENERATION - patterns.length;

  return (
    <div className="generate-panel">
      <div className="panel-screws" aria-hidden="true">
        <span className="screw screw-tl" />
        <span className="screw screw-tr" />
        <span className="screw screw-bl" />
        <span className="screw screw-br" />
      </div>
      <div className="generate-header">
        <h3>AI Generator</h3>
        <span className="pattern-count">
          {patterns.length}/{MIN_PATTERNS_FOR_GENERATION} patterns
        </span>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${Math.min(100, (patterns.length / MIN_PATTERNS_FOR_GENERATION) * 100)}%`,
          }}
        />
      </div>

      {!canGenerate && (
        <p className="hint">
          Save {patternsNeeded} more pattern{patternsNeeded !== 1 ? 's' : ''} to train the AI
        </p>
      )}

      <button
        className="generate-button"
        onClick={generatePattern}
        disabled={!canGenerate}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z" />
        </svg>
        Generate Pattern
      </button>

      <p className="description">
        The AI learns from your saved patterns using Markov chains and musical rules to generate new rhythms.
      </p>
    </div>
  );
}
