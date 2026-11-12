import { MergeDropConfig } from '../types';
import { SimulationEvent, MergeEvent, DropEvent, BounceEvent, ClimaxEvent } from './types';
import { audioBufferToWav } from '../../../core/audioBufferToWav';

interface ScheduledVoice {
  startTime: number;
  endTime: number;
  naturalDuration: number;
  buffer: AudioBuffer;
  playbackRate: number;
  tier: number;
}

export class OfflineAudioSynthesizer {
  /**
   * Synthétise l'ensemble de la bande-son d'une partie (effets ASMR + voix IA)
   * avec priorité absolue au merge le plus fort, interruption vocale nette sans chevauchement,
   * déduplication des fenêtres de fusion rapprochées et limiteur dynamique anti-saturation.
   */
  public static async synthesizeAudio(
    events: SimulationEvent[],
    durationSeconds: number,
    config: MergeDropConfig
  ): Promise<Blob> {
    const sampleRate = 44100;
    const totalSamples = Math.max(sampleRate, Math.ceil((durationSeconds + 1.5) * sampleRate));
    const AudioCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    const ctx = new AudioCtx(2, totalSamples, sampleRate);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.85, 0);

    // Limiteur dynamique anti-saturation (mastering broadcast)
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-2, 0);
    compressor.knee.setValueAtTime(6, 0);
    compressor.ratio.setValueAtTime(12, 0);
    compressor.attack.setValueAtTime(0.003, 0);
    compressor.release.setValueAtTime(0.08, 0);

    masterGain.connect(compressor);
    compressor.connect(ctx.destination);

    // Pré-téléchargement des buffers vocaux pour le thème (avec fallback)
    const themeId = (config.SKIN_THEME || 'potatoes').replace(/[^a-zA-Z0-9_-]/g, '_');
    const voiceBuffers = new Map<string, AudioBuffer>();

    if (config.VOICE_ANNOUNCER_ENABLED !== false) {
      const clipsToLoad = ['patate', 'prefix', ...Array.from({ length: 10 }, (_, i) => `tier_${i}`)];
      await Promise.all(
        clipsToLoad.map(async (name) => {
          try {
            let res = await fetch(`/audio/voice/${themeId}/${name}.mp3`);
            if (!res.ok && themeId !== 'potatoes') {
              res = await fetch(`/audio/voice/potatoes/${name}.mp3`);
            }
            if (res.ok) {
              const arrayBuf = await res.arrayBuffer();
              const decoded = await ctx.decodeAudioData(arrayBuf);
              voiceBuffers.set(name, decoded);
            }
          } catch (_) {}
        })
      );
    }

    // Trier chronologiquement les événements
    const sortedEvents = events.slice().sort((a, b) => a.timeSeconds - b.timeSeconds);

    // Repérage du moment de la Supernova s'il y a victoire
    const climaxEvt = sortedEvents.find((e): e is ClimaxEvent => e.type === 'climax');
    const climaxTime = climaxEvt ? Math.max(0, climaxEvt.timeSeconds) : Infinity;

    // =========================================================================
    // 1. VOIX IA : Priorité absolue au merge le plus fort & coupure sans chevauchement
    // =========================================================================
    const scheduledVoices: ScheduledVoice[] = [];

    if (config.VOICE_ANNOUNCER_ENABLED !== false && voiceBuffers.size > 0) {
      const allMergeEvents = sortedEvents.filter((e): e is MergeEvent => e.type === 'merge');

      // Dans les cascades très resserrées (<= 40ms), ne retenir que le merge au palier le plus élevé
      const voiceCandidates: { t: number; merge: MergeEvent }[] = [];
      let i = 0;
      while (i < allMergeEvents.length) {
        const cur = allMergeEvents[i];
        let best = cur;
        let j = i + 1;
        while (j < allMergeEvents.length && (allMergeEvents[j].timeSeconds - cur.timeSeconds) < 0.04) {
          if (allMergeEvents[j].nextTier > best.nextTier) {
            best = allMergeEvents[j];
          }
          j++;
        }
        voiceCandidates.push({ t: Math.max(0, best.timeSeconds), merge: best });
        i = j;
      }

      // Simulation de la machine à états de la voix (comme dans le jeu de base)
      let activeVoice: ScheduledVoice | null = null;
      let lastSpokenTier = -1;
      let lastSpokenTime = -999;

      for (const cand of voiceCandidates) {
        const { t, merge } = cand;
        if (t >= climaxTime) break; // Arrêter les annonces normales dès le déclenchement du climax

        // Anti-rebond (80ms sur le même palier)
        if (merge.nextTier === lastSpokenTier && (t - lastSpokenTime) < 0.08) {
          continue;
        }

        // Si une voix parle déjà à cet instant précis
        if (activeVoice !== null && t < activeVoice.endTime) {
          if (merge.nextTier < activeVoice.tier) {
            // Le merge actuel est de palier inférieur à la voix en cours : ON L'IGNORE COMPLÈTEMENT
            // La voix du merge le plus fort continue de dominer la bande son !
            continue;
          } else {
            // Le merge actuel est supérieur ou égal : INTERRUPTION NETTE DE LA VOIX PRÉCÉDENTE
            activeVoice.endTime = Math.min(activeVoice.endTime, t + 0.015);
          }
        }

        const mode = config.VOICE_ANNOUNCER_MODE || 'tier_name';
        const clipIndex = merge.originalTierIndex !== undefined ? merge.originalTierIndex : merge.nextTier;
        const bufferKey = mode === 'repeat_prefix' ? 'prefix' : `tier_${clipIndex}`;
        const buffer = voiceBuffers.get(bufferKey) || voiceBuffers.get('prefix') || voiceBuffers.get('patate');

        if (buffer) {
          const totalTiers = Math.max(1, (config.ACTIVE_TIERS ? config.ACTIVE_TIERS.length : 10) - 1);
          const progress = Math.min(1, Math.max(0, merge.nextTier / totalTiers));
          const pitchBase = Math.max(0.7, Math.min(2.0, config.VOICE_ANNOUNCER_PITCH_BASE ?? 1.6));
          const pitchMin = Math.max(0.15, Math.min(1.2, config.VOICE_ANNOUNCER_PITCH_MIN ?? 0.35));
          const calculatedPitch = Math.max(0.2, Math.min(2.2, pitchBase - progress * (pitchBase - pitchMin)));
          const naturalDuration = buffer.duration / calculatedPitch;

          const newVoice: ScheduledVoice = {
            startTime: t,
            endTime: t + naturalDuration,
            naturalDuration,
            buffer,
            playbackRate: calculatedPitch,
            tier: merge.nextTier
          };

          scheduledVoices.push(newVoice);
          activeVoice = newVoice;
          lastSpokenTier = merge.nextTier;
          lastSpokenTime = t;
        }
      }

      // En cas de Supernova, couper la dernière voix pour laisser retentir l'explosion cosmique
      if (activeVoice !== null && climaxTime < activeVoice.endTime) {
        activeVoice.endTime = Math.min(activeVoice.endTime, climaxTime + 0.02);
      }

      // Planification définitive des voix (chaque source.start() et source.stop() appelé UNE SEULE FOIS)
      for (const v of scheduledVoices) {
        if (v.endTime <= v.startTime) continue;
        const source = ctx.createBufferSource();
        source.buffer = v.buffer;
        source.playbackRate.setValueAtTime(v.playbackRate, v.startTime);

        const voiceGain = ctx.createGain();
        voiceGain.gain.setValueAtTime(1.15, v.startTime);

        const wasCutOff = v.endTime < (v.startTime + v.naturalDuration - 0.02);
        if (wasCutOff) {
          const fadeStart = Math.max(v.startTime, v.endTime - 0.012);
          voiceGain.gain.setValueAtTime(1.15, fadeStart);
          voiceGain.gain.linearRampToValueAtTime(0.0001, v.endTime);
        }

        source.connect(voiceGain);
        voiceGain.connect(masterGain);

        source.start(v.startTime);
        source.stop(v.endTime);
      }
    }

    // =========================================================================
    // 2. SFX DE MERGE (Bubbly ASMR / Marimba) : Priorité au merge le plus fort
    // =========================================================================
    if (config.SOUND_MERGE_ENABLED !== false) {
      const allMergeEvents = sortedEvents.filter((e): e is MergeEvent => e.type === 'merge');
      let i = 0;
      while (i < allMergeEvents.length) {
        const cur = allMergeEvents[i];
        let best = cur;
        let j = i + 1;
        // Dans une fenêtre de 45ms, on ne joue que le merge du palier le plus haut
        while (j < allMergeEvents.length && (allMergeEvents[j].timeSeconds - cur.timeSeconds) < 0.045) {
          if (allMergeEvents[j].nextTier > best.nextTier) {
            best = allMergeEvents[j];
          }
          j++;
        }
        this.renderMergeSound(ctx, masterGain, Math.max(0, best.timeSeconds), best.nextTier, best.comboCount, config);
        i = j;
      }
    }

    // =========================================================================
    // 3. BRUITAGES SECONDAIRES (Drops, Impacts, Climax)
    // =========================================================================
    if (config.SOUND_DROP_ENABLED !== false) {
      let lastDropTime = -999;
      for (const ev of sortedEvents) {
        if (ev.type === 'drop') {
          const t = Math.max(0, ev.timeSeconds);
          if (t - lastDropTime >= 0.08) {
            lastDropTime = t;
            this.renderDropSound(ctx, masterGain, t);
          }
        }
      }
    }

    if (config.SOUND_COLLISION_ENABLED !== false) {
      let lastImpactTime = -999;
      for (const ev of sortedEvents) {
        if (ev.type === 'bounce') {
          const bounce = ev as BounceEvent;
          const t = Math.max(0, bounce.timeSeconds);
          // Throttling 80ms et seuil vitesse > 100 pour garder le mix propre et ASMR
          if (bounce.speed > 100 && (t - lastImpactTime >= 0.08) && t < climaxTime) {
            lastImpactTime = t;
            this.renderImpactSound(ctx, masterGain, t, bounce.speed, config);
          }
        }
      }
    }

    if (climaxEvt) {
      const t = Math.max(0, climaxEvt.timeSeconds);
      this.renderChargeSound(ctx, masterGain, t);
      this.renderExplosionSound(ctx, masterGain, t + 1.4);
    }

    const renderedBuffer = await ctx.startRendering();
    return audioBufferToWav(renderedBuffer);
  }

  private static renderDropSound(ctx: OfflineAudioContext, dest: GainNode, t: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.12);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  private static renderImpactSound(
    ctx: OfflineAudioContext,
    dest: GainNode,
    t: number,
    speed: number,
    config?: MergeDropConfig
  ) {
    const baseVol = (config?.SOUND_COLLISION_VOLUME ?? 35) / 100;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const norm = Math.min(1, Math.max(0.12, speed / 320));

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260 + norm * 80, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.06);

    const dur = 0.07;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(baseVol * 0.5 * norm, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + dur);
  }

  private static renderMergeSound(
    ctx: OfflineAudioContext,
    dest: GainNode,
    t: number,
    tier: number,
    combo: number,
    config: MergeDropConfig
  ) {
    const style = config.SOUND_MERGE_STYLE || 'bubbly';
    const baseVolume = (config.SOUND_MERGE_VOLUME ?? 80) / 100;
    // Plus le palier est élevé, plus le son est puissant et présent
    const tierMultiplier = 0.7 + (tier / 9) * 0.45;
    const finalVolume = Math.max(0.1, Math.min(1.0, baseVolume * tierMultiplier));

    const pitchMult = Math.max(0.5, Math.min(2.0, config.SOUND_PITCH || 1.0));
    const comboMultiplier = Math.pow(1.06, Math.min(8, Math.max(0, combo - 1)));
    const pentatonic = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 1046.5];
    const rawFreq = pentatonic[Math.min(tier, pentatonic.length - 1)] || 523.25;
    const targetFreq = rawFreq * pitchMult * comboMultiplier;

    if (style === 'bubbly') {
      // 🫧 Pop / Bulle ASMR (harmonisé avec SoundEngine)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(targetFreq * 0.72, t);
      osc.frequency.exponentialRampToValueAtTime(targetFreq * 1.55, t + 0.045);
      osc.frequency.exponentialRampToValueAtTime(targetFreq * 1.4, t + 0.14);

      const dur = 0.15;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(finalVolume * 0.85, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + dur);

      // Micro impulsion d'éclatement (clic feutré)
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.type = 'triangle';
      click.frequency.setValueAtTime(targetFreq * 3.2, t);
      click.frequency.exponentialRampToValueAtTime(targetFreq * 0.9, t + 0.02);

      clickGain.gain.setValueAtTime(finalVolume * 0.35, t);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);

      click.connect(clickGain);
      clickGain.connect(dest);
      click.start(t);
      click.stop(t + 0.02);
    } else {
      // Marimba / Accord zen riche
      [targetFreq, targetFreq * 1.5].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 1.05, t + 0.32);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime((idx === 0 ? finalVolume * 0.6 : finalVolume * 0.3), t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.36);
      });
    }
  }

  private static renderChargeSound(ctx: OfflineAudioContext, dest: GainNode, t: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(65, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 1.3);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.6, t + 1.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.35);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 1.35);
  }

  private static renderExplosionSound(ctx: OfflineAudioContext, dest: GainNode, t: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 1.2);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.65, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 1.5);
  }
}
