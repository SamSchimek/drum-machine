import { useRef, useCallback, useEffect } from 'react';
import './Knob.css';

export interface KnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  size?: number;
  label?: string;
  step?: number;
  largeStep?: number;
}

export function Knob({
  value,
  min,
  max,
  onChange,
  size = 64,
  label,
  step = 1,
  largeStep = 10,
}: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const dragStartValue = useRef<number>(value);

  const clamp = useCallback(
    (val: number) => Math.min(max, Math.max(min, val)),
    [min, max]
  );

  // Calculate rotation angle (from -135 to 135 degrees, 270 degree range)
  const range = max - min;
  const normalized = (value - min) / range;
  const rotation = -135 + normalized * 270;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let newValue = value;

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowRight':
          newValue = clamp(value + step);
          break;
        case 'ArrowDown':
        case 'ArrowLeft':
          newValue = clamp(value - step);
          break;
        case 'PageUp':
          newValue = clamp(value + largeStep);
          break;
        case 'PageDown':
          newValue = clamp(value - largeStep);
          break;
        case 'Home':
          newValue = min;
          break;
        case 'End':
          newValue = max;
          break;
        default:
          return;
      }

      e.preventDefault();
      onChange(newValue);
    },
    [value, min, max, step, largeStep, onChange, clamp]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragStartY.current = e.clientY;
      dragStartValue.current = value;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [value]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragStartY.current === null) return;

      const deltaY = dragStartY.current - e.clientY;
      const sensitivity = range / 150; // Full range over 150px of drag
      const newValue = clamp(
        Math.round(dragStartValue.current + deltaY * sensitivity)
      );
      onChange(newValue);
    },
    [range, clamp, onChange]
  );

  const handleMouseUp = useCallback(() => {
    dragStartY.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      dragStartY.current = touch.clientY;
      dragStartValue.current = value;
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    },
    [value]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (dragStartY.current === null) return;
      e.preventDefault();

      const touch = e.touches[0];
      const deltaY = dragStartY.current - touch.clientY;
      const sensitivity = range / 150;
      const newValue = clamp(
        Math.round(dragStartValue.current + deltaY * sensitivity)
      );
      onChange(newValue);
    },
    [range, clamp, onChange]
  );

  const handleTouchEnd = useCallback(() => {
    dragStartY.current = null;
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  }, [handleTouchMove]);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div
      ref={knobRef}
      role="slider"
      tabIndex={0}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-label={label}
      className="knob"
      style={{ width: size, height: size }}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="knob-body">
        <div
          className="knob-indicator"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      </div>
      <div className="knob-value">{value}</div>
    </div>
  );
}
