import { sound } from './SoundEngine';

export type VoiceAnnouncerMode = 'tier_name' | 'repeat_prefix' | 'speech_synthesis';

export interface VoiceAnnouncerOptions {
  enabled?: boolean;
  mode?: VoiceAnnouncerMode;
  themeId?: string;
  prefix?: string;
  pitchBase?: number; // Tonalité initiale palier 1 (0.8 à 2.0, défaut 1.6)
  pitchMin?: number;  // Gravité minimale palier ultime (0.15 à 0.8, défaut 0.35)
  rateBase?: number;  // Vitesse initiale palier 1 (0.8 à 2.0, défaut 1.25)
  rateMin?: number;   // Vitesse minimale palier ultime (0.4 à 1.2, défaut 0.65)
  isMuted?: boolean;
  lang?: string;      // 'fr' ou 'en'
  soundClipIndex?: number; // Index réel du fichier audio (originalTierIndex) si ACTIVE_TIERS est restreint
}

export class VoiceAnnouncer {
  private static instance: VoiceAnnouncer;
  private currentTierPlaying: number = -1;
  private lastSpeakTime: number = 0;
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private loadedThemes: Set<string> = new Set();
  private currentSource: AudioBufferSourceNode | null = null;
  private voiceGain: GainNode | null = null;

  // Voix du navigateur (fallback SpeechSynthesis)
  private voicesLoaded: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];

  private constructor() {
    this.preloadWebAudioBuffers('potatoes');
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  public static getInstance(): VoiceAnnouncer {
    if (!VoiceAnnouncer.instance) {
      VoiceAnnouncer.instance = new VoiceAnnouncer();
    }
    return VoiceAnnouncer.instance;
  }

  /**
   * Précharge et décode en mémoire RAM les clips audio d'un thème pour une réactivité absolue (0.00ms).
   */
  public async preloadWebAudioBuffers(themeId: string = 'potatoes'): Promise<void> {
    if (typeof window === 'undefined') return;

    const ctx = sound.getContext();
    if (!ctx) return;

    const cleanThemeId = (themeId || 'potatoes').replace(/[^a-zA-Z0-9_-]/g, '_');
    const clips = [
      'prefix',
      'patate',
      'tier_0',
      'tier_1',
      'tier_2',
      'tier_3',
      'tier_4',
      'tier_5',
      'tier_6',
      'tier_7',
      'tier_8',
      'tier_9'
    ];

    await Promise.all(
      clips.map(async (name) => {
        const cacheKey = `${cleanThemeId}:${name}`;
        if (this.bufferCache.has(cacheKey)) return;
        try {
          const res = await fetch(`/audio/voice/${cleanThemeId}/${name}.mp3`);
          if (!res.ok) return;
          const arrayBuf = await res.arrayBuffer();
          const decoded = await ctx.decodeAudioData(arrayBuf);
          this.bufferCache.set(cacheKey, decoded);
          if (cleanThemeId === 'potatoes') {
            this.bufferCache.set(name, decoded);
          }
        } catch (_) {
          // Erreur ignorée en tâche de fond (fichier non généré ou 404)
        }
      })
    );

    this.loadedThemes.add(cleanThemeId);
  }

  /**
   * Génère les clips audio TTS du thème sélectionné via le backend local, les rogne au millième de seconde
   * avec FFmpeg (suppression du silence d'attaque) et les charge immédiatement dans la RAM Web Audio.
   */
  public async generateVoiceClipsForTheme(
    themeId: string,
    tiers: { name: string }[],
    prefix?: string,
    lang: string = 'fr'
  ): Promise<{ success: boolean; count: number; error?: string }> {
    const cleanThemeId = (themeId || 'custom').replace(/[^a-zA-Z0-9_-]/g, '_');
    const items: { key: string; text: string }[] = [];

    const cleanPrefix = (prefix !== undefined ? prefix.trim() : (cleanThemeId.includes('potatoes') ? 'Patate' : ''));
    if (cleanPrefix) {
      items.push({ key: 'prefix', text: cleanPrefix });
      items.push({ key: 'patate', text: cleanPrefix });
    } else if (cleanThemeId === 'potatoes') {
      items.push({ key: 'patate', text: 'Patate' });
      items.push({ key: 'prefix', text: 'Patate' });
    }

    tiers.forEach((t, index) => {
      if (t && t.name && t.name.trim()) {
        const tierName = t.name.trim();
        const fullText = cleanPrefix && !tierName.toLowerCase().startsWith(cleanPrefix.toLowerCase())
          ? `${cleanPrefix} ${tierName}`
          : tierName;
        items.push({ key: `tier_${index}`, text: fullText });
      }
    });

    try {
      const res = await fetch('/api/generate-voice-clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeId: cleanThemeId,
          lang,
          items
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Erreur serveur HTTP ${res.status}`);
      }

      const data = await res.json();

      // Nettoyer le cache précédent de ce thème pour forcer le rechargement immédiat
      const keysToDelete: string[] = [];
      this.bufferCache.forEach((_, key) => {
        if (key.startsWith(`${cleanThemeId}:`)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach((k) => this.bufferCache.delete(k));

      // Recharger immédiatement les nouveaux fichiers MP3 en RAM Web Audio !
      await this.preloadWebAudioBuffers(cleanThemeId);

      return { success: true, count: data.count || items.length };
    } catch (err: any) {
      console.error('Erreur génération vocale thème:', err);
      return { success: false, count: 0, error: err.message || 'Échec de génération' };
    }
  }

  public initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voices = window.speechSynthesis.getVoices();
    if (this.voices.length > 0) {
      this.voicesLoaded = true;
    }
  }

  /**
   * Préchauffe l'AudioContext et les buffers au premier clic de l'utilisateur.
   */
  public warmup(themeId: string = 'potatoes'): void {
    sound.init();
    this.preloadWebAudioBuffers(themeId);
    this.initVoices();
  }

  /**
   * Déclenchement instantané à 0ms lors de la fusion.
   */
  public speakMergeTier(
    tier: number,
    maxTiers: number,
    tierName: string,
    options: VoiceAnnouncerOptions = {}
  ): void {
    if (options.enabled === false || options.isMuted) return;

    const now = performance.now();
    // Anti-rebond ultra-court (80ms)
    if (tier === this.currentTierPlaying && now - this.lastSpeakTime < 80) {
      return;
    }

    // Gestion de la priorité lors des cascades :
    // Si une voix parle déjà pour un palier strictement supérieur, on laisse le plus grand retentir
    if (this.currentSource && tier < this.currentTierPlaying) {
      return;
    }

    // Progression de 0.0 à 1.0
    const totalTiers = Math.max(1, maxTiers - 1);
    const progress = Math.min(1, Math.max(0, tier / totalTiers));

    // Calcul de la vitesse et de la tonalité
    const pitchBase = Math.max(0.7, Math.min(2.0, options.pitchBase ?? 1.6));
    const pitchMin = Math.max(0.15, Math.min(1.2, options.pitchMin ?? 0.35));
    const calculatedPitch = pitchBase - progress * (pitchBase - pitchMin);

    const mode = options.mode || 'tier_name';
    const themeId = (options.themeId || 'potatoes').replace(/[^a-zA-Z0-9_-]/g, '_');

    // 1. VOIE ULTRA-INSTANTANÉE : Web Audio API (0.00ms de latence)
    if (mode !== 'speech_synthesis') {
      const clipIndex = options.soundClipIndex !== undefined ? options.soundClipIndex : tier;
      const bufferKey = mode === 'repeat_prefix' ? 'prefix' : `tier_${clipIndex}`;

      // Recherche prioritaire dans le thème sélectionné
      let buffer = this.bufferCache.get(`${themeId}:${bufferKey}`);

      if (!buffer && mode === 'repeat_prefix') {
        buffer = this.bufferCache.get(`${themeId}:patate`) || this.bufferCache.get('potatoes:patate') || this.bufferCache.get('patate');
      }

      if (!buffer && mode === 'tier_name') {
        // Fallbacks gracieux : buffer générique ou préfixe
        buffer = this.bufferCache.get(bufferKey) ||
                 this.bufferCache.get(`potatoes:${bufferKey}`) ||
                 this.bufferCache.get(`${themeId}:prefix`) ||
                 this.bufferCache.get('patate');
      }

      if (buffer) {
        this.playWebAudioInstant(buffer, calculatedPitch, tier, now);
        return;
      }
    }

    // 2. VOIE DE SECOURS : SpeechSynthesis navigateur
    this.speakWithSpeechSynthesis(tier, maxTiers, tierName, options, progress, calculatedPitch, now);
  }

  private playWebAudioInstant(buffer: AudioBuffer, playbackRate: number, tier: number, now: number) {
    const ctx = sound.getContext();
    const masterGain = sound.getMasterGain();
    if (!ctx || !masterGain) return;

    // Coupe la voix précédente si elle existe
    this.stop();

    this.currentTierPlaying = tier;
    this.lastSpeakTime = now;

    if (!this.voiceGain) {
      this.voiceGain = ctx.createGain();
      this.voiceGain.gain.setValueAtTime(1.15, ctx.currentTime);
      this.voiceGain.connect(masterGain);
    }

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      // Web Audio playbackRate modifie à la fois le pitch et le tempo (exactement comme sur TikTok)
      source.playbackRate.setValueAtTime(Math.max(0.2, Math.min(2.2, playbackRate)), ctx.currentTime);
      source.connect(this.voiceGain);

      source.onended = () => {
        if (this.currentSource === source) {
          this.currentSource = null;
          this.currentTierPlaying = -1;
        }
      };

      this.currentSource = source;
      // Démarrage à 0ms sur le frame audio exact !
      source.start(0);
    } catch (e) {
      console.warn('Erreur Web Audio voice buffer:', e);
      this.currentTierPlaying = -1;
    }
  }

  private speakWithSpeechSynthesis(
    tier: number,
    maxTiers: number,
    tierName: string,
    options: VoiceAnnouncerOptions,
    progress: number,
    calculatedPitch: number,
    now: number
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    this.stop();
    this.currentTierPlaying = tier;
    this.lastSpeakTime = now;

    const cleanPrefix = (options.prefix !== undefined ? options.prefix.trim() : (options.themeId?.includes('potatoes') ? 'Patate' : ''));
    const textToSay = cleanPrefix && !tierName.toLowerCase().startsWith(cleanPrefix.toLowerCase())
      ? `${cleanPrefix} ${tierName}`
      : tierName;

    const utterance = new SpeechSynthesisUtterance(textToSay);
    utterance.pitch = Math.max(0.1, Math.min(2.0, calculatedPitch));

    const rateBase = Math.max(0.7, Math.min(2.0, options.rateBase ?? 1.25));
    const rateMin = Math.max(0.35, Math.min(1.5, options.rateMin ?? 0.65));
    utterance.rate = Math.max(0.4, Math.min(2.0, rateBase - progress * (rateBase - rateMin)));
    utterance.volume = 1.0;

    const isEn = options.lang === 'en';
    utterance.lang = isEn ? 'en-US' : 'fr-FR';

    if (!this.voicesLoaded) this.initVoices();
    if (this.voices.length > 0) {
      const langPrefix = isEn ? 'en' : 'fr';
      const targetVoices = this.voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
      const localVoices = targetVoices.filter((v) => v.localService);
      const candidates = localVoices.length > 0 ? localVoices : targetVoices;
      const preferred =
        candidates.find((v) => /thomas|paul|nicolas|antoine|natural|guy|david|george|male/i.test(v.name)) ||
        candidates[0] ||
        this.voices[0];
      if (preferred) utterance.voice = preferred;
    }

    utterance.onend = () => {
      if (this.currentTierPlaying === tier) this.currentTierPlaying = -1;
    };
    utterance.onerror = () => {
      this.currentTierPlaying = -1;
    };

    try {
      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.resume();
    } catch (_) {
      this.currentTierPlaying = -1;
    }
  }

  /**
   * Stoppe immédiatement toute parole en cours.
   */
  public stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (_) {}
      this.currentSource = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
      } catch (_) {}
    }
    this.currentTierPlaying = -1;
  }
}

export const voiceAnnouncer = VoiceAnnouncer.getInstance();

