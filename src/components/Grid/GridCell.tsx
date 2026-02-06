import type { TrackId } from '../../types';
import { TRACK_COLORS } from '../../constants';
import { useTutorial } from '../../context/TutorialContext';
import './Grid.css';

interface GridCellProps {
  trackId: TrackId;
  step: number;
  active: boolean;
  isCurrentStep: boolean;
  onClick: () => void;
}

export function GridCell({ trackId, step, active, isCurrentStep, onClick }: GridCellProps) {
  const { isActive: tutorialActive, isCellRequired, onCellToggle } = useTutorial();

  const color = TRACK_COLORS[trackId];
  const isDownbeat = step % 4 === 0;
  const isBeatEnd = step % 4 === 3;
  const isBarEnd = step === 15;
  const isBarStart = false;
  const isTarget = tutorialActive && isCellRequired(trackId, step);

  const classNames = [
    'grid-cell',
    active && 'active',
    isCurrentStep && 'current',
    isDownbeat && 'downbeat',
    isBeatEnd && !isBarEnd && 'beat-end',
    isBarEnd && 'bar-end',
    isBarStart && 'bar-start',
    isTarget && 'tutorial-target',
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    const willBeActive = !active;
    onClick();
    onCellToggle(trackId, step, willBeActive);
  };

  return (
    <button
      className={classNames}
      style={{
        '--track-color': color,
        '--track-color-dim': `${color}28`,
      } as React.CSSProperties}
      onClick={handleClick}
      data-testid={`cell-${trackId}-${step}`}
      aria-label={`${trackId} step ${step + 1} ${active ? 'active' : 'inactive'}`}
      aria-pressed={active}
    />
  );
}
