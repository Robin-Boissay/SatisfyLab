import { GameInstance, GameHUDState } from '../../core/types';
import { sound } from '../../core/SoundEngine';
import { drawCanvasHUD } from '../../core/canvasHUD';
import {
  BallEscapeConfig,
  DEFAULT_BALL_ESCAPE_CONFIG
} from './types';
import {
  VIRTUAL_WIDTH,
  VIRTUAL_HEIGHT,
  CENTER_X,
  CENTER_Y,
  Particle,
  Shockwave,
  WallSegment,
  Ball,
  SecondaryBall
} from './entities';

export class BallEscapeGame implements GameInstance {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onHUDUpdate: (hud: GameHUDState) => void;
  private config: BallEscapeConfig;

  private isRunning: boolean = false;
  private isDestroyed: boolean = false;
  private animFrameId: number | null = null;
  private lastTime: number = performance.now();

  private state: 'WAITING' | 'RUNNING' | 'ESCAPED' | 'FROZEN' = 'WAITING';
  private bounces: number = 0;
  private arenaAngle: number = 0;
  private screenShake: number = 0;
  private shakeX: number = 0;
  private shakeY: number = 0;
  private timeLeft: number;
  private freezeTimer: number = 0;
  private hasEscaped: boolean = false;
  private maxSpeedReached: number;

  private segments: WallSegment[] = [];
  private particles: Particle[] = [];
  private shockwaves: Shockwave[] = [];
  private ball: Ball;
  private secondaryBalls: SecondaryBall[] = [];
  private currentHUD: GameHUDState = {};

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

    this.timeLeft = this.config.CHALLENGE_TIME_LIMIT;
    this.maxSpeedReached = this.config.INITIAL_SPEED;
    this.ball = new Ball(CENTER_X, CENTER_Y, this.config.BALL_RADIUS);

    this.initSegments();
    this.initSecondaryBalls();
    this.resize();

    window.addEventListener('resize', this.handleResize);

    this.syncHUD();
    this.loop(performance.now());
  }

  private handleResize = () => {
    this.resize();
  };

  private initSegments() {
    this.segments = [];
    const step = (Math.PI * 2) / this.config.TOTAL_WALL_SEGMENTS;
    for (let i = 0; i < this.config.TOTAL_WALL_SEGMENTS; i++) {
      const start = i * step;
      const end = (i + 1) * step;
      this.segments.push(new WallSegment(i, start, end, this.config.SEGMENT_HP));
    }
  }

  private initSecondaryBalls() {
    this.secondaryBalls = [];
    const count = this.config.INITIAL_SECONDARY_BALLS_COUNT || 0;
    for (let i = 0; i < count; i++) {
      this.secondaryBalls.push(SecondaryBall.createRandom(this.config, CENTER_X, CENTER_Y));
    }
  }

  public updateConfig(newConfig: Partial<BallEscapeConfig>) {
    const prevSegmentsCount = this.config.TOTAL_WALL_SEGMENTS;
    const prevHp = this.config.SEGMENT_HP;

    this.config = { ...this.config, ...newConfig };

    // Si le nombre de briques ou la vie par défaut change et qu'on est en pause ou restart
    if (
      this.state === 'WAITING' &&
      (newConfig.TOTAL_WALL_SEGMENTS !== undefined || newConfig.SEGMENT_HP !== undefined)
    ) {
      this.initSegments();
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
    this.state = 'RUNNING';
    this.bounces = 0;
    this.arenaAngle = 0;
    this.screenShake = 0;
    this.timeLeft = this.config.CHALLENGE_TIME_LIMIT;
    this.freezeTimer = 0;
    this.hasEscaped = false;
    this.particles = [];
    this.shockwaves = [];
    this.maxSpeedReached = this.config.INITIAL_SPEED;

    this.initSegments();
    this.initSecondaryBalls();
    this.ball.reset(CENTER_X, CENTER_Y, this.config);

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
      statusText = this.config.TEXT_STATUS_ESCAPE || 'Évasion réussie !';
    } else if (this.state === 'FROZEN') {
      statusText = this.hasEscaped
        ? (this.config.TEXT_STATUS_WIN || 'VICTOIRE !')
        : (this.config.TEXT_STATUS_LOSS || 'TEMPS ÉCOULÉ !');
    }

    this.currentHUD = {
      title: this.config.TEXT_TITLE || this.config.CHALLENGE_TITLE,
      primaryMetricLabel: this.config.TEXT_METRIC_TIME || 'TEMPS RESTANT',
      primaryMetricValue: `${sec}s`,
      secondaryMetricLabel: this.config.TEXT_METRIC_BOUNCES || 'REBONDS',
      secondaryMetricValue: this.bounces,
      isDanger: sec <= 5 && this.state === 'RUNNING',
      isFinished: this.state === 'FROZEN',
      isWaitingToStart: this.state === 'WAITING',
      overlayPromptText: this.config.TEXT_STATUS_START || 'Clique pour démarrer',
      statusText
    };
    this.onHUDUpdate(this.currentHUD);
  }

  private handleBounce(
    segment: WallSegment,
    contactX: number,
    contactY: number,
    normalX: number,
    normalY: number
  ) {
    this.bounces++;

    const currentSpeed = Math.hypot(this.ball.vx, this.ball.vy);
    const newSpeed = Math.min(this.config.MAX_SPEED, currentSpeed * this.config.BOUNCE_SPEED_MULTIPLIER);
    const norm = currentSpeed > 0 ? newSpeed / currentSpeed : 1;
    this.ball.vx *= norm;
    this.ball.vy *= norm;
    this.ball.speed = newSpeed;

    if (newSpeed > this.maxSpeedReached) {
      this.maxSpeedReached = newSpeed;
    }

    this.ball.flash = 1.0;
    this.ball.updateColor(this.config);

    const destroyed = segment.hit();

    const speedRatio =
      (this.ball.speed - this.config.INITIAL_SPEED) /
      Math.max(1, this.config.MAX_SPEED - this.config.INITIAL_SPEED);
    sound.playBounce(this.bounces, speedRatio);

    if (destroyed) {
      sound.playWallDestroy();
      this.spawnDebris(contactX, contactY);
      this.triggerScreenShake(6);
    } else {
      this.triggerScreenShake(2 + speedRatio * 3);
    }

    this.spawnWallSparks(contactX, contactY, normalX, normalY);
    this.shockwaves.push(new Shockwave(contactX, contactY, this.ball.color, 45, 5));

    if (this.config.SPAWN_SECONDARY_BALL_ON_BRICK_HIT) {
      const maxBalls = this.config.MAX_SECONDARY_BALLS || 12;
      if (this.secondaryBalls.length < maxBalls) {
        const newBall = SecondaryBall.createRandom(this.config, CENTER_X, CENTER_Y);
        this.secondaryBalls.push(newBall);

        this.shockwaves.push(new Shockwave(CENTER_X, CENTER_Y, newBall.color, 32, 5));
        for (let b = 0; b < 6; b++) {
          const sAng = Math.random() * Math.PI * 2;
          const sSpd = 2 + Math.random() * 4;
          this.particles.push(
            new Particle(
              CENTER_X,
              CENTER_Y,
              Math.cos(sAng) * sSpd,
              Math.sin(sAng) * sSpd,
              newBall.color,
              2,
              0.35,
              2.5
            )
          );
        }
      }
    }

    this.syncHUD();
  }

  private handleEscape() {
    if (this.hasEscaped) return;

    this.hasEscaped = true;
    this.state = 'ESCAPED';
    this.freezeTimer = this.config.FREEZE_DELAY_AFTER_ESCAPE;

    sound.playEscape();
    this.triggerScreenShake(8);
    this.spawnEscapeFireworks(this.ball.x, this.ball.y);
    this.syncHUD();
  }

  private handleTimeUp() {
    if (this.state === 'FROZEN') return;
    this.state = 'FROZEN';
    this.triggerScreenShake(4);
    this.syncHUD();
  }

  private spawnWallSparks(x: number, y: number, nx: number, ny: number) {
    const count = 10 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const angle = Math.atan2(-ny, -nx) + (Math.random() - 0.5) * 1.5;
      const spd = 2 + Math.random() * 6;
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;
      const size = 1.5 + Math.random() * 2.5;
      const life = 0.35 + Math.random() * 0.25;
      this.particles.push(new Particle(x, y, vx, vy, this.ball.color, size, life, 1.8));
    }
  }

  private spawnDebris(x: number, y: number) {
    const debrisColors = ['#ff0044', '#ff7700', '#ffe600', '#ffffff'];
    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 3 + Math.random() * 8;
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;
      const size = 3 + Math.random() * 4;
      const life = 0.7 + Math.random() * 0.4;
      const color = debrisColors[Math.floor(Math.random() * debrisColors.length)];
      this.particles.push(new Particle(x, y, vx, vy, color, size, life, 1.2, true));
    }
  }

  private spawnEscapeFireworks(x: number, y: number) {
    const colors = ['#00f0ff', '#ffe600', '#ff0055', '#a6ff00', '#ffffff', '#ff9900'];
    const count = this.config.CONFETTI_COUNT || 120;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 5 + Math.random() * 12;
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 3 + Math.random() * 4;
      const life = 1.5 + Math.random() * 0.8;
      this.particles.push(new Particle(x, y, vx, vy, color, size, life, 0.7, true));
    }
  }

  private triggerScreenShake(intensity: number) {
    if (!this.config.SCREEN_SHAKE_ENABLED) return;
    const mult = this.config.SCREEN_SHAKE_INTENSITY ?? 0.25;
    const maxShake = this.config.SCREEN_SHAKE_MAX ?? 3.0;
    const effective = Math.min(maxShake, intensity * mult);
    this.screenShake = Math.max(this.screenShake, effective);
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

    const rotSpeed = this.config.ARENA_ROTATION_SPEED || 0;
    const subSteps = this.config.SUB_STEPS;
    const subDt = dt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      this.arenaAngle = (this.arenaAngle + rotSpeed * subDt) % (Math.PI * 2);
      if (this.arenaAngle < 0) this.arenaAngle += Math.PI * 2;

      for (let i = this.secondaryBalls.length - 1; i >= 0; i--) {
        const sec = this.secondaryBalls[i];
        sec.updatePhysics(subDt, this.config, this.segments, this.arenaAngle);
        if (sec.isDead) {
          this.secondaryBalls.splice(i, 1);
        }
      }

      this.ball.vy += this.config.GRAVITY * subDt;
      this.ball.x += this.ball.vx * subDt;
      this.ball.y += this.ball.vy * subDt;

      if (!this.ball.isEscaping) {
        for (let i = 0; i < this.secondaryBalls.length; i++) {
          const sec = this.secondaryBalls[i];
          const cdx = this.ball.x - sec.x;
          const cdy = this.ball.y - sec.y;
          const cdist = Math.hypot(cdx, cdy);
          const minDist = this.ball.radius + sec.radius;

          if (cdist < minDist && cdist > 0) {
            const cnx = cdx / cdist;
            const cny = cdy / cdist;

            const rvx = this.ball.vx - sec.vx;
            const rvy = this.ball.vy - sec.vy;
            const velAlongNormal = rvx * cnx + rvy * cny;

            if (velAlongNormal < 0) {
              const overlap = minDist - cdist;
              this.ball.x += cnx * (overlap * 0.55);
              this.ball.y += cny * (overlap * 0.55);
              sec.x -= cnx * (overlap * 0.55);
              sec.y -= cny * (overlap * 0.55);

              if (!sec.isEscaping) {
                const secDist = Math.hypot(sec.x - CENTER_X, sec.y - CENTER_Y);
                const secLimit = this.config.CIRCLE_RADIUS - sec.radius;
                if (secDist > secLimit) {
                  sec.x = CENTER_X + ((sec.x - CENTER_X) / secDist) * secLimit;
                  sec.y = CENTER_Y + ((sec.y - CENTER_Y) / secDist) * secLimit;
                }
              }

              const speedBefore = Math.max(this.ball.speed, Math.hypot(this.ball.vx, this.ball.vy));

              const dotBall = this.ball.vx * cnx + this.ball.vy * cny;
              if (dotBall < 0) {
                this.ball.vx -= 2 * dotBall * cnx;
                this.ball.vy -= 2 * dotBall * cny;
              }

              this.ball.vx += -cny * (Math.random() - 0.5) * 0.1;
              this.ball.vy += cnx * (Math.random() - 0.5) * 0.1;

              const mult = this.config.SECONDARY_BALL_COUNTS_AS_BOUNCE
                ? this.config.SECONDARY_BALL_BOUNCE_MULTIPLIER || 1.03
                : 1.0;
              const targetSpeed = Math.min(
                this.config.MAX_SPEED,
                Math.max(speedBefore, speedBefore * mult)
              );

              const postLen = Math.hypot(this.ball.vx, this.ball.vy);
              if (postLen > 0) {
                this.ball.vx = (this.ball.vx / postLen) * targetSpeed;
                this.ball.vy = (this.ball.vy / postLen) * targetSpeed;
              } else {
                this.ball.vx = cnx * targetSpeed;
                this.ball.vy = cny * targetSpeed;
              }
              this.ball.speed = targetSpeed;
              if (targetSpeed > this.maxSpeedReached) {
                this.maxSpeedReached = targetSpeed;
              }

              sec.vx = -cnx * sec.baseSpeed + -cny * (Math.random() - 0.5) * sec.baseSpeed * 0.5;
              sec.vy = -cny * sec.baseSpeed + cnx * (Math.random() - 0.5) * sec.baseSpeed * 0.5;
              const secLen = Math.hypot(sec.vx, sec.vy);
              if (secLen > 0) {
                sec.vx = (sec.vx / secLen) * sec.baseSpeed;
                sec.vy = (sec.vy / secLen) * sec.baseSpeed;
              }

              this.ball.flash = 1.0;
              sec.flash = 1.0;

              const contactX = (this.ball.x + sec.x) / 2;
              const contactY = (this.ball.y + sec.y) / 2;
              this.shockwaves.push(new Shockwave(contactX, contactY, sec.color, 45, 6));
              this.spawnWallSparks(contactX, contactY, -cnx, -cny);
              this.triggerScreenShake(3.5);

              if (this.config.SECONDARY_BALL_COUNTS_AS_BOUNCE) {
                this.bounces++;
                this.ball.updateColor(this.config);
                const speedRatio =
                  (this.ball.speed - this.config.INITIAL_SPEED) /
                  Math.max(1, this.config.MAX_SPEED - this.config.INITIAL_SPEED);
                sound.playBounce(this.bounces, speedRatio);
              } else {
                sound.playBounce(this.bounces, 0.4);
              }
            }
          }
        }
      }

      const dx = this.ball.x - CENTER_X;
      const dy = this.ball.y - CENTER_Y;
      const dist = Math.hypot(dx, dy);

      if (this.ball.isEscaping) {
        if (dist >= this.config.CIRCLE_RADIUS + this.ball.radius * 0.4) {
          this.handleEscape();
          break;
        }
        continue;
      }

      const limitRadius = this.config.CIRCLE_RADIUS - this.ball.radius;

      if (dist >= limitRadius) {
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        const dot = this.ball.vx * nx + this.ball.vy * ny;

        let angle = Math.atan2(dy, dx);
        if (angle < 0) angle += Math.PI * 2;

        let relAngle = (angle - this.arenaAngle) % (Math.PI * 2);
        if (relAngle < 0) relAngle += Math.PI * 2;

        const segmentIndex =
          Math.floor((relAngle / (Math.PI * 2)) * this.config.TOTAL_WALL_SEGMENTS) %
          this.config.TOTAL_WALL_SEGMENTS;
        const segment = this.segments[segmentIndex];

        if (segment && segment.isAlive) {
          if (dot > 0) {
            this.ball.x = CENTER_X + nx * limitRadius;
            this.ball.y = CENTER_Y + ny * limitRadius;

            this.ball.vx = this.ball.vx - 2 * dot * nx;
            this.ball.vy = this.ball.vy - 2 * dot * ny;

            const tanVx = -ny * rotSpeed * this.config.CIRCLE_RADIUS * 0.08;
            const tanVy = nx * rotSpeed * this.config.CIRCLE_RADIUS * 0.08;
            this.ball.vx += tanVx;
            this.ball.vy += tanVy;

            const perpX = -ny;
            const perpY = nx;
            const jitter = (Math.random() - 0.5) * 0.12;
            this.ball.vx += perpX * jitter;
            this.ball.vy += perpY * jitter;

            const contactX = CENTER_X + nx * this.config.CIRCLE_RADIUS;
            const contactY = CENTER_Y + ny * this.config.CIRCLE_RADIUS;

            this.handleBounce(segment, contactX, contactY, nx, ny);
          }
        } else {
          if (dot > 0) {
            this.ball.isEscaping = true;
          }
        }
      }
    }

    if (this.state === 'RUNNING' || this.state === 'ESCAPED') {
      this.ball.trail.push({
        x: this.ball.x,
        y: this.ball.y,
        color: this.ball.color
      });
      if (this.ball.trail.length > this.ball.maxTrail) {
        this.ball.trail.shift();
      }
    }

    if (this.state === 'ESCAPED') {
      this.freezeTimer -= dt;
      if (this.freezeTimer <= 0) {
        this.freezeTimer = 0;
        this.state = 'FROZEN';
        this.syncHUD();
      }
    }
  }

  private updateEntities(dt: number) {
    if (this.state === 'FROZEN') return;

    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].update(dt);
    }

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
      this.shakeX = (Math.random() - 0.5) * this.screenShake;
      this.shakeY = (Math.random() - 0.5) * this.screenShake;
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

    for (let i = 0; i < this.shockwaves.length; i++) {
      this.shockwaves[i].draw(this.ctx);
    }

    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].draw(this.ctx);
    }

    for (let i = 0; i < this.secondaryBalls.length; i++) {
      this.secondaryBalls[i].draw(this.ctx);
    }

    this.ball.draw(this.ctx);

    // Dessin du HUD textuel en haut du Canvas (inclus dans la vidéo 9:16)
    drawCanvasHUD(this.ctx, this.currentHUD, VIRTUAL_WIDTH);

    this.ctx.restore();
  }

  private drawBackground() {
    this.ctx.save();
    const bgGrad = this.ctx.createRadialGradient(
      CENTER_X,
      CENTER_Y,
      15,
      CENTER_X,
      CENTER_Y,
      this.config.CIRCLE_RADIUS
    );
    bgGrad.addColorStop(0, 'rgba(176, 38, 255, 0.09)');
    bgGrad.addColorStop(0.45, 'rgba(0, 240, 255, 0.04)');
    bgGrad.addColorStop(0.9, 'rgba(0, 0, 0, 0.2)');
    bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = bgGrad;
    this.ctx.beginPath();
    this.ctx.arc(CENTER_X, CENTER_Y, this.config.CIRCLE_RADIUS, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(CENTER_X, CENTER_Y, this.config.CIRCLE_RADIUS - 10, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(CENTER_X, CENTER_Y, 3, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    this.ctx.fill();
    this.ctx.restore();
  }

  private drawArena() {
    this.ctx.save();
    this.ctx.translate(CENTER_X, CENTER_Y);
    this.ctx.rotate(this.arenaAngle);
    this.ctx.translate(-CENTER_X, -CENTER_Y);
    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].draw(this.ctx, CENTER_X, CENTER_Y, this.config.CIRCLE_RADIUS);
    }
    this.ctx.restore();
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
