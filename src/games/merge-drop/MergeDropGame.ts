import { GameInstance, GameHUDState } from '../../core/types';
import { sound } from '../../core/SoundEngine';
import { drawCanvasHUD } from '../../core/canvasHUD';
import {
  MergeDropConfig,
  DEFAULT_MERGE_DROP_CONFIG,
  MergeTier,
  getTiersForTheme,
  getTierLocalizedName,
  getThemeDefinition,
  textureManager
} from './types';
import { MergeBall, MergeSpark } from './items';
import { voiceAnnouncer } from '../../core/VoiceAnnouncer';
import { MergeDropSimulation } from './simulation/MergeDropSimulation';
import { SimulationTelemetry, SimulationEvent, MergeEvent, ClimaxEvent } from './simulation/types';
import { MergeDrop3DRenderer } from './MergeDrop3DRenderer';

const VIRTUAL_WIDTH = 540;
const VIRTUAL_HEIGHT = 960;

interface MergeTextPopup {
  x: number;
  y: number;
  text: string;
  color: string;
  glowColor: string;
  size: number;
  life: number;
  maxLife: number;
}

interface CosmicShockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
  maxLife: number;
  lineWidth: number;
}

interface VortexParticle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  size: number;
  progress: number;
}

export class MergeDropGame implements GameInstance {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onHUDUpdate: (hud: GameHUDState) => void;
  public config: MergeDropConfig;

  private isDestroyed: boolean = false;
  private animFrameId: number | null = null;
  private lastTime: number = performance.now();

  private balls: MergeBall[] = [];
  private sparks: MergeSpark[] = [];
  private shockwaves: CosmicShockwave[] = [];
  private vortexParticles: VortexParticle[] = [];
  private textPopups: MergeTextPopup[] = [];
  private nextBallId: number = 1;

  private score: number = 0;
  private maxTierReached: number = 0;
  private tierUnlockPops: number[] = new Array(10).fill(1.0);
  private nextTier: number = 0;
  private currentHUD: GameHUDState = {};

  // Audio Combos & Effets en Cascade
  private comboCount: number = 0;
  private comboTimer: number = 0;

  // État du jeu & Gestion du Débordement (Game Over)
  private state: 'RUNNING' | 'GAME_OVER' | 'VICTORY' = 'RUNNING';
  private overflowTimer: number = 0;
  private isDangerWarning: boolean = false;
  private dangerSoundCooldown: number = 0;

  // Climax Supernova Ralenti & Explosion Finale (Tier 9)
  private climaxPhase: 'NONE' | 'SLOWMO_CHARGE' | 'EXPLOSION' | 'VICTORY_SCREEN' = 'NONE';
  private climaxTimer: number = 0;
  private timeScale: number = 1.0;

  // Géométrie Générale & Dimensions Dynamiques (Safe Zone TikTok)
  public readonly centerX = 270;
  public get funnelTop(): number {
    return this.config.CONTAINER_TOP_Y ?? 150;
  }
  public get chamberBottom(): number {
    return this.config.CONTAINER_BOTTOM_Y ?? 820;
  }
  public get dropY(): number {
    return this.funnelTop + 15;
  }
  public get funnelLeft(): number { return 195; }
  public get funnelRight(): number { return 345; }

  // Tube & Cuve Rectangulaire
  public get tubeLeft(): number { return 230; }
  public get tubeRight(): number { return 310; }
  public get tubeTop(): number { return this.funnelTop + 50; }
  public get tubeBottom(): number { return this.funnelTop + 140; }
  public get chamberLeft(): number { return 60; }
  public get chamberRight(): number { return 480; }
  public get chamberWidth(): number { return 420; }
  public get chamberTop(): number { return this.tubeBottom; }

  // Ligne de danger dynamique
  public get dangerY(): number {
    if (this.config.CONTAINER_SHAPE === 'circle') {
      const { neckConnectY } = this.getCircleGeometry();
      return neckConnectY - 25;
    }
    const topY = this.funnelTop;
    const botY = this.chamberBottom;
    const neckEndY = topY + 140;
    return neckEndY + Math.min(90, Math.max(35, (botY - neckEndY) * 0.16));
  }

  // Point de largage unique
  public readonly dropX = 270;
  private canManualDrop: boolean = true;
  private manualDropCooldown: number = 0;

  // Rafale Automatique Niveau 1
  public isAutoStreaming: boolean = false;
  private autoStreamTimer: number = 0;
  private autoStreamElapsedTime: number = 0;
  private autoStreamBallsDropped: number = 0;
  private lastDisplayedStreamRate: number = 0;

  // Visuels & Secousses
  private screenShake: number = 0;
  private shakeX: number = 0;
  private shakeY: number = 0;
  private tubeFlowOffset: number = 0;

  private viewScale: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private stars: { x: number; y: number; size: number; speed: number; baseAlpha: number }[] = [];
  private renderer3D: MergeDrop3DRenderer | null = null;
  private canvas3D: HTMLCanvasElement | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    initialConfig: MergeDropConfig,
    onHUDUpdate: (hud: GameHUDState) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onHUDUpdate = onHUDUpdate;
    this.config = { ...DEFAULT_MERGE_DROP_CONFIG, ...initialConfig };
    this.isAutoStreaming = !!this.config.AUTO_STREAM_ACTIVE;

    this.nextTier = this.getRandomSpawnTier();
    this.resize();

    window.addEventListener('resize', this.handleResize);

    this.syncHUD();
    textureManager.preloadThemeImages(this.getCurrentTiers());
    voiceAnnouncer.preloadWebAudioBuffers(this.config.SKIN_THEME || 'potatoes');
    this.loop(performance.now());
  }

  private handleResize = () => {
    this.resize();
  };

  public getActiveTiers(): MergeTier[] {
    const fullTiers = getTiersForTheme(this.config.SKIN_THEME, this.config.BASE_BALL_RADIUS || 16);
    const activeIndices = this.config.ACTIVE_TIERS && Array.isArray(this.config.ACTIVE_TIERS) && this.config.ACTIVE_TIERS.length >= 5
      ? this.config.ACTIVE_TIERS.slice().sort((a, b) => a - b)
      : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    const hitboxScale = Math.max(0.4, Math.min(2.0, this.config.BALL_HITBOX_SCALE ?? 1.0));

    const mapTier = (t: MergeTier, newTier: number, origIdx: number): MergeTier => {
      const visualR = t.radius;
      const hitboxR = Math.max(4, Math.round(visualR * hitboxScale * 10) / 10);
      return {
        ...t,
        tier: newTier,
        originalTierIndex: origIdx,
        visualRadius: visualR,
        radius: hitboxR
      };
    };

    const filtered = activeIndices
      .filter((idx) => idx >= 0 && idx < fullTiers.length)
      .map((idx, newTier) => mapTier(fullTiers[idx], newTier, idx));

    return filtered.length >= 5 ? filtered : fullTiers.map((t, i) => mapTier(t, i, i));
  }

  private getCurrentTiers(): MergeTier[] {
    return this.getActiveTiers();
  }

  private getRandomSpawnTier(): number {
    const tiers = this.getCurrentTiers();
    const maxAllowed = Math.min(this.config.SPAWN_MAX_TIER, Math.max(1, Math.min(2, tiers.length - 3)));
    return Math.floor(Math.random() * (maxAllowed + 1));
  }

  public updateConfig(newConfig: Partial<MergeDropConfig>) {
    const prevTheme = this.config.SKIN_THEME;
    const prevBaseRadius = this.config.BASE_BALL_RADIUS;
    this.config = { ...this.config, ...newConfig };

    if (newConfig.AUTO_STREAM_ACTIVE !== undefined) {
      this.isAutoStreaming = newConfig.AUTO_STREAM_ACTIVE;
    }

    if (newConfig.ACTIVE_TIERS !== undefined) {
      const activeTiers = this.getActiveTiers();
      textureManager.preloadThemeImages(activeTiers);
      this.balls.forEach((b) => b.setActiveTiers(activeTiers));
      if (this.maxTierReached >= activeTiers.length) {
        this.maxTierReached = activeTiers.length - 1;
      }
      if (this.nextTier >= activeTiers.length) {
        this.nextTier = this.getRandomSpawnTier();
      }
    }

    if (newConfig.BASE_BALL_RADIUS !== undefined && newConfig.BASE_BALL_RADIUS !== prevBaseRadius) {
      const activeTiers = this.getActiveTiers();
      this.balls.forEach((b) => b.updateRadius(this.config.BASE_BALL_RADIUS, activeTiers));
    }

    if (newConfig.BALL_HITBOX_SCALE !== undefined) {
      const activeTiers = this.getActiveTiers();
      const scale = Math.max(0.4, Math.min(2.0, this.config.BALL_HITBOX_SCALE ?? 1.0));
      this.balls.forEach((b) => b.setHitboxScale(scale, activeTiers));
    }

    if (newConfig.SHOW_BALL_OUTLINE !== undefined) {
      const showOutline = newConfig.SHOW_BALL_OUTLINE !== false;
      this.balls.forEach((b) => b.setShowOutline(showOutline));
    }

    if (newConfig.SHOW_HITBOX_DEBUG !== undefined) {
      const showDebug = this.config.SHOW_HITBOX_DEBUG === true;
      this.balls.forEach((b) => b.setShowHitboxDebug(showDebug));
    }

    if (newConfig.SKIN_THEME !== undefined && newConfig.SKIN_THEME !== prevTheme) {
      const themeDef = getThemeDefinition(this.config.SKIN_THEME);
      if (themeDef.defaultContainerColor && newConfig.CONTAINER_COLOR === undefined) {
        this.config.CONTAINER_COLOR = themeDef.defaultContainerColor;
      }
      if (themeDef.defaultBackgroundColor && newConfig.BACKGROUND_COLOR === undefined) {
        this.config.BACKGROUND_COLOR = themeDef.defaultBackgroundColor;
      }
      const activeTiers = this.getActiveTiers();
      textureManager.preloadThemeImages(activeTiers);
      voiceAnnouncer.preloadWebAudioBuffers(this.config.SKIN_THEME);
      this.balls.forEach((b) => b.setTheme(this.config.SKIN_THEME, this.config.BASE_BALL_RADIUS, activeTiers));
      if (this.maxTierReached >= activeTiers.length) {
        this.maxTierReached = activeTiers.length - 1;
      }
      if (this.nextTier >= activeTiers.length) {
        this.nextTier = this.getRandomSpawnTier();
      }
    }

    if (newConfig.CONTAINER_BOTTOM_Y !== undefined || newConfig.CONTAINER_TOP_Y !== undefined) {
      const bot = this.chamberBottom;
      for (const b of this.balls) {
        if (b.y + b.radius > bot) {
          b.y = bot - b.radius;
          b.vy = Math.min(b.vy, 0);
        }
      }
    }

    this.syncHUD();
  }

  public start() {
    if (this.isReplaying) return;
    sound.init();
    voiceAnnouncer.warmup();
    if (this.balls.length === 0) {
      this.reset();
    }
  }

  public reset() {
    this.balls = [];
    this.sparks = [];
    this.shockwaves = [];
    this.vortexParticles = [];
    this.textPopups = [];
    voiceAnnouncer.stop();
    this.score = 0;
    this.maxTierReached = 0;
    this.tierUnlockPops = new Array(10).fill(1.0);
    this.tierUnlockPops[0] = 1.35;
    this.nextTier = this.getRandomSpawnTier();
    this.canManualDrop = true;
    this.manualDropCooldown = 0;
    this.autoStreamTimer = 0;
    this.autoStreamElapsedTime = 0;
    this.autoStreamBallsDropped = 0;
    this.lastDisplayedStreamRate = 0;
    this.screenShake = 0;
    this.state = 'RUNNING';
    this.climaxPhase = 'NONE';
    this.climaxTimer = 0;
    this.timeScale = 1.0;
    this.overflowTimer = 0;
    this.isDangerWarning = false;
    this.dangerSoundCooldown = 0;
    this.syncHUD();
  }

  public pauseLoop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public resumeLoop() {
    if (this.animFrameId === null && !this.isDestroyed) {
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
  }

  public syncFromSimulation(sim: MergeDropSimulation, events: SimulationEvent[]) {
    // Si la Supernova est en cours, la cinématique visuelle contrôle les billes
    if (this.climaxPhase !== 'NONE') {
      this.score = sim.score;
      this.maxTierReached = sim.maxTierReached;
      return;
    }

    const simBallMap = new Map(sim.balls.map((b) => [b.id, b]));

    // Supprime les billes disparues
    this.balls = this.balls.filter((b) => simBallMap.has(b.id));

    // Met à jour les positions des billes existantes
    for (const b of this.balls) {
      const sb = simBallMap.get(b.id);
      if (sb) {
        b.x = sb.x;
        b.y = sb.y;
        b.vx = sb.vx;
        b.vy = sb.vy;
        b.hasLanded = sb.hasLanded;
      }
    }

    // Ajoute les nouvelles billes
    const existingIds = new Set(this.balls.map((b) => b.id));
    for (const sb of sim.balls) {
      if (!existingIds.has(sb.id)) {
        const isMergedBall = events.some(
          (e) => e.type === 'merge' && (e as MergeEvent).newBallId === sb.id
        );
        const showOutline = this.config.SHOW_BALL_OUTLINE !== false;
        const nb = new MergeBall(
          sb.id,
          sb.tier,
          sb.x,
          sb.y,
          this.config.SKIN_THEME,
          isMergedBall,
          this.config.BASE_BALL_RADIUS || 16,
          this.getActiveTiers(),
          showOutline,
          this.config.BALL_HITBOX_SCALE ?? 1.0,
          this.config.SHOW_HITBOX_DEBUG === true
        );
        nb.vx = sb.vx;
        nb.vy = sb.vy;
        nb.hasLanded = sb.hasLanded;
        this.balls.push(nb);
      }
    }

    // Traite les événements
    const currentTiers = this.getCurrentTiers();
    for (const ev of events) {
      if (ev.type === 'merge') {
        const m = ev as MergeEvent;
        this.comboCount = m.comboCount;
        this.comboTimer = 0.55;

        const tierColor = currentTiers[m.nextTier]?.color || '#ffd700';
        for (let s = 0; s < 6; s++) {
          this.sparks.push(new MergeSpark(m.x, m.y, tierColor));
        }

        if (this.config.VOICE_ANNOUNCER_SHOW_POPUP !== false) {
          const isEn = this.config.TEXT_METRIC_SCORE === 'SCORE' && this.config.TEXT_METRIC_MAX_TIER === 'MAX PLANET';
          const tierName = getTierLocalizedName(currentTiers[m.nextTier], isEn);
          const prefix = (this.config.VOICE_ANNOUNCER_PREFIX !== undefined ? this.config.VOICE_ANNOUNCER_PREFIX.trim() : (this.config.SKIN_THEME?.includes('potatoes') ? 'Patate' : ''));
          const displayTxt = prefix && !tierName.toLowerCase().startsWith(prefix.toLowerCase()) ? `${prefix} ${tierName}` : tierName;
          this.textPopups.push({
            x: m.x,
            y: m.y - 30,
            text: displayTxt,
            color: tierColor,
            glowColor: currentTiers[m.nextTier]?.glowColor || tierColor,
            size: Math.min(26, 15 + m.nextTier * 1.3),
            life: 0.9,
            maxLife: 0.9
          });
        }
      } else if (ev.type === 'climax') {
        const cl = ev as ClimaxEvent;
        const ultimateTier = currentTiers.length - 1;
        const sunBall = this.balls.find((b) => b.id === cl.sunBallId) ||
                        this.balls.find((b) => b.tier === ultimateTier) ||
                        this.balls[this.balls.length - 1];
        if (sunBall) {
          this.triggerSupernovaClimax(sunBall);
        }
      }
    }

    this.score = sim.score;
    this.maxTierReached = sim.maxTierReached;
    if (sim.state === 'VICTORY') {
      this.state = 'VICTORY';
    } else if (sim.state === 'GAME_OVER') {
      this.state = 'GAME_OVER';
    }
  }

  public renderOfflineStep(sim: MergeDropSimulation, events: SimulationEvent[]) {
    this.syncFromSimulation(sim, events);

    const dt = 1 / 60;
    this.updateClimaxLogic(dt);

    for (let i = 0; i < this.balls.length; i++) {
      this.balls[i].update(dt);
    }

    this.updateVisualEffects(dt);
    this.render();
  }

  public isReplaying: boolean = false;
  private replaySim: MergeDropSimulation | null = null;
  private replayOnFinish?: () => void;
  private preReplayConfig: MergeDropConfig | null = null;

  public startReplay(telemetry: SimulationTelemetry, onFinish?: () => void) {
    this.pauseLoop();
    this.reset();
    this.isReplaying = true;
    this.replayOnFinish = onFinish;
    this.preReplayConfig = { ...this.config };
    const replayConfig = telemetry.config ? { ...this.config, ...telemetry.config } : this.config;
    this.updateConfig(replayConfig);
    this.replaySim = new MergeDropSimulation(telemetry.seed, replayConfig);
    textureManager.preloadThemeImagesAsync(this.getCurrentTiers());

    const stepReplayLoop = () => {
      if (!this.isReplaying || !this.replaySim || this.isDestroyed) return;

      const events = this.replaySim.tick();
      this.renderOfflineStep(this.replaySim, events);
      this.syncHUD();

      // Sons et voix en direct lors du replay (priorité absolue au merge le plus fort)
      const mergeEvents = events.filter((e): e is MergeEvent => e.type === 'merge');
      if (mergeEvents.length > 0 && this.config.SOUND_MERGE_ENABLED !== false) {
        const highestMerge = mergeEvents.reduce((prev, curr) => (curr.nextTier > prev.nextTier ? curr : prev));
        sound.playMerge(highestMerge.nextTier, {
          style: this.config.SOUND_MERGE_STYLE,
          comboIndex: highestMerge.comboCount - 1,
          pitchMult: this.config.SOUND_PITCH
        });
        if (this.config.VOICE_ANNOUNCER_ENABLED) {
          const isEn = this.config.TEXT_METRIC_SCORE === 'SCORE' && this.config.TEXT_METRIC_MAX_TIER === 'MAX PLANET';
          const targetTierObj = this.getCurrentTiers()[highestMerge.nextTier];
          const tierName = getTierLocalizedName(targetTierObj, isEn);
          const soundClipIndex = highestMerge.originalTierIndex ?? targetTierObj?.originalTierIndex ?? highestMerge.nextTier;
          voiceAnnouncer.speakMergeTier(highestMerge.nextTier, this.getCurrentTiers().length, tierName, {
            enabled: true,
            themeId: this.config.SKIN_THEME,
            mode: this.config.VOICE_ANNOUNCER_MODE,
            prefix: (this.config.VOICE_ANNOUNCER_PREFIX !== undefined ? this.config.VOICE_ANNOUNCER_PREFIX.trim() : (this.config.SKIN_THEME?.includes('potatoes') ? 'Patate' : '')),
            pitchBase: this.config.VOICE_ANNOUNCER_PITCH_BASE,
            rateBase: this.config.VOICE_ANNOUNCER_RATE_BASE,
            pitchMin: this.config.VOICE_ANNOUNCER_PITCH_MIN,
            rateMin: this.config.VOICE_ANNOUNCER_RATE_MIN,
            isMuted: sound.isMuted,
            lang: isEn ? 'en' : 'fr',
            soundClipIndex
          });
        }
      }

      if (this.replaySim.currentTick >= telemetry.totalTicks) {
        this.isReplaying = false;
        this.replaySim = null;
        this.pauseLoop();
        if (this.preReplayConfig) {
          this.updateConfig(this.preReplayConfig);
          this.preReplayConfig = null;
        }
        this.reset();
        this.resumeLoop();
        if (this.replayOnFinish) {
          const cb = this.replayOnFinish;
          this.replayOnFinish = undefined;
          cb();
        }
        return;
      }

      this.animFrameId = requestAnimationFrame(stepReplayLoop);
    };

    this.animFrameId = requestAnimationFrame(stepReplayLoop);
  }

  public stopReplay() {
    this.isReplaying = false;
    this.replaySim = null;
    this.pauseLoop();
    if (this.preReplayConfig) {
      this.updateConfig(this.preReplayConfig);
      this.preReplayConfig = null;
    }
    this.reset();
    this.resumeLoop();
    if (this.replayOnFinish) {
      const cb = this.replayOnFinish;
      this.replayOnFinish = undefined;
      cb();
    }
  }

  public destroy() {
    this.isDestroyed = true;
    voiceAnnouncer.stop();
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.renderer3D) {
      this.renderer3D.destroy();
      this.renderer3D = null;
      this.canvas3D = null;
    }
    window.removeEventListener('resize', this.handleResize);
  }

  public triggerExtraAction = () => {
    if (this.isReplaying) return;
    sound.init();
    if (this.state === 'GAME_OVER' || this.state === 'VICTORY') {
      this.reset();
      return;
    }
    this.toggleAutoStream();
  };

  public toggleAutoStream(): boolean {
    if (this.state === 'GAME_OVER' || this.state === 'VICTORY') return false;
    this.isAutoStreaming = !this.isAutoStreaming;
    this.config.AUTO_STREAM_ACTIVE = this.isAutoStreaming;
    this.autoStreamTimer = 0;
    this.autoStreamElapsedTime = 0;
    this.lastDisplayedStreamRate = 0;
    this.syncHUD();
    return this.isAutoStreaming;
  }

  public getCurrentStreamRate(): number {
    if (this.config.AUTO_STREAM_RAMP_ENABLED !== false) {
      const startRate = Math.max(1, this.config.AUTO_STREAM_START_RATE || 2);
      const maxRate = Math.max(startRate, this.config.AUTO_STREAM_MAX_RATE || 10);
      const step = Math.max(0.1, this.config.AUTO_STREAM_RAMP_STEP || 1);
      const interval = Math.max(0.5, this.config.AUTO_STREAM_RAMP_INTERVAL || 4);

      const numSteps = Math.floor(this.autoStreamElapsedTime / interval);
      return Math.min(maxRate, startRate + numSteps * step);
    }
    return Math.max(1, this.config.AUTO_STREAM_RATE || 5);
  }

  private triggerGameOver() {
    if (this.state === 'GAME_OVER' || this.state === 'VICTORY') return;
    this.state = 'GAME_OVER';
    this.isAutoStreaming = false;
    this.config.AUTO_STREAM_ACTIVE = false;
    this.triggerScreenShake(8.0);
    sound.playGameOver();
    this.syncHUD();
  }

  /**
   * Déclenche le Grand Final Cosmique (Supernova ralentie en Bullet Time)
   */
  private triggerSupernovaClimax(sunBall: MergeBall) {
    this.state = 'VICTORY';
    this.climaxPhase = 'SLOWMO_CHARGE';
    this.climaxTimer = 0;
    this.timeScale = 0.16; // Ralenti cosmique cinématographique

    // Clear les pop-ups flottants déjà existants SAUF celui du dernier merge
    if (this.textPopups.length > 0) {
      const currentTiers = this.getCurrentTiers();
      const ultimateTier = currentTiers.length - 1;
      const isEn = this.config.TEXT_METRIC_SCORE === 'SCORE' && this.config.TEXT_METRIC_MAX_TIER === 'MAX PLANET';
      const ultimateName = getTierLocalizedName(currentTiers[ultimateTier], isEn);

      const lastMergePopup =
        this.textPopups.slice().reverse().find((p) =>
          p.text.toLowerCase().includes(ultimateName.toLowerCase())
        ) || this.textPopups[this.textPopups.length - 1];

      lastMergePopup.life = Math.max(lastMergePopup.life, 2.5);
      lastMergePopup.maxLife = Math.max(lastMergePopup.maxLife, 2.5);
      this.textPopups = [lastMergePopup];
    }

    // Arrêt immédiat de tout largage par le haut
    this.canManualDrop = false;
    this.isAutoStreaming = false;
    this.config.AUTO_STREAM_ACTIVE = false;

    // Musique de montée en puissance
    sound.playSupernovaCharge();
    this.syncHUD();
  }

  private syncHUD() {
    const isEn = this.config.TEXT_METRIC_MAX_TIER === 'MAX PLANET' || this.config.TEXT_METRIC_SCORE === 'SCORE';
    const tiers = this.getCurrentTiers();
    const currentMaxTierObj = tiers[this.maxTierReached] || tiers[0];
    const themeDef = getThemeDefinition(this.config.SKIN_THEME);

    const title = this.config.TEXT_TITLE || (isEn ? themeDef.defaultTitleEn : themeDef.defaultTitle);
    let statusText: string | undefined;

    if (this.state === 'GAME_OVER') {
      statusText = isEn ? '💥 OVERFLOW! GAME OVER 💥' : '💥 DÉBORDEMENT ! PARTIE PERDUE 💥';
    } else if (this.state === 'VICTORY') {
      statusText = isEn ? '☀️ COSMIC SUPERNOVA! ULTIMATE MERGE ☀️' : '☀️ SUPERNOVA COSMIQUE ! VICTOIRE TOTALE ☀️';
    } else if (this.isDangerWarning) {
      statusText = isEn ? '⚠️ DANGER: OVERFLOW! ⚠️' : '⚠️ DANGER : DÉBORDEMENT ! ⚠️';
    } else if (this.maxTierReached >= tiers.length - 1) {
      statusText = this.config.TEXT_STATUS_VICTORY || (isEn ? themeDef.victoryTextEn : themeDef.victoryText);
    }

    const streamStopLabel = this.config.TEXT_ACTION_STREAM_STOP || (isEn ? themeDef.streamStopLabelEn : themeDef.streamStopLabel);
    const streamStartLabel = this.config.TEXT_ACTION_STREAM_START || (isEn ? themeDef.streamStartLabelEn : themeDef.streamStartLabel);
    const currentRate = this.getCurrentStreamRate();
    const formattedRate = currentRate % 1 === 0 ? currentRate.toString() : currentRate.toFixed(1);
    const dynamicStreamStopLabel = `${streamStopLabel} (${formattedRate}/s)`;

    const tierLocalizedName = getTierLocalizedName(currentMaxTierObj, isEn);

    this.currentHUD = {
      title,
      primaryMetricLabel: this.config.TEXT_METRIC_SCORE || 'SCORE',
      primaryMetricValue: this.score,
      secondaryMetricLabel: this.config.TEXT_METRIC_MAX_TIER || (isEn ? themeDef.metricMaxLabelEn : themeDef.metricMaxLabel),
      secondaryMetricValue: `${currentMaxTierObj.symbol} ${tierLocalizedName}`,
      statusText,
      extraActionLabel: this.isAutoStreaming ? dynamicStreamStopLabel : streamStartLabel,
      extraActionActive: this.isAutoStreaming,
      topOffset: this.config.HUD_TOP_OFFSET !== undefined ? this.config.HUD_TOP_OFFSET : 35
    };
    this.onHUDUpdate(this.currentHUD);
  }

  public handlePointerDown = (e: MouseEvent | TouchEvent, clientX: number, clientY: number) => {
    if (this.isReplaying) return;
    sound.init();
    voiceAnnouncer.warmup();
    if (this.state === 'GAME_OVER' || this.climaxPhase === 'VICTORY_SCREEN') {
      this.reset();
      return;
    }
    if (this.state === 'RUNNING') {
      this.triggerManualDrop();
    }
  };

  public handlePointerMove = (e: MouseEvent | TouchEvent, clientX: number, clientY: number) => { };
  public handlePointerUp = () => { };

  private triggerImpactSound(speed: number) {
    if (this.config.SOUND_COLLISION_ENABLED === false) return;
    sound.playImpact(speed, {
      style: this.config.SOUND_COLLISION_STYLE,
      volume: (this.config.SOUND_COLLISION_VOLUME ?? 35) / 100,
      pitchMult: this.config.SOUND_PITCH
    });
  }

  private triggerManualDrop() {
    if (this.state !== 'RUNNING' || !this.canManualDrop) return;

    if (this.config.SOUND_DROP_ENABLED !== false) {
      sound.playDrop({
        style: this.config.SOUND_MERGE_STYLE,
        volume: (this.config.SOUND_MERGE_VOLUME ?? 80) / 100,
        pitchMult: this.config.SOUND_PITCH
      });
    }

    const showOutline = this.config.SHOW_BALL_OUTLINE !== false;
    const ball = new MergeBall(
      this.nextBallId++,
      this.nextTier,
      this.dropX,
      this.dropY,
      this.config.SKIN_THEME,
      false,
      this.config.BASE_BALL_RADIUS || 16,
      this.getActiveTiers(),
      showOutline,
      this.config.BALL_HITBOX_SCALE ?? 1.0,
      this.config.SHOW_HITBOX_DEBUG === true
    );
    ball.vy = 260; // Descente rapide
    this.balls.push(ball);

    if (ball.tier > this.maxTierReached) {
      this.maxTierReached = ball.tier;
      this.tierUnlockPops[ball.tier] = 1.45;
    }

    this.nextTier = this.getRandomSpawnTier();
    this.canManualDrop = false;
    this.manualDropCooldown = 0.35;
  }

  private spawnLevel1StreamBall() {
    if (this.state !== 'RUNNING') return;
    const jitterX = (Math.random() - 0.5) * 10;
    const showOutline = this.config.SHOW_BALL_OUTLINE !== false;
    const ball = new MergeBall(
      this.nextBallId++,
      0, // Niveau 1 / Premier palier actif
      this.dropX + jitterX,
      this.dropY,
      this.config.SKIN_THEME,
      false,
      this.config.BASE_BALL_RADIUS || 16,
      this.getActiveTiers(),
      showOutline,
      this.config.BALL_HITBOX_SCALE ?? 1.0,
      this.config.SHOW_HITBOX_DEBUG === true
    );
    ball.vx = (Math.random() - 0.5) * 20;
    ball.vy = 300 + Math.random() * 80;
    this.balls.push(ball);

    this.autoStreamBallsDropped++;
    if (this.config.SOUND_DROP_ENABLED !== false && this.autoStreamBallsDropped % 3 === 0) {
      sound.playDrop({
        style: this.config.SOUND_MERGE_STYLE,
        volume: ((this.config.SOUND_MERGE_VOLUME ?? 80) / 100) * 0.7,
        pitchMult: this.config.SOUND_PITCH
      });
    }
  }

  private triggerScreenShake(intensity: number) {
    if (!this.config.SCREEN_SHAKE_ENABLED) return;
    this.screenShake = Math.max(this.screenShake, Math.min(18.0, intensity));
  }

  /**
   * Calcul géométrique de la Fiole sphérique avec col vertical
   */
  public getCircleGeometry() {
    const cX = 270;
    const botY = this.chamberBottom;
    const topY = this.funnelTop;
    const neckHalfW = 45;
    // Rayon dynamique s'adaptant à la hauteur disponible
    const R = Math.max(130, Math.min(225, (botY - topY - 110) * 0.52));
    const cY = botY - R;
    const neckConnectY = cY - Math.sqrt(Math.max(1, R * R - neckHalfW * neckHalfW));
    const delta = Math.asin(Math.min(0.99, neckHalfW / R));
    const thetaLeft = -Math.PI / 2 - delta;
    const thetaRight = -Math.PI / 2 + delta;
    return { cX, cY, R, neckHalfW, neckConnectY, delta, thetaLeft, thetaRight, circleBottom: botY };
  }

  /**
   * Profil mathématique de la Jarre galbée (demi-largeur en fonction de Y)
   */
  public getJarHalfWidth(y: number): number {
    const topY = this.funnelTop;
    const botY = this.chamberBottom;
    const funnelEndY = topY + 50;
    const neckEndY = topY + 140;

    if (y < funnelEndY) {
      const t = Math.max(0, Math.min(1, (y - topY) / (funnelEndY - topY)));
      return 75 - t * 35; // 75 -> 40
    }
    if (y <= neckEndY) {
      return 40; // Col de la jarre (diamètre 80px)
    }
    const chamberH = Math.max(40, botY - neckEndY);
    const t = Math.max(0, Math.min(1, (y - neckEndY) / chamberH)); // 0 -> 1
    if (t < 0.5) {
      const p = t / 0.5;
      const s = Math.sin((p * Math.PI) / 2);
      return 40 + (215 - 40) * s; // Évasement du col vers la panse (215px demi-largeur)
    } else {
      const p = (t - 0.5) / 0.5;
      const s = Math.sin((p * Math.PI) / 2);
      return 215 - (215 - 165) * s; // Rétrécissement vers le fond plat (165px demi-largeur)
    }
  }

  /**
   * Profil mathématique du Conteneur Personnalisable sur-mesure
   */
  public getCustomHalfWidth(y: number): number {
    const topY = this.funnelTop;
    const botY = this.chamberBottom;
    const funnelEndY = topY + 50;
    const neckEndY = topY + 140;

    const neckW = Math.max(35, this.config.CUSTOM_NECK_WIDTH || 45);
    const bellyW = Math.max(40, this.config.CUSTOM_BELLY_WIDTH || 135);
    const bellyPos = Math.max(0.15, Math.min(0.85, this.config.CUSTOM_BELLY_POSITION || 0.55));
    const bottomW = Math.max(35, this.config.CUSTOM_BOTTOM_WIDTH || 220);
    const curvature = Math.max(0, Math.min(1, this.config.CUSTOM_CURVATURE !== undefined ? this.config.CUSTOM_CURVATURE : 0.05));
    const waveCount = Math.max(0, this.config.CUSTOM_WAVE_COUNT || 0);
    const waveAmp = Math.max(0, this.config.CUSTOM_WAVE_AMPLITUDE || 0);

    // Entonnoir supérieur de largage
    if (y < funnelEndY) {
      const t = Math.max(0, Math.min(1, (y - topY) / (funnelEndY - topY)));
      const topW = Math.max(75, neckW + 15);
      return topW - t * (topW - neckW);
    }
    // Col de passage
    if (y <= neckEndY) {
      return neckW;
    }

    // Cuve principale personnalisée
    const chamberH = Math.max(40, botY - neckEndY);
    const t = Math.max(0, Math.min(1, (y - neckEndY) / chamberH));

    let baseW: number;
    if (t < bellyPos) {
      const p = t / bellyPos;
      const lin = neckW + (bellyW - neckW) * p;
      const curv = neckW + (bellyW - neckW) * Math.sin((p * Math.PI) / 2);
      baseW = lin * (1 - curvature) + curv * curvature;
    } else {
      const p = (t - bellyPos) / (1 - bellyPos);
      const lin = bellyW + (bottomW - bellyW) * p;
      const curv = bellyW + (bottomW - bellyW) * (1 - Math.cos((p * Math.PI) / 2));
      baseW = lin * (1 - curvature) + curv * curvature;
    }

    // Modulation d'ondulations
    if (waveCount > 0 && waveAmp > 0) {
      const wave = Math.sin(t * Math.PI * waveCount * 2) * waveAmp * Math.sin(t * Math.PI);
      baseW += wave;
    }

    return Math.max(35, Math.min(235, baseW));
  }

  /**
   * Profil mathématique de la Fiole ronde avec tube vertical (demi-largeur en fonction de Y)
   */
  public getCircleHalfWidth(y: number): number {
    const { cY, R, neckHalfW, neckConnectY } = this.getCircleGeometry();
    const topY = this.funnelTop;
    const funnelEndY = topY + 50;

    if (y < funnelEndY) {
      const t = Math.max(0, Math.min(1, (y - topY) / (funnelEndY - topY)));
      return 80 - t * (80 - neckHalfW); // 80 -> 45
    }
    if (y <= neckConnectY) {
      return neckHalfW; // Tube vertical d'entrée (diamètre 90px)
    }
    const dy = Math.abs(y - cY);
    if (dy >= R) {
      return 20;
    }
    return Math.sqrt(Math.max(0, R * R - dy * dy));
  }

  /**
   * Retourne la demi-largeur active du conteneur selon la forme choisie
   */
  public getContainerHalfWidth(y: number): number {
    if (this.config.CONTAINER_SHAPE === 'custom') {
      return this.getCustomHalfWidth(y);
    }
    if (this.config.CONTAINER_SHAPE === 'circle') {
      return this.getCircleHalfWidth(y);
    }
    return this.getJarHalfWidth(y);
  }

  /**
   * Helper pour obtenir le style visuel du contour du conteneur (couleur unie ou dégradé arc-en-ciel animé)
   */
  public getContainerStrokeStyle(
    ctx: CanvasRenderingContext2D,
    topY: number = 190,
    bottomY: number = 790
  ): string | CanvasGradient {
    if (this.config.CONTAINER_COLOR === 'rainbow') {
      const grad = ctx.createLinearGradient(0, topY, 0, bottomY);
      const shift = (performance.now() * 0.0004) % 1; // Animation fluide du flux arc-en-ciel
      const colors = ['#ff0055', '#ff7700', '#ffee00', '#00ff66', '#00f0ff', '#b026ff', '#ff0055'];
      for (let i = 0; i < colors.length; i++) {
        let stop = (i / (colors.length - 1) + shift) % 1;
        grad.addColorStop(stop, colors[i]);
      }
      return grad;
    }
    return this.config.CONTAINER_COLOR || '#00f0ff';
  }

  /**
   * Helper pour obtenir la couleur du conteneur avec un niveau d'opacité
   */
  public getContainerAccentColor(alpha: number = 0.4): string {
    if (this.config.CONTAINER_COLOR === 'rainbow') {
      const hue = (performance.now() * 0.08) % 360;
      return `hsla(${hue}, 100%, 65%, ${alpha})`;
    }
    const hex = (this.config.CONTAINER_COLOR || '#00f0ff').replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return `rgba(0, 240, 255, ${alpha})`;
  }

  /**
   * Calcule la hauteur Y du sol personnalisable à la coordonnée X donnée (arrondi ou piques)
   */
  public getCustomFloorY(x: number): number {
    const bottomHW = this.getCustomHalfWidth(this.chamberBottom);
    const xLeft = 270 - bottomHW;
    const xRight = 270 + bottomHW;
    const count = this.config.CUSTOM_BOTTOM_WAVE_COUNT || 0;
    const amp = this.config.CUSTOM_BOTTOM_WAVE_AMPLITUDE || 0;
    const style = this.config.CUSTOM_BOTTOM_WAVE_STYLE || 'smooth';

    if (count <= 0 || amp <= 0 || x <= xLeft || x >= xRight) {
      return this.chamberBottom;
    }

    const u = Math.max(0, Math.min(1, (x - xLeft) / (xRight - xLeft))); // 0 -> 1

    let wavePattern: number;
    if (style === 'spikes') {
      // Forme en piques triangulaires / dents de scie (lignes droites de -1 à +1)
      const cycle = (u * count * 2) % 2;
      wavePattern = cycle < 1 ? -1 + 2 * cycle : 1 - 2 * (cycle - 1);
    } else {
      // Vagues arrondies douces
      wavePattern = Math.sin(u * Math.PI * count * 2);
    }

    // Atténuation aux extrémités pour joindre parfaitement les parois à gauche et à droite
    const envelope = Math.sin(u * Math.PI);
    const wave = wavePattern * amp * envelope;

    return this.chamberBottom - wave;
  }

  /**
   * Pente (dérivée df/dx) du sol au point X pour calculer la normale physique de collision
   */
  public getCustomFloorSlope(x: number): number {
    const dx = 1.0;
    return (this.getCustomFloorY(x + dx) - this.getCustomFloorY(x - dx)) / (2 * dx);
  }

  private updateClimaxLogic(dt: number) {
    if (this.climaxPhase === 'NONE') return;

    this.climaxTimer += dt;
    const ultimateTier = this.getCurrentTiers().length - 1;
    const sunBall = this.balls.find((b) => b.tier === ultimateTier);

    if (this.climaxPhase === 'SLOWMO_CHARGE') {
      if (sunBall) {
        // Lévitation douce du Soleil vers le centre de la cuve
        sunBall.x += (this.centerX - sunBall.x) * 2.2 * dt;
        sunBall.y += (520 - sunBall.y) * 2.2 * dt;
        sunBall.vx = 0;
        sunBall.vy = 0;

        // Pulsation façon cœur d'énergie cosmique qui gonfle
        sunBall.scale = 1.15 + Math.sin(this.climaxTimer * 14) * 0.28 + this.climaxTimer * 0.18;

        // Particules de vortex aspirées vers le Soleil (trou noir / singularité)
        if (Math.random() < 0.75) {
          const ang = Math.random() * Math.PI * 2;
          const dist = 140 + Math.random() * 160;
          this.vortexParticles.push({
            x: sunBall.x + Math.cos(ang) * dist,
            y: sunBall.y + Math.sin(ang) * dist,
            targetX: sunBall.x,
            targetY: sunBall.y,
            color: Math.random() > 0.4 ? '#ffd700' : '#ff007f',
            size: 2.5 + Math.random() * 3,
            progress: 0
          });
        }

        // Montée progressive de la secousse d'écran
        this.triggerScreenShake(2.0 + this.climaxTimer * 4.5);

        // Maintenir le pop-up du dernier merge centré au-dessus de l'astre en charge
        if (this.textPopups.length > 0) {
          const p = this.textPopups[0];
          p.x = sunBall.x;
          p.y = sunBall.y - sunBall.radius * sunBall.scale - 20;
        }
      }

      // Détonation de la Supernova au terme de la charge !
      if (this.climaxTimer >= 1.4) {
        this.climaxPhase = 'EXPLOSION';
        this.timeScale = 0.5;
        this.textPopups = []; // Efface les pop-ups lors de la déflagration pour sublimer l'explosion
        sound.playSupernovaExplosion();
        this.triggerScreenShake(18.0);

        if (sunBall) {
          // Ondes de choc titanesques concentriques
          this.shockwaves.push(
            { x: sunBall.x, y: sunBall.y, radius: sunBall.radius, maxRadius: 550, color: '#ffffff', life: 1.0, maxLife: 1.0, lineWidth: 10 },
            { x: sunBall.x, y: sunBall.y, radius: sunBall.radius * 0.7, maxRadius: 650, color: '#ffd700', life: 1.3, maxLife: 1.3, lineWidth: 16 },
            { x: sunBall.x, y: sunBall.y, radius: sunBall.radius * 0.4, maxRadius: 780, color: '#ff007f', life: 1.6, maxLife: 1.6, lineWidth: 8 }
          );

          // Éjection et vaporisation de toutes les autres billes en poussière stellaire
          for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];
            if (b.id !== sunBall.id) {
              for (let s = 0; s < 14; s++) {
                this.sparks.push(new MergeSpark(b.x, b.y, b.tierData.color));
              }
            }
          }
          // Nuée d'étincelles solaires royales
          for (let s = 0; s < 140; s++) {
            this.sparks.push(new MergeSpark(sunBall.x, sunBall.y, Math.random() > 0.5 ? '#ffd700' : '#ff6d00'));
          }

          // Seul le Soleil brille triomphalement au centre
          this.balls = [sunBall];
          sunBall.scale = 1.55;
          sunBall.flash = 1.0;
        }
      }
    } else if (this.climaxPhase === 'EXPLOSION') {
      if (sunBall) {
        sunBall.scale = Math.max(1.0, sunBall.scale - 0.4 * dt);
        sunBall.x = this.centerX;
        sunBall.y = 520;
        sunBall.vx = 0;
        sunBall.vy = 0;
      }

      if (this.climaxTimer >= 3.2) {
        this.climaxPhase = 'VICTORY_SCREEN';
        this.timeScale = 1.0;
        this.syncHUD();
      }
    }
  }

  private updatePhysics(dt: number) {
    this.tubeFlowOffset = (this.tubeFlowOffset + dt * 180) % 30;

    const effectiveDt = this.climaxPhase !== 'NONE' ? dt * this.timeScale : dt;

    // Gestion de la cinématique de Supernova
    this.updateClimaxLogic(dt);

    if (this.state === 'RUNNING') {
      if (!this.canManualDrop) {
        this.manualDropCooldown -= dt;
        if (this.manualDropCooldown <= 0) {
          this.canManualDrop = true;
        }
      }

      if (this.isAutoStreaming) {
        this.autoStreamElapsedTime += dt;
        const rate = this.getCurrentStreamRate();
        const roundedRate = Math.round(rate * 10) / 10;
        if (roundedRate !== this.lastDisplayedStreamRate) {
          this.lastDisplayedStreamRate = roundedRate;
          this.syncHUD();
        }

        const interval = 1.0 / rate;
        this.autoStreamTimer += dt;
        while (this.autoStreamTimer >= interval) {
          this.autoStreamTimer -= interval;
          this.spawnLevel1StreamBall();
        }
      }
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    const subSteps = 6;
    const subDt = effectiveDt / subSteps;
    const gravityAccel = this.config.GRAVITY * 2600;
    const restitution = this.config.RESTITUTION;
    const friction = Math.pow(this.config.FRICTION, subDt * 60);

    const useCurvedContainer = this.config.CONTAINER_SHAPE === 'jar' || this.config.CONTAINER_SHAPE === 'custom';
    let hadMergeThisFrame = false;

    for (let step = 0; step < subSteps; step++) {
      // 1. Déplacement & Collision Parois
      for (let i = 0; i < this.balls.length; i++) {
        const b = this.balls[i];

        // L'astre ultime en climax ne subit plus la gravité ordinaire
        const ultimateTier = this.getCurrentTiers().length - 1;
        if (this.climaxPhase !== 'NONE' && b.tier === ultimateTier) {
          continue;
        }

        b.vy += gravityAccel * subDt;
        b.vx *= friction;
        b.vy *= friction;
        b.x += b.vx * subDt;
        b.y += b.vy * subDt;

        if (this.config.CONTAINER_SHAPE === 'circle') {
          // --- COLLISIONS FIOLE RONDE & TUBE VERTICAL ---
          const { cX, cY, R, neckHalfW, neckConnectY, circleBottom } = this.getCircleGeometry();

          if (b.y <= neckConnectY) {
            // Dans le tube vertical ou l'entonnoir
            const halfW = this.getCircleHalfWidth(b.y);
            const minX = cX - halfW + b.radius;
            const maxX = cX + halfW - b.radius;
            if (b.x < minX) {
              b.x = minX;
              b.vx = Math.abs(b.vx) * restitution + 10;
            } else if (b.x > maxX) {
              b.x = maxX;
              b.vx = -Math.abs(b.vx) * restitution - 10;
            }
          } else {
            // Dans la fiole sphérique
            const dx = b.x - cX;
            const dy = b.y - cY;
            const dist = Math.hypot(dx, dy);
            const maxDist = R - b.radius;

            // Couloir d'entrée sous le col : la bille tombe librement dans la fiole
            const inNeckCorridor = b.y < neckConnectY + 30 && Math.abs(dx) < neckHalfW - 4;

            if (!inNeckCorridor && dist > maxDist && dist > 0.001) {
              const nx = dx / dist;
              const ny = dy / dist;
              b.x = cX + nx * maxDist;
              b.y = cY + ny * maxDist;

              const vNormal = b.vx * nx + b.vy * ny;
              if (vNormal > 0) {
                b.vx -= (1 + restitution) * vNormal * nx;
                b.vy -= (1 + restitution) * vNormal * ny;
              }
              // Friction le long de la paroi arrondie
              b.vx *= 0.98;
              b.vy *= 0.98;
              b.hasLanded = true;
            }

            // Épaulement supérieur : empêche de remonter hors du col sur les côtés
            if (b.y - b.radius < neckConnectY && Math.abs(dx) >= neckHalfW - 4) {
              b.y = neckConnectY + b.radius;
              if (b.vy < 0) b.vy = -b.vy * restitution;
            }
          }

          // Filet de sécurité absolu au fond du bocal
          if (b.y + b.radius > circleBottom) {
            const spd = Math.abs(b.vy);
            if (spd > 70) this.triggerImpactSound(spd);
            b.y = circleBottom - b.radius;
            b.vy = -Math.abs(b.vy) * restitution * 0.5;
            b.hasLanded = true;
          }
        } else if (useCurvedContainer) {
          // --- COLLISIONS DANS LA JARRE / FORME SUR-MESURE ---
          const halfW = this.getContainerHalfWidth(b.y);
          const minX = 270 - halfW + b.radius;
          const maxX = 270 + halfW - b.radius;

          if (b.x < minX) {
            b.x = minX;
            const spd = Math.abs(b.vx);
            if (spd > 75) this.triggerImpactSound(spd);
            b.vx = Math.abs(b.vx) * restitution + 10;
          } else if (b.x > maxX) {
            b.x = maxX;
            const spd = Math.abs(b.vx);
            if (spd > 75) this.triggerImpactSound(spd);
            b.vx = -Math.abs(b.vx) * restitution - 10;
          }

          // Collision avec le sol (plat ou ondulé selon les réglages)
          const hasBottomWaves =
            this.config.CONTAINER_SHAPE === 'custom' &&
            (this.config.CUSTOM_BOTTOM_WAVE_COUNT || 0) > 0 &&
            (this.config.CUSTOM_BOTTOM_WAVE_AMPLITUDE || 0) > 0;

          if (hasBottomWaves) {
            const floorY = this.getCustomFloorY(b.x);
            const penetration = (b.y + b.radius) - floorY;
            if (penetration > 0) {
              const slope = this.getCustomFloorSlope(b.x);
              const len = Math.sqrt(slope * slope + 1);
              const nx = -slope / len;
              const ny = -1 / len;

              // Remise à niveau stricte au-dessus du sol
              b.y = Math.min(b.y, floorY - b.radius);
              b.x += nx * Math.min(penetration, 8);

              const vNormal = b.vx * nx + b.vy * ny;
              if (vNormal < 0) {
                if (-vNormal > 70) this.triggerImpactSound(-vNormal);
                b.vx -= (1 + restitution) * vNormal * nx;
                b.vy -= (1 + restitution) * vNormal * ny;
              }
              // Glissement sur les pentes
              b.vx += -slope * gravityAccel * subDt * 0.75;
              b.vx *= 0.94;
              b.hasLanded = true;
            }
          } else {
            if (b.y + b.radius > this.chamberBottom) {
              const spd = Math.abs(b.vy);
              if (spd > 70) this.triggerImpactSound(spd);
              b.y = this.chamberBottom - b.radius;
              b.vy = -b.vy * restitution;
              b.vx *= 0.94;
              b.hasLanded = true;
            }
          }

          // Filet de sécurité absolu contre toute bille en chute sous le sol
          if (b.y + b.radius > this.chamberBottom + 10) {
            b.y = this.chamberBottom - b.radius;
            b.vy = -Math.abs(b.vy) * restitution * 0.5;
            b.hasLanded = true;
          }
        } else {
          // --- COLLISIONS TUBE & CUVE RECTANGULAIRE ---
          if (b.y <= this.tubeBottom) {
            if (b.y < this.tubeTop) {
              const funnelProgress = (b.y - this.funnelTop) / (this.tubeTop - this.funnelTop);
              const curLeft = this.funnelLeft + (this.tubeLeft - this.funnelLeft) * Math.max(0, funnelProgress);
              const curRight = this.funnelRight - (this.funnelRight - this.tubeRight) * Math.max(0, funnelProgress);

              if (b.x - b.radius < curLeft) {
                b.x = curLeft + b.radius;
                b.vx = Math.abs(b.vx) * 0.4 + 20;
              } else if (b.x + b.radius > curRight) {
                b.x = curRight - b.radius;
                b.vx = -Math.abs(b.vx) * 0.4 - 20;
              }
            } else {
              if (b.x - b.radius < this.tubeLeft) {
                b.x = this.tubeLeft + b.radius;
                b.vx = -b.vx * restitution * 0.5;
              } else if (b.x + b.radius > this.tubeRight) {
                b.x = this.tubeRight - b.radius;
                b.vx = -b.vx * restitution * 0.5;
              }
            }
          } else {
            if (b.x - b.radius < this.chamberLeft) {
              b.x = this.chamberLeft + b.radius;
              b.vx = -b.vx * restitution;
            } else if (b.x + b.radius > this.chamberRight) {
              b.x = this.chamberRight - b.radius;
              b.vx = -b.vx * restitution;
            }

            if (b.y - b.radius < this.tubeBottom) {
              if (b.x < this.tubeLeft || b.x > this.tubeRight) {
                b.y = this.tubeBottom + b.radius;
                b.vy = Math.abs(b.vy) * restitution;
              }
            }

            if (b.y + b.radius > this.chamberBottom) {
              b.y = this.chamberBottom - b.radius;
              b.vy = -b.vy * restitution;
              b.vx *= 0.94;
              b.hasLanded = true;
            }
          }
        }
      }

      // 2. Collision & Fusion Cercle-Cercle (Sweep-and-Prune spatial optimisé 60 FPS)
      const toRemove = new Set<number>();
      const toAdd: MergeBall[] = [];
      const currentTiers = this.getCurrentTiers();

      // Tri spatial selon Y pour un balayage ultra-rapide
      const sorted = this.balls.slice().sort((a, b) => a.y - b.y);

      for (let i = 0; i < sorted.length; i++) {
        const b1 = sorted[i];
        if (toRemove.has(b1.id)) continue;

        // Limite Y maximale au-delà de laquelle aucune bille ne peut toucher b1
        const maxR = 94; // rayon maximal possible (Soleil)
        const cutoffY = b1.y + b1.radius + maxR;

        for (let j = i + 1; j < sorted.length; j++) {
          const b2 = sorted[j];

          // Arrêt immédiat dès que les billes suivantes sont trop basses en Y
          if (b2.y > cutoffY) break;
          if (toRemove.has(b2.id)) continue;

          const minDist = b1.radius + b2.radius;
          const dx = b2.x - b1.x;

          // Test AABB rapide en X sans calcul lourd
          if (Math.abs(dx) >= minDist) continue;

          const dy = b2.y - b1.y;
          const distSq = dx * dx + dy * dy;
          const minDistSq = minDist * minDist;

          // Test de collision géométrique réel
          if (distSq < minDistSq && distSq > 0) {
            // Fusion
            if (
              b1.tier === b2.tier &&
              b1.tier < currentTiers.length - 1 &&
              b1.mergeCooldown <= 0 &&
              b2.mergeCooldown <= 0
            ) {
              toRemove.add(b1.id);
              toRemove.add(b2.id);

              const nextTier = b1.tier + 1;
              const midX = (b1.x + b2.x) / 2;
              const midY = (b1.y + b2.y) / 2;

              const showOutline = this.config.SHOW_BALL_OUTLINE !== false;
              const mergedBall = new MergeBall(
                this.nextBallId++,
                nextTier,
                midX,
                midY,
                this.config.SKIN_THEME,
                true,
                this.config.BASE_BALL_RADIUS || 16,
                this.getActiveTiers(),
                showOutline,
                this.config.BALL_HITBOX_SCALE ?? 1.0,
                this.config.SHOW_HITBOX_DEBUG === true
              );
              mergedBall.vx = (b1.vx + b2.vx) * 0.35;
              mergedBall.vy = (b1.vy + b2.vy) * 0.35 - 50;

              toAdd.push(mergedBall);

              this.comboCount++;
              this.comboTimer = 0.55; // Fenêtre de cascade active

              if (this.config.SOUND_MERGE_ENABLED !== false) {
                sound.playMerge(nextTier, {
                  style: this.config.SOUND_MERGE_STYLE,
                  volume: (this.config.SOUND_MERGE_VOLUME ?? 80) / 100,
                  comboIndex: this.config.SOUND_COMBO_PITCH !== false ? this.comboCount - 1 : 0,
                  pitchMult: this.config.SOUND_PITCH
                });
              }

              // Annonce vocale IA TikTok (Trend Patate avec pitch et vitesse dégressifs)
              if (this.config.VOICE_ANNOUNCER_ENABLED) {
                const isEn = this.config.TEXT_METRIC_SCORE === 'SCORE' && this.config.TEXT_METRIC_MAX_TIER === 'MAX PLANET';
                const targetTierObj = currentTiers[nextTier];
                const tierName = getTierLocalizedName(targetTierObj, isEn);
                const soundClipIndex = targetTierObj?.originalTierIndex ?? nextTier;
                voiceAnnouncer.speakMergeTier(nextTier, currentTiers.length, tierName, {
                  enabled: true,
                  themeId: this.config.SKIN_THEME,
                  mode: this.config.VOICE_ANNOUNCER_MODE,
                  prefix: (this.config.VOICE_ANNOUNCER_PREFIX !== undefined ? this.config.VOICE_ANNOUNCER_PREFIX.trim() : (this.config.SKIN_THEME?.includes('potatoes') ? 'Patate' : '')),
                  pitchBase: this.config.VOICE_ANNOUNCER_PITCH_BASE,
                  rateBase: this.config.VOICE_ANNOUNCER_RATE_BASE,
                  pitchMin: this.config.VOICE_ANNOUNCER_PITCH_MIN,
                  rateMin: this.config.VOICE_ANNOUNCER_RATE_MIN,
                  isMuted: sound.isMuted,
                  lang: isEn ? 'en' : 'fr',
                  soundClipIndex
                });
              }

              // Pop-up textuel flottant dynamique au-dessus de la bille créée
              if (this.config.VOICE_ANNOUNCER_SHOW_POPUP !== false) {
                const isEn = this.config.TEXT_METRIC_SCORE === 'SCORE' && this.config.TEXT_METRIC_MAX_TIER === 'MAX PLANET';
                const tierName = getTierLocalizedName(currentTiers[nextTier], isEn);
                const prefix = (this.config.VOICE_ANNOUNCER_PREFIX !== undefined ? this.config.VOICE_ANNOUNCER_PREFIX.trim() : (this.config.SKIN_THEME?.includes('potatoes') ? 'Patate' : ''));
                const displayTxt = prefix && !tierName.toLowerCase().startsWith(prefix.toLowerCase()) ? `${prefix} ${tierName}` : tierName;
                if (this.textPopups.length < 15) {
                  this.textPopups.push({
                    x: midX,
                    y: midY - mergedBall.radius - 12,
                    text: displayTxt,
                    color: currentTiers[nextTier].color,
                    glowColor: currentTiers[nextTier].glowColor,
                    size: Math.min(26, 15 + nextTier * 1.3),
                    life: 0.9,
                    maxLife: 0.9
                  });
                }
              }

              const pts = currentTiers[nextTier].points;
              this.score += pts;
              if (nextTier > this.maxTierReached) {
                this.maxTierReached = nextTier;
                this.tierUnlockPops[nextTier] = 1.55;
                if (this.config.SOUND_MERGE_ENABLED !== false) {
                  sound.playTierUnlock(nextTier, this.config.SOUND_MERGE_STYLE, this.config.SOUND_PITCH);
                }
              }

              // Déclenchement grandiose si création de l'astre ultime du thème !
              if (nextTier === currentTiers.length - 1) {
                this.triggerSupernovaClimax(mergedBall);
              }

              this.triggerScreenShake(2 + nextTier * 0.4);
              if (this.sparks.length < 80) {
                const count = Math.min(8, 4 + nextTier);
                for (let s = 0; s < count; s++) {
                  this.sparks.push(new MergeSpark(midX, midY, currentTiers[nextTier].color));
                }
              }

              hadMergeThisFrame = true;
              break;
            }

            // Propagation du statut d'atterrissage sur le sol ou la pile
            if (b1.hasLanded || b2.hasLanded) {
              b1.hasLanded = true;
              b2.hasLanded = true;
            }

            // Collision élastique
            const dist = Math.sqrt(distSq);
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;
            const m1 = b1.mass;
            const m2 = b2.mass;
            const totalMass = m1 + m2;

            b1.x -= nx * overlap * (m2 / totalMass);
            b1.y -= ny * overlap * (m2 / totalMass);
            b2.x += nx * overlap * (m1 / totalMass);
            b2.y += ny * overlap * (m1 / totalMass);

            // Re-stabilisation dans les parois pour éviter tout bug d'enfoncement
            if (this.config.CONTAINER_SHAPE === 'circle') {
              const { cX, cY, R, neckHalfW, neckConnectY } = this.getCircleGeometry();
              for (const ball of [b1, b2]) {
                const dx = ball.x - cX;
                const dy = ball.y - cY;
                if (ball.y > neckConnectY) {
                  const inNeckCorridor = ball.y < neckConnectY + 30 && Math.abs(dx) < neckHalfW - 4;
                  if (!inNeckCorridor) {
                    const d = Math.hypot(dx, dy);
                    const maxD = R - ball.radius;
                    if (d > maxD && d > 0.001) {
                      ball.x = cX + (dx / d) * maxD;
                      ball.y = cY + (dy / d) * maxD;
                    }
                  }
                } else {
                  const hw = this.getCircleHalfWidth(ball.y);
                  ball.x = Math.max(cX - hw + ball.radius, Math.min(cX + hw - ball.radius, ball.x));
                }
              }
            } else if (useCurvedContainer) {
              const hw1 = this.getContainerHalfWidth(b1.y);
              b1.x = Math.max(270 - hw1 + b1.radius, Math.min(270 + hw1 - b1.radius, b1.x));
              const hw2 = this.getContainerHalfWidth(b2.y);
              b2.x = Math.max(270 - hw2 + b2.radius, Math.min(270 + hw2 - b2.radius, b2.x));
            }

            const rvx = b2.vx - b1.vx;
            const rvy = b2.vy - b1.vy;
            const velAlongNormal = rvx * nx + rvy * ny;

            if (velAlongNormal < 0) {
              if (-velAlongNormal > 65) {
                this.triggerImpactSound(-velAlongNormal);
              }
              const impulse = -(1 + restitution) * velAlongNormal / (1 / m1 + 1 / m2);
              b1.vx -= (impulse / m1) * nx;
              b1.vy -= (impulse / m1) * ny;
              b2.vx += (impulse / m2) * nx;
              b2.vy += (impulse / m2) * ny;
            }
          }
        }
      }

      if (toRemove.size > 0) {
        this.balls = this.balls.filter((b) => !toRemove.has(b.id));
        this.balls.push(...toAdd);
      }
    }

    if (hadMergeThisFrame) {
      this.syncHUD();
    }

    for (let i = 0; i < this.balls.length; i++) {
      this.balls[i].update(effectiveDt);
    }

    // 3. Détection du Débordement (Game Over au niveau de la ligne rouge dangerY)
    let hasOverflowingBall = false;
    for (let i = 0; i < this.balls.length; i++) {
      const b = this.balls[i];
      // Une bille déborde uniquement si :
      // 1. Elle a touché le sol ou la pile (hasLanded === true)
      // 2. Son sommet dépasse au-dessus de la ligne rouge
      // 3. Elle est posée sur la pile (vy < 80)
      if (b.hasLanded && (b.y - b.radius * 0.4) < this.dangerY && b.vy < 80) {
        hasOverflowingBall = true;
        break;
      }
    }

    const DANGER_DURATION = 1.4;

    if (this.state === 'RUNNING') {
      const prevDanger = this.isDangerWarning;
      if (hasOverflowingBall) {
        this.isDangerWarning = true;
        this.overflowTimer += dt;
        this.dangerSoundCooldown -= dt;
        if (this.dangerSoundCooldown <= 0) {
          sound.playDanger();
          this.dangerSoundCooldown = 0.35;
        }

        if (this.overflowTimer >= DANGER_DURATION) {
          this.triggerGameOver();
        }
      } else {
        // Décroissance douce si les billes redescendent sous la ligne
        this.overflowTimer = Math.max(0, this.overflowTimer - dt * 0.8);
        if (this.overflowTimer <= 0) {
          this.isDangerWarning = false;
          this.dangerSoundCooldown = 0;
        }
      }

      if (this.isDangerWarning !== prevDanger) {
        this.syncHUD();
      }
    }

    // Mise à jour des effets visuels, ondes de choc, particules et tremblements d'écran
    this.updateVisualEffects(dt);
  }

  private updateVisualEffects(dt: number) {
    const effectiveDt = this.climaxPhase !== 'NONE' ? dt * this.timeScale : dt;

    // Mise à jour des particules d'étincelles
    if (this.sparks.length > 70 && this.climaxPhase === 'NONE') {
      this.sparks.splice(0, this.sparks.length - 70);
    }
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      this.sparks[i].update(effectiveDt);
      if (this.sparks[i].life <= 0) {
        this.sparks.splice(i, 1);
      }
    }

    // Mise à jour des ondes de choc Supernova
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 5.0 * dt;
      sw.life -= dt;
      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Mise à jour des particules de vortex
    for (let i = this.vortexParticles.length - 1; i >= 0; i--) {
      const vp = this.vortexParticles[i];
      vp.progress += dt * 1.8;
      vp.x += (vp.targetX - vp.x) * dt * 4.0;
      vp.y += (vp.targetY - vp.y) * dt * 4.0;
      if (vp.progress >= 1.0) {
        this.vortexParticles.splice(i, 1);
      }
    }

    // Mise à jour des popups textuels TikTok
    for (let i = this.textPopups.length - 1; i >= 0; i--) {
      const p = this.textPopups[i];
      p.life -= effectiveDt;
      p.y -= 42 * effectiveDt;
      if (p.life <= 0) {
        this.textPopups.splice(i, 1);
      }
    }

    // Décroissance des pops d'animation de la frise d'évolution
    for (let i = 0; i < 10; i++) {
      if (this.tierUnlockPops[i] > 1.0) {
        this.tierUnlockPops[i] = Math.max(1.0, this.tierUnlockPops[i] - 2.5 * dt);
      }
    }

    if (this.screenShake > 0) {
      this.shakeX = (Math.random() - 0.5) * this.screenShake;
      this.shakeY = (Math.random() - 0.5) * this.screenShake;
      const decay = this.climaxPhase !== 'NONE' ? 6.0 : 16.0;
      this.screenShake = Math.max(0, this.screenShake - decay * dt);
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  private render() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Fond solide opaque sombre 1080x1920 (indispensable pour que MediaRecorder et codecs vidéo YUV n'aient aucun artefact alpha)
    this.ctx.fillStyle = this.config.BACKGROUND_COLOR || '#06080d';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const scale = this.viewScale;
    const offX = this.offsetX || 0;
    const offY = this.offsetY || 0;
    this.ctx.translate(offX + this.shakeX * scale, offY + this.shakeY * scale);
    this.ctx.scale(scale, scale);

    // Effet d'arrière-plan animé pour TikTok / Reels
    this.drawAnimatedBackground();

    if (this.config.CONTAINER_SHAPE === 'custom') {
      this.drawCustomContainer();
    } else if (this.config.CONTAINER_SHAPE === 'circle') {
      this.drawCircleContainer();
    } else if (this.config.CONTAINER_SHAPE === 'jar') {
      this.drawJarContainer();
    } else {
      this.drawTubeChamber();
    }

    // Aperçu du spawner uniquement pendant le jeu normal
    if (this.state === 'RUNNING') {
      this.drawSpawnerPreview();
    }

    // Particules de vortex aspirées vers le Soleil pendant la charge
    for (let i = 0; i < this.vortexParticles.length; i++) {
      const vp = this.vortexParticles[i];
      this.ctx.save();
      this.ctx.fillStyle = vp.color;
      this.ctx.shadowColor = vp.color;
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(vp.x, vp.y, vp.size * (1 - vp.progress * 0.7), 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // Rayons célestes tournants si Supernova active
    if (this.climaxPhase === 'EXPLOSION' || this.climaxPhase === 'VICTORY_SCREEN') {
      const ultimateTier = this.getCurrentTiers().length - 1;
      const sunBall = this.balls.find((b) => b.tier === ultimateTier);
      if (sunBall) {
        this.ctx.save();
        this.ctx.translate(sunBall.x, sunBall.y);
        const rot = performance.now() * 0.001;
        this.ctx.rotate(rot);
        const numBeams = 18;
        for (let b = 0; b < numBeams; b++) {
          const ang = (b * Math.PI * 2) / numBeams;
          this.ctx.beginPath();
          this.ctx.moveTo(0, 0);
          this.ctx.lineTo(Math.cos(ang - 0.06) * 500, Math.sin(ang - 0.06) * 500);
          this.ctx.lineTo(Math.cos(ang + 0.06) * 500, Math.sin(ang + 0.06) * 500);
          this.ctx.closePath();
          this.ctx.fillStyle = b % 2 === 0 ? 'rgba(255, 215, 0, 0.12)' : 'rgba(255, 109, 0, 0.09)';
          this.ctx.fill();
        }
        this.ctx.restore();
      }
    }

    if (this.config.RENDER_MODE === '3d') {
      if (!this.renderer3D || !this.canvas3D) {
        this.canvas3D = document.createElement('canvas');
        this.canvas3D.width = this.canvas.width;
        this.canvas3D.height = this.canvas.height;
        this.renderer3D = new MergeDrop3DRenderer(this.canvas3D);
      }
      this.renderer3D.update(this.balls, this.getCurrentTiers(), [], 0.0166);
      this.renderer3D.render();
      if (this.canvas3D) {
        this.ctx.drawImage(this.canvas3D, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
      }
    } else {
      for (let i = 0; i < this.balls.length; i++) {
        this.balls[i].draw(this.ctx);
      }
    }

    for (let i = 0; i < this.sparks.length; i++) {
      this.sparks[i].draw(this.ctx);
    }

    // Rendu des ondes de choc Supernova
    for (let i = 0; i < this.shockwaves.length; i++) {
      const sw = this.shockwaves[i];
      const alpha = Math.max(0, sw.life / sw.maxLife);
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = sw.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.lineWidth = sw.lineWidth * alpha;
      this.ctx.shadowColor = sw.color;
      this.ctx.shadowBlur = 24;
      this.ctx.stroke();
      this.ctx.restore();
    }

    // Rendu des popups textuels animés (TikTok style)
    for (const p of this.textPopups) {
      const alpha = Math.min(1, p.life / (p.maxLife * 0.4));
      const progress = 1 - p.life / p.maxLife;
      const bounce = 1 + 0.28 * Math.sin(progress * Math.PI);
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      this.ctx.translate(p.x, p.y);
      this.ctx.scale(bounce, bounce);
      this.ctx.font = `900 ${Math.round(p.size)}px "Outfit", system-ui, sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      // Liseré sombre épais pour contraste parfait sur n'importe quel fond
      this.ctx.strokeStyle = '#05070f';
      this.ctx.lineWidth = 4;
      this.ctx.lineJoin = 'round';
      this.ctx.strokeText(p.text, 0, 0);

      // Halo lumineux aux couleurs du palier
      this.ctx.shadowColor = p.glowColor;
      this.ctx.shadowBlur = 12;

      // Remplissage texte clair
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(p.text, 0, 0);
      this.ctx.restore();
    }

    // Dessin de l'écran Game Over si débordement confirmé
    if (this.state === 'GAME_OVER') {
      this.drawGameOverOverlay();
    } else if (this.climaxPhase === 'VICTORY_SCREEN') {
      this.drawVictoryOverlay();
    }

    // Frise d'évolution des 10 paliers sous le bocal
    this.drawEvolutionBar();

    // Dessin du HUD textuel en haut du Canvas (inclus dans la vidéo 9:16)
    if (this.config.SHOW_TOP_HUD !== false) {
      drawCanvasHUD(this.ctx, this.currentHUD, VIRTUAL_WIDTH);
    }

    this.ctx.restore();
  }

  private initStars() {
    if (this.stars.length === 0) {
      for (let i = 0; i < 75; i++) {
        this.stars.push({
          x: ((i * 137.5) % 520) + 10,
          y: ((i * 243.1) % 940) + 10,
          size: 0.8 + (i % 3) * 0.7,
          speed: 1.2 + (i % 5) * 0.6,
          baseAlpha: 0.2 + (i % 4) * 0.15
        });
      }
    }
  }

  /**
   * Rendu de l'arrière-plan animé pour les formats courts TikTok / Reels
   */
  private drawAnimatedBackground() {
    const effect = this.config.BACKGROUND_EFFECT || 'none';
    if (effect === 'none') return;

    const ctx = this.ctx;
    const now = performance.now() * 0.001;

    ctx.save();

    if (effect === 'cosmic-stars') {
      this.initStars();
      for (let i = 0; i < this.stars.length; i++) {
        const s = this.stars[i];
        const alpha = s.baseAlpha + Math.sin(now * s.speed + i) * 0.2;
        if (alpha > 0.05) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.9, alpha)})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (effect === 'celestial-rays') {
      // Rayons de lumière célestes rotatifs
      const cX = 270;
      const cY = 480;
      const rayCount = 12;
      const baseAngle = now * 0.15;
      const length = 750;

      for (let i = 0; i < rayCount; i++) {
        const a1 = baseAngle + (i * Math.PI * 2) / rayCount;
        const a2 = a1 + (Math.PI * 2) / (rayCount * 3.5);
        const pulse = 0.035 + Math.sin(now * 1.5 + i) * 0.015;

        ctx.beginPath();
        ctx.moveTo(cX, cY);
        ctx.lineTo(cX + Math.cos(a1) * length, cY + Math.sin(a1) * length);
        ctx.lineTo(cX + Math.cos(a2) * length, cY + Math.sin(a2) * length);
        ctx.closePath();
        ctx.fillStyle = `rgba(180, 220, 255, ${pulse})`;
        ctx.fill();
      }
    } else if (effect === 'cyber-grid') {
      // Grille perspective 3D Synthwave
      const horizonY = 420;
      const bottomY = 960;
      const cX = 270;

      // Lignes de fuite radiales
      ctx.lineWidth = 1.0;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
      for (let x = -100; x <= 640; x += 55) {
        ctx.beginPath();
        ctx.moveTo(cX, horizonY);
        ctx.lineTo(x, bottomY);
        ctx.stroke();
      }

      // Lignes horizontales en défilement perspective
      const speed = 0.45;
      const offset = (now * speed) % 1;
      const gridLines = 8;
      for (let i = 0; i < gridLines; i++) {
        const t = (i + offset) / gridLines;
        const y = horizonY + (bottomY - horizonY) * Math.pow(t, 2.2);
        const alpha = t * 0.22;
        ctx.strokeStyle = `rgba(255, 0, 127, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(540, y);
        ctx.stroke();
      }
    } else if (effect === 'aurora-waves') {
      // Vagues atmosphériques aurora
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        const tOffset = now * 0.8 + w * 2.1;
        const yBase = 260 + w * 180;
        ctx.beginPath();
        ctx.moveTo(0, yBase);
        for (let x = 0; x <= 540; x += 30) {
          const y =
            yBase +
            Math.sin(x * 0.008 + tOffset) * 45 +
            Math.cos(x * 0.015 - tOffset * 0.5) * 25;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(540, 960);
        ctx.lineTo(0, 960);
        ctx.closePath();

        const color =
          w === 0
            ? 'rgba(0, 255, 180, 0.04)'
            : w === 1
            ? 'rgba(150, 50, 255, 0.04)'
            : 'rgba(0, 180, 255, 0.04)';
        ctx.fillStyle = color;
        ctx.fill();
      }
    } else if (effect === 'hypnotic-tunnel') {
      // Anneaux concentriques hypnotiques néon pulsants
      const cX = 270;
      const cY = 560;
      const ringCount = 7;
      const maxRadius = 480;
      const cycle = (now * 60) % (maxRadius / ringCount);

      ctx.lineWidth = 1.4;
      for (let i = 0; i < ringCount; i++) {
        const r = i * (maxRadius / ringCount) + cycle;
        if (r > 15 && r < maxRadius) {
          const fade = 1 - r / maxRadius;
          const alpha = fade * 0.16;
          ctx.strokeStyle =
            i % 2 === 0
              ? `rgba(0, 240, 255, ${alpha})`
              : `rgba(255, 0, 127, ${alpha})`;
          ctx.beginPath();
          ctx.arc(cX, cY, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  /**
   * Rendu de la Fiole ronde avec tube vertical (verre néon net et précis)
   */
  private drawCircleContainer() {
    const ctx = this.ctx;
    ctx.save();

    const themeColor = this.config.CONTAINER_COLOR || '#00f0ff';
    const accentColor = this.getContainerAccentColor(0.4);
    const { cX, cY, R, neckHalfW, neckConnectY, thetaLeft, thetaRight } = this.getCircleGeometry();
    const funnelEndY = this.funnelTop + 50;

    // 1. Fond teinté de la fiole (remplissage complet de la sphère et du col)
    ctx.beginPath();
    ctx.moveTo(cX - 80, this.funnelTop);
    ctx.lineTo(cX - neckHalfW, funnelEndY);
    ctx.lineTo(cX - neckHalfW, neckConnectY);
    // Arc circulaire de thetaLeft à thetaRight passant par le bas (anticlockwise: true)
    ctx.arc(cX, cY, R, thetaLeft, thetaRight, true);
    ctx.lineTo(cX + neckHalfW, funnelEndY);
    ctx.lineTo(cX + 80, this.funnelTop);
    ctx.closePath();
    ctx.fillStyle = 'rgba(14, 20, 34, 0.65)';
    ctx.fill();

    // 2. Ligne de danger (dans le col)
    const dangerY = this.dangerY;
    const pulse = (Math.sin(performance.now() * 0.015) + 1) * 0.5;

    ctx.save();
    ctx.beginPath();
    ctx.setLineDash(this.isDangerWarning ? [6, 4] : [5, 4]);
    ctx.moveTo(cX - neckHalfW, dangerY);
    ctx.lineTo(cX + neckHalfW, dangerY);
    ctx.strokeStyle = this.isDangerWarning
      ? `rgba(255, 0, 85, ${0.9 + pulse * 0.1})`
      : 'rgba(255, 60, 100, 0.7)';
    ctx.lineWidth = this.isDangerWarning ? 1.6 : 1.1;
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();

    // Badge d'alerte en cas de danger
    if (this.isDangerWarning && this.state === 'RUNNING') {
      ctx.save();
      const timeLeft = Math.max(0, 1.4 - this.overflowTimer).toFixed(1);
      ctx.fillStyle = '#ff0055';
      ctx.font = 'bold 12px "JetBrains Mono", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 0;
      ctx.fillText(`⚠️ DANGER: ${timeLeft}s ⚠️`, cX, dangerY - 10);
      ctx.restore();
    }

    // 3. Parois néon de la fiole (traits vectoriels nets dessinant la sphère complète)
    ctx.beginPath();
    ctx.moveTo(cX - 80, this.funnelTop);
    ctx.lineTo(cX - neckHalfW, funnelEndY);
    ctx.lineTo(cX - neckHalfW, neckConnectY);
    ctx.arc(cX, cY, R, thetaLeft, thetaRight, true);
    ctx.lineTo(cX + neckHalfW, funnelEndY);
    ctx.lineTo(cX + 80, this.funnelTop);

    // Contour principal
    const strokeW = Math.max(1, this.config.CONTAINER_STROKE_WIDTH || 4.5);
    const containerStroke = this.getContainerStrokeStyle(ctx, this.funnelTop, cY + R);
    ctx.strokeStyle = containerStroke;
    ctx.shadowColor = this.config.CONTAINER_COLOR === 'rainbow' ? '#ff007f' : themeColor;
    ctx.shadowBlur = Math.min(20, strokeW * 2.5);
    ctx.lineWidth = strokeW;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Cœur blanc pur
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(1, strokeW * 0.3);
    ctx.stroke();

    // Reflet de verre courbé esthétique sur la fiole
    ctx.beginPath();
    ctx.arc(cX, cY, R - 12, -Math.PI * 0.75, -Math.PI * 0.42, false);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Rendu du Conteneur Personnalisable sur-mesure (lignes vectorielles ultra-nettes)
   */
  private drawCustomContainer() {
    const ctx = this.ctx;
    ctx.save();

    const step = 8; // Pas fin pour un tracé très fidèle aux ondulations et courbes
    const bottomHW = this.getCustomHalfWidth(this.chamberBottom);
    const xLeft = 270 - bottomHW;
    const xRight = 270 + bottomHW;
    const hasBottomWaves = (this.config.CUSTOM_BOTTOM_WAVE_COUNT || 0) > 0 && (this.config.CUSTOM_BOTTOM_WAVE_AMPLITUDE || 0) > 0;

    const stepFloor = this.config.CUSTOM_BOTTOM_WAVE_STYLE === 'spikes' ? 2 : 3;

    // 1. Fond teinté du réceptacle sur-mesure
    ctx.beginPath();
    ctx.moveTo(270 - this.getCustomHalfWidth(this.funnelTop), this.funnelTop);
    for (let y = this.funnelTop; y <= this.chamberBottom; y += step) {
      ctx.lineTo(270 - this.getCustomHalfWidth(y), y);
    }
    // Ligne de sol du fond (ondulé ou plat)
    if (hasBottomWaves) {
      for (let x = xLeft; x <= xRight; x += stepFloor) {
        ctx.lineTo(x, this.getCustomFloorY(x));
      }
      ctx.lineTo(xRight, this.getCustomFloorY(xRight));
    } else {
      ctx.lineTo(xRight, this.chamberBottom);
    }
    // Côté droit montant
    for (let y = this.chamberBottom; y >= this.funnelTop; y -= step) {
      ctx.lineTo(270 + this.getCustomHalfWidth(y), y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(14, 20, 34, 0.65)';
    ctx.fill();

    // 2. Ligne limite de danger courbée/adaptée à la largeur locale
    const dangerY = this.dangerY;
    const pulse = (Math.sin(performance.now() * 0.015) + 1) * 0.5;
    const dangerHalfW = this.getCustomHalfWidth(dangerY);

    ctx.save();
    ctx.beginPath();
    ctx.setLineDash(this.isDangerWarning ? [6, 4] : [5, 4]);
    ctx.moveTo(270 - dangerHalfW, dangerY);
    ctx.lineTo(270 + dangerHalfW, dangerY);
    ctx.strokeStyle = this.isDangerWarning
      ? `rgba(255, 0, 85, ${0.9 + pulse * 0.1})`
      : 'rgba(255, 60, 100, 0.7)';
    ctx.lineWidth = this.isDangerWarning ? 1.6 : 1.1;
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();

    // Badge d'alerte en cas de danger
    if (this.isDangerWarning && this.state === 'RUNNING') {
      ctx.save();
      const timeLeft = Math.max(0, 1.4 - this.overflowTimer).toFixed(1);
      ctx.fillStyle = '#ff0055';
      ctx.font = 'bold 12px "JetBrains Mono", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 0;
      ctx.fillText(`⚠️ DANGER: ${timeLeft}s ⚠️`, 270, dangerY - 10);
      ctx.restore();
    }

    // 3. Parois néon personnalisées (lignes ultra-fines et nettes)
    ctx.beginPath();
    // Côté gauche
    ctx.moveTo(270 - this.getCustomHalfWidth(this.funnelTop), this.funnelTop);
    for (let y = this.funnelTop; y <= this.chamberBottom; y += step) {
      ctx.lineTo(270 - this.getCustomHalfWidth(y), y);
    }
    // Fond (ondulé ou plat)
    if (hasBottomWaves) {
      for (let x = xLeft; x <= xRight; x += stepFloor) {
        ctx.lineTo(x, this.getCustomFloorY(x));
      }
      ctx.lineTo(xRight, this.getCustomFloorY(xRight));
    } else {
      ctx.lineTo(xRight, this.chamberBottom);
    }
    // Côté droit
    for (let y = this.chamberBottom; y >= this.funnelTop; y -= step) {
      ctx.lineTo(270 + this.getCustomHalfWidth(y), y);
    }

    // Contour principal épuré
    const themeColor = this.config.CONTAINER_COLOR || '#00f0ff';
    const strokeW = Math.max(1, this.config.CONTAINER_STROKE_WIDTH || 4.5);
    const containerStroke = this.getContainerStrokeStyle(ctx, this.funnelTop, this.chamberBottom);
    ctx.strokeStyle = containerStroke;
    ctx.shadowColor = this.config.CONTAINER_COLOR === 'rainbow' ? '#ff007f' : themeColor;
    ctx.shadowBlur = Math.min(20, strokeW * 2.5);
    ctx.lineWidth = strokeW;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Cœur blanc pur
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(1, strokeW * 0.3);
    ctx.stroke();

    // Graduations holographiques sur le flanc droit pour le style laboratoire
    ctx.strokeStyle = this.getContainerAccentColor(0.35);
    ctx.lineWidth = 1.0;
    for (let y = this.chamberTop + 50; y <= this.chamberBottom - 30; y += 45) {
      const hw = this.getCustomHalfWidth(y);
      ctx.beginPath();
      ctx.moveTo(270 + hw - 10, y);
      ctx.lineTo(270 + hw - 2, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Rendu de la Jarre galbée en verre néon (traits vectoriels nets, sans bavure d'encodage vidéo)
   */
  private drawJarContainer() {
    const ctx = this.ctx;
    ctx.save();

    // 1. Fond teinté du bocal
    ctx.beginPath();
    ctx.moveTo(270 - this.getJarHalfWidth(this.funnelTop), this.funnelTop);
    for (let y = this.funnelTop; y <= this.chamberBottom; y += 15) {
      ctx.lineTo(270 - this.getJarHalfWidth(y), y);
    }
    for (let y = this.chamberBottom; y >= this.funnelTop; y -= 15) {
      ctx.lineTo(270 + this.getJarHalfWidth(y), y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(14, 20, 34, 0.65)';
    ctx.fill();

    // 2. Ligne limite de danger fine et précise
    const dangerY = this.dangerY;
    const pulse = (Math.sin(performance.now() * 0.015) + 1) * 0.5;

    ctx.save();
    ctx.beginPath();
    ctx.setLineDash(this.isDangerWarning ? [6, 4] : [5, 4]);
    ctx.moveTo(270 - this.getJarHalfWidth(dangerY), dangerY);
    ctx.lineTo(270 + this.getJarHalfWidth(dangerY), dangerY);
    ctx.strokeStyle = this.isDangerWarning
      ? `rgba(255, 0, 85, ${0.9 + pulse * 0.1})`
      : 'rgba(255, 60, 100, 0.7)';
    ctx.lineWidth = this.isDangerWarning ? 1.6 : 1.1;
    ctx.shadowBlur = 0; // Zéro flou pour éliminer les bavures vidéo YUV420
    ctx.stroke();
    ctx.restore();

    // Badge d'alerte en cas de danger
    if (this.isDangerWarning && this.state === 'RUNNING') {
      ctx.save();
      const timeLeft = Math.max(0, 1.4 - this.overflowTimer).toFixed(1);
      ctx.fillStyle = '#ff0055';
      ctx.font = 'bold 12px "JetBrains Mono", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 0;
      ctx.fillText(`⚠️ DANGER: ${timeLeft}s ⚠️`, 270, dangerY - 10);
      ctx.restore();
    }

    // 3. Parois néon galbées de la jarre (lignes ultra-fines et nettes)
    ctx.beginPath();
    // Côté gauche
    ctx.moveTo(270 - this.getJarHalfWidth(this.funnelTop), this.funnelTop);
    for (let y = this.funnelTop; y <= this.chamberBottom; y += 12) {
      ctx.lineTo(270 - this.getJarHalfWidth(y), y);
    }
    // Fond plat de la jarre
    ctx.lineTo(270 + this.getJarHalfWidth(this.chamberBottom), this.chamberBottom);
    // Côté droit
    for (let y = this.chamberBottom; y >= this.funnelTop; y -= 12) {
      ctx.lineTo(270 + this.getJarHalfWidth(y), y);
    }

    // Contour principal épuré
    const themeColor = this.config.CONTAINER_COLOR || '#00f0ff';
    const strokeW = Math.max(1, this.config.CONTAINER_STROKE_WIDTH || 4.5);
    const containerStroke = this.getContainerStrokeStyle(ctx, this.funnelTop, this.chamberBottom);
    ctx.strokeStyle = containerStroke;
    ctx.shadowColor = this.config.CONTAINER_COLOR === 'rainbow' ? '#ff007f' : themeColor;
    ctx.shadowBlur = Math.min(20, strokeW * 2.5);
    ctx.lineWidth = strokeW;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Cœur blanc pur
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(1, strokeW * 0.3);
    ctx.stroke();

    // Anses décoratives de la Jarre (gauche et droite)
    [-1, 1].forEach((side) => {
      ctx.beginPath();
      const xAnchor = 270 + side * this.getJarHalfWidth(410);
      ctx.arc(xAnchor + side * 14, 440, 24, Math.PI * 0.5, Math.PI * 1.5, side === -1);
      ctx.strokeStyle = this.getContainerAccentColor(0.45);
      ctx.lineWidth = 1.2;
      ctx.shadowBlur = 0;
      ctx.stroke();
    });

    ctx.restore();
  }

  /**
   * Rendu du Tube et de la Cuve rectangulaire (traits nets)
   */
  private drawTubeChamber() {
    const ctx = this.ctx;
    const left = this.chamberLeft;
    const right = this.chamberRight;
    const top = this.chamberTop;
    const bottom = this.chamberBottom;

    ctx.save();

    // Fond cuve
    ctx.fillStyle = 'rgba(14, 20, 34, 0.65)';
    ctx.fillRect(left, top, this.chamberWidth, bottom - top);

    // Ligne limite haute
    const dangerY = this.dangerY;
    const pulse = (Math.sin(performance.now() * 0.015) + 1) * 0.5;

    ctx.save();
    ctx.beginPath();
    ctx.setLineDash(this.isDangerWarning ? [6, 4] : [5, 4]);
    ctx.moveTo(left, dangerY);
    ctx.lineTo(right, dangerY);
    ctx.strokeStyle = this.isDangerWarning
      ? `rgba(255, 0, 85, ${0.9 + pulse * 0.1})`
      : 'rgba(255, 60, 100, 0.7)';
    ctx.lineWidth = this.isDangerWarning ? 1.6 : 1.1;
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();

    // Badge d'alerte en cas de danger
    if (this.isDangerWarning && this.state === 'RUNNING') {
      ctx.save();
      const timeLeft = Math.max(0, 1.4 - this.overflowTimer).toFixed(1);
      ctx.fillStyle = '#ff0055';
      ctx.font = 'bold 12px "JetBrains Mono", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 0;
      ctx.fillText(`⚠️ DANGER: ${timeLeft}s ⚠️`, 270, dangerY - 10);
      ctx.restore();
    }

    // Cuve
    ctx.beginPath();
    ctx.moveTo(this.tubeLeft, top);
    ctx.lineTo(left, top);
    ctx.lineTo(left, bottom);
    ctx.lineTo(right, bottom);
    ctx.lineTo(right, top);
    ctx.lineTo(this.tubeRight, top);

    const themeColor = this.config.CONTAINER_COLOR || '#00f0ff';
    const strokeW = Math.max(1, this.config.CONTAINER_STROKE_WIDTH || 4.5);
    const containerStroke = this.getContainerStrokeStyle(ctx, top, bottom);
    ctx.strokeStyle = containerStroke;
    ctx.shadowColor = this.config.CONTAINER_COLOR === 'rainbow' ? '#ff007f' : themeColor;
    ctx.shadowBlur = Math.min(20, strokeW * 2.5);
    ctx.lineWidth = strokeW;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(1, strokeW * 0.3);
    ctx.stroke();

    // Fût du tube
    ctx.beginPath();
    ctx.moveTo(this.funnelLeft, this.funnelTop);
    ctx.lineTo(this.tubeLeft, this.tubeTop);
    ctx.lineTo(this.tubeLeft, this.tubeBottom);
    ctx.moveTo(this.funnelRight, this.funnelTop);
    ctx.lineTo(this.tubeRight, this.tubeTop);
    ctx.lineTo(this.tubeRight, this.tubeBottom);
    ctx.strokeStyle = themeColor;
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Dessine la frise d'évolution des 10 paliers (configurable en 1 ligne ou 2 lignes de 5 géants, position Y et taille réglables).
   */
  private drawEvolutionBar() {
    if (this.config.SHOW_EVOLUTION_BAR === false) return;

    const ctx = this.ctx;
    const tiers = this.getCurrentTiers();
    if (!tiers || tiers.length === 0) return;

    const tierCount = tiers.length;
    ctx.save();

    const is2Rows = this.config.EVOLUTION_BAR_LAYOUT === '2rows';
    const baseR = this.config.EVOLUTION_BAR_SIZE !== undefined ? this.config.EVOLUTION_BAR_SIZE : (is2Rows ? 22 : 19);
    const themeColor = this.config.CONTAINER_COLOR || '#00f0ff';
    const userY = this.config.EVOLUTION_BAR_Y !== undefined ? this.config.EVOLUTION_BAR_Y : 810;

    // Pour mémoriser la position de la bille max active et afficher son nom au-dessus (z-index max)
    let maxTierPos: { cx: number; cy: number; r: number; tierData: MergeTier } | null = null;

    if (is2Rows && tierCount > 5) {
      // --- MODE 2 LIGNES (5 EN HAUT + RESTE CENTRÉ EN BAS) ---
      const row1Count = 5;
      const row2Count = tierCount - 5;

      const barW = 420;
      const barH = baseR * 4 + 60;
      const barX = (540 - barW) / 2;
      const barY = userY;
      const barR = 18;

      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(barX, barY, barW, barH, barR);
      } else {
        ctx.rect(barX, barY, barW, barH);
      }
      ctx.fillStyle = 'rgba(6, 10, 20, 0.85)';
      ctx.fill();

      // Contour du conteneur isolé
      ctx.save();
      ctx.strokeStyle = themeColor;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();

      const stepX = (barW - 64) / 4;
      const startX1 = barX + 32;
      const cyRow1 = barY + baseR + 12;
      const cyRow2 = barY + baseR * 3 + 32;

      // Rails de connexion Ligne 1
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX1, cyRow1);
      ctx.lineTo(startX1 + 4 * stepX, cyRow1);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Rail actif ligne 1
      if (this.maxTierReached > 0) {
        const endCol1 = Math.min(4, this.maxTierReached);
        ctx.beginPath();
        ctx.moveTo(startX1, cyRow1);
        ctx.lineTo(startX1 + endCol1 * stepX, cyRow1);
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = themeColor;
        ctx.shadowBlur = 8;
        ctx.stroke();
      }

      // Rails de connexion Ligne 2 (centrée horizontalement)
      const startX2 = row2Count > 1
        ? barX + (barW - (row2Count - 1) * stepX) / 2
        : barX + barW / 2;

      if (row2Count > 1) {
        ctx.beginPath();
        ctx.moveTo(startX2, cyRow2);
        ctx.lineTo(startX2 + (row2Count - 1) * stepX, cyRow2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Rail actif ligne 2
        if (this.maxTierReached >= 5) {
          const activeEnd2 = Math.min(row2Count - 1, this.maxTierReached - 5);
          ctx.beginPath();
          ctx.moveTo(startX2, cyRow2);
          ctx.lineTo(startX2 + activeEnd2 * stepX, cyRow2);
          ctx.strokeStyle = themeColor;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = themeColor;
          ctx.shadowBlur = 8;
          ctx.stroke();
        }
      }
      ctx.restore();

      // 1ère passe : rendu de TOUS les cercles de toutes les lignes
      for (let i = 0; i < tierCount; i++) {
        let cx: number;
        let cy: number;
        if (i < 5) {
          cx = startX1 + i * stepX;
          cy = cyRow1;
        } else {
          const colInRow2 = i - 5;
          cx = row2Count > 1 ? startX2 + colInRow2 * stepX : barX + barW / 2;
          cy = cyRow2;
        }

        const pop = this.tierUnlockPops[i] || 1.0;
        const r = baseR * pop;

        if (i === this.maxTierReached) {
          maxTierPos = { cx, cy, r, tierData: tiers[i] };
        }

        this.renderEvolutionCircle(ctx, i, cx, cy, baseR, tiers[i], themeColor, tierCount);
      }
    } else {
      // --- MODE 1 LIGNE (5 À 10 CERCLES ALIGNÉS) ---
      const barW = Math.min(520, Math.max(380, tierCount * (baseR * 2 + 18) + 40));
      const barH = baseR * 2 + 38;
      const barX = (540 - barW) / 2;
      const barY = userY;
      const barR = 18;

      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(barX, barY, barW, barH, barR);
      } else {
        ctx.rect(barX, barY, barW, barH);
      }
      ctx.fillStyle = 'rgba(6, 10, 20, 0.85)';
      ctx.fill();

      // Contour du conteneur isolé
      ctx.save();
      ctx.strokeStyle = themeColor;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();

      const stepX = (barW - (baseR * 2 + 24)) / Math.max(1, tierCount - 1);
      const startX = barX + baseR + 12;
      const cy = barY + baseR + 8;

      // Rail arrière
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX, cy);
      ctx.lineTo(startX + (tierCount - 1) * stepX, cy);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Rail actif
      if (this.maxTierReached > 0) {
        const activeEnd = Math.min(tierCount - 1, this.maxTierReached);
        ctx.beginPath();
        ctx.moveTo(startX, cy);
        ctx.lineTo(startX + activeEnd * stepX, cy);
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = themeColor;
        ctx.shadowBlur = 8;
        ctx.stroke();
      }
      ctx.restore();

      // Cercles des paliers
      for (let i = 0; i < tierCount; i++) {
        const cx = startX + i * stepX;
        const pop = this.tierUnlockPops[i] || 1.0;
        const r = baseR * pop;

        if (i === this.maxTierReached) {
          maxTierPos = { cx, cy, r, tierData: tiers[i] };
        }

        this.renderEvolutionCircle(ctx, i, cx, cy, baseR, tiers[i], themeColor, tierCount);
      }
    }

    // 2ème passe : Z-INDEX SUPÉRIEUR - Afficher le nom de la bille max au-dessus de tout
    if (maxTierPos) {
      this.renderCurrentMaxTierBadge(
        ctx,
        maxTierPos.cx,
        maxTierPos.cy,
        maxTierPos.r,
        maxTierPos.tierData,
        themeColor
      );
    }

    ctx.restore();
  }

  /**
   * Rendu unitaire d'un cercle dans la frise d'évolution (sans le badge de nom)
   */
  private renderEvolutionCircle(
    ctx: CanvasRenderingContext2D,
    i: number,
    cx: number,
    cy: number,
    baseR: number,
    tierData: MergeTier,
    themeColor: string,
    tierCount: number
  ) {
    if (!tierData) return;
    const isUnlocked = i <= this.maxTierReached;
    const isCurrentMax = i === this.maxTierReached;
    const isBoss = i === tierCount - 1;
    const pop = this.tierUnlockPops[i] || 1.0;
    const r = baseR * pop;

    if (isUnlocked) {
      // --- CERCLE DÉBLOQUÉ (OPACITÉ 100% MAX, VIBRANTE ET NETTE) ---
      ctx.save();
      ctx.globalAlpha = 1.0;
      ctx.shadowColor = isCurrentMax ? (tierData.glowColor || themeColor) : 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = isCurrentMax ? 16 : 5;

      // Disque de base coloré à 100% d'opacité
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = tierData.color || '#00f0ff';
      ctx.fill();

      // Affichage de l'image si présente et chargée
      const img = tierData.image ? textureManager.getImage(tierData.image) : null;
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
        ctx.restore();
      } else {
        // Fallback : Symbole / Emoji centré
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(10, Math.round(r * 0.95))}px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 3;
        ctx.shadowColor = '#000000';
        ctx.fillText(tierData.symbol, cx, cy + 1);
      }

      // Contour net (si sans image ou si SHOW_BALL_OUTLINE est actif)
      if (!img || this.config.SHOW_BALL_OUTLINE !== false) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = isCurrentMax ? '#ffffff' : 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = isCurrentMax ? 2.4 : 1.2;
        ctx.stroke();
      }

      // Pulsation sur le palier max actuel
      if (isCurrentMax) {
        const pulse = (Math.sin(performance.now() * 0.007) + 1) * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 2.5 + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = tierData.glowColor || themeColor;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = tierData.glowColor || themeColor;
        ctx.shadowBlur = 10;
        ctx.stroke();
      }

      // Couronne au-dessus de la bille ultime si débloquée
      if (isBoss) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 12px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 8;
        ctx.fillText('👑', cx, cy - r - 7);
      }

      ctx.restore();
    } else {
      // --- CERCLE VERROUILLÉ ---
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(12, 18, 30, 0.72)';
      ctx.fill();

      ctx.strokeStyle = isBoss ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Teasing de contenu
      if (isBoss) {
        // Boss final : petite couronne dorée estompée
        ctx.fillStyle = 'rgba(255, 215, 0, 0.45)';
        ctx.font = 'bold 11px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👑', cx, cy);
      } else {
        // Paliers normaux : point d'interrogation discret
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.font = 'bold 11px "JetBrains Mono", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', cx, cy + 1);
      }
      ctx.restore();
    }
  }

  /**
   * Rendu au premier plan (z-index supérieur) du badge avec le nom de la bille la plus forte
   * Dessiné APRÈS tous les cercles pour ne jamais être masqué par la 2ème ligne
   */
  private renderCurrentMaxTierBadge(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    tierData: MergeTier,
    themeColor: string
  ) {
    if (!tierData) return;

    ctx.save();
    ctx.globalAlpha = 1.0;
    // Taille de police augmentée pour une excellente lisibilité vidéo TikTok
    ctx.font = 'bold 12px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const isEn = this.config.TEXT_METRIC_MAX_TIER === 'MAX PLANET' || this.config.TEXT_METRIC_SCORE === 'SCORE';
    const nameText = getTierLocalizedName(tierData, isEn);
    const textMetrics = ctx.measureText(nameText);
    const pillW = Math.max(textMetrics.width + 18, 46);
    const pillH = 22;
    const pillY = cy + r + 4;
    // Empêcher tout débordement d'écran sur les côtés
    const pillX = Math.max(10, Math.min(540 - pillW - 10, cx - pillW / 2));

    // Fond sombre très contrasté avec contour lumineux
    ctx.fillStyle = 'rgba(6, 12, 22, 0.96)';
    ctx.strokeStyle = tierData.color || themeColor;
    ctx.lineWidth = 1.4;
    ctx.shadowColor = tierData.glowColor || themeColor;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(pillX, pillY, pillW, pillH, 8);
    } else {
      ctx.rect(pillX, pillY, pillW, pillH);
    }
    ctx.fill();
    ctx.stroke();

    // Texte blanc net avec halo de lisibilité
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000000';
    ctx.fillText(nameText, pillX + pillW / 2, pillY + 4);

    ctx.restore();
  }

  private drawSpawnerPreview() {
    const ctx = this.ctx;
    const tiers = this.getCurrentTiers();
    const tierData = tiers[this.nextTier] || tiers[0];

    ctx.save();
    ctx.translate(this.dropX, this.dropY);

    if (this.isAutoStreaming) {
      const pulse = (Math.sin(performance.now() * 0.015) + 1) * 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, 24 + pulse * 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 0, 127, 0.25)';
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 18;
      ctx.fill();

      ctx.fillStyle = '#ff007f';
      ctx.font = 'bold 12px "JetBrains Mono", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡ STREAM', 0, 0);
    } else {
      // Bille prête à tomber : rendu identique et net à 100%
      const img = tierData.image ? textureManager.getImage(tierData.image) : null;
      const visualR = tierData.visualRadius || tierData.radius;
      const hitboxR = tierData.radius;
      const r = visualR;

      // Animation fluide d'apparition lors du cooldown
      const isCooldown = !this.canManualDrop;
      const cooldownRatio = isCooldown ? Math.max(0, this.manualDropCooldown / 0.35) : 0;
      const scale = isCooldown ? 0.7 + 0.3 * (1 - cooldownRatio) : 1.0;

      ctx.scale(scale, scale);

      if (img) {
        const showOutline = this.config.SHOW_BALL_OUTLINE !== false;
        // 1. Halo lumineux doux sous la bille (si outline actif)
        if (showOutline) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, r * 1.2, 0, Math.PI * 2);
          const aura = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.2);
          aura.addColorStop(0, tierData.glowColor || 'rgba(255, 255, 255, 0.35)');
          aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = aura;
          ctx.globalAlpha = 0.5;
          ctx.fill();
          ctx.restore();
        }

        // 2. Rendu de l'image (si outline actif on clip en cercle parfait, sinon on dessine direct)
        const drawR = r * 0.98;
        ctx.save();
        if (showOutline) {
          ctx.beginPath();
          ctx.arc(0, 0, drawR, 0, Math.PI * 2);
          ctx.clip();
        }
        ctx.drawImage(img, -drawR, -drawR, drawR * 2, drawR * 2);
        ctx.restore();

        // 3. Liseré fin d'accentuation (si outline actif)
        if (showOutline) {
          ctx.beginPath();
          ctx.arc(0, 0, drawR, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // 4. Debug hitbox sur la preview si activé
        if (this.config.SHOW_HITBOX_DEBUG) {
          const hitboxScale = this.config.BALL_HITBOX_SCALE ?? 1.0;
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, hitboxR, 0, Math.PI * 2);
          ctx.strokeStyle = hitboxScale > 1.0 ? 'rgba(0, 240, 255, 0.95)' : 'rgba(0, 255, 102, 0.95)';
          ctx.lineWidth = 2.2;
          ctx.setLineDash([5, 4]);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.restore();
        }
      } else {
        // Thèmes procéduraux (Système Solaire, Néon, Minéraux, etc.) : rendu exact MergeBall
        const previewBall = new MergeBall(
          -1,
          this.nextTier,
          0,
          0,
          this.config.SKIN_THEME,
          false,
          this.config.BASE_BALL_RADIUS || 16,
          this.getActiveTiers(),
          this.config.SHOW_BALL_OUTLINE !== false,
          this.config.BALL_HITBOX_SCALE ?? 1.0,
          this.config.SHOW_HITBOX_DEBUG === true
        );
        previewBall.draw(ctx);
      }

      // Indicateur discret de largage
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.moveTo(0, r + 8);
      ctx.lineTo(-4, r + 3);
      ctx.lineTo(4, r + 3);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  private drawGameOverOverlay() {
    const ctx = this.ctx;
    const isEn = this.config.TEXT_METRIC_MAX_TIER === 'MAX PLANET' || this.config.TEXT_METRIC_SCORE === 'SCORE';
    const tiers = this.getCurrentTiers();
    const currentMaxTierObj = tiers[this.maxTierReached] || tiers[0];
    const tierLocalizedName = getTierLocalizedName(currentMaxTierObj, isEn);

    ctx.save();
    // Voile sombre
    ctx.fillStyle = 'rgba(8, 4, 16, 0.82)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Boîte modale stylée au centre
    const boxW = 430;
    const boxH = 300;
    const boxX = (VIRTUAL_WIDTH - boxW) / 2;
    const boxY = (VIRTUAL_HEIGHT - boxH) / 2 + 10;

    ctx.fillStyle = 'rgba(22, 12, 28, 0.96)';
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(255, 0, 85, 0.85)';
    ctx.shadowBlur = 28;

    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 18);
    ctx.fill();
    ctx.stroke();

    // Titre GAME OVER
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff0055';
    ctx.font = '900 36px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isEn ? '💥 GAME OVER 💥' : '💥 PARTIE PERDUE 💥', VIRTUAL_WIDTH / 2, boxY + 56);

    // Sous-titre explicatif
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 15px "Inter", sans-serif';
    ctx.fillText(
      isEn ? 'Overflow! Balls exceeded the danger line' : 'Débordement ! Les billes ont dépassé la ligne rouge',
      VIRTUAL_WIDTH / 2,
      boxY + 96
    );

    // Ligne de séparation
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(boxX + 30, boxY + 118);
    ctx.lineTo(boxX + boxW - 30, boxY + 118);
    ctx.stroke();

    // Scores & Récapitulatif
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 22px "JetBrains Mono", sans-serif';
    ctx.fillText(`${isEn ? 'Final Score:' : 'Score Final :'} ${this.score}`, VIRTUAL_WIDTH / 2, boxY + 160);

    ctx.fillStyle = '#ffb300';
    ctx.font = '600 17px "Inter", sans-serif';
    ctx.fillText(
      `${isEn ? 'Max Planet:' : 'Planète Max :'} ${currentMaxTierObj.symbol} ${tierLocalizedName}`,
      VIRTUAL_WIDTH / 2,
      boxY + 200
    );

    // Bouton / Instruction de redémarrage
    const pulse = (Math.sin(performance.now() * 0.008) + 1) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.75 + pulse * 0.25})`;
    ctx.font = 'bold 15px "Inter", sans-serif';
    ctx.fillText(
      isEn ? '▶ Click or Press [R] to Restart' : '▶ Cliquez ou Appuyez sur [R] pour Rejouer',
      VIRTUAL_WIDTH / 2,
      boxY + 258
    );

    ctx.restore();
  }

  private drawVictoryOverlay() {
    const ctx = this.ctx;
    const isEn = this.config.TEXT_METRIC_MAX_TIER === 'MAX PLANET' || this.config.TEXT_METRIC_SCORE === 'SCORE';

    ctx.save();
    // Voile nébuleuse royale
    ctx.fillStyle = 'rgba(10, 6, 22, 0.84)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    const boxW = 440;
    const boxH = 320;
    const boxX = (VIRTUAL_WIDTH - boxW) / 2;
    const boxY = (VIRTUAL_HEIGHT - boxH) / 2 + 15;

    // Cadre doré rayonnant
    ctx.fillStyle = 'rgba(28, 18, 38, 0.96)';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.9)';
    ctx.shadowBlur = 32;

    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 20);
    ctx.fill();
    ctx.stroke();

    // Titre SUPERNOVA COSMIQUE
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#ffd700';
    ctx.font = '900 32px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isEn ? '☀️ COSMIC SUPERNOVA ☀️' : '☀️ SUPERNOVA COSMIQUE ☀️', VIRTUAL_WIDTH / 2, boxY + 58);

    // Sous-titre
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff9c4';
    ctx.font = '600 15px "Inter", sans-serif';
    ctx.fillText(
      isEn ? 'The Sun has ignited the Cosmos!' : 'Le Soleil a embrasé le Système Solaire !',
      VIRTUAL_WIDTH / 2,
      boxY + 98
    );

    // Séparateur
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(boxX + 30, boxY + 122);
    ctx.lineTo(boxX + boxW - 30, boxY + 122);
    ctx.stroke();

    // Score final astronomique
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 24px "JetBrains Mono", sans-serif';
    ctx.fillText(`${isEn ? 'Ultimate Score:' : 'Score Ultime :'} ${this.score}`, VIRTUAL_WIDTH / 2, boxY + 168);

    ctx.fillStyle = '#ff9100';
    ctx.font = 'bold 18px "Inter", sans-serif';
    ctx.fillText(
      isEn ? '👑 RANK: MASTER OF THE UNIVERSE' : '👑 RANG : MAÎTRE DU SYSTÈME SOLAIRE',
      VIRTUAL_WIDTH / 2,
      boxY + 210
    );

    // Bouton de redémarrage
    const pulse = (Math.sin(performance.now() * 0.008) + 1) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + pulse * 0.2})`;
    ctx.font = 'bold 15px "Inter", sans-serif';
    ctx.fillText(
      isEn ? '▶ Click or Press [R] to Play Again' : '▶ Cliquez ou Appuyez sur [R] pour Rejouer',
      VIRTUAL_WIDTH / 2,
      boxY + 272
    );

    ctx.restore();
  }

  private loop = (timestamp: number) => {
    if (this.isDestroyed) return;

    const rawDt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    const dt = Math.min(0.05, rawDt);

    this.updatePhysics(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  public setDimensions(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.viewScale = width / VIRTUAL_WIDTH;
    this.offsetX = 0;
    this.offsetY = 0;
    if (this.canvas3D && this.renderer3D) {
      this.renderer3D.resize(width, height);
    }
  }

  private resize() {
    // Toujours fixer un buffer interne haute résolution Full HD 1080x1920 (ratio 9:16 natif)
    // Cela garantit un enregistrement vidéo 1080x1920 60fps ultra-net sans aucun upscaling baveux,
    // et un affichage parfaitement lissé par supersampling matériel sur tous les écrans.
    this.canvas.width = 1080;
    this.canvas.height = 1920;
    this.viewScale = 2.0; // 1080 / VIRTUAL_WIDTH (540) = 2.0
    this.offsetX = 0;
    this.offsetY = 0;
  }
}
