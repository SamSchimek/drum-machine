import type { TrackId } from '../../types';
import { TRACK_NAMES } from '../../types';
import { STEPS_PER_PATTERN, TRACK_COLORS } from '../../constants';
import { GridCell } from './GridCell';
import './Grid.css';

// Shortened names for display
const SHORT_NAMES: Record<TrackId, string> = {
  kick: 'Kick',
  snare: 'Snare',
  closedHH: 'Cl. HH',
  openHH: 'Op. HH',
  clap: 'Clap',
  tomLow: 'Tom L',
  tomMid: 'Tom M',
  tomHigh: 'Tom H',
  rimshot: 'Rim',
  cowbell: 'Cowbell',
  clave: 'Clave',
  maracas: 'Maracas',
};

interface GridRowProps {
  trackId: TrackId;
  steps: boolean[];
  currentStep: number;
  isPlaying: boolean;
  isMuted: boolean;
  onToggle: (step: number) => void;
  onTrigger: () => void;
  onMuteToggle: () => void;
}

export function GridRow({
  trackId,
  steps,
  currentStep,
  isPlaying,
  isMuted,
  onToggle,
  onTrigger,
  onMuteToggle,
}: GridRowProps) {
  return (
    <div className="grid-row" data-track={trackId}>
      <div className="track-controls">
        <button
          className="track-label"
          onClick={onTrigger}
          style={{ '--track-color': TRACK_COLORS[trackId] } as React.CSSProperties}
          title={`Preview ${TRACK_NAMES[trackId]}`}
        >
          {SHORT_NAMES[trackId]}
        </button>
        <button
          className={`mute-button ${isMuted ? 'muted' : ''}`}
          onClick={onMuteToggle}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          M
        </button>
      </div>
      <div className="grid-cells">
        {Array.from({ length: STEPS_PER_PATTERN }, (_, step) => (
          <GridCell
            key={step}
            trackId={trackId}
            step={step}
            active={steps[step]}
            isCurrentStep={isPlaying && currentStep === step}
            onClick={() => onToggle(step)}
          />
        ))}
      </div>
    </div>
  );
}
