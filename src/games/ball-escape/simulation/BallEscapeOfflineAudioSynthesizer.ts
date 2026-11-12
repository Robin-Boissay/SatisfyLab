import { BallEscapeConfig, BallMelodyPreset, BallSoundInstrument, BallBreakStyle } from '../types';
import { BallEscapeEvent, BallBounceEvent, SegmentBreakEvent, EscapeEvent } from './types';
import { audioBufferToWav } from '../../../core/audioBufferToWav';

const VIRAL_MELODIES: Record<BallMelodyPreset, number[]> = {
  pentatonic: [220, 246.94, 277.18, 329.63, 369.99, 440, 493.88, 554.37, 659.25, 739.99, 880],
  chromatic: [220, 233.08, 246.94, 261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440, 466.16, 493.88, 523.25, 554.37, 587.33, 622.25, 659.25, 698.46, 739.99, 783.99, 830.61, 880],
  megalovania: [293.66, 293.66, 587.33, 440.00, 415.30, 392.00, 349.23, 293.66, 349.23, 392.00, 261.63, 261.63, 587.33, 440.00, 415.30, 392.00, 349.23, 293.66, 349.23, 392.00, 246.94, 246.94, 587.33, 440.00, 415.30, 392.00, 349.23, 293.66, 349.23, 392.00, 233.08, 233.08, 587.33, 440.00, 415.30, 392.00, 349.23, 293.66, 349.23, 392.00],
  'coffin-dance': [349.23, 349.23, 349.23, 349.23, 440.00, 392.00, 349.23, 523.25, 466.16, 440.00, 392.00, 392.00, 392.00, 440.00, 392.00, 349.23, 329.63, 349.23],
  interstellar: [440.00, 659.25, 440.00, 659.25, 493.88, 659.25, 523.25, 659.25, 440.00, 659.25, 493.88, 659.25, 587.33, 659.25, 523.25, 659.25],
  'fur-elise': [659.25, 622.25, 659.25, 622.25, 659.25, 493.88, 587.33, 523.25, 440.00, 261.63, 329.63, 440.00, 493.88, 329.63, 415.30, 493.88, 523.25],
  pirates: [293.66, 349.23, 392.00, 392.00, 392.00, 440.00, 466.16, 466.16, 466.16, 523.25, 440.00, 440.00, 392.00, 349.23, 349.23, 392.00]
};

export class BallEscapeOfflineAudioSynthesizer {
  /**
   * Synthétise l'intégralité de la bande-son procédurale de Ball Escape hors-ligne
   * à l'échantillon près avec l'OfflineAudioContext (44.1 kHz, dynamique broadcast).
   */
  public static async synthesizeAudio(
    events: BallEscapeEvent[],
    durationSeconds: number,
    config: BallEscapeConfig
  ): Promise<Blob> {
    const sampleRate = 44100;
    const totalSamples = Math.max(sampleRate, Math.ceil((durationSeconds + 1.2) * sampleRate));
    const AudioCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    const ctx = new AudioCtx(2, totalSamples, sampleRate);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.85, 0);

    // Compresseur & limiteur broadcast anti-saturation
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-2, 0);
    compressor.knee.setValueAtTime(6, 0);
    compressor.ratio.setValueAtTime(12, 0);
    compressor.attack.setValueAtTime(0.003, 0);
    compressor.release.setValueAtTime(0.08, 0);

    masterGain.connect(compressor);
    compressor.connect(ctx.destination);

    const sortedEvents = events.slice().sort((a, b) => a.timeSeconds - b.timeSeconds);

    let lastBounceTime = -1;
    let comboIndex = 0;

    for (const evt of sortedEvents) {
      if (evt.type === 'bounce' && config.SOUND_BOUNCE_ENABLED !== false) {
        const bounceEvt = evt as BallBounceEvent;
        // Throttling strict (25ms) pour garder des sons cristallins
        if (bounceEvt.timeSeconds - lastBounceTime < 0.025) continue;
        lastBounceTime = bounceEvt.timeSeconds;

        comboIndex++;
        const t = Math.max(0, bounceEvt.timeSeconds);
        this.renderBounceSound(ctx, masterGain, bounceEvt, config, t, comboIndex);
      } else if (evt.type === 'segment_break' && config.SOUND_BREAK_ENABLED !== false) {
        const breakEvt = evt as SegmentBreakEvent;
        const t = Math.max(0, breakEvt.timeSeconds);
        this.renderBreakSound(ctx, masterGain, config, t);
      } else if (evt.type === 'escape' && config.SOUND_ESCAPE_ENABLED !== false) {
        const escEvt = evt as EscapeEvent;
        const t = Math.max(0, escEvt.timeSeconds);
        this.renderEscapeSound(ctx, masterGain, config, t);
      }
    }

    const renderedBuffer = await ctx.startRendering();
    const wavArrayBuffer = audioBufferToWav(renderedBuffer);
    return new Blob([wavArrayBuffer], { type: 'audio/wav' });
  }

  private static renderBounceSound(
    ctx: OfflineAudioContext,
    dest: AudioNode,
    evt: BallBounceEvent,
    config: BallEscapeConfig,
    now: number,
    comboIdx: number
  ) {
    const instrument: BallSoundInstrument = config.SOUND_BOUNCE_STYLE || 'piano';
    const melody: BallMelodyPreset = config.SOUND_MELODY_PRESET || 'pentatonic';
    const volume = Math.max(0, Math.min(1.0, config.SOUND_BOUNCE_VOLUME !== undefined ? config.SOUND_BOUNCE_VOLUME : 0.85));
    if (volume <= 0.001) return;

    const pitchMult = Math.max(0.4, Math.min(2.5, config.SOUND_PITCH_MULT || 1.0));
    const speedRatio = Math.max(
      0,
      Math.min(
        1.0,
        (evt.speed - (config.INITIAL_SPEED || 220)) /
          Math.max(1, (config.MAX_SPEED || 420) - (config.INITIAL_SPEED || 220))
      )
    );
    const comboStep = config.SOUND_COMBO_PITCH ? Math.pow(1.04, Math.min(12, comboIdx)) : 1.0;

    const melodyNotes = VIRAL_MELODIES[melody] || VIRAL_MELODIES.pentatonic;
    const noteIndex = evt.bounceCount % melodyNotes.length;
    const octaveShift = Math.floor(evt.bounceCount / melodyNotes.length);
    const rawFreq = melodyNotes[noteIndex] * Math.pow(2, octaveShift % 2);
    const targetFreq = Math.min(1800, rawFreq * pitchMult * comboStep);

    if (instrument === 'marimba') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(targetFreq, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(targetFreq * 4.0, now);

      const dur = 0.09;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume * 0.9, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(dest);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + dur);
      osc2.stop(now + dur);
    } else if (instrument === 'synth') {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(targetFreq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(targetFreq * 3.5, now);
      filter.frequency.exponentialRampToValueAtTime(targetFreq * 0.8, now + 0.1);
      filter.Q.setValueAtTime(4.0, now);

      const dur = 0.11;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume * 0.75, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + dur);
    } else if (instrument === 'bubbly') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(targetFreq * 0.75, now);
      osc.frequency.exponentialRampToValueAtTime(targetFreq * 1.5, now + 0.035);

      const dur = 0.08;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume * 0.85, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + dur);
    } else if (instrument === '8bit') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(targetFreq, now);
      osc.frequency.setValueAtTime(targetFreq * 1.25, now + 0.02);

      const dur = 0.07;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume * 0.55, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + dur);
    } else {
      // Piano ASMR
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = speedRatio > 0.6 ? 'triangle' : 'sine';
      osc1.frequency.setValueAtTime(targetFreq * (1.1 + speedRatio * 0.2), now);
      osc1.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.015);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(targetFreq * 2.0, now);

      const dur = 0.12;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume * 0.85, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(dest);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + dur);
      osc2.stop(now + dur);
    }
  }

  private static renderBreakSound(
    ctx: OfflineAudioContext,
    dest: AudioNode,
    config: BallEscapeConfig,
    now: number
  ) {
    const style: BallBreakStyle = config.SOUND_BREAK_STYLE || 'crunch';
    const volume = Math.max(0, Math.min(1.0, config.SOUND_BREAK_VOLUME !== undefined ? config.SOUND_BREAK_VOLUME : 0.85));
    if (volume <= 0.001) return;

    const pitchMult = Math.max(0.5, Math.min(2.0, config.SOUND_PITCH_MULT || 1.0));

    if (style === 'glass') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400 * pitchMult, now);
      osc.frequency.exponentialRampToValueAtTime(950 * pitchMult, now + 0.1);

      const dur = 0.13;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume * 0.7, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + dur);
    } else {
      // Crunch
      const bufferSize = Math.floor(ctx.sampleRate * 0.08);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1900 * pitchMult, now);
      filter.frequency.exponentialRampToValueAtTime(320 * pitchMult, now + 0.08);
      filter.Q.setValueAtTime(3.2, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.08);

      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(140 * pitchMult, now);
      subOsc.frequency.exponentialRampToValueAtTime(45 * pitchMult, now + 0.11);

      subGain.gain.setValueAtTime(volume * 0.65, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      subOsc.connect(subGain);
      subGain.connect(dest);
      subOsc.start(now);
      subOsc.stop(now + 0.11);
    }
  }

  private static renderEscapeSound(
    ctx: OfflineAudioContext,
    dest: AudioNode,
    config: BallEscapeConfig,
    now: number
  ) {
    const volume = Math.max(0, Math.min(1.0, config.SOUND_ESCAPE_VOLUME !== undefined ? config.SOUND_ESCAPE_VOLUME : 0.85));
    if (volume <= 0.001) return;

    const notes = [261.63, 392.0, 523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51];

    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.05;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      const dur = 0.5 - idx * 0.025;
      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(volume * 0.45, noteTime + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + dur);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(noteTime);
      osc.stop(noteTime + dur);
    });
  }
}
