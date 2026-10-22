/**
 * High-performance, mobile-resilient Web Audio Sound Engine.
 *
 * Specially engineered for iOS Safari / WebKit & Android Chrome to survive:
 * - Mobile alarm rings (Clock app)
 * - Incoming phone / FaceTime calls
 * - Siri activations
 * - App switching, locking/unlocking screen, and background tab transitions
 *
 * Implements:
 * 1. Persistent (never-removed) user gesture listeners (touchstart, touchend, pointerdown, click, keydown).
 * 2. Automatic recovery from WebKit 'interrupted' state.
 * 3. Safe AudioContext recreation (respecting the WebKit 4-context limit by closing dead instances).
 * 4. Inaudible buffer warm-up on every unlock/recovery to un-gate hardware channels.
 * 5. Proactive suspension on hidden/pagehide and graceful auto-resume on visible/pageshow/focus.
 * 6. Companion silent HTML5 audio session anchor.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8;
  private isUnlocked: boolean = false;
  private silentAudioEl: HTMLAudioElement | null = null;
  private isRecreating: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // 1. Persistent User Interaction Listeners:
      // DO NOT remove these listeners! On mobile devices (iOS Safari / Android),
      // OS interruptions (alarms, phone calls) force the AudioContext into 'interrupted' or 'suspended'.
      // When the user returns to the game and touches the screen, these persistent listeners
      // immediately revive the audio session within the trusted user gesture call stack.
      const interactionEvents = ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'click', 'keydown'];
      const handleUserGesture = () => {
        this.handleUserInteraction();
      };

      interactionEvents.forEach((evt) => {
        window.addEventListener(evt, handleUserGesture, { capture: true, passive: true });
      });

      // 2. Page Lifecycle / Visibility Listeners:
      const handleAppVisible = () => {
        if (document.visibilityState === 'visible') {
          this.recoverAudio();
        } else if (document.visibilityState === 'hidden') {
          // Proactive suspend: puts the audio hardware safely to sleep before
          // WebKit/CoreAudio forcefully corrupts the AudioContext into a zombie state.
          if (this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend().catch(() => {});
          }
        }
      };

      document.addEventListener('visibilitychange', handleAppVisible);
      window.addEventListener('pageshow', () => this.recoverAudio());
      window.addEventListener('focus', () => this.recoverAudio());

      // 3. Initialize silent HTML5 companion audio
      this.initSilentAudio();
    }
  }

  /**
   * Initializes a hidden HTML5 Audio element with a 1-sample silent WAV.
   * On iOS Safari, playing an HTML5 audio snippet keeps the page's media session
   * active and tells iOS to hand audio focus right back to the browser when an alarm ends.
   */
  private initSilentAudio() {
    if (typeof window === 'undefined') return;
    try {
      if (!this.silentAudioEl) {
        const existing = document.getElementById('bg-audio-keepalive') as HTMLAudioElement | null;
        if (existing) {
          this.silentAudioEl = existing;
        } else if (typeof Audio !== 'undefined') {
          const audio = new Audio();
          audio.id = 'bg-audio-keepalive';
          audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
          audio.setAttribute('playsinline', 'true');
          audio.setAttribute('webkit-playsinline', 'true');
          audio.preload = 'auto';
          this.silentAudioEl = audio;
        }
      }
    } catch {
      // ignore
    }
  }

  /**
   * Primes the silent audio session during user interactions.
   */
  private primeSilentAudio() {
    if (!this.silentAudioEl) {
      this.initSilentAudio();
    }
    if (this.silentAudioEl) {
      try {
        const p = this.silentAudioEl.play();
        if (p !== undefined) {
          p.then(() => {
            this.silentAudioEl?.pause();
          }).catch(() => {});
        }
      } catch {
        // ignore
      }
    }
  }

  private getAudioContextClass(): typeof AudioContext | null {
    if (typeof window === 'undefined') return null;
    return (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext ||
      null
    );
  }

  private bindContextListeners(ctx: AudioContext) {
    ctx.onstatechange = () => {
      const state = ctx.state as string;
      if (state === 'running') {
        this.isUnlocked = true;
      } else if (state === 'interrupted' || state === 'suspended' || state === 'closed') {
        this.isUnlocked = false;
      }
    };
  }

  /**
   * Plays an inaudible 1-sample buffer to warm up the iOS audio session hardware.
   */
  private warmUp(ctx: AudioContext) {
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch {
      // ignore
    }
  }

  /**
   * Safely recreates the AudioContext by closing any existing dead context first
   * (avoiding WebKit's 4-context limit).
   */
  public recreateContext(): AudioContext | null {
    if (typeof window === 'undefined' || this.isRecreating) return this.ctx;
    this.isRecreating = true;

    try {
      if (this.ctx) {
        try {
          this.ctx.onstatechange = null;
          if (this.ctx.state !== 'closed') {
            this.ctx.close().catch(() => {});
          }
        } catch {
          // ignore
        }
        this.ctx = null;
      }

      const AudioCtx = this.getAudioContextClass();
      if (AudioCtx) {
        const newCtx = new AudioCtx();
        this.bindContextListeners(newCtx);

        const state = newCtx.state as string;
        if (state === 'suspended' || state === 'interrupted') {
          newCtx.resume().then(() => {
            this.isUnlocked = true;
            this.warmUp(newCtx);
          }).catch(() => {});
        } else if (state === 'running') {
          this.isUnlocked = true;
          this.warmUp(newCtx);
        }

        this.ctx = newCtx;
      }
    } catch {
      // ignore
    } finally {
      this.isRecreating = false;
    }

    return this.ctx;
  }

  /**
   * Called on every trusted user gesture (tap, click, key).
   * Checks whether the audio context is healthy and running; if interrupted or suspended,
   * immediately heals it within the active gesture.
   */
  private handleUserInteraction() {
    this.primeSilentAudio();

    if (!this.ctx || this.ctx.state === 'closed') {
      this.recreateContext();
      return;
    }

    const state = this.ctx.state as string;
    if (state === 'interrupted') {
      // Alarm/call interruption detected. Try resume; if not running, recreate immediately.
      this.ctx.resume().then(() => {
        if (this.ctx && (this.ctx.state as string) === 'running') {
          this.isUnlocked = true;
          this.warmUp(this.ctx);
        } else {
          this.recreateContext();
        }
      }).catch(() => {
        this.recreateContext();
      });
    } else if (state === 'suspended') {
      this.ctx.resume().then(() => {
        this.isUnlocked = true;
        if (this.ctx) this.warmUp(this.ctx);
      }).catch(() => {});
    } else if (state === 'running') {
      this.isUnlocked = true;
    }
  }

  public isAudioUnlocked(): boolean {
    return this.isUnlocked;
  }

  /**
   * Recovers audio when returning to the app or when audio settings are toggled.
   */
  public async recoverAudio(): Promise<void> {
    if (typeof window === 'undefined') return;

    this.primeSilentAudio();

    if (!this.ctx || this.ctx.state === 'closed') {
      this.recreateContext();
      return;
    }

    const state = this.ctx.state as string;
    if (state === 'running') {
      this.isUnlocked = true;
      return;
    }

    try {
      await this.ctx.resume();
      if ((this.ctx.state as string) === 'running') {
        this.isUnlocked = true;
        this.warmUp(this.ctx);
        return;
      }
    } catch {
      // Resume failed
    }

    // If still interrupted, closed, or not running, recreate fresh context
    if ((this.ctx.state as string) === 'interrupted' || (this.ctx.state as string) !== 'running') {
      this.recreateContext();
    }
  }

  public unlock() {
    this.recoverAudio();
  }

  public getState(): string {
    return this.ctx ? (this.ctx.state as string) : 'uninitialized';
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx || this.ctx.state === 'closed') {
      return this.recreateContext();
    }

    const state = this.ctx.state as string;

    // WebKit 'interrupted' state after alarm/call:
    // If we're inside a user gesture (like rolling dice or moving checker),
    // immediately recreate to obtain a live running context without delay.
    if (state === 'interrupted') {
      return this.recreateContext();
    }

    if (state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!muted) {
      this.recoverAudio();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.volume > 0.001 && !this.isMuted) {
      this.recoverAudio();
    }
  }

  /**
   * Generates realistic wooden dice rattle and multi-bounce acoustic sound.
   * Synchronized to match the 750ms 3D bounce trajectory keyframes.
   */
  public playDiceRoll() {
    if (this.isMuted || this.volume <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const safeVol = Math.max(0.001, this.volume);

    // Helper: Play a realistic crisp wooden impact click/resonance
    const playWoodImpact = (time: number, volumeScale: number, pitch = 850) => {
      // 1. Resonant wood impulse
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, time);
      osc.frequency.exponentialRampToValueAtTime(140, time + 0.045);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(Math.max(0.001, 0.5 * volumeScale * safeVol), time);
      oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.055);

      // 2. High-frequency wood tap click noise
      const bufferSize = Math.floor(ctx.sampleRate * 0.02);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.25));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200 + Math.random() * 400, time);
      filter.Q.setValueAtTime(4, time);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(Math.max(0.001, 0.6 * volumeScale * safeVol), time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(time);
      noise.stop(time + 0.04);
    };

    // Realistic throw & bounce schedule:
    // Shake / throw flick:
    playWoodImpact(now + 0.02, 0.4, 950);
    playWoodImpact(now + 0.07, 0.35, 1100);

    // Primary board impact 1 (~230ms):
    playWoodImpact(now + 0.23, 1.0, 780);
    playWoodImpact(now + 0.25, 0.85, 840); // 2nd die offset

    // Bounce impact 2 (~430ms):
    playWoodImpact(now + 0.43, 0.75, 820);
    playWoodImpact(now + 0.45, 0.65, 890);

    // Bounce impact 3 (~590ms):
    playWoodImpact(now + 0.59, 0.5, 860);
    playWoodImpact(now + 0.61, 0.45, 920);

    // Final settling tap (~690ms):
    playWoodImpact(now + 0.69, 0.35, 960);
    playWoodImpact(now + 0.72, 0.3, 1020);
  }

  /**
   * Deep, satisfying resonant clack of a solid wooden checker hitting the board.
   */
  public playCheckerMove() {
    if (this.isMuted || this.volume <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const safeVol = Math.max(0.001, this.volume);

    // 1. Low wood resonance (Oscillator)
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.06);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(Math.max(0.001, 0.6 * safeVol), t);
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
    clickGain.gain.setValueAtTime(Math.max(0.001, 0.4 * safeVol), t);
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
    if (this.isMuted || this.volume <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const safeVol = Math.max(0.001, this.volume);

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
    gain.gain.setValueAtTime(Math.max(0.001, 0.5 * safeVol), t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t + 0.04);
    osc.stop(t + 0.13);
  }

  /**
   * Smooth wooden sliding clack when bearing off a checker.
   */
  public playBearOff() {
    if (this.isMuted || this.volume <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const safeVol = Math.max(0.001, this.volume);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(540, t + 0.12);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(Math.max(0.001, 0.4 * safeVol), t);
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
    if (this.isMuted || this.volume <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const safeVol = Math.max(0.001, this.volume);
    // Dramatic gong / triad chord
    const freqs = [220, 277.18, 329.63, 440]; // A major chord

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(Math.max(0.001, (0.35 / (idx + 1)) * safeVol), t);
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
    if (this.isMuted || this.volume <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const safeVol = Math.max(0.001, this.volume);
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
      gain.gain.setValueAtTime(Math.max(0.001, 0.4 * safeVol), t + n.delay);
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
    if (this.isMuted || this.volume <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const safeVol = Math.max(0.001, this.volume);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.03);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(Math.max(0.001, 0.2 * safeVol), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  }
}

export const sounds = new SoundEngine();
