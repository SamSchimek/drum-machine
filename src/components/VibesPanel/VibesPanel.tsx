import { useDrumMachine } from '../../context/DrumMachineContext';
import { Knob } from '../Knob/Knob';
import './VibesPanel.css';

export function VibesPanel() {
  const { reverb, warmth, lofi, vibesOpen, setReverb, setWarmth, setLofi, setVibesOpen } = useDrumMachine();

  const toggle = () => setVibesOpen(!vibesOpen);

  return (
    <div className={`vibes-panel ${vibesOpen ? 'open' : ''}`}>
      {/* Standard panel screws — always visible on outer panel */}
      <div className="panel-screws" aria-hidden="true">
        <span className="screw screw-tl" />
        <span className="screw screw-tr" />
        <span className="screw screw-bl" />
        <span className="screw screw-br" />
      </div>

      {/* Fixed header — VIBES + latch, always clickable */}
      <button
        className="vibes-header"
        onClick={toggle}
        aria-expanded={vibesOpen}
        aria-label="VIBES"
      >
        <span className="vibes-title">VIBES</span>
        <div className={`vibes-latch ${vibesOpen ? 'unlatched' : ''}`}>
          <div className="vibes-latch-bar" />
        </div>
      </button>

      {/* Recessed well — always visible as inset cavity */}
      <div className="vibes-well">
        {/* Knobs — inside the well, behind door */}
        {/* @ts-expect-error inert is valid HTML but missing from React types */}
        <div className="vibes-knobs" data-testid="vibes-knobs" aria-hidden={!vibesOpen} inert={!vibesOpen ? '' : undefined}>
          <div className="vibes-knob-group">
            <div className={`vibes-knob-well${reverb > 0 ? ' lit' : ''}`}>
              <div className="vibes-knob-glow" />
              <Knob value={reverb} min={0} max={100} onChange={setReverb} label="Reverb" size={46} spriteSheet="/knobs/Credence_128.png" />
            </div>
            <span className="vibes-knob-label">Reverb</span>
          </div>
          <div className="vibes-knob-group">
            <div className={`vibes-knob-well${warmth > 0 ? ' lit' : ''}`}>
              <div className="vibes-knob-glow" />
              <Knob value={warmth} min={0} max={100} onChange={setWarmth} label="Warmth" size={46} spriteSheet="/knobs/Bluesbreaker_128.png" />
            </div>
            <span className="vibes-knob-label">Warmth</span>
          </div>
          <div className="vibes-knob-group">
            <div className={`vibes-knob-well${lofi > 0 ? ' lit' : ''}`}>
              <div className="vibes-knob-glow" />
              <Knob value={lofi} min={0} max={100} onChange={setLofi} label="Lo-fi" size={46} spriteSheet="/knobs/FStyle_128.png" />
            </div>
            <span className="vibes-knob-label">Lo-fi</span>
          </div>
        </div>

        {/* Sliding metal door — inside the well */}
        <div className="vibes-door" aria-hidden="true" />
      </div>
    </div>
  );
}
