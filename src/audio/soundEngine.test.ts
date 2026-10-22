import { describe, expect, it, vi, beforeEach } from 'vitest';

class MockAudioContext {
  state: 'suspended' | 'running' | 'interrupted' | 'closed' = 'suspended';
  currentTime: number = 0;
  sampleRate: number = 44100;
  destination = {};
  onstatechange: (() => void) | null = null;

  async resume() {
    this.state = 'running';
    if (this.onstatechange) this.onstatechange();
  }

  async suspend() {
    this.state = 'suspended';
    if (this.onstatechange) this.onstatechange();
  }

  async close() {
    this.state = 'closed';
    if (this.onstatechange) this.onstatechange();
  }

  createBuffer(channels: number, length: number, sampleRate: number) {
    return {
      channels,
      length,
      sampleRate,
      getChannelData: () => new Float32Array(length),
    };
  }

  createBufferSource() {
    return {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  createOscillator() {
    return {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  createGain() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
  }

  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: {
        setValueAtTime: vi.fn(),
      },
      Q: {
        setValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
  }
}

describe('SoundEngine mobile & interruption resilience', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (globalThis as unknown as { window: unknown }).window = {
      AudioContext: MockAudioContext,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    (globalThis as unknown as { document: unknown }).document = {
      visibilityState: 'visible',
      addEventListener: vi.fn(),
      getElementById: vi.fn().mockReturnValue(null),
    };
  });

  it('exposes sound settings and volume controls', async () => {
    const { sounds } = await import('./soundEngine');
    sounds.setMuted(true);
    sounds.setVolume(0.5);
    // Should not throw
    sounds.playClick();
    sounds.playDiceRoll();

    sounds.setMuted(false);
    sounds.setVolume(1.0);
    expect(sounds.getState()).toBeDefined();
  });

  it('recreates AudioContext cleanly when interrupted or requested', async () => {
    const { sounds } = await import('./soundEngine');
    const ctx1 = sounds.recreateContext();
    expect(ctx1).not.toBeNull();
    expect(sounds.getState()).toBe('running');

    // Simulate mobile alarm interrupting the context
    (ctx1 as unknown as MockAudioContext).state = 'interrupted';
    expect(sounds.getState()).toBe('interrupted');

    // Tapping / requesting recreation should generate a fresh running context
    const ctx2 = sounds.recreateContext();
    expect(ctx2).not.toBeNull();
    expect(ctx2).not.toBe(ctx1);
    expect(sounds.getState()).toBe('running');
  });

  it('recovers gracefully via recoverAudio and unlock after an interruption', async () => {
    const { sounds } = await import('./soundEngine');
    const ctx = sounds.recreateContext();
    (ctx as unknown as MockAudioContext).state = 'interrupted';

    await sounds.recoverAudio();
    expect(sounds.getState()).toBe('running');

    sounds.unlock();
    expect(sounds.isAudioUnlocked()).toBe(true);
  });

  it('plays all synthesized sound effects successfully on running context', async () => {
    const { sounds } = await import('./soundEngine');
    sounds.setMuted(false);
    sounds.setVolume(0.8);

    expect(() => {
      sounds.playDiceRoll();
      sounds.playCheckerMove();
      sounds.playCheckerHit();
      sounds.playBearOff();
      sounds.playDaviCall();
      sounds.playWinFanfare();
      sounds.playClick();
    }).not.toThrow();
  });
});
