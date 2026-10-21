class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser policies
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  /**
   * Generates realistic wooden dice rattle sound.
   */
  public playDiceRoll() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const bounces = 5;

    for (let i = 0; i < bounces; i++) {
      const delay = i * 0.06 + Math.random() * 0.02;
      const t = now + delay;

      // Noise impulse for impact
      const bufferSize = ctx.sampleRate * 0.03;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.2));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800 + Math.random() * 600, t);
      filter.Q.setValueAtTime(3, t);

      const gain = ctx.createGain();
      const intensity = (1 - i / bounces) * 0.7 * this.volume;
      gain.gain.setValueAtTime(intensity, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(t);
      noise.stop(t + 0.05);
    }
  }

  /**
   * Deep, satisfying resonant clack of a solid wooden checker hitting the board.
   */
  public playCheckerMove() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // 1. Low wood resonance (Oscillator)
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.06);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.6 * this.volume, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);

    // 2. High wood tap click
    const clickBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.015, ctx.sampleRate);
    const clickData = clickBuffer.getChannelData(0);
    for (let i = 0; i < clickBuffer.length; i++) {
      clickData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (clickBuffer.length * 0.25));
    }
    const clickSource = ctx.createBufferSource();
    clickSource.buffer = clickBuffer;

    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = 'highpass';
    clickFilter.frequency.setValueAtTime(1400, t);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.4 * this.volume, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

    clickSource.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickSource.start(t);
    clickSource.stop(t + 0.025);
  }

  /**
   * Sharp, energetic double-click of hitting an opponent's checker.
   */
  public playCheckerHit() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // First sharp hit
    this.playCheckerMove();

    // Second bounce hit 40ms later with higher pitch
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, t + 0.04);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.1);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t + 0.04);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5 * this.volume, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t + 0.04);
    osc.stop(t + 0.13);
  }

  /**
   * Smooth sliding clink when a checker is borne off the board.
   */
  public playBearOff() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(540, t + 0.12);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  /**
   * Dramatic, bold chime when Davi / Se / Chari is declared.
   */
  public playDaviCall() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    // Dramatic gong / triad chord
    const freqs = [220, 277.18, 329.63, 440]; // A major chord

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime((0.35 / (idx + 1)) * this.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 1.3);
    });
  }

  /**
   * Georgian celebratory fanfare chords on victory!
   */
  public playWinFanfare() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    // Ascending celebratory notes
    const notes = [
      { f: 261.63, delay: 0.0 },   // C4
      { f: 329.63, delay: 0.15 },  // E4
      { f: 392.00, delay: 0.30 },  // G4
      { f: 523.25, delay: 0.45 },  // C5 (held longer)
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, t + n.delay);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4 * this.volume, t + n.delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.delay + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + n.delay);
      osc.stop(t + n.delay + 0.6);
    });
  }

  /**
   * Subtle UI click.
   */
  public playClick() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.03);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  }
}

export const sounds = new SoundEngine();
