import { BallEscapeConfig, DEFAULT_BALL_ESCAPE_CONFIG } from '../types';
import { PRNG } from '../../../core/math/prng';
import { ArenaRing, Ball } from '../entities';
import {
  BallEscapeTelemetry,
  BallEscapeEvent,
  BallBounceEvent,
  SegmentBreakEvent,
  RingAdvanceEvent,
  EscapeEvent,
  TimeUpEvent
} from './types';

const CENTER_X = 270;

export class BallEscapeSimulation {
  public seed: number;
  public config: BallEscapeConfig;
  public prng: PRNG;
  public rings: ArenaRing[] = [];
  public balls: Ball[] = [];
  public currentTick: number = 0;
  public currentTimeSeconds: number = 0;
  public timeLeft: number;
  public bounces: number = 0;
  public maxSpeedReached: number = 0;
  public maxRingReached: number = 0;
  public hasEscaped: boolean = false;
  public escapeTimeSeconds?: number;
  public winnerTeam?: string;
  public isFinished: boolean = false;
  public events: BallEscapeEvent[] = [];

  constructor(seed: number, config: Partial<BallEscapeConfig> = {}) {
    this.seed = seed;
    this.config = { ...DEFAULT_BALL_ESCAPE_CONFIG, ...config, SEED: seed };
    this.prng = new PRNG(seed);
    this.timeLeft = this.config.CHALLENGE_TIME_LIMIT || 30;
    this.maxSpeedReached = this.config.INITIAL_SPEED;

    this.initArena();
    this.initBalls();
  }

  public getCenterY(): number {
    return this.config.ARENA_CENTER_Y !== undefined ? this.config.ARENA_CENTER_Y : 480;
  }

  private initArena() {
    this.rings = [];
    const baseRadius = this.config.CIRCLE_RADIUS;
    const ringCount = Math.max(1, Math.min(6, this.config.RING_COUNT || 1));
    const spacing = this.config.RING_SPACING || 36;
    const baseGapDeg = this.config.GAP_SIZE_DEGREES || 36;
    const baseGapRad = (baseGapDeg * Math.PI) / 180;
    const speedBase = this.config.ARENA_ROTATION_SPEED || 0.35;
    const segCount = this.config.TOTAL_WALL_SEGMENTS || 28;
    const segHp = this.config.SEGMENT_HP || 3;
    const mode = this.config.RING_GAP_MODE || 'rotating-gap';

    for (let i = 0; i < ringCount; i++) {
      const radius = baseRadius + i * spacing;
      const speedDir = i % 2 === 0 ? 1 : -1;
      const ringSpeed = speedBase * speedDir * (1 + i * 0.15);
      const gapSize = baseGapRad * (1 + i * 0.1);

      this.rings.push(new ArenaRing(i, radius, gapSize, ringSpeed, segCount, segHp, mode));
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

  public tick(): BallEscapeEvent[] {
    if (this.isFinished) return [];

    const frameEvents: BallEscapeEvent[] = [];
    const dt = 1 / 60;
    this.currentTick++;
    this.currentTimeSeconds += dt;
    this.timeLeft -= dt;

    if (this.timeLeft <= 0 && !this.hasEscaped) {
      this.timeLeft = 0;
      this.isFinished = true;
      const timeUpEvt: TimeUpEvent = {
        type: 'time_up',
        tick: this.currentTick,
        timeSeconds: this.currentTimeSeconds,
        finalBounces: this.bounces
      };
      this.events.push(timeUpEvt);
      frameEvents.push(timeUpEvt);
      return frameEvents;
    }

    const centerY = this.getCenterY();
    const subSteps = this.config.SUB_STEPS || 12;
    const subDt = dt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      // Rotation des anneaux
      for (let r = 0; r < this.rings.length; r++) {
        this.rings[r].update(subDt);
      }

      // Collisions physiques entre billes
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
              Ball.resolveBallBallCollision(b1, b2, this.prng, elasticity, dirNorm, speedNorm);
            }
          }
        }
      }

      // Physique des billes & collisions avec parois
      for (let i = 0; i < this.balls.length; i++) {
        this.updateBallPhysics(this.balls[i], subDt, centerY, frameEvents);
      }

      if (this.hasEscaped) {
        this.isFinished = true;
        break;
      }
    }

    return frameEvents;
  }

  private updateBallPhysics(
    ball: Ball,
    subDt: number,
    centerY: number,
    frameEvents: BallEscapeEvent[]
  ) {
    ball.vy += this.config.GRAVITY * subDt;
    ball.x += ball.vx * subDt;
    ball.y += ball.vy * subDt;

    const dx = ball.x - CENTER_X;
    const dy = ball.y - centerY;
    const dist = Math.hypot(dx, dy);

    if (ball.isEscaping) {
      const outermostRadius = this.rings[this.rings.length - 1]?.radius || this.config.CIRCLE_RADIUS;
      if (dist >= outermostRadius + ball.radius + 20) {
        this.handleEscape(ball, frameEvents);
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
        const lnx = dLip > 0.001 ? (ball.x - hitLipX) / dLip : nx;
        const lny = dLip > 0.001 ? (ball.y - hitLipY) / dLip : ny;
        const lipDot = ball.vx * lnx + ball.vy * lny;

        if (lipDot < 0) {
          ball.x = hitLipX + lnx * (lipHitRadius + 1.0);
          ball.y = hitLipY + lny * (lipHitRadius + 1.0);

          ball.vx = ball.vx - 2 * lipDot * lnx;
          ball.vy = ball.vy - 2 * lipDot * lny;

          this.applyBounceDeflectionAndSpin(ball, -lnx, -lny, currentRing.rotSpeed, R);
          this.recordBounce(ball, currentRing, null, hitLipX, hitLipY, frameEvents);
        }
      } else if (absDTheta < halfGap - angularClearance) {
        if (dist >= R && dot > 0) {
          this.advanceRing(ball, frameEvents);
        }
      } else if (dist >= limitRadius) {
        if (dot > 0) {
          ball.x = CENTER_X + nx * (limitRadius - 1.2);
          ball.y = centerY + ny * (limitRadius - 1.2);

          ball.vx = ball.vx - 2 * dot * nx;
          ball.vy = ball.vy - 2 * dot * ny;

          this.applyBounceDeflectionAndSpin(ball, nx, ny, currentRing.rotSpeed, R);
          const contactX = CENTER_X + nx * R;
          const contactY = centerY + ny * R;
          this.recordBounce(ball, currentRing, null, contactX, contactY, frameEvents);
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
          this.advanceRing(ball, frameEvents);
        }
      } else if (dist >= limitRadius && dot > 0) {
        ball.x = CENTER_X + nx * (limitRadius - 1.2);
        ball.y = centerY + ny * (limitRadius - 1.2);

        ball.vx = ball.vx - 2 * dot * nx;
        ball.vy = ball.vy - 2 * dot * ny;

        this.applyBounceDeflectionAndSpin(ball, nx, ny, currentRing.rotSpeed, R);

        const contactX = CENTER_X + nx * R;
        const contactY = centerY + ny * R;
        this.recordBounce(ball, currentRing, segment, contactX, contactY, frameEvents, segIdx);
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
    const inNx = -nx;
    const inNy = -ny;
    const tangentX = -ny;
    const tangentY = nx;

    let vInward = ball.vx * inNx + ball.vy * inNy;
    let vTangent = ball.vx * tangentX + ball.vy * tangentY;

    if (vInward < 1) {
      vInward = Math.max(1, Math.abs(vInward));
    }

    const wallTangentSpeed = rotSpeed * R;
    const slip = wallTangentSpeed - vTangent;
    const spinFactor =
      this.config.WALL_SPIN_TRANSFER !== undefined ? this.config.WALL_SPIN_TRANSFER : 0.45;
    vTangent += slip * spinFactor;

    const baseAngle = Math.atan2(vTangent, vInward);

    const dirRandPct =
      this.config.BOUNCE_DIR_RANDOMNESS !== undefined
        ? this.config.BOUNCE_DIR_RANDOMNESS
        : (this.config.BOUNCE_RANDOMNESS !== undefined ? this.config.BOUNCE_RANDOMNESS : 25);
    const dirNorm = Math.max(0, Math.min(100, dirRandPct)) / 100;

    let finalAngle = baseAngle;
    if (dirNorm > 0) {
      const maxDeflectAngle = dirNorm * 1.15;
      const angleJitter = (this.prng.next() * 2 - 1) * maxDeflectAngle;
      finalAngle = baseAngle + angleJitter;
    }

    const maxSafeAngle = Math.PI * 0.42;
    finalAngle = Math.max(-maxSafeAngle, Math.min(maxSafeAngle, finalAngle));

    const baseMult = this.config.BOUNCE_SPEED_MULTIPLIER || 1.03;
    const speedRandPct =
      this.config.BOUNCE_SPEED_RANDOMNESS !== undefined
        ? this.config.BOUNCE_SPEED_RANDOMNESS
        : 20;
    const speedNorm = Math.max(0, Math.min(100, speedRandPct)) / 100;

    let speedMult = baseMult;
    if (speedNorm > 0) {
      const speedJitter = (this.prng.next() * 2 - 1) * (0.35 * speedNorm);
      speedMult = Math.max(0.75, baseMult * (1.0 + speedJitter));
    }

    const curSpeed = ball.speed || Math.hypot(ball.vx, ball.vy) || this.config.INITIAL_SPEED;
    const newSpeed = Math.min(
      this.config.MAX_SPEED,
      Math.max(this.config.INITIAL_SPEED * 0.5, curSpeed * speedMult)
    );
    ball.speed = newSpeed;

    const finalVInward = newSpeed * Math.cos(finalAngle);
    const finalVTangent = newSpeed * Math.sin(finalAngle);

    ball.vx = inNx * finalVInward + tangentX * finalVTangent;
    ball.vy = inNy * finalVInward + tangentY * finalVTangent;
  }

  private recordBounce(
    ball: Ball,
    ring: ArenaRing,
    segment: any,
    contactX: number,
    contactY: number,
    frameEvents: BallEscapeEvent[],
    segIdx?: number
  ) {
    this.bounces++;
    ball.bouncesCount++;

    if (ball.speed > this.maxSpeedReached) {
      this.maxSpeedReached = ball.speed;
    }

    const bounceEvt: BallBounceEvent = {
      type: 'bounce',
      tick: this.currentTick,
      timeSeconds: this.currentTimeSeconds,
      ballIndex: ball.id,
      ringIndex: ring.index,
      bounceCount: ball.bouncesCount,
      speed: ball.speed,
      x: contactX,
      y: contactY
    };
    this.events.push(bounceEvt);
    frameEvents.push(bounceEvt);

    if (segment) {
      const destroyed = segment.hit ? segment.hit() : false;
      if (destroyed) {
        const breakEvt: SegmentBreakEvent = {
          type: 'segment_break',
          tick: this.currentTick,
          timeSeconds: this.currentTimeSeconds,
          ringIndex: ring.index,
          segmentIndex: segIdx ?? 0,
          x: contactX,
          y: contactY
        };
        this.events.push(breakEvt);
        frameEvents.push(breakEvt);
      }
    }
  }

  private advanceRing(ball: Ball, frameEvents: BallEscapeEvent[]) {
    if (ball.currentRingIndex < this.rings.length - 1) {
      const prevRing = ball.currentRingIndex;
      ball.currentRingIndex++;
      if (ball.currentRingIndex > this.maxRingReached) {
        this.maxRingReached = ball.currentRingIndex;
      }

      const ringEvt: RingAdvanceEvent = {
        type: 'ring_advance',
        tick: this.currentTick,
        timeSeconds: this.currentTimeSeconds,
        ballIndex: ball.id,
        fromRingIndex: prevRing,
        toRingIndex: ball.currentRingIndex,
        x: ball.x,
        y: ball.y
      };
      this.events.push(ringEvt);
      frameEvents.push(ringEvt);
    } else {
      ball.isEscaping = true;
    }
  }

  private handleEscape(ball: Ball, frameEvents: BallEscapeEvent[]) {
    if (this.hasEscaped) return;

    this.hasEscaped = true;
    this.escapeTimeSeconds = parseFloat(this.currentTimeSeconds.toFixed(2));
    this.winnerTeam = ball.label || (ball.team ? ball.team.toUpperCase() : 'VICTOIRE');

    const escEvt: EscapeEvent = {
      type: 'escape',
      tick: this.currentTick,
      timeSeconds: this.currentTimeSeconds,
      ballIndex: ball.id,
      team: ball.team,
      x: ball.x,
      y: ball.y,
      escapeTimeSeconds: this.escapeTimeSeconds
    };
    this.events.push(escEvt);
    frameEvents.push(escEvt);
  }

  public simulateFull(maxDurationSeconds: number = 30): BallEscapeTelemetry {
    const maxTicks = Math.ceil(maxDurationSeconds * 60);

    while (!this.isFinished && this.currentTick < maxTicks) {
      this.tick();
    }

    const viralScore = this.calculateViralScore();

    return {
      seed: this.seed,
      totalTicks: this.currentTick,
      durationSeconds: parseFloat(this.currentTimeSeconds.toFixed(2)),
      hasEscaped: this.hasEscaped,
      escapeTimeSeconds: this.escapeTimeSeconds,
      bouncesCount: this.bounces,
      maxSpeedReached: Math.round(this.maxSpeedReached),
      maxRingIndexReached: this.maxRingReached,
      winnerTeam: this.winnerTeam,
      viralScore,
      events: this.events,
      config: this.config
    };
  }

  private calculateViralScore(): number {
    let score = 0;
    const timeLimit = this.config.CHALLENGE_TIME_LIMIT || 30;

    if (this.hasEscaped && this.escapeTimeSeconds !== undefined) {
      // 1. Base victoire : 50 points
      score += 50;

      // 2. Bonus "Buzzer Beater" (Suspense extrême de dernière seconde)
      // Si l'évasion survient entre (timeLimit - 6s) et timeLimit : gros pic de rétention TikTok !
      const remainingAtEscape = timeLimit - this.escapeTimeSeconds;
      if (remainingAtEscape <= 6 && remainingAtEscape >= 0) {
        // Plus c'est proche de 0s, plus le score explose (+28 points max)
        const buzzerFactor = 1 - (remainingAtEscape / 6);
        score += Math.round(buzzerFactor * 28);
      } else if (this.escapeTimeSeconds <= 8) {
        // Bonus "Évasion éclair" impressionnante (+18 points)
        score += 18;
      } else {
        // Durée intermédiaire satisfaisante (15-22s) (+12 points)
        score += 12;
      }
    } else {
      // Échec : score proportionnel à la progression des anneaux
      const ringProgression = (this.maxRingReached + 1) / Math.max(1, this.rings.length);
      score += Math.round(ringProgression * 30);
    }

    // 3. Bonus dynamique de rebonds (rythme ASMR satisfaisant)
    // 25 à 50 rebonds est idéal pour le son TikTok
    const bounceBonus = Math.min(15, Math.round(this.bounces * 0.35));
    score += bounceBonus;

    // 4. Bonus vitesse max
    const speedRatio = Math.min(1, this.maxSpeedReached / (this.config.MAX_SPEED || 420));
    score += Math.round(speedRatio * 7);

    return Math.max(10, Math.min(100, score));
  }
}
