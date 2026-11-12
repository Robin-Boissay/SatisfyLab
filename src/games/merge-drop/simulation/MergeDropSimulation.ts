import { PRNG } from '../../../core/math/prng';
import { MergeDropConfig, DEFAULT_MERGE_DROP_CONFIG } from '../types';
import { getThemeDefinition, getTiersForTheme, MergeTier } from '../themeRegistry';
import {
  SimBall,
  SimulationEvent,
  DropAction,
  SimulationTelemetry,
  DropEvent,
  MergeEvent,
  BounceEvent,
  DangerEvent,
  ClimaxEvent,
  VictoryEvent,
  GameOverEvent
} from './types';

export class MergeDropSimulation {
  public readonly seed: number;
  public readonly prng: PRNG;
  public config: MergeDropConfig;
  public tiers: MergeTier[];

  public balls: SimBall[] = [];
  public score: number = 0;
  public maxTierReached: number = 0;
  public comboCount: number = 0;
  public comboTimer: number = 0;
  public currentTick: number = 0;
  public dangerTimer: number = 0;
  public state: 'RUNNING' | 'VICTORY' | 'GAME_OVER' = 'RUNNING';
  public victoryTicksRemaining: number = 0;
  public static readonly VICTORY_CLIMAX_TICKS: number = 330; // 5.5s à 60 FPS pour jouer l'intégralité du grand final cosmique

  public nextBallId: number = 1;
  public autoStreamTimer: number = 0;
  public ballsDroppedCount: number = 0;
  public mergesCount: number = 0;
  public maxCombo: number = 0;
  public totalCombos: number = 0;
  public dangerLineSeconds: number = 0;

  public events: SimulationEvent[] = [];
  public dropActions: DropAction[] = [];

  // Constantes d'arène (identiques à MergeDropGame)
  public readonly centerX = 270;
  public get funnelTop(): number { return this.config.CONTAINER_TOP_Y ?? 190; }
  public get chamberBottom(): number { return this.config.CONTAINER_BOTTOM_Y ?? 790; }
  public get dropY(): number { return this.funnelTop + 15; }
  public readonly dropX = 270;
  public get funnelLeft(): number { return 195; }
  public get funnelRight(): number { return 345; }

  // Tube & Cuve Rectangulaire
  public get tubeLeft(): number { return 230; }
  public get tubeRight(): number { return 310; }
  public get tubeTop(): number { return this.funnelTop + 50; }
  public get tubeBottom(): number { return this.funnelTop + 140; }
  public get chamberLeft(): number { return 60; }
  public get chamberRight(): number { return 480; }

  constructor(seed: number = 12345, customConfig: Partial<MergeDropConfig> = {}) {
    this.seed = seed >>> 0;
    this.prng = new PRNG(this.seed);
    this.config = { ...DEFAULT_MERGE_DROP_CONFIG, ...customConfig };

    const baseRadius = this.config.BASE_BALL_RADIUS || 16;
    const hitboxScale = Math.max(0.4, Math.min(2.0, this.config.BALL_HITBOX_SCALE ?? 1.0));
    const fullTiers = getTiersForTheme(this.config.SKIN_THEME, baseRadius);
    const activeIndices =
      this.config.ACTIVE_TIERS && Array.isArray(this.config.ACTIVE_TIERS) && this.config.ACTIVE_TIERS.length >= 5
        ? this.config.ACTIVE_TIERS.slice().sort((a, b) => a - b)
        : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    this.tiers = activeIndices.map((idx, newTier) => {
      const visualR = fullTiers[idx].radius;
      const hitboxR = Math.max(4, Math.round(visualR * hitboxScale * 10) / 10);
      return {
        ...fullTiers[idx],
        tier: newTier,
        originalTierIndex: idx,
        visualRadius: visualR,
        radius: hitboxR
      };
    });
  }

  public getCircleGeometry() {
    const cX = this.centerX;
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

  public getCircleHalfWidth(y: number): number {
    const { cY, R, neckHalfW, neckConnectY } = this.getCircleGeometry();
    const topY = this.funnelTop;
    const funnelEndY = topY + 50;
    if (y < funnelEndY) {
      const t = Math.max(0, Math.min(1, (y - topY) / (funnelEndY - topY)));
      return 80 - t * (80 - neckHalfW);
    }
    if (y <= neckConnectY) {
      return neckHalfW;
    }
    const dy = Math.abs(y - cY);
    if (dy >= R) return 20;
    return Math.sqrt(Math.max(0, R * R - dy * dy));
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

    if (y < funnelEndY) {
      const t = Math.max(0, Math.min(1, (y - topY) / (funnelEndY - topY)));
      const topW = Math.max(75, neckW + 15);
      return topW - t * (topW - neckW);
    }
    if (y <= neckEndY) {
      return neckW;
    }

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

    if (waveCount > 0 && waveAmp > 0) {
      baseW += Math.sin(t * Math.PI * waveCount * 2) * waveAmp * Math.sin(t * Math.PI);
    }

    return Math.max(35, Math.min(235, baseW));
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
      const cycle = (u * count * 2) % 2;
      wavePattern = cycle < 1 ? -1 + 2 * cycle : 1 - 2 * (cycle - 1);
    } else {
      wavePattern = Math.sin(u * Math.PI * count * 2);
    }

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

  /**
   * Largage déterministe d'une bille (exécuté par script ou au tick d'auto-stream)
   */
  public dropBall(tier: number = 0, explicitX?: number): DropEvent | null {
    if (this.state !== 'RUNNING') return null;

    const jitterX = this.prng.jitter(10);
    const spawnX = explicitX !== undefined ? explicitX : this.dropX + jitterX;
    const tierData = this.tiers[tier] || this.tiers[0];

    const ball: SimBall = {
      id: this.nextBallId++,
      tier,
      x: spawnX,
      y: this.dropY,
      vx: this.prng.jitter(20),
      vy: 300 + this.prng.range(0, 80),
      radius: tierData.radius,
      mass: Math.PI * tierData.radius * tierData.radius * 0.001,
      hasLanded: false,
      mergeCooldown: 0
    };

    this.balls.push(ball);
    this.ballsDroppedCount++;

    const event: DropEvent = {
      type: 'drop',
      tick: this.currentTick,
      timeSeconds: this.currentTick / 60,
      ballId: ball.id,
      tier,
      x: ball.x,
      y: ball.y,
      vx: ball.vx,
      vy: ball.vy
    };

    this.dropActions.push({
      tick: this.currentTick,
      tier,
      x: explicitX
    });

    return event;
  }

  /**
   * Avance la simulation physique de strictement 1 frame (1/60s = 0.016666s).
   * Retourne la liste des événements survenus pendant ce tick.
   */
  public tick(): SimulationEvent[] {
    if (this.state === 'VICTORY') {
      if (this.victoryTicksRemaining > 0) {
        this.victoryTicksRemaining--;
        this.currentTick++;
      }
      return [];
    }
    if (this.state !== 'RUNNING') return [];

    const frameEvents: SimulationEvent[] = [];
    const dt = 1 / 60;
    const currentTimeSec = this.currentTick / 60;

    // 1. Déclenchement automatique continu (Auto-Stream avec accélération progressive TikTok)
    if (this.config.AUTO_STREAM_ACTIVE !== false) {
      let currentRate: number;
      if (this.config.AUTO_STREAM_RAMP_ENABLED !== false) {
        const startRate = Math.max(1, this.config.AUTO_STREAM_START_RATE || 2);
        const maxRate = Math.max(startRate, this.config.AUTO_STREAM_MAX_RATE || 10);
        const step = Math.max(0.1, this.config.AUTO_STREAM_RAMP_STEP || 1);
        const interval = Math.max(0.5, this.config.AUTO_STREAM_RAMP_INTERVAL || 4);

        const numSteps = Math.floor(currentTimeSec / interval);
        currentRate = Math.min(maxRate, startRate + numSteps * step);
      } else {
        currentRate = Math.max(1, this.config.AUTO_STREAM_RATE || 5);
      }

      const dropInterval = 1.0 / currentRate;
      this.autoStreamTimer += dt;
      while (this.autoStreamTimer >= dropInterval) {
        this.autoStreamTimer -= dropInterval;
        const dropEvt = this.dropBall(0);
        if (dropEvt) frameEvents.push(dropEvt);
      }
    }

    // 2. Gestion du combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    // 3. Intégration physique par sous-étapes (6 sous-étapes = 360 Hz)
    const subSteps = 6;
    const subDt = dt / subSteps;
    const gravityAccel = this.config.GRAVITY * 2600;
    const restitution = this.config.RESTITUTION;
    const friction = Math.pow(this.config.FRICTION, subDt * 60);
    const useCurved = this.config.CONTAINER_SHAPE === 'jar' || this.config.CONTAINER_SHAPE === 'custom';

    for (let step = 0; step < subSteps; step++) {
      // Intégration positions & collision parois
      for (let i = 0; i < this.balls.length; i++) {
        const b = this.balls[i];
        if (b.mergeCooldown > 0) b.mergeCooldown -= subDt;

        b.vy += gravityAccel * subDt;
        b.vx *= friction;
        b.vy *= friction;
        b.x += b.vx * subDt;
        b.y += b.vy * subDt;

        if (this.config.CONTAINER_SHAPE === 'circle') {
          const { cX, cY, R, neckHalfW, neckConnectY, circleBottom } = this.getCircleGeometry();
          if (b.y <= neckConnectY) {
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
            const dx = b.x - cX;
            const dy = b.y - cY;
            const dist = Math.hypot(dx, dy);
            const maxDist = R - b.radius;
            const inNeck = b.y < neckConnectY + 30 && Math.abs(dx) < neckHalfW - 4;

            if (!inNeck && dist > maxDist && dist > 0.001) {
              const nx = dx / dist;
              const ny = dy / dist;
              b.x = cX + nx * maxDist;
              b.y = cY + ny * maxDist;
              const vNormal = b.vx * nx + b.vy * ny;
              if (vNormal > 0) {
                b.vx -= (1 + restitution) * vNormal * nx;
                b.vy -= (1 + restitution) * vNormal * ny;
              }
              b.vx *= 0.98;
              b.vy *= 0.98;
              b.hasLanded = true;
            }

            if (b.y - b.radius < neckConnectY && Math.abs(dx) >= neckHalfW - 4) {
              b.y = neckConnectY + b.radius;
              if (b.vy < 0) b.vy = -b.vy * restitution;
            }
          }

          if (b.y + b.radius > circleBottom) {
            const spd = Math.abs(b.vy);
            if (spd > 70) {
              frameEvents.push({ type: 'bounce', tick: this.currentTick, timeSeconds: currentTimeSec, ballId: b.id, speed: spd });
            }
            b.y = circleBottom - b.radius;
            b.vy = -Math.abs(b.vy) * restitution * 0.5;
            b.hasLanded = true;
          }
        } else if (useCurved) {
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

              b.y = Math.min(b.y, floorY - b.radius);
              b.x += nx * Math.min(penetration, 8);

              const vNormal = b.vx * nx + b.vy * ny;
              if (vNormal < 0) {
                b.vx -= (1 + restitution) * vNormal * nx;
                b.vy -= (1 + restitution) * vNormal * ny;
              }
              b.vx += -slope * gravityAccel * subDt * 0.75;
              b.vx *= 0.94;
              b.hasLanded = true;
            }
          } else {
            if (b.y + b.radius > this.chamberBottom) {
              const spd = Math.abs(b.vy);
              if (spd > 70) {
                frameEvents.push({ type: 'bounce', tick: this.currentTick, timeSeconds: currentTimeSec, ballId: b.id, speed: spd });
              }
              b.y = this.chamberBottom - b.radius;
              b.vy = -b.vy * restitution;
              b.vx *= 0.94;
              b.hasLanded = true;
            }
          }
        } else {
          // Tube & cuve rectangulaire (entonnoir + col vertical + cuve large)
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

            // Épaulement supérieur de la cuve sous le tube
            if (b.y - b.radius < this.tubeBottom) {
              if (b.x < this.tubeLeft || b.x > this.tubeRight) {
                b.y = this.tubeBottom + b.radius;
                b.vy = Math.abs(b.vy) * restitution;
              }
            }

            if (b.y + b.radius > this.chamberBottom) {
              const spd = Math.abs(b.vy);
              if (spd > 70) {
                frameEvents.push({ type: 'bounce', tick: this.currentTick, timeSeconds: currentTimeSec, ballId: b.id, speed: spd });
              }
              b.y = this.chamberBottom - b.radius;
              b.vy = -b.vy * restitution;
              b.vx *= 0.94;
              b.hasLanded = true;
            }
          }
        }
      }

      // Collisions & fusions entre billes
      const toRemove = new Set<number>();
      const toAdd: SimBall[] = [];
      const sorted = this.balls.slice().sort((a, b) => a.y - b.y);

      for (let i = 0; i < sorted.length; i++) {
        const b1 = sorted[i];
        if (toRemove.has(b1.id)) continue;
        const cutoffY = b1.y + b1.radius + 94;

        for (let j = i + 1; j < sorted.length; j++) {
          const b2 = sorted[j];
          if (b2.y > cutoffY) break;
          if (toRemove.has(b2.id)) continue;

          const minDist = b1.radius + b2.radius;
          const dx = b2.x - b1.x;
          if (Math.abs(dx) >= minDist) continue;

          const dy = b2.y - b1.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < minDist * minDist && distSq > 0) {
            // Fusion de deux billes de même palier
            if (
              b1.tier === b2.tier &&
              b1.tier < this.tiers.length - 1 &&
              b1.mergeCooldown <= 0 &&
              b2.mergeCooldown <= 0
            ) {
              toRemove.add(b1.id);
              toRemove.add(b2.id);

              const nextTier = b1.tier + 1;
              const midX = (b1.x + b2.x) / 2;
              const midY = (b1.y + b2.y) / 2;
              const nextTierData = this.tiers[nextTier];

              const mergedBall: SimBall = {
                id: this.nextBallId++,
                tier: nextTier,
                x: midX,
                y: midY,
                vx: (b1.vx + b2.vx) * 0.35,
                vy: (b1.vy + b2.vy) * 0.35 - 50,
                radius: nextTierData.radius,
                mass: Math.PI * nextTierData.radius * nextTierData.radius * 0.001,
                hasLanded: true,
                mergeCooldown: 0.15
              };
              toAdd.push(mergedBall);

              this.comboCount++;
              this.comboTimer = 0.55;
              this.mergesCount++;
              if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;
              if (this.comboCount > 1) this.totalCombos++;

              const pts = nextTierData.points || 100;
              this.score += pts;
              if (nextTier > this.maxTierReached) {
                this.maxTierReached = nextTier;
              }

              const isUltimate = nextTier === this.tiers.length - 1;
              const mergeEvt: MergeEvent = {
                type: 'merge',
                tick: this.currentTick,
                timeSeconds: currentTimeSec,
                newBallId: mergedBall.id,
                nextTier,
                originalTierIndex: nextTierData.originalTierIndex ?? nextTier,
                x: midX,
                y: midY,
                b1Id: b1.id,
                b2Id: b2.id,
                points: pts,
                comboCount: this.comboCount,
                isClimax: isUltimate
              };
              frameEvents.push(mergeEvt);

              if (isUltimate) {
                this.state = 'VICTORY';
                this.victoryTicksRemaining = MergeDropSimulation.VICTORY_CLIMAX_TICKS;
                const climaxEvt: ClimaxEvent = {
                  type: 'climax',
                  tick: this.currentTick,
                  timeSeconds: currentTimeSec,
                  tier: nextTier,
                  sunBallId: mergedBall.id
                };
                const vicEvt: VictoryEvent = {
                  type: 'victory',
                  tick: this.currentTick,
                  timeSeconds: currentTimeSec,
                  finalScore: this.score,
                  maxTier: nextTier
                };
                frameEvents.push(climaxEvt, vicEvt);
              }
              break;
            }

            if (b1.hasLanded || b2.hasLanded) {
              b1.hasLanded = true;
              b2.hasLanded = true;
            }

            // Réponse de collision élastique
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
                const bdx = ball.x - cX;
                const bdy = ball.y - cY;
                if (ball.y > neckConnectY) {
                  const inNeckCorridor = ball.y < neckConnectY + 30 && Math.abs(bdx) < neckHalfW - 4;
                  if (!inNeckCorridor) {
                    const d = Math.hypot(bdx, bdy);
                    const maxD = R - ball.radius;
                    if (d > maxD && d > 0.001) {
                      ball.x = cX + (bdx / d) * maxD;
                      ball.y = cY + (bdy / d) * maxD;
                    }
                  }
                } else {
                  const hw = this.getCircleHalfWidth(ball.y);
                  ball.x = Math.max(cX - hw + ball.radius, Math.min(cX + hw - ball.radius, ball.x));
                }
              }
            } else if (useCurved) {
              const hw1 = this.getContainerHalfWidth(b1.y);
              b1.x = Math.max(270 - hw1 + b1.radius, Math.min(270 + hw1 - b1.radius, b1.x));
              const hw2 = this.getContainerHalfWidth(b2.y);
              b2.x = Math.max(270 - hw2 + b2.radius, Math.min(270 + hw2 - b2.radius, b2.x));
            } else {
              for (const ball of [b1, b2]) {
                if (ball.y <= this.tubeBottom) {
                  ball.x = Math.max(this.tubeLeft + ball.radius, Math.min(this.tubeRight - ball.radius, ball.x));
                } else {
                  ball.x = Math.max(this.chamberLeft + ball.radius, Math.min(this.chamberRight - ball.radius, ball.x));
                }
              }
            }

            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const p = 2 * (nx * kx + ny * ky) / totalMass;

            b1.vx -= p * m2 * nx * restitution;
            b1.vy -= p * m2 * ny * restitution;
            b2.vx += p * m1 * nx * restitution;
            b2.vy += p * m1 * ny * restitution;
          }
        }
      }

      if (toRemove.size > 0) {
        this.balls = this.balls.filter((b) => !toRemove.has(b.id));
        this.balls.push(...toAdd);
      }
    }

    // 4. Surveillance de la ligne de danger
    let highestLandedY = 9999;
    const dY = this.dangerY;
    for (let i = 0; i < this.balls.length; i++) {
      const b = this.balls[i];
      if (b.hasLanded && b.y - b.radius < highestLandedY) {
        highestLandedY = b.y - b.radius;
      }
    }

    if (highestLandedY < dY) {
      this.dangerTimer += dt;
      this.dangerLineSeconds += dt;
      frameEvents.push({
        type: 'danger',
        tick: this.currentTick,
        timeSeconds: currentTimeSec,
        highestY: highestLandedY,
        dangerY: dY
      });

      // Échec si débordement continu pendant plus de 3 secondes
      if (this.dangerTimer >= 3.0) {
        this.state = 'GAME_OVER';
        const goEvt: GameOverEvent = {
          type: 'game_over',
          tick: this.currentTick,
          timeSeconds: currentTimeSec,
          finalScore: this.score,
          maxTier: this.maxTierReached,
          reason: 'danger_overflow'
        };
        frameEvents.push(goEvt);
      }
    } else {
      this.dangerTimer = Math.max(0, this.dangerTimer - dt * 2);
    }

    this.currentTick++;
    this.events.push(...frameEvents);
    return frameEvents;
  }

  /**
   * Avance la simulation de N ticks
   */
  public step(ticksCount: number = 1): SimulationEvent[] {
    const allEvents: SimulationEvent[] = [];
    for (let i = 0; i < ticksCount; i++) {
      if (this.state !== 'RUNNING' && !(this.state === 'VICTORY' && this.victoryTicksRemaining > 0)) break;
      const evts = this.tick();
      allEvents.push(...evts);
    }
    return allEvents;
  }

  /**
   * Simule une partie complète en mode Headless (maths pures ultra-rapides)
   */
  public simulateFull(maxDurationSeconds: number = 60): SimulationTelemetry {
    const maxTicks = maxDurationSeconds * 60;
    while (this.currentTick < maxTicks && this.state === 'RUNNING') {
      this.tick();
    }

    // Si victoire cosmique, on prolonge la simulation pour capturer toute la cinématique (5.5s)
    if (this.state === 'VICTORY') {
      while (this.victoryTicksRemaining > 0) {
        this.tick();
      }
    }

    const durationSeconds = this.currentTick / 60;
    const isVictory = this.state === 'VICTORY' || this.maxTierReached === this.tiers.length - 1;

    // Calcul du score viral TikTok (0 - 100) :
    // - 40 pts pour l'évolution maximale atteinte (ex: Gigachad / Soleil)
    // - 25 pts pour les combos et cascades de fusions spectaculaires
    // - 20 pts pour la tension drama (secondes passées à frôler la ligne de danger)
    // - 15 pts pour le rythme et la densité de merges
    const tierScore = (this.maxTierReached / Math.max(1, this.tiers.length - 1)) * 40;
    const comboScore = Math.min(25, this.maxCombo * 4 + this.totalCombos * 1.5);
    const dangerScore = Math.min(20, this.dangerLineSeconds * 4.5);
    const rhythmScore = Math.min(15, (this.mergesCount / Math.max(10, durationSeconds)) * 25);

    const viralScore = Math.min(100, Math.round(tierScore + comboScore + dangerScore + rhythmScore));

    return {
      seed: this.seed,
      totalTicks: this.currentTick,
      durationSeconds,
      finalScore: this.score,
      maxTierReached: this.maxTierReached,
      ballsDropped: this.ballsDroppedCount,
      mergesCount: this.mergesCount,
      maxCombo: this.maxCombo,
      totalCombos: this.totalCombos,
      dangerLineSeconds: this.dangerLineSeconds,
      viralScore,
      isVictory,
      events: this.events,
      dropActions: this.dropActions
    };
  }
}
