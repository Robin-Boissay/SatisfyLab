import { GameInstance, GameHUDState } from '../../core/types';
import { sound } from '../../core/SoundEngine';
import { drawCanvasHUD } from '../../core/canvasHUD';
import {
  MergeDropConfig,
  DEFAULT_MERGE_DROP_CONFIG,
  MergeTier,
  getTiersForTheme,
  getTierLocalizedName
} from './types';
import { MergeBall, MergeSpark } from './items';

const VIRTUAL_WIDTH = 540;
const VIRTUAL_HEIGHT = 960;

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
  private nextBallId: number = 1;

  private score: number = 0;
  private maxTierReached: number = 0;
  private nextTier: number = 0;
  private currentHUD: GameHUDState = {};

  // État du jeu & Gestion du Débordement (Game Over)
  private state: 'RUNNING' | 'GAME_OVER' | 'VICTORY' = 'RUNNING';
  public readonly dangerY = 380;
  private overflowTimer: number = 0;
  private isDangerWarning: boolean = false;
  private dangerSoundCooldown: number = 0;

  // Climax Supernova Ralenti & Explosion Finale (Tier 9)
  private climaxPhase: 'NONE' | 'SLOWMO_CHARGE' | 'EXPLOSION' | 'VICTORY_SCREEN' = 'NONE';
  private climaxTimer: number = 0;
  private timeScale: number = 1.0;

  // Géométrie Générale
  public readonly centerX = 270;
  public readonly funnelTop = 150;
  public readonly funnelLeft = 195;
  public readonly funnelRight = 345;

  // Tube & Cuve Rectangulaire
  public readonly tubeLeft = 230;
  public readonly tubeRight = 310;
  public readonly tubeTop = 200;
  public readonly tubeBottom = 290;
  public readonly chamberLeft = 60;
  public readonly chamberRight = 480;
  public readonly chamberWidth = 420;
  public readonly chamberTop = 290;
  public readonly chamberBottom = 880;

  // Point de largage unique
  public readonly dropX = 270;
  public readonly dropY = 165;
  private canManualDrop: boolean = true;
  private manualDropCooldown: number = 0;

  // Rafale Automatique Niveau 1
  public isAutoStreaming: boolean = false;
  private autoStreamTimer: number = 0;
  private autoStreamBallsDropped: number = 0;

  // Visuels & Secousses
  private screenShake: number = 0;
  private shakeX: number = 0;
  private shakeY: number = 0;
  private tubeFlowOffset: number = 0;

  private viewScale: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private stars: { x: number; y: number; size: number; speed: number; baseAlpha: number }[] = [];

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
    this.loop(performance.now());
  }

  private handleResize = () => {
    this.resize();
  };

  private getCurrentTiers(): MergeTier[] {
    return getTiersForTheme(this.config.SKIN_THEME, this.config.BASE_BALL_RADIUS || 16);
  }

  private getRandomSpawnTier(): number {
    const maxT = Math.min(this.config.SPAWN_MAX_TIER, 2);
    return Math.floor(Math.random() * (maxT + 1));
  }

  public updateConfig(newConfig: Partial<MergeDropConfig>) {
    const prevTheme = this.config.SKIN_THEME;
    const prevBaseRadius = this.config.BASE_BALL_RADIUS;
    this.config = { ...this.config, ...newConfig };

    if (newConfig.AUTO_STREAM_ACTIVE !== undefined) {
      this.isAutoStreaming = newConfig.AUTO_STREAM_ACTIVE;
    }

    if (newConfig.BASE_BALL_RADIUS !== undefined && newConfig.BASE_BALL_RADIUS !== prevBaseRadius) {
      this.balls.forEach((b) => b.updateRadius(this.config.BASE_BALL_RADIUS));
    }

    if (newConfig.SKIN_THEME !== undefined && newConfig.SKIN_THEME !== prevTheme) {
      this.balls.forEach((b) => b.setTheme(this.config.SKIN_THEME, this.config.BASE_BALL_RADIUS));
    }

    this.syncHUD();
  }

  public start() {
    sound.init();
    if (this.balls.length === 0) {
      this.reset();
    }
  }

  public reset() {
    this.balls = [];
    this.sparks = [];
    this.shockwaves = [];
    this.vortexParticles = [];
    this.score = 0;
    this.maxTierReached = 0;
    this.nextTier = this.getRandomSpawnTier();
    this.canManualDrop = true;
    this.manualDropCooldown = 0;
    this.autoStreamTimer = 0;
    this.autoStreamBallsDropped = 0;
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

  public destroy() {
    this.isDestroyed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
  }

  public triggerExtraAction = () => {
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
    this.syncHUD();
    return this.isAutoStreaming;
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
    const isSolar = this.config.SKIN_THEME === 'solar';

    const title = this.config.TEXT_TITLE || (isSolar ? (isEn ? '🪐 SOLAR SYSTEM' : '🪐 SYSTÈME SOLAIRE') : '⚡ NEON MERGE DROP');
    let statusText: string | undefined;

    if (this.state === 'GAME_OVER') {
      statusText = isEn ? '💥 OVERFLOW! GAME OVER 💥' : '💥 DÉBORDEMENT ! PARTIE PERDUE 💥';
    } else if (this.state === 'VICTORY') {
      statusText = isEn ? '☀️ COSMIC SUPERNOVA! ULTIMATE MERGE ☀️' : '☀️ SUPERNOVA COSMIQUE ! VICTOIRE TOTALE ☀️';
    } else if (this.isDangerWarning) {
      statusText = isEn ? '⚠️ DANGER: OVERFLOW! ⚠️' : '⚠️ DANGER : DÉBORDEMENT ! ⚠️';
    } else if (this.maxTierReached === 9) {
      statusText = this.config.TEXT_STATUS_VICTORY || (isSolar ? (isEn ? '☀️ SUN CREATED! COSMIC VICTORY ☀️' : '☀️ SOLEIL CRÉÉ ! VICTOIRE COSMIQUE ☀️') : (isEn ? '⭐ ULTIMATE MERGE REACHED! ⭐' : '⭐ FUSION ULTIME ATTEINTE ! ⭐'));
    }

    const streamStopLabel = this.config.TEXT_ACTION_STREAM_STOP || (isSolar ? (isEn ? 'STOP ASTEROID STREAM' : 'ARRÊTER RAFALE ASTÉROÏDES') : (isEn ? 'STOP STREAM TIER 1' : 'ARRÊTER RAFALE NIVEAU 1'));
    const streamStartLabel = this.config.TEXT_ACTION_STREAM_START || (isSolar ? (isEn ? 'LAUNCH ASTEROID STREAM' : 'LANCER RAFALE ASTÉROÏDES') : (isEn ? 'LAUNCH STREAM TIER 1' : 'LANCER RAFALE NIVEAU 1'));

    const tierLocalizedName = getTierLocalizedName(currentMaxTierObj, isEn);

    this.currentHUD = {
      title,
      primaryMetricLabel: this.config.TEXT_METRIC_SCORE || 'SCORE',
      primaryMetricValue: this.score,
      secondaryMetricLabel: this.config.TEXT_METRIC_MAX_TIER || (isSolar ? (isEn ? 'MAX PLANET' : 'PLANÈTE MAX') : (isEn ? 'MAX TIER' : 'PALIER MAX')),
      secondaryMetricValue: `${currentMaxTierObj.symbol} ${tierLocalizedName}`,
      statusText,
      extraActionLabel: this.isAutoStreaming ? streamStopLabel : streamStartLabel,
      extraActionActive: this.isAutoStreaming
    };
    this.onHUDUpdate(this.currentHUD);
  }

  public handlePointerDown = (e: MouseEvent | TouchEvent, clientX: number, clientY: number) => {
    sound.init();
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

  private triggerManualDrop() {
    if (this.state !== 'RUNNING' || !this.canManualDrop) return;

    sound.playDrop();

    const ball = new MergeBall(
      this.nextBallId++,
      this.nextTier,
      this.dropX,
      this.dropY,
      this.config.SKIN_THEME,
      false,
      this.config.BASE_BALL_RADIUS || 16
    );
    ball.vy = 260; // Descente rapide
    this.balls.push(ball);

    this.nextTier = this.getRandomSpawnTier();
    this.canManualDrop = false;
    this.manualDropCooldown = 0.35;
  }

  private spawnLevel1StreamBall() {
    if (this.state !== 'RUNNING') return;
    const jitterX = (Math.random() - 0.5) * 10;
    const ball = new MergeBall(
      this.nextBallId++,
      0, // Niveau 1 / Astéroïde
      this.dropX + jitterX,
      this.dropY,
      this.config.SKIN_THEME,
      false,
      this.config.BASE_BALL_RADIUS || 16
    );
    ball.vx = (Math.random() - 0.5) * 20;
    ball.vy = 300 + Math.random() * 80;
    this.balls.push(ball);

    this.autoStreamBallsDropped++;
    if (this.autoStreamBallsDropped % 3 === 0) {
      sound.playDrop();
    }
  }

  private triggerScreenShake(intensity: number) {
    if (!this.config.SCREEN_SHAKE_ENABLED) return;
    this.screenShake = Math.max(this.screenShake, Math.min(18.0, intensity));
  }

  /**
   * Profil mathématique de la Jarre galbée (demi-largeur en fonction de Y)
   */
  public getJarHalfWidth(y: number): number {
    if (y < 200) {
      const t = Math.max(0, Math.min(1, (y - this.funnelTop) / (200 - this.funnelTop)));
      return 75 - t * 35; // 75 -> 40
    }
    if (y <= 290) {
      return 40; // Col de la jarre (diamètre 80px)
    }
    const t = Math.max(0, Math.min(1, (y - 290) / (this.chamberBottom - 290))); // 0 -> 1
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
    const neckW = Math.max(35, this.config.CUSTOM_NECK_WIDTH || 45);
    const bellyW = Math.max(40, this.config.CUSTOM_BELLY_WIDTH || 135);
    const bellyPos = Math.max(0.15, Math.min(0.85, this.config.CUSTOM_BELLY_POSITION || 0.55));
    const bottomW = Math.max(35, this.config.CUSTOM_BOTTOM_WIDTH || 220);
    const curvature = Math.max(0, Math.min(1, this.config.CUSTOM_CURVATURE !== undefined ? this.config.CUSTOM_CURVATURE : 0.05));
    const waveCount = Math.max(0, this.config.CUSTOM_WAVE_COUNT || 0);
    const waveAmp = Math.max(0, this.config.CUSTOM_WAVE_AMPLITUDE || 0);

    // Entonnoir supérieur de largage
    if (y < 200) {
      const t = Math.max(0, Math.min(1, (y - this.funnelTop) / (200 - this.funnelTop)));
      const topW = Math.max(75, neckW + 15);
      return topW - t * (topW - neckW);
    }
    // Col de passage
    if (y <= 290) {
      return neckW;
    }

    // Cuve principale personnalisée
    const chamberH = this.chamberBottom - 290;
    const t = Math.max(0, Math.min(1, (y - 290) / chamberH));

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
    if (y < 200) {
      const t = Math.max(0, Math.min(1, (y - this.funnelTop) / (200 - this.funnelTop)));
      return 80 - t * 35; // 80 -> 45
    }
    if (y <= 419.5) {
      return 45; // Tube vertical d'entrée (diamètre 90px)
    }
    const dy = Math.abs(y - 640);
    if (dy >= 225) {
      return 20;
    }
    return Math.sqrt(225 * 225 - dy * dy);
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
   * Helper pour obtenir la couleur du conteneur avec un niveau d'opacité
   */
  public getContainerAccentColor(alpha: number = 0.4): string {
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

  private updatePhysics(dt: number) {
    this.tubeFlowOffset = (this.tubeFlowOffset + dt * 180) % 30;

    const effectiveDt = this.climaxPhase !== 'NONE' ? dt * this.timeScale : dt;

    // Gestion de la cinématique de Supernova
    if (this.climaxPhase !== 'NONE') {
      this.climaxTimer += dt;
      const sunBall = this.balls.find((b) => b.tier === 9);

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
        }

        // Détonation de la Supernova au terme de la charge !
        if (this.climaxTimer >= 1.4) {
          this.climaxPhase = 'EXPLOSION';
          this.timeScale = 0.5;
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

    if (this.state === 'RUNNING') {
      if (!this.canManualDrop) {
        this.manualDropCooldown -= dt;
        if (this.manualDropCooldown <= 0) {
          this.canManualDrop = true;
        }
      }

      if (this.isAutoStreaming) {
        const rate = Math.max(1, this.config.AUTO_STREAM_RATE || 5);
        const interval = 1.0 / rate;
        this.autoStreamTimer += dt;
        while (this.autoStreamTimer >= interval) {
          this.autoStreamTimer -= interval;
          this.spawnLevel1StreamBall();
        }
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

        // Le Soleil en climax ne subit plus la gravité ordinaire
        if (this.climaxPhase !== 'NONE' && b.tier === 9) {
          continue;
        }

        b.vy += gravityAccel * subDt;
        b.vx *= friction;
        b.vy *= friction;
        b.x += b.vx * subDt;
        b.y += b.vy * subDt;

        if (this.config.CONTAINER_SHAPE === 'circle') {
          // --- COLLISIONS FIOLE RONDE & TUBE VERTICAL ---
          const cX = 270;
          const cY = 640;
          const R = 225;
          const neckHalfW = 45;
          const neckConnectY = 419.5;
          const circleBottom = cY + R; // 865

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
            b.vx = Math.abs(b.vx) * restitution + 10;
          } else if (b.x > maxX) {
            b.x = maxX;
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
            if (b1.tier === b2.tier && b1.tier < currentTiers.length - 1) {
              toRemove.add(b1.id);
              toRemove.add(b2.id);

              const nextTier = b1.tier + 1;
              const midX = (b1.x + b2.x) / 2;
              const midY = (b1.y + b2.y) / 2;

              const mergedBall = new MergeBall(
                this.nextBallId++,
                nextTier,
                midX,
                midY,
                this.config.SKIN_THEME,
                true,
                this.config.BASE_BALL_RADIUS || 16
              );
              mergedBall.vx = (b1.vx + b2.vx) * 0.35;
              mergedBall.vy = (b1.vy + b2.vy) * 0.35 - 50;

              toAdd.push(mergedBall);

              sound.playMerge(nextTier);

              const pts = currentTiers[nextTier].points;
              this.score += pts;
              if (nextTier > this.maxTierReached) {
                this.maxTierReached = nextTier;
              }

              // Déclenchement grandiose si création de l'astre ultime (Le Soleil / Tier 9) !
              if (nextTier === 9) {
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
              continue;
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
              const cX = 270;
              const cY = 640;
              const R = 225;
              const neckHalfW = 45;
              const neckConnectY = 419.5;
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

    // Mise à jour des particules d'étincelles
    if (this.sparks.length > 70) {
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
      const sunBall = this.balls.find((b) => b.tier === 9);
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

    for (let i = 0; i < this.balls.length; i++) {
      this.balls[i].draw(this.ctx);
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

    // Dessin de l'écran Game Over si débordement confirmé
    if (this.state === 'GAME_OVER') {
      this.drawGameOverOverlay();
    } else if (this.climaxPhase === 'VICTORY_SCREEN') {
      this.drawVictoryOverlay();
    }

    // Dessin du HUD textuel en haut du Canvas (inclus dans la vidéo 9:16)
    drawCanvasHUD(this.ctx, this.currentHUD, VIRTUAL_WIDTH);

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
    const cX = 270;
    const cY = 640;
    const R = 225;
    const neckHalfW = 45;
    const neckConnectY = 419.5;
    const delta = Math.asin(neckHalfW / R);
    const thetaLeft = -Math.PI / 2 - delta;
    const thetaRight = -Math.PI / 2 + delta;

    // 1. Fond teinté de la fiole (remplissage complet de la sphère et du col)
    ctx.beginPath();
    ctx.moveTo(cX - 80, this.funnelTop);
    ctx.lineTo(cX - neckHalfW, 200);
    ctx.lineTo(cX - neckHalfW, neckConnectY);
    // Arc circulaire de thetaLeft à thetaRight passant par le bas (anticlockwise: true)
    ctx.arc(cX, cY, R, thetaLeft, thetaRight, true);
    ctx.lineTo(cX + neckHalfW, 200);
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
    ctx.lineTo(cX - neckHalfW, 200);
    ctx.lineTo(cX - neckHalfW, neckConnectY);
    ctx.arc(cX, cY, R, thetaLeft, thetaRight, true);
    ctx.lineTo(cX + neckHalfW, 200);
    ctx.lineTo(cX + 80, this.funnelTop);

    // Contour principal
    ctx.strokeStyle = themeColor;
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Cœur blanc pur ultra-fin
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 0.7;
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
    ctx.strokeStyle = themeColor;
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Cœur blanc pur ultra-fin
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 0.7;
    ctx.stroke();

    // Graduations holographiques sur le flanc droit pour le style laboratoire
    ctx.strokeStyle = this.getContainerAccentColor(0.35);
    ctx.lineWidth = 1.0;
    for (let y = 340; y <= this.chamberBottom - 30; y += 45) {
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
    ctx.strokeStyle = themeColor;
    ctx.shadowBlur = 0; // Finis les traits baveux énormes
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Cœur blanc pur ultra-fin
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 0.7;
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
    ctx.strokeStyle = themeColor;
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 0.7;
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

  private drawSpawnerPreview() {
    const ctx = this.ctx;
    const tiers = this.getCurrentTiers();
    const tierData = tiers[this.nextTier];

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
    } else if (this.canManualDrop) {
      ctx.beginPath();
      ctx.arc(0, 0, tierData.radius * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = tierData.glowColor;
      ctx.globalAlpha = 0.35;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, tierData.radius, 0, Math.PI * 2);
      ctx.fillStyle = tierData.color;
      ctx.shadowColor = tierData.glowColor;
      ctx.shadowBlur = 12;
      ctx.globalAlpha = 0.9;
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(10, Math.round(tierData.radius * 0.52))}px 'Inter', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText(tierData.symbol, 0, 1);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
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
