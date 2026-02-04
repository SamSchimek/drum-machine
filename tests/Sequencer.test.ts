import { describe, it, expect, beforeEach } from 'vitest';
import { Sequencer } from '../src/audio/Sequencer';

describe('Sequencer Swing', () => {
  let sequencer: Sequencer;

  beforeEach(() => {
    sequencer = new Sequencer();
  });

  it('has default swing of 0', () => {
    expect(sequencer.getSwing()).toBe(0);
  });

  it('sets swing value', () => {
    sequencer.setSwing(50);
    expect(sequencer.getSwing()).toBe(50);
  });

  it('clamps swing to minimum 0', () => {
    sequencer.setSwing(-10);
    expect(sequencer.getSwing()).toBe(0);
  });

  it('clamps swing to maximum 100', () => {
    sequencer.setSwing(150);
    expect(sequencer.getSwing()).toBe(100);
  });

  it('returns 0 offset for on-beat steps (even steps)', () => {
    sequencer.setSwing(66);
    expect(sequencer.getSwingOffset(0)).toBe(0);
    expect(sequencer.getSwingOffset(2)).toBe(0);
    expect(sequencer.getSwingOffset(4)).toBe(0);
    expect(sequencer.getSwingOffset(8)).toBe(0);
  });

  it('returns positive offset for off-beat steps (odd steps)', () => {
    sequencer.setTempo(120);
    sequencer.setSwing(66);
    // At 120 BPM: secondsPerBeat = 0.5s, secondsPerStep = 0.125s
    // offset = (66/100) * 0.125 * 0.5 = 0.04125 (triplet feel)
    const offset = sequencer.getSwingOffset(1);
    expect(offset).toBeCloseTo(0.04125, 4);
  });

  it('returns 0 offset when swing is 0', () => {
    sequencer.setTempo(120);
    sequencer.setSwing(0);
    expect(sequencer.getSwingOffset(1)).toBe(0);
    expect(sequencer.getSwingOffset(3)).toBe(0);
  });

  it('scales offset with swing amount', () => {
    sequencer.setTempo(120);

    sequencer.setSwing(50);
    const offset50 = sequencer.getSwingOffset(1);

    sequencer.setSwing(100);
    const offset100 = sequencer.getSwingOffset(1);

    // offset100 should be twice offset50
    expect(offset100).toBeCloseTo(offset50 * 2, 4);
  });
});
