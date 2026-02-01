import { TRACK_IDS } from '../../types';
import { STEPS_PER_PATTERN } from '../../constants';
import { useDrumMachine } from '../../context/DrumMachineContext';
import { GridRow } from './GridRow';
import './Grid.css';

export function Grid() {
  const {
    grid,
    currentStep,
    isPlaying,
    mutedTracks,
    toggleCell,
    triggerSound,
    toggleMute,
  } = useDrumMachine();

  return (
    <div className="grid-container" data-testid="grid">
      <div className="step-indicators">
        <div className="track-label-spacer" />
        <div className="indicators">
          {Array.from({ length: STEPS_PER_PATTERN }, (_, step) => {
            const isDownbeat = step % 4 === 0;
            const isBeatEnd = step % 4 === 3;
            const isActive = isPlaying && currentStep === step;

            const classNames = [
              'step-indicator',
              isActive && 'active',
              isDownbeat && 'downbeat',
              isBeatEnd && 'beat-end',
            ].filter(Boolean).join(' ');

            return (
              <div key={step} className={classNames}>
                {step + 1}
              </div>
            );
          })}
        </div>
      </div>
      {TRACK_IDS.map((trackId) => (
        <GridRow
          key={trackId}
          trackId={trackId}
          steps={grid[trackId]}
          currentStep={currentStep}
          isPlaying={isPlaying}
          isMuted={mutedTracks[trackId]}
          onToggle={(step) => toggleCell(trackId, step)}
          onTrigger={() => triggerSound(trackId)}
          onMuteToggle={() => toggleMute(trackId)}
        />
      ))}
    </div>
  );
}
