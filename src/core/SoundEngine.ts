/**
 * SYSTÈME AUDIO PROCÉDURAL (WEB AUDIO API)
 * Synthèse en temps réel sans asset externe.
 */

export class SoundEngine {
  private static instance: SoundEngine;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private streamDest: MediaStreamAudioDestinationNode | null = null;
  public isMuted: boolean = false;
  private baseFreq: number = 220; // Note La3 (A3)

  private constructor() {}

  public static getInstance(): SoundEngine {
    if (!SoundEngine.instance) {
      SoundEngine.instance = new SoundEngine();
    }
    return SoundEngine.instance;
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.45, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      try {
        this.streamDest = this.ctx.createMediaStreamDestination();
        this.masterGain.connect(this.streamDest);
      } catch (e) {
        console.warn('MediaStreamDestination non supporté sur ce navigateur:', e);
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAudioTrack(): MediaStreamTrack | null {
    if (!this.ctx) {
      this.init();
    }
    if (this.streamDest && this.streamDest.stream) {
      const tracks = this.streamDest.stream.getAudioTracks();
      return tracks.length > 0 ? tracks[0] : null;
    }
    return null;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.45, this.ctx.currentTime, 0.03);
    }
    return this.isMuted;
  }

  public playBounce(bounceIndex: number, speedRatio: number = 0.5) {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const pentatonicScale = [0, 2, 4, 7, 9];
    const step = bounceIndex % 30;
    const octave = Math.floor(step / pentatonicScale.length);
    const semitone = pentatonicScale[step % pentatonicScale.length] + octave * 12;
    const targetFreq = Math.min(800, this.baseFreq * Math.pow(2, semitone / 24));

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = speedRatio > 0.6 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(targetFreq * (1.3 + speedRatio * 0.4), now);
    osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.012);

    const dur = 0.085;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.7 + speedRatio * 0.3, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + dur);
  }

  public playWallDestroy() {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.09);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(350, now + 0.09);
    filter.Q.setValueAtTime(3.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.09);

    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    subGain.gain.setValueAtTime(0.6, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain!);

    subOsc.start(now);
    subOsc.stop(now + 0.12);
  }

  public playEscape() {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 392.0, 523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51];

    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.055;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      const dur = 0.55 - idx * 0.03;
      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.4, noteTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteTime);
      osc.stop(noteTime + dur);
    });
  }

  /**
   * Son de fusion pour Neon Merge Drop (Chime cristallin avec tier ascendant)
   */
  public playMerge(tier: number) {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Notes douces et harmonieuses (Lydian / Pentatonic)
    const baseFreqs = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 1046.5];
    const freq = baseFreqs[Math.min(tier, baseFreqs.length - 1)] || 523.25;

    // Harmoniques cristallines
    [freq, freq * 2].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 1.05, now + 0.15);

      const dur = 0.25;
      const vol = i === 0 ? 0.6 : 0.25;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + dur);
    });
  }

  /**
   * Petit son mécanique / clic feutré lors du lâcher d'une boule
   */
  public playDrop() {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Bip d'avertissement quand les boules débordent la ligne rouge de danger
   */
  public playDanger() {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(310, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Son dramatique de Game Over / Débordement
   */
  public playGameOver() {
    if (!this.ctx || this.isMuted) return;

    this.playWallDestroy();

    const now = this.ctx.currentTime;
    const freqs = [180, 140, 95];
    freqs.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      const t = now + idx * 0.12;
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 0.5, t + 0.4);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  /**
   * Ralenti cosmique & Montée en charge gravitationnelle (Bullet Time)
   */
  public playSupernovaCharge() {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 1.3);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.65, now + 1.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.35);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 1.35);

    // Harmoniques cristallines montantes
    [130, 195, 260].forEach((baseF, i) => {
      const harmOsc = this.ctx!.createOscillator();
      const harmGain = this.ctx!.createGain();

      harmOsc.type = 'triangle';
      harmOsc.frequency.setValueAtTime(baseF, now);
      harmOsc.frequency.exponentialRampToValueAtTime(baseF * 3.0, now + 1.3);

      harmGain.gain.setValueAtTime(0.001, now);
      harmGain.gain.linearRampToValueAtTime(0.25 / (i + 1), now + 1.0);
      harmGain.gain.exponentialRampToValueAtTime(0.001, now + 1.35);

      harmOsc.connect(harmGain);
      harmGain.connect(this.masterGain!);

      harmOsc.start(now);
      harmOsc.stop(now + 1.35);
    });
  }

  /**
   * Climax grandiose : Explosion Supernova & Carillon de Victoire Céleste
   */
  public playSupernovaExplosion() {
    if (!this.ctx || this.isMuted) return;

    this.playWallDestroy();

    const now = this.ctx.currentTime;

    // 1. Détonation sub-bass cosmique
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(120, now);
    subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.8);
    subGain.gain.setValueAtTime(0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain!);
    subOsc.start(now);
    subOsc.stop(now + 0.8);

    // 2. Cascade d'arpèges célestes majestueux (C-E-G-B-D-G-C)
    const chords = [261.63, 329.63, 392.0, 493.88, 587.33, 783.99, 1046.5, 1318.5, 1567.98];
    chords.forEach((freq, idx) => {
      const noteTime = now + 0.08 + idx * 0.07;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      const dur = 1.2 - idx * 0.05;
      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.5, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteTime);
      osc.stop(noteTime + dur);
    });
  }
}

export const sound = SoundEngine.getInstance();
