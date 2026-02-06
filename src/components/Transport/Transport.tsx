import { useDrumMachine } from '../../context/DrumMachineContext';
import { useTutorial } from '../../context/TutorialContext';
import { MIN_TEMPO, MAX_TEMPO, MIN_SWING, MAX_SWING } from '../../constants';
import { Knob } from '../Knob/Knob';
import './Transport.css';

export function Transport() {
  const { isPlaying, tempo, volume, swing, play, stop, setTempo, setVolume, setSwing, resetTempo, clearGrid, loadStarterBeat } = useDrumMachine();
  const { onTempoReset, onSwingReset } = useTutorial();

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };

  const handleVolumeDoubleClick = () => {
    setVolume(0.8); // Reset to 80%
  };

  const handleTempoDoubleClick = () => {
    resetTempo();
    onTempoReset();
  };

  const handleSwingDoubleClick = () => {
    setSwing(0);
    onSwingReset();
  };

  return (
    <div className="transport">
      <div className="panel-screws" aria-hidden="true">
        <span className="screw screw-tl" />
        <span className="screw screw-tr" />
        <span className="screw screw-bl" />
        <span className="screw screw-br" />
      </div>
      <button
        className={`play-button ${isPlaying ? 'playing' : ''}`}
        onClick={isPlaying ? stop : play}
        aria-label={isPlaying ? 'Stop' : 'Play'}
        title="Space to play/stop"
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
        <label>BPM</label>
        <div className="tempo-knob-wrapper" onDoubleClick={handleTempoDoubleClick} title="Double-click to reset to 120">
          <Knob
            value={tempo}
            min={MIN_TEMPO}
            max={MAX_TEMPO}
            onChange={setTempo}
            label="Tempo"
            size={56}
            step={1}
            largeStep={10}
          />
        </div>
      </div>

      <div className="swing-control">
        <label>Swing</label>
        <div className="swing-knob-wrapper" onDoubleClick={handleSwingDoubleClick} title="Double-click to reset to Straight">
          <Knob
            value={swing}
            min={MIN_SWING}
            max={MAX_SWING}
            onChange={setSwing}
            label="Swing"
            size={56}
            step={1}
            largeStep={10}
          />
        </div>
        <div className="swing-presets">
          <button onClick={() => setSwing(0)} className={swing === 0 ? 'active' : ''}>Str</button>
          <button onClick={() => setSwing(50)} className={swing === 50 ? 'active' : ''}>Light</button>
          <button onClick={() => setSwing(66)} className={swing === 66 ? 'active' : ''}>Trip</button>
          <button onClick={() => setSwing(100)} className={swing === 100 ? 'active' : ''}>Heavy</button>
        </div>
      </div>

      <div className="volume-control" onDoubleClick={handleVolumeDoubleClick} title="Double-click to reset to 80%">
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
