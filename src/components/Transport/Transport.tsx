import { useState } from 'react';
import { useDrumMachine } from '../../context/DrumMachineContext';
import { MIN_TEMPO, MAX_TEMPO, MIN_SWING, MAX_SWING } from '../../constants';
import './Transport.css';

export function Transport() {
  const { isPlaying, tempo, volume, swing, play, stop, setTempo, setVolume, setSwing, resetTempo, clearGrid, loadStarterBeat } = useDrumMachine();
  const [isEditingTempo, setIsEditingTempo] = useState(false);
  const [tempoInput, setTempoInput] = useState(String(tempo));

  const handleTempoSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempo(Number(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };

  const handleSwingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSwing(Number(e.target.value));
  };

  const handlePlayDoubleClick = () => {
    resetTempo();
  };

  const handleTempoClick = () => {
    setTempoInput(String(tempo));
    setIsEditingTempo(true);
  };

  const handleTempoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempoInput(e.target.value);
  };

  const handleTempoInputBlur = () => {
    const value = parseInt(tempoInput, 10);
    if (!isNaN(value)) {
      setTempo(Math.max(MIN_TEMPO, Math.min(MAX_TEMPO, value)));
    }
    setIsEditingTempo(false);
  };

  const handleTempoInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTempoInputBlur();
    } else if (e.key === 'Escape') {
      setIsEditingTempo(false);
    }
  };

  return (
    <div className="transport">
      <button
        className={`play-button ${isPlaying ? 'playing' : ''}`}
        onClick={isPlaying ? stop : play}
        onDoubleClick={handlePlayDoubleClick}
        aria-label={isPlaying ? 'Stop' : 'Play'}
        title="Space to play/stop. Double-click to reset tempo"
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <polygon points="8,5 20,12 8,19" />
          </svg>
        )}
      </button>

      <div className="keyboard-hint">
        <kbd>Space</kbd> to play/stop
      </div>

      <div className="tempo-control">
        <label htmlFor="tempo">BPM</label>
        {isEditingTempo ? (
          <input
            type="number"
            className="tempo-input"
            value={tempoInput}
            onChange={handleTempoInputChange}
            onBlur={handleTempoInputBlur}
            onKeyDown={handleTempoInputKeyDown}
            min={MIN_TEMPO}
            max={MAX_TEMPO}
            autoFocus
          />
        ) : (
          <button className="tempo-value" onClick={handleTempoClick} title="Click to edit">
            {tempo}
          </button>
        )}
        <input
          id="tempo"
          type="range"
          min={MIN_TEMPO}
          max={MAX_TEMPO}
          value={tempo}
          onChange={handleTempoSliderChange}
          className="tempo-slider"
        />
      </div>

      <div className="swing-control">
        <label htmlFor="swing">Swing</label>
        <div className="swing-slider-container">
          <input
            id="swing"
            type="range"
            min={MIN_SWING}
            max={MAX_SWING}
            value={swing}
            onChange={handleSwingChange}
            className="swing-slider"
            aria-label="Swing"
          />
          <div className="swing-notches">
            <button className={`swing-notch ${swing === 0 ? 'active' : ''}`} onClick={() => setSwing(0)} title="Straight">|</button>
            <button className={`swing-notch ${swing === 50 ? 'active' : ''}`} onClick={() => setSwing(50)} title="Light shuffle">|</button>
            <button className={`swing-notch ${swing === 66 ? 'active' : ''}`} onClick={() => setSwing(66)} title="Triplet">|</button>
            <button className={`swing-notch ${swing === 100 ? 'active' : ''}`} onClick={() => setSwing(100)} title="Heavy">|</button>
          </div>
          <div className="swing-labels">
            <span onClick={() => setSwing(0)}>Str</span>
            <span onClick={() => setSwing(50)}>Light</span>
            <span onClick={() => setSwing(66)}>Trip</span>
            <span onClick={() => setSwing(100)}>Heavy</span>
          </div>
        </div>
      </div>

      <div className="volume-control">
        <label htmlFor="volume">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        </label>
        <input
          id="volume"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
        <span className="volume-value">{Math.round(volume * 100)}%</span>
      </div>

      <button
        className="starter-beat-button"
        onClick={loadStarterBeat}
        aria-label="Load starter beat"
        title="Load a random starter pattern"
      >
        Starter Beat
      </button>

      <button className="clear-button" onClick={clearGrid} aria-label="Clear pattern">
        Clear
      </button>
    </div>
  );
}
