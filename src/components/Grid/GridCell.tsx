import type { TrackId } from '../../types';
import { TRACK_COLORS } from '../../constants';
import './Grid.css';

interface GridCellProps {
  trackId: TrackId;
  step: number;
  active: boolean;
  isCurrentStep: boolean;
  onClick: () => void;
}

export function GridCell({ trackId, step, active, isCurrentStep, onClick }: GridCellProps) {
  const color = TRACK_COLORS[trackId];
  const isDownbeat = step % 4 === 0;
  const isBeatEnd = step % 4 === 3;
  const isBarEnd = step === 15;
  const isBarStart = false;

  const classNames = [
    'grid-cell',
    active && 'active',
    isCurrentStep && 'current',
    isDownbeat && 'downbeat',
    isBeatEnd && !isBarEnd && 'beat-end',
    isBarEnd && 'bar-end',
    isBarStart && 'bar-start',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classNames}
      style={{
        '--track-color': color,
        '--track-color-dim': `${color}40`,
      } as React.CSSProperties}
      onClick={onClick}
      data-testid={`cell-${trackId}-${step}`}
      aria-label={`${trackId} step ${step + 1} ${active ? 'active' : 'inactive'}`}
      aria-pressed={active}
    />
  );
}
