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
  private nextBallId: number = 1;

  private score: number = 0;
  private maxTierReached: number = 0;
  private nextTier: number = 0;
  private currentHUD: GameHUDState = {};

  // État du jeu & Gestion du Débordement (Game Over)
  private state: 'RUNNING' | 'GAME_OVER' = 'RUNNING';
  public readonly dangerY = 380;
  private overflowTimer: number = 0;
  private isDangerWarning: boolean = false;
  private dangerSoundCooldown: number = 0;

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
    this.score = 0;
    this.maxTierReached = 0;
    this.nextTier = this.getRandomSpawnTier();
    this.canManualDrop = true;
    this.manualDropCooldown = 0;
    this.autoStreamTimer = 0;
    this.autoStreamBallsDropped = 0;
    this.screenShake = 0;
    this.state = 'RUNNING';
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
    if (this.state === 'GAME_OVER') {
      this.reset();
      return;
    }
    this.toggleAutoStream();
  };

  public toggleAutoStream(): boolean {
    if (this.state === 'GAME_OVER') return false;
    this.isAutoStreaming = !this.isAutoStreaming;
    this.config.AUTO_STREAM_ACTIVE = this.isAutoStreaming;
    this.autoStreamTimer = 0;
    this.syncHUD();
    return this.isAutoStreaming;
  }

  private triggerGameOver() {
    if (this.state === 'GAME_OVER') return;
    this.state = 'GAME_OVER';
    this.isAutoStreaming = false;
    this.config.AUTO_STREAM_ACTIVE = false;
    this.triggerScreenShake(8.0);
    sound.playGameOver();
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
    } else if (this.maxTierReached === 9) {
      statusText = this.config.TEXT_STATUS_VICTORY || (isSolar ? (isEn ? '☀️ SUN CREATED! COSMIC VICTORY ☀️' : '☀️ SOLEIL CRÉÉ ! VICTOIRE COSMIQUE ☀️') : (isEn ? '⭐ ULTIMATE MERGE REACHED! ⭐' : '⭐ FUSION ULTIME ATTEINTE ! ⭐'));
    }

    const streamStopLabel = this.config.TEXT_ACTION_STREAM_STOP || (isSolar ? (isEn ? 'STOP ASTEROID STREAM' : 'ARRÊTER RAFALE ASTÉROÏDES') : (isEn ? 'STOP STREAM TIER 1' : 'ARRÊTER RAFALE NIVEAU 1'));
    const streamStartLabel = this.config.TEXT_ACTION_STREAM_START || (isSolar ? (isEn ? 'LAUNCH ASTEROID STREAM' : 'LANCER RAFALE ASTÉROÏDES') : (isEn ? 'LAUNCH STREAM TIER 1' : 'LANCER RAFALE NIVEAU 1'));

    const tierLocalizedName = getTierLocalizedName(currentMaxTierObj, isEn);

    this.currentHUD = {
      title,
      primaryMetricLabel: this.config.TEXT_METRIC_SCORE || (isEn ? 'SCORE' : 'SCORE'),
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
    if (this.state === 'GAME_OVER') {
      this.reset();
      return;
    }
    this.triggerManualDrop();
  };

  public handlePointerMove = (e: MouseEvent | TouchEvent, clientX: number, clientY: number) => {};
  public handlePointerUp = () => {};

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
    this.screenShake = Math.max(this.screenShake, Math.min(6.0, intensity));
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

  private updatePhysics(dt: number) {
    this.tubeFlowOffset = (this.tubeFlowOffset + dt * 180) % 30;

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

    const subSteps = 8;
    const subDt = dt / subSteps;
    const gravityAccel = this.config.GRAVITY * 2600;
    const restitution = this.config.RESTITUTION;
    const friction = Math.pow(this.config.FRICTION, subDt * 60);

    const isJar = this.config.CONTAINER_SHAPE === 'jar';

    for (let step = 0; step < subSteps; step++) {
      // 1. Déplacement & Collision Parois
      for (let i = 0; i < this.balls.length; i++) {
        const b = this.balls[i];

        b.vy += gravityAccel * subDt;
        b.vx *= friction;
        b.vy *= friction;
        b.x += b.vx * subDt;
        b.y += b.vy * subDt;

        if (isJar) {
          // --- COLLISIONS DANS LA JARRE ---
          const halfW = this.getJarHalfWidth(b.y);
          const minX = 270 - halfW + b.radius;
          const maxX = 270 + halfW - b.radius;

          if (b.x < minX) {
            b.x = minX;
            b.vx = Math.abs(b.vx) * restitution + 10;
          } else if (b.x > maxX) {
            b.x = maxX;
            b.vx = -Math.abs(b.vx) * restitution - 10;
          }

          if (b.y + b.radius > this.chamberBottom) {
            b.y = this.chamberBottom - b.radius;
            b.vy = -b.vy * restitution;
            b.vx *= 0.94;
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
            }
          }
        }
      }

      // 2. Collision & Fusion Cercle-Cercle
      const toRemove = new Set<number>();
      const toAdd: MergeBall[] = [];
      const currentTiers = this.getCurrentTiers();

      for (let i = 0; i < this.balls.length; i++) {
        for (let j = i + 1; j < this.balls.length; j++) {
          const b1 = this.balls[i];
          const b2 = this.balls[j];

          if (toRemove.has(b1.id) || toRemove.has(b2.id)) continue;

          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.hypot(dx, dy);
          const minDist = b1.radius + b2.radius;

          if (dist < minDist && dist > 0) {
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

              this.triggerScreenShake(2 + nextTier * 0.4);
              for (let s = 0; s < 10 + nextTier * 2; s++) {
                this.sparks.push(new MergeSpark(midX, midY, currentTiers[nextTier].color));
              }

              this.syncHUD();
              continue;
            }

            // Collision élastique
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

    for (let i = 0; i < this.balls.length; i++) {
      this.balls[i].update(dt);
    }

    // 3. Détection du Débordement (Game Over au-dessus de dangerY)
    let hasOverflowingBall = false;
    for (let i = 0; i < this.balls.length; i++) {
      const b = this.balls[i];
      // La bille doit être stabilisée (age > 1.2s et vy < 85) et son sommet dépasser la ligne rouge
      if (b.age > 1.2 && (b.y - b.radius) < this.dangerY && b.vy < 85) {
        hasOverflowingBall = true;
        break;
      }
    }

    if (this.state === 'RUNNING') {
      if (hasOverflowingBall) {
        this.isDangerWarning = true;
        this.overflowTimer += dt;
        this.dangerSoundCooldown -= dt;
        if (this.dangerSoundCooldown <= 0) {
          sound.playDanger();
          this.dangerSoundCooldown = 0.45;
        }

        if (this.overflowTimer >= 2.0) {
          this.triggerGameOver();
        }
      } else {
        this.isDangerWarning = false;
        this.overflowTimer = Math.max(0, this.overflowTimer - dt * 2);
        this.dangerSoundCooldown = 0;
      }
    }

    for (let i = this.sparks.length - 1; i >= 0; i--) {
      this.sparks[i].update(dt);
      if (this.sparks[i].life <= 0) {
        this.sparks.splice(i, 1);
      }
    }

    if (this.screenShake > 0) {
      this.shakeX = (Math.random() - 0.5) * this.screenShake;
      this.shakeY = (Math.random() - 0.5) * this.screenShake;
      const decay = 16.0;
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

    if (this.config.CONTAINER_SHAPE === 'jar') {
      this.drawJarContainer();
    } else {
      this.drawTubeChamber();
    }

    if (this.state === 'RUNNING') {
      this.drawSpawnerPreview();
    }

    for (let i = 0; i < this.balls.length; i++) {
      this.balls[i].draw(this.ctx);
    }

    for (let i = 0; i < this.sparks.length; i++) {
      this.sparks[i].draw(this.ctx);
    }

    // Dessin de l'écran Game Over si débordement confirmé
    if (this.state === 'GAME_OVER') {
      this.drawGameOverOverlay();
    }

    // Dessin du HUD textuel en haut du Canvas (inclus dans la vidéo 9:16)
    drawCanvasHUD(this.ctx, this.currentHUD, VIRTUAL_WIDTH);

    this.ctx.restore();
  }

  /**
   * Rendu de la Jarre galbée en verre néon
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
    ctx.fillStyle = 'rgba(20, 26, 42, 0.5)';
    ctx.fill();

    // 2. Ligne limite de danger courbée
    const dangerY = this.dangerY;
    const pulse = (Math.sin(performance.now() * 0.015) + 1) * 0.5;

    ctx.save();
    ctx.beginPath();
    ctx.setLineDash(this.isDangerWarning ? [12, 6] : [8, 8]);
    ctx.moveTo(270 - this.getJarHalfWidth(dangerY), dangerY);
    ctx.lineTo(270 + this.getJarHalfWidth(dangerY), dangerY);
    ctx.strokeStyle = this.isDangerWarning
      ? `rgba(255, 0, 85, ${0.85 + pulse * 0.15})`
      : 'rgba(255, 0, 85, 0.4)';
    ctx.lineWidth = this.isDangerWarning ? 4 : 2;
    if (this.isDangerWarning) {
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 18;
    }
    ctx.stroke();
    ctx.restore();

    // Badge d'alerte en cas de danger
    if (this.isDangerWarning && this.state === 'RUNNING') {
      ctx.save();
      const timeLeft = Math.max(0, 2.0 - this.overflowTimer).toFixed(1);
      ctx.fillStyle = '#ff0055';
      ctx.font = 'bold 13px "JetBrains Mono", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 10;
      ctx.fillText(`⚠️ DANGER: ${timeLeft}s ⚠️`, 270, dangerY - 12);
      ctx.restore();
    }

    // 3. Parois néon galbées de la jarre
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

    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = 'rgba(0, 240, 255, 0.7)';
    ctx.shadowBlur = 18;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Cœur blanc pur
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Anses décoratives de la Jarre (gauche et droite)
    [ -1, 1 ].forEach((side) => {
      ctx.beginPath();
      const xAnchor = 270 + side * this.getJarHalfWidth(410);
      ctx.arc(xAnchor + side * 14, 440, 24, Math.PI * 0.5, Math.PI * 1.5, side === -1);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
      ctx.lineWidth = 4;
      ctx.stroke();
    });

    ctx.restore();
  }

  /**
   * Rendu du Tube et de la Cuve rectangulaire
   */
  private drawTubeChamber() {
    const ctx = this.ctx;
    const left = this.chamberLeft;
    const right = this.chamberRight;
    const top = this.chamberTop;
    const bottom = this.chamberBottom;

    ctx.save();

    // Fond cuve
    ctx.fillStyle = 'rgba(17, 22, 34, 0.45)';
    ctx.fillRect(left, top, this.chamberWidth, bottom - top);

    // Ligne limite haute
    const dangerY = this.dangerY;
    const pulse = (Math.sin(performance.now() * 0.015) + 1) * 0.5;

    ctx.save();
    ctx.beginPath();
    ctx.setLineDash(this.isDangerWarning ? [12, 6] : [8, 8]);
    ctx.moveTo(left, dangerY);
    ctx.lineTo(right, dangerY);
    ctx.strokeStyle = this.isDangerWarning
      ? `rgba(255, 0, 85, ${0.85 + pulse * 0.15})`
      : 'rgba(255, 0, 85, 0.35)';
    ctx.lineWidth = this.isDangerWarning ? 4 : 2;
    if (this.isDangerWarning) {
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 18;
    }
    ctx.stroke();
    ctx.restore();

    // Badge d'alerte en cas de danger
    if (this.isDangerWarning && this.state === 'RUNNING') {
      ctx.save();
      const timeLeft = Math.max(0, 2.0 - this.overflowTimer).toFixed(1);
      ctx.fillStyle = '#ff0055';
      ctx.font = 'bold 13px "JetBrains Mono", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 10;
      ctx.fillText(`⚠️ DANGER: ${timeLeft}s ⚠️`, 270, dangerY - 12);
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

    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
    ctx.shadowBlur = 16;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fût du tube
    ctx.beginPath();
    ctx.moveTo(this.funnelLeft, this.funnelTop);
    ctx.lineTo(this.tubeLeft, this.tubeTop);
    ctx.lineTo(this.tubeLeft, this.tubeBottom);
    ctx.moveTo(this.funnelRight, this.funnelTop);
    ctx.lineTo(this.tubeRight, this.tubeTop);
    ctx.lineTo(this.tubeRight, this.tubeBottom);
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = 'rgba(0, 240, 255, 0.8)';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 5;
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
