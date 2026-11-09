/**
 * ==============================================================================
 * SYSTÈME AUDIO PROCÉDURAL (WEB AUDIO API) - LEGACY STANDALONE
 * ==============================================================================
 * Zéro fichier externe : sons synthétisés dynamiquement en temps réel.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.baseFreq = CONFIG.AUDIO_BASE_FREQ || 220; // Fréquence de base (La3)
  }

  /**
   * Initialise ou réactive l'AudioContext lors d'une interaction utilisateur.
   */
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      const vol = CONFIG.AUDIO_MASTER_VOLUME || 0.45;
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : vol, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Bascule le mode muet / sonore.
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const vol = CONFIG.AUDIO_MASTER_VOLUME || 0.45;
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : vol, this.ctx.currentTime, 0.03);
    }
    return this.isMuted;
  }

  /**
   * Son d'impact régulier dont la fréquence monte à chaque rebond (tension musicale).
   * @param {number} bounceIndex - Compteur de rebonds
   * @param {number} speedRatio - Ratio de vitesse normalisé (0 à 1)
   */
  playBounce(bounceIndex, speedRatio) {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;

    // Gamme pentatonique montante progressive (La3 -> La6)
    const pentatonicScale = [0, 2, 4, 7, 9];
    const step = bounceIndex % 30;
    const octave = Math.floor(step / pentatonicScale.length);
    const semitone = pentatonicScale[step % pentatonicScale.length] + octave * 12;
    const targetFreq = Math.min(800, this.baseFreq * Math.pow(2, semitone / 24));

    // Oscillateur principal (onde sinusoïdale ou triangle pour le punch)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = speedRatio > 0.6 ? 'triangle' : 'sine';

    // Pitch drop instantané (kick snap d'attaque)
    osc.frequency.setValueAtTime(targetFreq * (1.3 + speedRatio * 0.4), now);
    osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.012);

    // Enveloppe d'amplitude ADSR ultra courte (~0.085s)
    const dur = 0.085;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.7 + speedRatio * 0.3, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + dur);
  }

  /**
   * Son de destruction d'un segment d'arc (bruit d'éclatement laser + sub-kick).
   */
  playWallDestroy() {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;

    // Burst de bruit blanc filtré passe-bande
    const bufferSize = this.ctx.sampleRate * 0.09;
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
    gain.connect(this.masterGain);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.09);

    // Sub-kick basse percutant pour marquer l'ouverture
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    subGain.gain.setValueAtTime(0.6, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    subOsc.start(now);
    subOsc.stop(now + 0.12);
  }

  /**
   * Son d'évasion triomphal : accord majeur ascendant étendu en arpège rapide.
   */
  playEscape() {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Accord majeur 9e étendu : Do4, Sol4, Do5, Mi5, Sol5, Si5, Do6, Mi6
    const notes = [261.63, 392.00, 523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51];

    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.055;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      const dur = 0.55 - idx * 0.03;
      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.4, noteTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + dur);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + dur);
    });
  }
}
