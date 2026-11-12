import { GameInstance, GameHUDState } from '../../core/types';
import { sound } from '../../core/SoundEngine';
import { drawCanvasHUD } from '../../core/canvasHUD';
import { PRNG } from '../../core/math/prng';
import { BallEscapeConfig, DEFAULT_BALL_ESCAPE_CONFIG } from './types';
import {
  VIRTUAL_WIDTH,
  VIRTUAL_HEIGHT,
  CENTER_X,
  DEFAULT_CENTER_Y,
  Particle,
  Shockwave,
  ArenaRing,
  Ball
} from './entities';

export class BallEscapeGame implements GameInstance {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onHUDUpdate: (hud: GameHUDState) => void;
  private config: BallEscapeConfig;
  private prng: PRNG;

  private isRunning: boolean = false;
  private isDestroyed: boolean = false;
  private animFrameId: number | null = null;
  private lastTime: number = performance.now();

  private state: 'WAITING' | 'RUNNING' | 'ESCAPED' | 'FROZEN' = 'WAITING';
  private bounces: number = 0;
  private screenShake: number = 0;
  private shakeX: number = 0;
  private shakeY: number = 0;
  private timeLeft: number;
  private freezeTimer: number = 0;
  private loopCountdown: number = 0;
  private timeScale: number = 1.0;
  private hasEscaped: boolean = false;
  private maxSpeedReached: number;
  private winnerTeam?: string;

  // Entités
  private rings: ArenaRing[] = [];
  private particles: Particle[] = [];
  private shockwaves: Shockwave[] = [];
  private balls: Ball[] = [];
  private currentHUD: GameHUDState = {};

  // Éléments de fond animé
  private bgStars: { x: number; y: number; speed: number; size: number; alpha: number }[] = [];
  private bgRayAngle: number = 0;
  private bgGridOffset: number = 0;

  // Viewport
  private viewScale: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    initialConfig: BallEscapeConfig,
    onHUDUpdate: (hud: GameHUDState) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onHUDUpdate = onHUDUpdate;
    this.config = { ...DEFAULT_BALL_ESCAPE_CONFIG, ...initialConfig };
    this.prng = new PRNG(this.config.SEED || 12345);

    this.timeLeft = this.config.CHALLENGE_TIME_LIMIT;
    this.maxSpeedReached = this.config.INITIAL_SPEED;

    this.initBackgroundStars();
    this.initArena();
    this.initBalls();
    this.resize();

    window.addEventListener('resize', this.handleResize);

    this.syncHUD();
    this.loop(performance.now());
  }

  private handleResize = () => {
    this.resize();
  };

  private getCenterY(): number {
    return this.config.ARENA_CENTER_Y !== undefined
      ? this.config.ARENA_CENTER_Y
      : DEFAULT_CENTER_Y;
  }

  private initBackgroundStars() {
    this.bgStars = [];
    for (let i = 0; i < 45; i++) {
      this.bgStars.push({
        x: this.prng.range(0, VIRTUAL_WIDTH),
        y: this.prng.range(0, VIRTUAL_HEIGHT),
        speed: this.prng.range(12, 37),
        size: this.prng.range(1, 3),
        alpha: this.prng.range(0.2, 0.8)
      });
    }
  }

  private initArena() {
    this.rings = [];
    const isClassic = this.config.GAME_MODE === 'classic';
    const isMultiRing =
      !isClassic &&
      (this.config.GAME_MODE === 'multi-ring' || (this.config.RING_COUNT && this.config.RING_COUNT > 1));
    const ringCount = isMultiRing ? Math.max(2, Math.min(6, this.config.RING_COUNT || 3)) : 1;
    const spacing = this.config.RING_SPACING || 36;
    const baseRadius = this.config.CIRCLE_RADIUS || 180;
    const innerRadius = Math.max(65, baseRadius - (ringCount - 1) * spacing);
    const gapMode = isClassic ? 'bricks' : (this.config.RING_GAP_MODE || 'rotating-gap');
    const gapSizeRad = (this.config.GAP_SIZE_DEGREES || 36) * (Math.PI / 180);

    for (let i = 0; i < ringCount; i++) {
      const radius = innerRadius + i * spacing;
      const dir = i % 2 === 0 ? 1 : -1;
      const rotSpeed = dir * (0.2 + i * 0.08) * (this.config.ARENA_ROTATION_SPEED || 0.35);
      const segCount = Math.max(12, Math.round(this.config.TOTAL_WALL_SEGMENTS * (radius / baseRadius)));
      const segHp = Math.max(1, this.config.SEGMENT_HP || 3);

      this.rings.push(new ArenaRing(i, radius, rotSpeed, segCount, segHp, gapMode, gapSizeRad));
    }
  }

  private initBalls() {
    this.balls = [];
    const cy = this.getCenterY();
    const mode = this.config.GAME_MODE;

    if (mode === 'duel') {
      const count = Math.max(2, Math.min(8, this.config.BATTLE_BALL_COUNT || 2));
      for (let i = 0; i < count; i++) {
        const teamKey = `p${i + 1}`;
        const b = new Ball(i, CENTER_X, cy, this.config.BALL_RADIUS, teamKey);
        // Angle initial réparti en étoile pour un envol dynamique
        const spreadAngle = (i / count) * Math.PI * 2 + this.prng.jitter(0.25) - Math.PI / 2;
        b.reset(CENTER_X, cy, this.config, spreadAngle, this.prng);
        this.balls.push(b);
      }
    } else {
      const mainBall = new Ball(0, CENTER_X, cy, this.config.BALL_RADIUS);
      const angle = this.prng.range(0.2, 0.8) * Math.PI * (this.prng.next() < 0.5 ? 1 : -1);
      mainBall.reset(CENTER_X, cy, this.config, angle, this.prng);
      this.balls.push(mainBall);

      if (mode === 'ball-storm') {
        const initialCount = 4;
        for (let i = 1; i <= initialCount; i++) {
          const stormBall = new Ball(i, CENTER_X, cy, this.config.BALL_RADIUS * 0.9);
          const sAngle = (i / initialCount) * Math.PI * 2 + this.prng.jitter(0.25);
          stormBall.reset(CENTER_X, cy, this.config, sAngle, this.prng);
          this.balls.push(stormBall);
        }
      }
    }
  }

  public updateConfig(newConfig: Partial<BallEscapeConfig>) {
    const prevMode = this.config.GAME_MODE;
    const prevSeed = this.config.SEED;
    const prevCount = this.config.BATTLE_BALL_COUNT;

    this.config = { ...this.config, ...newConfig };

    if (newConfig.SEED !== undefined && newConfig.SEED !== prevSeed) {
      this.prng.reseed(newConfig.SEED);
    }

    const modeChanged = newConfig.GAME_MODE !== undefined && newConfig.GAME_MODE !== prevMode;
    const battleCountChanged =
      newConfig.BATTLE_BALL_COUNT !== undefined && newConfig.BATTLE_BALL_COUNT !== prevCount;
    const ringChanged =
      newConfig.RING_COUNT !== undefined ||
      newConfig.TOTAL_WALL_SEGMENTS !== undefined ||
      newConfig.SEGMENT_HP !== undefined ||
      newConfig.CIRCLE_RADIUS !== undefined ||
      newConfig.RING_GAP_MODE !== undefined ||
      newConfig.GAP_SIZE_DEGREES !== undefined ||
      newConfig.RING_SPACING !== undefined ||
      newConfig.ARENA_ROTATION_SPEED !== undefined;

    if (modeChanged || ringChanged) {
      this.initArena();
    }

    if (modeChanged || battleCountChanged || ringChanged) {
      this.initBalls();
    } else {
      for (let i = 0; i < this.balls.length; i++) {
        this.balls[i].updateColor(this.config);
      }
    }

    this.syncHUD();
  }

  public start() {
    sound.init();
    if (this.state === 'WAITING' || this.state === 'ESCAPED' || this.state === 'FROZEN') {
      this.reset();
    }
    this.state = 'RUNNING';
    this.syncHUD();
  }

  public reset() {
    this.prng.reseed(this.config.SEED || 12345);
    this.state = 'RUNNING';
    this.bounces = 0;
    this.screenShake = 0;
    this.timeLeft = this.config.CHALLENGE_TIME_LIMIT;
    this.freezeTimer = 0;
    this.loopCountdown = 0;
    this.timeScale = 1.0;
    this.hasEscaped = false;
    this.winnerTeam = undefined;
    this.particles = [];
    this.shockwaves = [];
    this.maxSpeedReached = this.config.INITIAL_SPEED;

    this.initArena();
    this.initBalls();

    this.syncHUD();
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
  }

  private syncHUD() {
    const sec = Math.max(0, Math.ceil(this.timeLeft));
    let statusText: string | undefined;

    if (this.state === 'WAITING') {
      statusText = this.config.TEXT_STATUS_START || 'Clique pour démarrer';
    } else if (this.state === 'ESCAPED') {
      if (this.config.GAME_MODE === 'duel' && this.winnerTeam) {
        statusText = `VICTOIRE ${this.winnerTeam} !`;
      } else {
        statusText = this.config.TEXT_STATUS_ESCAPE || 'Évasion réussie !';
      }
    } else if (this.state === 'FROZEN') {
      statusText = this.hasEscaped
        ? (this.config.TEXT_STATUS_WIN || 'VICTOIRE !')
        : (this.config.TEXT_STATUS_LOSS || 'TEMPS ÉCOULÉ !');
    }

    if (this.config.GAME_MODE === 'duel' || this.balls.length > 1) {
      const sorted = [...this.balls].sort((a, b) => {
        if (b.currentRingIndex !== a.currentRingIndex) return b.currentRingIndex - a.currentRingIndex;
        return b.bouncesCount - a.bouncesCount;
      });
      const top1 = sorted[0] || this.balls[0] || { label: 'P1', bouncesCount: 0, color: '#00f0ff' };
      const top2 = sorted[1] || this.balls[1] || { label: 'P2', bouncesCount: 0, color: '#ff007f' };
      const isMulti = this.balls.length > 2;
      const p1Label = isMulti ? `1er: ${top1.label}` : top1.label;
      const p2Label = isMulti ? `2e: ${top2.label}` : top2.label;

      this.currentHUD = {
        title: this.config.TEXT_TITLE || (isMulti ? `BATTLE ROYALE : ${this.balls.length} BILLES` : 'DUEL : QUI SORTIRA EN PREMIER ?'),
        primaryMetricLabel: p1Label,
        primaryMetricValue: top1.bouncesCount,
        primaryMetricColor: top1.color,
        secondaryMetricLabel: p2Label,
        secondaryMetricValue: top2.bouncesCount,
        secondaryMetricColor: top2.color,
        statusText,
        isDanger: sec <= 5 && this.state === 'RUNNING',
        isFinished: this.state === 'FROZEN',
        isWaitingToStart: this.state === 'WAITING',
        overlayPromptText: this.config.TEXT_STATUS_START || 'Clique pour démarrer',
        topOffset: this.config.HUD_TOP_OFFSET || 0
      };
    } else if (this.config.GAME_MODE === 'multi-ring' || this.rings.length > 1) {
      const mainBall = this.balls[0];
      const maxRing = mainBall ? mainBall.currentRingIndex : 0;
      const currentRing = Math.min(this.rings.length, maxRing + 1);
      this.currentHUD = {
        title: this.config.TEXT_TITLE || `CAN IT ESCAPE ${this.rings.length} RINGS?`,
        primaryMetricLabel: 'ANNEAU',
        primaryMetricValue: `${currentRing}/${this.rings.length}`,
        primaryMetricColor: '#00f0ff',
        secondaryMetricLabel: this.config.TEXT_METRIC_BOUNCES || 'REBONDS',
        secondaryMetricValue: this.bounces,
        statusText,
        isDanger: sec <= 5 && this.state === 'RUNNING',
        isFinished: this.state === 'FROZEN',
        isWaitingToStart: this.state === 'WAITING',
        overlayPromptText: this.config.TEXT_STATUS_START || 'Clique pour démarrer',
        topOffset: this.config.HUD_TOP_OFFSET || 0
      };
    } else {
      this.currentHUD = {
        title: this.config.TEXT_TITLE || 'CAN THE BALL ESCAPE IN 30s?',
        primaryMetricLabel: this.config.TEXT_METRIC_TIME || 'TEMPS',
        primaryMetricValue: `${sec}s`,
        primaryMetricColor: sec <= 5 ? '#ef4444' : '#00f0ff',
        secondaryMetricLabel: this.config.TEXT_METRIC_BOUNCES || 'REBONDS',
        secondaryMetricValue: this.bounces,
        statusText,
        isDanger: sec <= 5 && this.state === 'RUNNING',
        isFinished: this.state === 'FROZEN',
        isWaitingToStart: this.state === 'WAITING',
        overlayPromptText: this.config.TEXT_STATUS_START || 'Clique pour démarrer',
        topOffset: this.config.HUD_TOP_OFFSET || 0
      };
    }

    this.onHUDUpdate(this.currentHUD);
  }

  private handleBounceOnRing(
    ball: Ball,
    ring: ArenaRing,
    segment: any,
    contactX: number,
    contactY: number,
    normalX: number,
    normalY: number
  ) {
    this.bounces++;
    ball.bouncesCount++;

    if (ball.speed > this.maxSpeedReached) {
      this.maxSpeedReached = ball.speed;
    }

    ball.flash = 1.0;
    ball.updateColor(this.config);

    const destroyed = segment && segment.hit ? segment.hit() : false;

    // Son de rebond ASMR (Mélodie virale ou instrument sélectionné)
    if (this.config.SOUND_BOUNCE_ENABLED) {
      const speedRatio =
        (ball.speed - this.config.INITIAL_SPEED) /
        Math.max(1, this.config.MAX_SPEED - this.config.INITIAL_SPEED);

      sound.playBallBounce(ball.bouncesCount, {
        instrument: this.config.SOUND_BOUNCE_STYLE || 'piano',
        melodyPreset: this.config.SOUND_MELODY_PRESET || 'pentatonic',
        volume: this.config.SOUND_BOUNCE_VOLUME,
        pitchMult: this.config.SOUND_PITCH_MULT || 1.0,
        speedRatio,
        comboIndex: this.config.SOUND_COMBO_PITCH ? this.bounces : 0
      });
    }

    if (destroyed) {
      if (this.config.SOUND_BREAK_ENABLED) {
        sound.playBallBreak({
          style: this.config.SOUND_BREAK_STYLE || 'crunch',
          volume: this.config.SOUND_BREAK_VOLUME,
          pitchMult: this.config.SOUND_PITCH_MULT || 1.0
        });
      }
      this.spawnDebris(contactX, contactY);
      this.triggerScreenShake(5);
    } else {
      this.triggerScreenShake(2);
    }

    this.spawnWallSparks(contactX, contactY, normalX, normalY, ball.color);
    if (this.config.SHOCKWAVE_ENABLED !== false) {
      const swDuration =
        this.config.SHOCKWAVE_DURATION !== undefined ? this.config.SHOCKWAVE_DURATION : 0.45;
      this.shockwaves.push(new Shockwave(contactX, contactY, ball.color, 45, swDuration));
    }

    // Duplication de balle / Tempête de balles
    const shouldSpawn =
      this.config.BALL_DUPLICATION_ON_BOUNCE ||
      this.config.GAME_MODE === 'ball-storm';

    if (shouldSpawn) {
      const maxBalls = this.config.MAX_BALLS || 16;
      if (this.balls.length < maxBalls) {
        const cy = this.getCenterY();
        const newBall = new Ball(
          this.balls.length,
          CENTER_X,
          cy,
          this.config.BALL_RADIUS * 0.9,
          ball.team
        );
        const spreadAngle = this.prng.range(0, Math.PI * 2);
        newBall.reset(CENTER_X, cy, this.config, spreadAngle, this.prng);
        this.balls.push(newBall);
        if (this.config.SHOCKWAVE_ENABLED !== false) {
          const swDuration =
            this.config.SHOCKWAVE_DURATION !== undefined ? this.config.SHOCKWAVE_DURATION : 0.45;
          this.shockwaves.push(new Shockwave(CENTER_X, cy, newBall.color, 30, swDuration));
        }
      }
    }

    this.syncHUD();
  }

  private handleEscape(ball: Ball) {
    if (this.hasEscaped) return;

    this.hasEscaped = true;
    this.state = 'ESCAPED';
    this.timeScale = this.config.BULLET_TIME_FACTOR || 0.25; // Bullet Time ralenti fluide
    this.freezeTimer = this.config.FREEZE_DELAY_AFTER_ESCAPE || 1.0;
    this.loopCountdown = this.config.PERFECT_LOOP_DELAY || 2.2;

    if (this.config.GAME_MODE === 'duel' || this.balls.length > 1) {
      this.winnerTeam = ball.label || (ball.team ? ball.team.toUpperCase() : 'VAINQUEUR');
    }

    if (this.config.SOUND_ESCAPE_ENABLED) {
      sound.playBallEscape(this.config.SOUND_ESCAPE_VOLUME);
    }

    this.triggerScreenShake(8);
    this.spawnEscapeFireworks(ball.x, ball.y);
    this.syncHUD();
  }

  private handleTimeUp() {
    if (this.state === 'FROZEN') return;
    this.state = 'FROZEN';
    this.triggerScreenShake(4);
    this.syncHUD();
  }

  private spawnWallSparks(x: number, y: number, nx: number, ny: number, color: string) {
    const count = 10 + this.prng.rangeInt(0, 4);
    for (let i = 0; i < count; i++) {
      const angle = Math.atan2(-ny, -nx) + this.prng.jitter(1.5);
      const spd = this.prng.range(2, 7);
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;
      const size = this.prng.range(1.5, 3.5);
      const life = this.prng.range(0.35, 0.6);
      this.particles.push(new Particle(x, y, vx, vy, color, size, life, 1.8));
    }
  }

  private spawnDebris(x: number, y: number) {
    const debrisColors = ['#ff0055', '#ff7700', '#ffee00', '#ffffff', '#00f0ff'];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = this.prng.next() * Math.PI * 2;
      const spd = this.prng.range(3, 10);
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;
      const size = this.prng.range(2.5, 6);
      const life = this.prng.range(0.7, 1.1);
      const color = this.prng.choice(debrisColors);
      this.particles.push(new Particle(x, y, vx, vy, color, size, life, 1.2, true));
    }
  }

  private spawnEscapeFireworks(x: number, y: number) {
    const colors = ['#00f0ff', '#ff007f', '#ffe600', '#00ff88', '#ffffff', '#bf00ff'];
    const count = this.config.CONFETTI_COUNT || 180;
    for (let i = 0; i < count; i++) {
      const angle = this.prng.next() * Math.PI * 2;
      const spd = this.prng.range(5, 17);
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;
      const color = this.prng.choice(colors);
      const size = this.prng.range(3, 7);
      const life = this.prng.range(1.8, 2.6);
      this.particles.push(new Particle(x, y, vx, vy, color, size, life, 0.65, true));
    }
  }

  private triggerScreenShake(intensity: number) {
    if (!this.config.SCREEN_SHAKE_ENABLED) return;
    const mult = this.config.SCREEN_SHAKE_INTENSITY ?? 0.25;
    const maxShake = this.config.SCREEN_SHAKE_MAX ?? 3.0;
    const effective = Math.min(maxShake, intensity * mult);
    this.screenShake = Math.max(this.screenShake, effective);
  }

  private spawnRingClearParticles(cx: number, cy: number, radius: number, ballColor: string) {
    const count = 36;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const spd = this.prng.range(2, 6);
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;
      const size = this.prng.range(2, 4);
      const life = this.prng.range(0.4, 0.8);
      const color =
        this.config.ARENA_COLOR === 'rainbow'
          ? `hsl(${Math.round((i / count) * 360)}, 100%, 60%)`
          : ballColor;
      this.particles.push(new Particle(x, y, vx, vy, color, size, life, 1.5, false));
    }
  }

  private advanceRing(ball: Ball) {
    if (ball.currentRingIndex < this.rings.length - 1) {
      // Franchissement vers l'anneau extérieur supérieur
      const clearedRing = this.rings[ball.currentRingIndex];
      clearedRing.isCleared = true;
      ball.currentRingIndex++;

      this.spawnRingClearParticles(CENTER_X, this.getCenterY(), clearedRing.radius, ball.color);
      if (this.config.SHOCKWAVE_ENABLED !== false) {
        const swDuration =
          this.config.SHOCKWAVE_DURATION !== undefined ? this.config.SHOCKWAVE_DURATION : 0.45;
        this.shockwaves.push(new Shockwave(ball.x, ball.y, '#ffffff', 55, swDuration));
      }

      if (this.config.SOUND_BOUNCE_ENABLED) {
        sound.playBallBounce(ball.bouncesCount, {
          instrument: 'synth',
          pitchMult: 1.45,
          volume: 0.95
        });
      }
      this.syncHUD();
    } else {
      // Échappé de tous les anneaux !
      const outermostRing = this.rings[this.rings.length - 1];
      if (outermostRing) {
        outermostRing.isCleared = true;
      }
      ball.isEscaping = true;
      if (this.config.SHOCKWAVE_ENABLED !== false) {
        const swDuration =
          this.config.SHOCKWAVE_DURATION !== undefined ? this.config.SHOCKWAVE_DURATION : 0.45;
        this.shockwaves.push(new Shockwave(ball.x, ball.y, '#ffd700', 65, swDuration));
      }
    }
  }

  private applyBounceDeflectionAndSpin(
    ball: Ball,
    nx: number,
    ny: number,
    rotSpeed: number,
    R: number
  ) {
    // nx, ny est le vecteur normal unitaire dirigé vers la surface d'impact (vers l'extérieur de l'arène)
    // La normale intérieure (dirigée vers le centre de l'arène / espace libre) est donc (-nx, -ny)
    const inNx = -nx;
    const inNy = -ny;
    const tangentX = -ny;
    const tangentY = nx;

    // Décomposition de la vitesse après réflexion géométrique
    let vInward = ball.vx * inNx + ball.vy * inNy;
    let vTangent = ball.vx * tangentX + ball.vy * tangentY;

    // Assurer que la balle s'éloigne impérativement de la paroi
    if (vInward < 1) {
      vInward = Math.max(1, Math.abs(vInward));
    }

    // 1. Transfert de rotation de la paroi (frottement dynamique avec l'arène tournante)
    const wallTangentSpeed = rotSpeed * R;
    const slip = wallTangentSpeed - vTangent;
    const spinFactor =
      this.config.WALL_SPIN_TRANSFER !== undefined ? this.config.WALL_SPIN_TRANSFER : 0.45;
    vTangent += slip * spinFactor;

    // 2. Angle de rebond de référence par rapport à la normale intérieure
    const baseAngle = Math.atan2(vTangent, vInward);

    // 3. Aléatoire de Direction (BOUNCE_DIR_RANDOMNESS : 0% à 100%)
    const dirRandPct =
      this.config.BOUNCE_DIR_RANDOMNESS !== undefined
        ? this.config.BOUNCE_DIR_RANDOMNESS
        : (this.config.BOUNCE_RANDOMNESS !== undefined ? this.config.BOUNCE_RANDOMNESS : 25);
    const dirNorm = Math.max(0, Math.min(100, dirRandPct)) / 100;

    let finalAngle = baseAngle;
    if (dirNorm > 0) {
      // Déviation angulaire jusqu'à ±65° (1.13 rad) à 100%
      const maxDeflectAngle = dirNorm * 1.15;
      const angleJitter = (this.prng.next() * 2 - 1) * maxDeflectAngle;
      finalAngle = baseAngle + angleJitter;
    }

    // Clamp de sécurité : l'angle ne doit jamais dépasser 75° pour garantir un retour franc vers l'intérieur
    const maxSafeAngle = Math.PI * 0.42; // ~75.6°
    finalAngle = Math.max(-maxSafeAngle, Math.min(maxSafeAngle, finalAngle));

    // 4. Vitesse et Aléatoire de Vitesse (BOUNCE_SPEED_RANDOMNESS : 0% à 100%)
    const baseMult = this.config.BOUNCE_SPEED_MULTIPLIER || 1.03;
    const speedRandPct =
      this.config.BOUNCE_SPEED_RANDOMNESS !== undefined
        ? this.config.BOUNCE_SPEED_RANDOMNESS
        : 20;
    const speedNorm = Math.max(0, Math.min(100, speedRandPct)) / 100;

    let speedMult = baseMult;
    if (speedNorm > 0) {
      // Variation de vitesse jusqu'à ±35% à 100% (ex: 0.67x à 1.39x)
      const speedJitter = (this.prng.next() * 2 - 1) * (0.35 * speedNorm);
      speedMult = Math.max(0.75, baseMult * (1.0 + speedJitter));
    }

    // Calcul de la vitesse finale
    const curSpeed = ball.speed || Math.hypot(ball.vx, ball.vy) || this.config.INITIAL_SPEED;
    const newSpeed = Math.min(
      this.config.MAX_SPEED,
      Math.max(this.config.INITIAL_SPEED * 0.5, curSpeed * speedMult)
    );
    ball.speed = newSpeed;

    // 5. Reconstruction précise du vecteur vitesse (ball.vx, ball.vy)
    const finalVInward = newSpeed * Math.cos(finalAngle);
    const finalVTangent = newSpeed * Math.sin(finalAngle);

    ball.vx = inNx * finalVInward + tangentX * finalVTangent;
    ball.vy = inNy * finalVInward + tangentY * finalVTangent;
  }

  private updateBallPhysics(ball: Ball, subDt: number, centerY: number) {
    ball.vy += this.config.GRAVITY * subDt;
    ball.x += ball.vx * subDt;
    ball.y += ball.vy * subDt;

    const dx = ball.x - CENTER_X;
    const dy = ball.y - centerY;
    const dist = Math.hypot(dx, dy);

    if (ball.isEscaping) {
      const outermostRadius = this.rings[this.rings.length - 1]?.radius || this.config.CIRCLE_RADIUS;
      if (dist >= outermostRadius + ball.radius + 20) {
        this.handleEscape(ball);
      }
      return;
    }

    const currentRing = this.rings[ball.currentRingIndex];
    if (!currentRing) {
      ball.isEscaping = true;
      return;
    }

    const strokeWidth = this.config.ARENA_STROKE_WIDTH || 8;
    const R = currentRing.radius;
    const r = ball.radius;
    const limitRadius = R - strokeWidth * 0.5 - r;

    const nx = dist > 0.001 ? dx / dist : 0;
    const ny = dist > 0.001 ? dy / dist : -1;
    const dot = ball.vx * nx + ball.vy * ny;

    let ballAngle = Math.atan2(dy, dx);
    if (ballAngle < 0) ballAngle += Math.PI * 2;

    let dTheta = (ballAngle - currentRing.angle) % (Math.PI * 2);
    if (dTheta > Math.PI) dTheta -= Math.PI * 2;
    if (dTheta < -Math.PI) dTheta += Math.PI * 2;
    const absDTheta = Math.abs(dTheta);

    const halfGap = currentRing.gapSize / 2;
    const angularClearance = Math.asin(Math.min(0.9, r / R));

    if (currentRing.gapMode === 'rotating-gap') {
      // Détection des extrémités de la brèche (lèvres)
      const lip1Angle = currentRing.angle - halfGap;
      const lip2Angle = currentRing.angle + halfGap;
      const lip1X = CENTER_X + Math.cos(lip1Angle) * R;
      const lip1Y = centerY + Math.sin(lip1Angle) * R;
      const lip2X = CENTER_X + Math.cos(lip2Angle) * R;
      const lip2Y = centerY + Math.sin(lip2Angle) * R;

      const dLip1 = Math.hypot(ball.x - lip1X, ball.y - lip1Y);
      const dLip2 = Math.hypot(ball.x - lip2X, ball.y - lip2Y);
      const lipHitRadius = r + strokeWidth * 0.5;

      let hitLip = false;
      let hitLipX = 0;
      let hitLipY = 0;
      let dLip = 0;

      if (dLip1 < lipHitRadius) {
        hitLip = true;
        hitLipX = lip1X;
        hitLipY = lip1Y;
        dLip = dLip1;
      } else if (dLip2 < lipHitRadius) {
        hitLip = true;
        hitLipX = lip2X;
        hitLipY = lip2Y;
        dLip = dLip2;
      }

      if (hitLip) {
        // Rebond sur le coin arrondi de la brèche
        const lnx = dLip > 0.001 ? (ball.x - hitLipX) / dLip : nx;
        const lny = dLip > 0.001 ? (ball.y - hitLipY) / dLip : ny;
        const lipDot = ball.vx * lnx + ball.vy * lny;

        if (lipDot < 0) {
          ball.x = hitLipX + lnx * (lipHitRadius + 1.0);
          ball.y = hitLipY + lny * (lipHitRadius + 1.0);

          ball.vx = ball.vx - 2 * lipDot * lnx;
          ball.vy = ball.vy - 2 * lipDot * lny;

          // La normale dirigée vers l'obstacle (le coin) est (-lnx, -lny)
          this.applyBounceDeflectionAndSpin(ball, -lnx, -lny, currentRing.rotSpeed, R);
          this.handleBounceOnRing(ball, currentRing, null, hitLipX, hitLipY, -lnx, -lny);
        }
      } else if (absDTheta < halfGap - angularClearance) {
        // Dans l'ouverture libre de la brèche
        if (dist >= R && dot > 0) {
          this.advanceRing(ball);
        }
      } else if (dist >= limitRadius) {
        // Collision avec l'arc plein de la paroi
        if (dot > 0) {
          ball.x = CENTER_X + nx * (limitRadius - 1.2);
          ball.y = centerY + ny * (limitRadius - 1.2);

          ball.vx = ball.vx - 2 * dot * nx;
          ball.vy = ball.vy - 2 * dot * ny;

          this.applyBounceDeflectionAndSpin(ball, nx, ny, currentRing.rotSpeed, R);

          const contactX = CENTER_X + nx * R;
          const contactY = centerY + ny * R;
          this.handleBounceOnRing(ball, currentRing, null, contactX, contactY, nx, ny);
        }
      }
    } else {
      // Mode 'bricks'
      let relAngle = (ballAngle - currentRing.angle) % (Math.PI * 2);
      if (relAngle < 0) relAngle += Math.PI * 2;

      const segIdx =
        Math.floor((relAngle / (Math.PI * 2)) * currentRing.segments.length) %
        currentRing.segments.length;
      const segment = currentRing.segments[segIdx];

      if (!segment || !segment.isAlive) {
        if (dist >= R && dot > 0) {
          this.advanceRing(ball);
        }
      } else if (dist >= limitRadius && dot > 0) {
        ball.x = CENTER_X + nx * (limitRadius - 1.2);
        ball.y = centerY + ny * (limitRadius - 1.2);

        ball.vx = ball.vx - 2 * dot * nx;
        ball.vy = ball.vy - 2 * dot * ny;

        this.applyBounceDeflectionAndSpin(ball, nx, ny, currentRing.rotSpeed, R);

        const contactX = CENTER_X + nx * R;
        const contactY = centerY + ny * R;
        this.handleBounceOnRing(ball, currentRing, segment, contactX, contactY, nx, ny);
      }
    }
  }

  private updatePhysics(dt: number) {
    if (this.state === 'WAITING' || this.state === 'FROZEN') return;

    if (this.state === 'RUNNING') {
      const prevSec = Math.ceil(this.timeLeft);
      this.timeLeft -= dt;
      const newSec = Math.ceil(this.timeLeft);
      if (newSec !== prevSec) {
        this.syncHUD();
      }
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.syncHUD();
        this.handleTimeUp();
        return;
      }
    }

    const centerY = this.getCenterY();
    const effectiveDt = dt * this.timeScale;
    const subSteps = this.config.SUB_STEPS;
    const subDt = effectiveDt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      // Rotation de tous les anneaux
      for (let r = 0; r < this.rings.length; r++) {
        this.rings[r].update(subDt);
      }

      // Collisions physiques entre les billes (Ball-to-Ball)
      if (this.config.BALL_COLLISION_ENABLED && this.balls.length > 1) {
        const elasticity =
          this.config.BALL_COLLISION_ELASTICITY !== undefined
            ? this.config.BALL_COLLISION_ELASTICITY
            : 0.98;
        const dirNorm =
          (this.config.BOUNCE_DIR_RANDOMNESS !== undefined
            ? this.config.BOUNCE_DIR_RANDOMNESS
            : (this.config.BOUNCE_RANDOMNESS ?? 25)) / 100;
        const speedNorm =
          (this.config.BOUNCE_SPEED_RANDOMNESS !== undefined
            ? this.config.BOUNCE_SPEED_RANDOMNESS
            : 20) / 100;
        for (let i = 0; i < this.balls.length; i++) {
          for (let j = i + 1; j < this.balls.length; j++) {
            const b1 = this.balls[i];
            const b2 = this.balls[j];
            if (b1.currentRingIndex === b2.currentRingIndex) {
              const collided = Ball.resolveBallBallCollision(
                b1,
                b2,
                this.prng,
                elasticity,
                dirNorm,
                speedNorm
              );
              if (collided) {
                const mx = (b1.x + b2.x) * 0.5;
                const my = (b1.y + b2.y) * 0.5;
                if (this.config.SHOCKWAVE_ENABLED !== false) {
                  const swDuration =
                    this.config.SHOCKWAVE_DURATION !== undefined ? this.config.SHOCKWAVE_DURATION : 0.45;
                  this.shockwaves.push(new Shockwave(mx, my, '#ffffff', 26, swDuration));
                }
              }
            }
          }
        }
      }

      // Physique de toutes les billes
      for (let i = 0; i < this.balls.length; i++) {
        this.updateBallPhysics(this.balls[i], subDt, centerY);
      }
    }

    // Traînées lumineuses de toutes les billes
    if (this.state === 'RUNNING' || this.state === 'ESCAPED') {
      for (let i = 0; i < this.balls.length; i++) {
        const b = this.balls[i];
        b.trail.push({ x: b.x, y: b.y, color: b.color });
        if (b.trail.length > b.maxTrail) {
          b.trail.shift();
        }
      }
    }

    // Boucle Parfaite (Perfect Loop) automatique pour TikTok
    if (this.state === 'ESCAPED') {
      this.loopCountdown -= dt;
      if (this.loopCountdown <= 0) {
        if (this.config.PERFECT_LOOP_ENABLED) {
          this.reset();
        } else {
          this.state = 'FROZEN';
          this.syncHUD();
        }
      }
    }
  }

  private updateEntities(dt: number) {
    if (this.state === 'FROZEN') return;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.update(dt);
      if (sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    if (this.screenShake > 0) {
      this.shakeX = this.prng.jitter(this.screenShake);
      this.shakeY = this.prng.jitter(this.screenShake);
      const decay = this.config.SCREEN_SHAKE_DECAY ?? 18.0;
      this.screenShake = Math.max(0, this.screenShake - decay * dt);
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  private render() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const scale = this.viewScale;
    const offX = this.offsetX || 0;
    const offY = this.offsetY || 0;
    this.ctx.translate(offX + this.shakeX * scale, offY + this.shakeY * scale);
    this.ctx.scale(scale, scale);

    this.drawBackground();
    this.drawArena();

    if (this.config.SHOCKWAVE_ENABLED !== false) {
      for (let i = 0; i < this.shockwaves.length; i++) {
        this.shockwaves[i].draw(this.ctx);
      }
    }

    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].draw(this.ctx);
    }

    // Rendu de toutes les billes
    for (let i = 0; i < this.balls.length; i++) {
      this.balls[i].draw(this.ctx, this.config.BALL_SKIN, this.config.BALL_TRAIL_STYLE);
    }

    // Dessin du HUD textuel en haut du Canvas (Safe Zone & Video Recorder)
    if (this.config.SHOW_TOP_HUD) {
      drawCanvasHUD(this.ctx, this.currentHUD, VIRTUAL_WIDTH);
    }

    this.ctx.restore();
  }

  private drawBackground() {
    this.ctx.save();
    const bgCol = this.config.BACKGROUND_COLOR || '#06080d';
    this.ctx.fillStyle = bgCol;
    this.ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    const centerY = this.getCenterY();
    const effect = this.config.BACKGROUND_EFFECT || 'cosmic-stars';

    if (effect === 'cosmic-stars') {
      // ✨ Étoiles Cosmiques scintillantes
      this.ctx.fillStyle = '#ffffff';
      for (let i = 0; i < this.bgStars.length; i++) {
        const s = this.bgStars[i];
        s.y = (s.y + s.speed * 0.016) % VIRTUAL_HEIGHT;
        this.ctx.globalAlpha = s.alpha * (0.6 + Math.sin(Date.now() * 0.003 + i) * 0.4);
        this.ctx.beginPath();
        this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    } else if (effect === 'celestial-rays') {
      // ☀️ Rayons célestes rotatifs
      this.bgRayAngle += 0.003;
      const rayCount = 12;
      this.ctx.save();
      this.ctx.translate(CENTER_X, centerY);
      this.ctx.rotate(this.bgRayAngle);
      for (let i = 0; i < rayCount; i++) {
        const angle = (i * Math.PI * 2) / rayCount;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.arc(0, 0, 420, angle - 0.12, angle + 0.12);
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(0, 240, 255, 0.03)';
        this.ctx.fill();
      }
      this.ctx.restore();
    } else if (effect === 'cyber-grid') {
      // 👾 Grille Cyber Synthwave 3D
      this.bgGridOffset = (this.bgGridOffset + 0.8) % 35;
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(176, 38, 255, 0.09)';
      this.ctx.lineWidth = 1;
      const horizonY = centerY + 100;
      for (let y = horizonY; y < VIRTUAL_HEIGHT; y += 22) {
        const py = y + this.bgGridOffset;
        if (py < VIRTUAL_HEIGHT) {
          this.ctx.beginPath();
          this.ctx.moveTo(0, py);
          this.ctx.lineTo(VIRTUAL_WIDTH, py);
          this.ctx.stroke();
        }
      }
      for (let x = -100; x <= VIRTUAL_WIDTH + 100; x += 35) {
        this.ctx.beginPath();
        this.ctx.moveTo(CENTER_X, horizonY);
        this.ctx.lineTo(x, VIRTUAL_HEIGHT);
        this.ctx.stroke();
      }
      this.ctx.restore();
    } else if (effect === 'aurora-waves') {
      // 🌌 Vagues d'Aurore Boréale
      const t = Date.now() * 0.0015;
      this.ctx.save();
      for (let w = 0; w < 3; w++) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, VIRTUAL_HEIGHT);
        for (let x = 0; x <= VIRTUAL_WIDTH; x += 25) {
          const y = centerY + Math.sin(x * 0.01 + t + w) * 60 + Math.cos(x * 0.005 - t) * 40;
          this.ctx.lineTo(x, y);
        }
        this.ctx.lineTo(VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
        this.ctx.closePath();
        this.ctx.fillStyle = w === 0 ? 'rgba(0, 255, 136, 0.04)' : 'rgba(0, 240, 255, 0.03)';
        this.ctx.fill();
      }
      this.ctx.restore();
    } else if (effect === 'hypnotic-tunnel') {
      // 🌀 Tunnel Hypnotique
      const tPulse = (Date.now() * 0.002) % 1;
      this.ctx.save();
      for (let r = 0; r < 5; r++) {
        const rad = ((r + tPulse) / 5) * 320;
        this.ctx.beginPath();
        this.ctx.arc(CENTER_X, centerY, rad, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(176, 38, 255, ${Math.max(0, 0.12 * (1 - rad / 320))})`;
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
      }
      this.ctx.restore();
    }

    // Halo d'ambiance central sous l'arène
    const outerRadius = this.rings[this.rings.length - 1]?.radius || this.config.CIRCLE_RADIUS;
    const bgGrad = this.ctx.createRadialGradient(CENTER_X, centerY, 20, CENTER_X, centerY, outerRadius);
    bgGrad.addColorStop(0, 'rgba(176, 38, 255, 0.08)');
    bgGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.03)');
    bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = bgGrad;
    this.ctx.beginPath();
    this.ctx.arc(CENTER_X, centerY, outerRadius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  private drawArena() {
    const centerY = this.getCenterY();
    const strokeWidth = this.config.ARENA_STROKE_WIDTH || 8;
    const arenaColor = this.config.ARENA_COLOR || 'rainbow';

    for (let i = 0; i < this.rings.length; i++) {
      this.rings[i].draw(this.ctx, CENTER_X, centerY, strokeWidth, arenaColor);
    }
  }

  private loop = (timestamp: number) => {
    if (this.isDestroyed) return;

    const rawDt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    const dt = Math.min(0.05, rawDt);

    this.updatePhysics(dt);
    this.updateEntities(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);

    const scaleX = this.canvas.width / VIRTUAL_WIDTH;
    const scaleY = this.canvas.height / VIRTUAL_HEIGHT;
    this.viewScale = Math.min(scaleX, scaleY);
    this.offsetX = (this.canvas.width - VIRTUAL_WIDTH * this.viewScale) / 2;
    this.offsetY = (this.canvas.height - VIRTUAL_HEIGHT * this.viewScale) / 2;
  }
}
