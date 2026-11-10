/**
 * SYSTÈME AUDIO PROCÉDURAL (WEB AUDIO API)
 * Synthèse en temps réel sans asset externe.
 */

export type SoundMergeStyle = 'bubbly' | 'marimba' | 'arcade' | 'cartoon' | 'crystal';
export type SoundCollisionStyle = 'wood' | 'glass' | 'bubble' | 'rubber' | 'arcade';

export interface PlayMergeOptions {
  style?: SoundMergeStyle;
  volume?: number;
  comboIndex?: number;
  pitchMult?: number;
}

export interface PlayDropOptions {
  style?: SoundMergeStyle;
  volume?: number;
  pitchMult?: number;
}

export interface PlayImpactOptions {
  style?: SoundCollisionStyle;
  volume?: number;
  pitchMult?: number;
}

export class SoundEngine {
  private static instance: SoundEngine;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private streamDest: MediaStreamAudioDestinationNode | null = null;
  public isMuted: boolean = false;
  private baseFreq: number = 220; // Note La3 (A3)
  private lastImpactTime: number = 0;

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
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.ctx || !this.masterGain) return null;

    // Vérifier si streamDest existe et si sa piste audio est toujours active ('live')
    const currentTrack = this.streamDest?.stream?.getAudioTracks()[0];
    if (this.streamDest && currentTrack && currentTrack.readyState === 'live') {
      return currentTrack;
    }

    // Si la piste est terminée ('ended') ou inexistante, recréer un MediaStreamDestination frais
    try {
      if (this.streamDest) {
        try {
          this.masterGain.disconnect(this.streamDest);
        } catch (_) {}
      }
      this.streamDest = this.ctx.createMediaStreamDestination();
      this.masterGain.connect(this.streamDest);
      const tracks = this.streamDest.stream.getAudioTracks();
      return tracks.length > 0 ? tracks[0] : null;
    } catch (e) {
      console.warn('Erreur création MediaStreamDestination audio:', e);
      return null;
    }
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
   * Son de fusion pour Neon Merge Drop (styles variés, ASMR, montées harmoniques)
   */
  public playMerge(tier: number, options?: PlayMergeOptions) {
    if (!this.ctx || this.isMuted) return;

    const style: SoundMergeStyle = options?.style || 'bubbly';
    const volume = Math.max(0, Math.min(1.0, options?.volume !== undefined ? options.volume : 0.8));
    if (volume <= 0.001) return;

    const pitchMult = Math.max(0.5, Math.min(2.0, options?.pitchMult || 1.0));
    const comboIndex = Math.max(0, options?.comboIndex || 0);
    const comboMultiplier = Math.pow(1.08, Math.min(8, comboIndex)); // +1 demi-ton par palier de combo

    const now = this.ctx.currentTime;
    const baseFreqs = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 1046.5];
    const rawFreq = baseFreqs[Math.min(tier, baseFreqs.length - 1)] || 523.25;
    const targetFreq = rawFreq * pitchMult * comboMultiplier;

    if (style === 'bubbly') {
      // 🫧 Pop / Bulle ASMR : pitch sweep ultra-rapide montant + click transitoire doux
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(targetFreq * 0.72, now);
      osc.frequency.exponentialRampToValueAtTime(targetFreq * 1.55, now + 0.045);
      osc.frequency.exponentialRampToValueAtTime(targetFreq * 1.4, now + 0.14);

      const dur = 0.15;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume * 0.85, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + dur);

      // Micro impulsion d'éclatement (clic feutré)
      const click = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      click.type = 'triangle';
      click.frequency.setValueAtTime(targetFreq * 3.2, now);
      click.frequency.exponentialRampToValueAtTime(targetFreq * 0.9, now + 0.02);

      clickGain.gain.setValueAtTime(volume * 0.4, now);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

      click.connect(clickGain);
      clickGain.connect(this.masterGain!);
      click.start(now);
      click.stop(now + 0.02);
    } else if (style === 'marimba') {
      // 🪵 Marimba Zen / Suika Game : percussion bois chaleureuse
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(targetFreq, now);

      const dur = 0.28;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume * 0.8, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + dur);

      // Harmonique de résonance du bois (4x freq courte)
      const harm = this.ctx.createOscillator();
      const harmGain = this.ctx.createGain();
      harm.type = 'triangle';
      harm.frequency.setValueAtTime(targetFreq * 3.95, now);

      harmGain.gain.setValueAtTime(volume * 0.35, now);
      harmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      harm.connect(harmGain);
      harmGain.connect(this.masterGain!);
      harm.start(now);
      harm.stop(now + 0.05);
    } else if (style === 'arcade') {
      // 👾 Arcade 8-Bit : Chiptune double arpeggio
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(targetFreq, now);
      osc.frequency.setValueAtTime(targetFreq * 1.26, now + 0.035); // tierce
      osc.frequency.setValueAtTime(targetFreq * 1.5, now + 0.07); // quinte

      const dur = 0.16;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume * 0.45, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + dur);
    } else if (style === 'cartoon') {
      // 🎪 Cartoon Boing : ressort élastique oscillant
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(targetFreq * 0.8, now);
      osc.frequency.exponentialRampToValueAtTime(targetFreq * 1.8, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(targetFreq * 1.0, now + 0.22);

      const dur = 0.24;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume * 0.75, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + dur);
    } else {
      // ✨ Cristal / Carillon (défaut)
      [targetFreq, targetFreq * 2].forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 1.04, now + 0.15);

        const dur = 0.28;
        const vol = (i === 0 ? 0.6 : 0.25) * volume;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now);
        osc.stop(now + dur);
      });
    }
  }

  /**
   * Son de déblocage triomphal d'un nouveau palier max dans Merge Drop
   */
  public playTierUnlock(tier: number, style?: SoundMergeStyle, pitchMult: number = 1.0) {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const baseFreqs = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 1046.5];
    const root = (baseFreqs[Math.min(tier, baseFreqs.length - 1)] || 523.25) * pitchMult;

    const waveType: OscillatorType = style === 'arcade' ? 'square' : (style === 'cartoon' ? 'sawtooth' : 'triangle');

    // Arpège ascendant triomphal : tonique -> tierce -> quinte -> octave
    [root, root * 1.25, root * 1.5, root * 2].forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startT = now + idx * 0.05;
      const dur = 0.35;

      osc.type = idx === 3 ? 'sine' : waveType;
      osc.frequency.setValueAtTime(f, startT);

      gain.gain.setValueAtTime(0.001, startT);
      gain.gain.linearRampToValueAtTime(0.4, startT + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, startT + dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startT);
      osc.stop(startT + dur);
    });
  }

  /**
   * Petit son mécanique / clic feutré lors du lâcher d'une boule
   */
  public playDrop(options?: PlayDropOptions) {
    if (!this.ctx || this.isMuted) return;

    const volumeSetting = Math.max(0, Math.min(1.0, options?.volume !== undefined ? options.volume : 0.6));
    if (volumeSetting <= 0.001) return;

    const style: SoundMergeStyle = options?.style || 'bubbly';
    const pitchMult = Math.max(0.5, Math.min(2.0, options?.pitchMult || 1.0));
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (style === 'arcade') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440 * pitchMult, now);
      osc.frequency.exponentialRampToValueAtTime(220 * pitchMult, now + 0.04);
    } else if (style === 'cartoon') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280 * pitchMult, now);
      osc.frequency.exponentialRampToValueAtTime(560 * pitchMult, now + 0.05);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(340 * pitchMult, now);
      osc.frequency.exponentialRampToValueAtTime(140 * pitchMult, now + 0.04);
    }

    const dur = 0.045;
    gain.gain.setValueAtTime(volumeSetting * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + dur);
  }

  /**
   * Son de collision physique (bille contre bille ou paroi)
   */
  public playImpact(relSpeed: number, options?: PlayImpactOptions) {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Throttle pour éviter toute cacophonie (max 28 impacts par seconde)
    if (now - this.lastImpactTime < 0.035) return;
    this.lastImpactTime = now;

    const volumeSetting = Math.max(0, Math.min(1.0, options?.volume !== undefined ? options.volume : 0.4));
    if (volumeSetting <= 0.001) return;

    // Normalisation de la vitesse relative pour doser l'intensité du choc
    const normVel = Math.max(0.12, Math.min(1.0, relSpeed / 320));
    const finalVol = volumeSetting * normVel;
    const pitchMult = Math.max(0.5, Math.min(2.0, options?.pitchMult || 1.0));
    const style: SoundCollisionStyle = options?.style || 'wood';

    if (style === 'glass') {
      // 🔮 Choc Verre / Bille cristalline
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseF = (1200 + Math.random() * 250) * pitchMult;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseF, now);
      osc.frequency.exponentialRampToValueAtTime(baseF * 0.95, now + 0.04);

      const dur = 0.045;
      gain.gain.setValueAtTime(finalVol * 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + dur);
    } else if (style === 'bubble') {
      // 🫧 Micro Plop Doux
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startF = (220 + Math.random() * 50) * pitchMult;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(startF, now);
      osc.frequency.exponentialRampToValueAtTime(startF * 1.6, now + 0.03);

      const dur = 0.035;
      gain.gain.setValueAtTime(finalVol * 0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + dur);
    } else if (style === 'rubber') {
      // ⚽ Rebond Caoutchouc / Thud feutré
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startF = (110 + Math.random() * 25) * pitchMult;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(startF, now);
      osc.frequency.exponentialRampToValueAtTime(startF * 0.5, now + 0.05);

      const dur = 0.055;
      gain.gain.setValueAtTime(finalVol * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + dur);
    } else if (style === 'arcade') {
      // 👾 Clic 8-Bit chiptune
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime((720 + Math.random() * 90) * pitchMult, now);

      const dur = 0.022;
      gain.gain.setValueAtTime(finalVol * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + dur);
    } else {
      // 🪵 Toc Bois / Noisette (défaut ASMR)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startF = (190 + Math.random() * 40) * pitchMult;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(startF, now);
      osc.frequency.exponentialRampToValueAtTime(startF * 0.45, now + 0.035);

      const dur = 0.04;
      gain.gain.setValueAtTime(finalVol * 0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + dur);
    }
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
