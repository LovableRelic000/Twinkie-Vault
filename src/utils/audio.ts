/**
 * TwinkieVault Procedural Web Audio Synthesizer
 * Zero external audio assets needed; all sounds synthesized procedurally in real-time.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user gesture
    const saved = localStorage.getItem('twinkie_vault_muted');
    if (saved !== null) {
      this.muted = saved === 'true';
    }
  }

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(mute: boolean) {
    this.muted = mute;
    localStorage.setItem('twinkie_vault_muted', String(mute));
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Normal Step Tick: Crisp metallic 15ms click with slight pitch jitter
   */
  public playTick() {
    if (this.muted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Bandpass filter for crisp metallic body
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200 + (Math.random() * 300 - 150), now);
      filter.Q.setValueAtTime(4.5, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2800 + (Math.random() * 200 - 100), now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.018);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.02);
    } catch {
      // Audio fallback fail-safe
    }
  }

  /**
   * Warm Zone Ping: Subtle resonant metal ping when in ±1 or ±2 zone
   */
  public playWarmZone() {
    if (this.muted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.035);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {}
  }

  /**
   * Gate Alignment Clunk: Heavy resonant mechanical clunk when hitting exact target gate
   */
  public playGateClunk() {
    if (this.muted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Sub-bass thud (tumbler dropping)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(160, now);
      subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

      subGain.gain.setValueAtTime(0.6, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.085);

      // Resonant metallic click
      const metalOsc = ctx.createOscillator();
      const metalGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1850, now);
      filter.Q.setValueAtTime(7.0, now);

      metalOsc.type = 'square';
      metalOsc.frequency.setValueAtTime(1200, now);
      metalGain.gain.setValueAtTime(0.35, now);
      metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      metalOsc.connect(filter);
      filter.connect(metalGain);
      metalGain.connect(ctx.destination);

      metalOsc.start(now);
      metalOsc.stop(now + 0.065);
    } catch {}
  }

  /**
   * Tumbler Locked: Satisfying double mechanical lock ("ca-CHUNK")
   */
  public playTumblerLock() {
    if (this.muted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Pulse 1: high catch click
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(2200, now);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.035);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.04);

      // Pulse 2: heavy bolt clack 45ms later
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(280, now + 0.045);
      osc2.frequency.exponentialRampToValueAtTime(70, now + 0.16);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now + 0.045);

      gain2.gain.setValueAtTime(0.65, now + 0.045);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc2.connect(filter);
      filter.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.045);
      osc2.stop(now + 0.17);
    } catch {}
  }

  /**
   * Wrong Direction Penalty: Harsh low buzz warning
   */
  public playErrorBuzz() {
    if (this.muted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(95, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      // 2 quick pulses
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.setValueAtTime(0.01, now + 0.05);
      gain.gain.setValueAtTime(0.4, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }

  /**
   * Vault Open / Level Clear: Heavy gears unwinding + Triumphant Golden Chime Fanfare
   */
  public playVaultOpen() {
    if (this.muted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Heavy bolt slide
      const boltOsc = ctx.createOscillator();
      const boltGain = ctx.createGain();
      boltOsc.type = 'sawtooth';
      boltOsc.frequency.setValueAtTime(110, now);
      boltOsc.frequency.linearRampToValueAtTime(220, now + 0.25);
      boltGain.gain.setValueAtTime(0.45, now);
      boltGain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      boltOsc.connect(boltGain);
      boltGain.connect(ctx.destination);
      boltOsc.start(now);
      boltOsc.stop(now + 0.3);

      // 2. Golden Chime chords (Twinkie Vault Victory!)
      const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      chords.forEach((freq, idx) => {
        const chimeOsc = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        const delay = 0.18 + idx * 0.08;

        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(freq, now + delay);

        chimeGain.gain.setValueAtTime(0, now + delay);
        chimeGain.gain.linearRampToValueAtTime(0.28, now + delay + 0.02);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.65);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(ctx.destination);

        chimeOsc.start(now + delay);
        chimeOsc.stop(now + delay + 0.7);
      });
    } catch {}
  }

  /**
   * Game Over Sound: Descending metallic power down
   */
  public playGameOver() {
    if (this.muted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch {}
  }
}

export const sound = new SoundSynthesizer();
