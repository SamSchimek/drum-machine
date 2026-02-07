import { describe, it, expect, beforeEach } from 'vitest';
import { VibesEffects } from '../src/audio/VibesEffects';

describe('VibesEffects', () => {
  let ctx: AudioContext;
  let effects: VibesEffects;

  beforeEach(() => {
    ctx = new AudioContext();
    effects = new VibesEffects(ctx);
  });

  it('creates all required nodes on init', () => {
    // Should expose input and be connectable
    expect(effects.getInput()).toBeDefined();
    expect(typeof effects.connect).toBe('function');
  });

  it('setReverb accepts 0-100 range', () => {
    expect(() => effects.setReverb(0)).not.toThrow();
    expect(() => effects.setReverb(50)).not.toThrow();
    expect(() => effects.setReverb(100)).not.toThrow();
  });

  it('setWarmth accepts 0-100 range', () => {
    expect(() => effects.setWarmth(0)).not.toThrow();
    expect(() => effects.setWarmth(50)).not.toThrow();
    expect(() => effects.setWarmth(100)).not.toThrow();
  });

  it('setLofi accepts 0-100 range', () => {
    expect(() => effects.setLofi(0)).not.toThrow();
    expect(() => effects.setLofi(50)).not.toThrow();
    expect(() => effects.setLofi(100)).not.toThrow();
  });

  it('dispose cleans up without error', () => {
    expect(() => effects.dispose()).not.toThrow();
  });

  it('connect chains to a destination node', () => {
    const destination = ctx.createGain();
    expect(() => effects.connect(destination)).not.toThrow();
  });
});
