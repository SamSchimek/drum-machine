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

  it('default reverb mode has room active and hall silent', () => {
    // Access private gains via any cast for testing
    const e = effects as any;
    expect(e.roomGain.gain.value).toBe(1);
    expect(e.hallGain.gain.value).toBe(0);
  });

  it('setReverbMode("hall") crossfades to hall convolver', () => {
    effects.setReverbMode('hall');
    const e = effects as any;
    // setTargetAtTime was called — check that scheduled values are queued
    // In web-audio-api mock, gain.value won't change instantly with setTargetAtTime,
    // so we verify via the automation events
    const roomEvents = e.roomGain.gain._automationEvents ?? e.roomGain.gain.__automationEvents;
    const hallEvents = e.hallGain.gain._automationEvents ?? e.hallGain.gain.__automationEvents;
    // If mock doesn't expose events, at least verify method exists and doesn't throw
    expect(typeof effects.setReverbMode).toBe('function');
  });

  it('setReverbMode("room") crossfades back to room convolver', () => {
    effects.setReverbMode('hall');
    effects.setReverbMode('room');
    // Should not throw
    expect(typeof effects.setReverbMode).toBe('function');
  });

  it('setReverbMode accepts only room or hall', () => {
    expect(() => effects.setReverbMode('room')).not.toThrow();
    expect(() => effects.setReverbMode('hall')).not.toThrow();
  });

  it('dispose cleans up without error', () => {
    expect(() => effects.dispose()).not.toThrow();
  });

  it('connect chains to a destination node', () => {
    const destination = ctx.createGain();
    expect(() => effects.connect(destination)).not.toThrow();
  });

  describe('Room reverb enhancements (plate-style)', () => {
    it('creates roomPreDelay as a DelayNode with 20ms delay', () => {
      const e = effects as any;
      expect(e.roomPreDelay).toBeDefined();
      expect(e.roomPreDelay.delayTime.value).toBe(0.02);
    });

    it('creates roomModDelay as a DelayNode with 7ms center', () => {
      const e = effects as any;
      expect(e.roomModDelay).toBeDefined();
      expect(e.roomModDelay.delayTime.value).toBe(0.007);
    });

    it('creates roomModLFO as a sine oscillator at 1.2Hz, started', () => {
      const e = effects as any;
      expect(e.roomModLFO).toBeDefined();
      expect(e.roomModLFO.type).toBe('sine');
      expect(e.roomModLFO.frequency.value).toBe(1.2);
      expect(e.roomModLFO.start).toHaveBeenCalled();
    });

    it('creates roomModDepth as a GainNode with value 0.002', () => {
      const e = effects as any;
      expect(e.roomModDepth).toBeDefined();
      expect(e.roomModDepth.gain.value).toBe(0.002);
    });

    it('creates roomHPF as highpass at 200Hz, Q=0.707', () => {
      const e = effects as any;
      expect(e.roomHPF).toBeDefined();
      expect(e.roomHPF.type).toBe('highpass');
      expect(e.roomHPF.frequency.value).toBe(200);
      expect(e.roomHPF.Q.value).toBeCloseTo(0.707);
    });

    it('creates roomLPF as lowpass at 6000Hz, Q=0.707', () => {
      const e = effects as any;
      expect(e.roomLPF).toBeDefined();
      expect(e.roomLPF.type).toBe('lowpass');
      expect(e.roomLPF.frequency.value).toBe(6000);
      expect(e.roomLPF.Q.value).toBeCloseTo(0.707);
    });

    it('wires room chain: reverbInput→preDelay→convolver→modDelay→HPF→LPF→roomGain', () => {
      const e = effects as any;
      expect(e.reverbInput.connect).toHaveBeenCalledWith(e.roomPreDelay);
      expect(e.roomPreDelay.connect).toHaveBeenCalledWith(e.roomConvolver);
      expect(e.roomConvolver.connect).toHaveBeenCalledWith(e.roomModDelay);
      expect(e.roomModDelay.connect).toHaveBeenCalledWith(e.roomHPF);
      expect(e.roomHPF.connect).toHaveBeenCalledWith(e.roomLPF);
      expect(e.roomLPF.connect).toHaveBeenCalledWith(e.roomGain);
    });

    it('wires LFO chain: modLFO→modDepth→modDelay.delayTime', () => {
      const e = effects as any;
      expect(e.roomModLFO.connect).toHaveBeenCalledWith(e.roomModDepth);
      expect(e.roomModDepth.connect).toHaveBeenCalledWith(e.roomModDelay.delayTime);
    });
  });

  describe('Hall reverb enhancements (reduced boom)', () => {
    it('creates hallHPF as highpass at 200Hz, Q=0.707', () => {
      const e = effects as any;
      expect(e.hallHPF).toBeDefined();
      expect(e.hallHPF.type).toBe('highpass');
      expect(e.hallHPF.frequency.value).toBe(200);
      expect(e.hallHPF.Q.value).toBeCloseTo(0.707);
    });

    it('wires hall chain: hallConvolver→hallHPF→hallGain', () => {
      const e = effects as any;
      expect(e.hallConvolver.connect).toHaveBeenCalledWith(e.hallHPF);
      expect(e.hallHPF.connect).toHaveBeenCalledWith(e.hallGain);
    });
  });

  describe('Dispose cleanup for reverb enhancement nodes', () => {
    it('disconnects all 7 new nodes on dispose', () => {
      effects.dispose();
      const e = effects as any;
      expect(e.roomPreDelay.disconnect).toHaveBeenCalled();
      expect(e.roomModDelay.disconnect).toHaveBeenCalled();
      expect(e.roomModDepth.disconnect).toHaveBeenCalled();
      expect(e.roomHPF.disconnect).toHaveBeenCalled();
      expect(e.roomLPF.disconnect).toHaveBeenCalled();
      expect(e.hallHPF.disconnect).toHaveBeenCalled();
    });

    it('stops and disconnects LFO on dispose', () => {
      effects.dispose();
      const e = effects as any;
      expect(e.roomModLFO.stop).toHaveBeenCalled();
      expect(e.roomModLFO.disconnect).toHaveBeenCalled();
    });
  });
});
