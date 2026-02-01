import { describe, it, expect, beforeEach } from 'vitest';
import { AudioEngine } from '../src/audio/AudioEngine';

describe('AudioEngine', () => {
  let engine: AudioEngine;

  beforeEach(() => {
    engine = new AudioEngine();
  });

  it('initializes AudioContext and synths', async () => {
    await engine.initialize();
    expect(engine.context).not.toBeNull();
    expect(engine.context!.state).toBe('running');
    expect(engine.synths.size).toBe(12);
  });

  it('creates all 12 drum synths', async () => {
    await engine.initialize();

    const expectedSynths = [
      'kick', 'snare', 'closedHH', 'openHH', 'clap',
      'tomLow', 'tomMid', 'tomHigh', 'rimshot', 'cowbell', 'clave', 'maracas'
    ];

    for (const synthName of expectedSynths) {
      expect(engine.synths.has(synthName as any)).toBe(true);
    }
  });

  it('can trigger sounds without error', async () => {
    await engine.initialize();
    expect(() => engine.triggerSound('kick')).not.toThrow();
    expect(() => engine.triggerSound('snare')).not.toThrow();
  });

  it('can dispose properly', async () => {
    await engine.initialize();
    engine.dispose();
    expect(engine.context).toBeNull();
    expect(engine.synths.size).toBe(0);
  });

  it('does not reinitialize if already initialized', async () => {
    await engine.initialize();
    const context = engine.context;
    await engine.initialize();
    expect(engine.context).toBe(context);
  });
});
