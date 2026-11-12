import { BallEscapeConfig, BallSkin, BallTrailStyle } from './types';
import { PRNG } from '../../core/math/prng';

export const VIRTUAL_WIDTH = 540;
export const VIRTUAL_HEIGHT = 960;
export const CENTER_X = VIRTUAL_WIDTH / 2;
export const DEFAULT_CENTER_Y = VIRTUAL_HEIGHT / 2;

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  initialSize: number;
  life: number;
  maxLife: number;
  decay: number;
  isGravity: boolean;
  rotation: number;
  rotSpeed: number;

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string,
    size: number,
    life: number,
    decay: number,
    isGravity: boolean = false
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.initialSize = size;
    this.life = life;
    this.maxLife = life;
    this.decay = decay;
    this.isGravity = isGravity;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.2;
  }

  update(dt: number) {
    if (this.isGravity) {
      this.vy += 0.25 * dt;
      this.vx *= 0.99;
    } else {
      this.vx *= 0.96;
      this.vy *= 0.96;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.rotSpeed * dt;
    this.life -= this.decay * dt;
  }

  draw(context: CanvasRenderingContext2D) {
    if (this.life <= 0) return;
    const progress = Math.max(0, this.life / this.maxLife);
    context.save();
    context.translate(this.x, this.y);
    context.rotate(this.rotation);
    context.globalAlpha = progress;

    context.fillStyle = this.color;
    context.shadowColor = this.color;
    context.shadowBlur = 8;

    if (this.isGravity) {
      context.fillRect(-this.size, -this.size * 0.5, this.size * 2, this.size);
    } else {
      context.beginPath();
      context.arc(0, 0, Math.max(0.5, this.size * progress), 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
}

export class Shockwave {
  x: number;
  y: number;
  color: string;
  radius: number;
  maxRadius: number;
  duration: number;
  elapsed: number;
  alpha: number;

  constructor(x: number, y: number, color: string, maxRadius = 45, duration = 0.45) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = 4;
    this.maxRadius = maxRadius;
    this.duration = Math.max(0.05, duration);
    this.elapsed = 0;
    this.alpha = 1.0;
  }

  update(dt: number) {
    this.elapsed += dt;
    const progress = Math.min(1, this.elapsed / this.duration);
    this.radius = 4 + (this.maxRadius - 4) * progress;
    this.alpha = Math.max(0, 1 - progress);
  }

  draw(context: CanvasRenderingContext2D) {
    if (this.alpha <= 0) return;
    context.save();
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.strokeStyle = this.color;
    context.lineWidth = Math.max(1, 3.5 * this.alpha);
    context.globalAlpha = this.alpha;
    context.shadowColor = this.color;
    context.shadowBlur = 12 * this.alpha;
    context.stroke();
    context.restore();
  }
}

export class WallSegment {
  index: number;
  startAngle: number;
  endAngle: number;
  maxHp: number;
  hp: number;
  hitFlash: number;

  constructor(index: number, startAngle: number, endAngle: number, maxHp: number) {
    this.index = index;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.maxHp = maxHp;
    this.hp = this.maxHp;
    this.hitFlash = 0;
  }

  get isAlive(): boolean {
    return this.hp > 0;
  }

  hit(): boolean {
    this.hp = Math.max(0, this.hp - 1);
    this.hitFlash = 1.0;
    return this.hp === 0;
  }

  update(dt: number) {
    if (this.hitFlash > 0) {
      this.hitFlash = Math.max(0, this.hitFlash - 6.0 * dt);
    }
  }

  draw(
    context: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    baseStrokeWidth: number = 8,
    customColor: string = 'rainbow'
  ) {
    if (!this.isAlive) return;

    context.save();
    const pad = 0.022;
    const sAngle = this.startAngle + pad;
    const eAngle = this.endAngle - pad;

    if (sAngle >= eAngle) {
      context.restore();
      return;
    }

    let strokeColor = '#00f0ff';
    let glowColor = 'rgba(0, 240, 255, 0.85)';
    const lineWidth = baseStrokeWidth;

    if (customColor === 'rainbow') {
      const segAngle = (sAngle + eAngle) / 2;
      const hue = Math.round(((segAngle % (Math.PI * 2)) / (Math.PI * 2)) * 360);
      strokeColor = `hsl(${hue}, 100%, 55%)`;
      glowColor = `hsla(${hue}, 100%, 55%, 0.85)`;
    } else {
      strokeColor = customColor;
      glowColor = customColor;
    }

    if (this.hitFlash > 0) {
      context.strokeStyle = '#ffffff';
      context.shadowColor = '#ffffff';
      context.shadowBlur = 24 + 15 * this.hitFlash;
      context.lineWidth = lineWidth + 4 * this.hitFlash;
      context.lineCap = 'round';
      context.beginPath();
      context.arc(cx, cy, radius, sAngle, eAngle);
      context.stroke();
    } else {
      context.strokeStyle = strokeColor;
      context.shadowColor = glowColor;
      context.shadowBlur = 16;
      context.lineWidth = lineWidth;
      context.lineCap = 'round';
      context.beginPath();
      context.arc(cx, cy, radius, sAngle, eAngle);
      context.stroke();

      context.save();
      context.shadowBlur = 0;
      context.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      context.lineWidth = Math.max(1.8, lineWidth * 0.28);
      context.beginPath();
      context.arc(cx, cy, radius, sAngle, eAngle);
      context.stroke();
      context.restore();
    }

    context.restore();
  }
}

export class ArenaRing {
  ringIndex: number;
  radius: number;
  rotSpeed: number;
  angle: number;
  segments: WallSegment[];
  gapAngle: number;
  gapSize: number;
  gapMode: 'bricks' | 'rotating-gap';
  isCleared: boolean;

  constructor(
    ringIndex: number,
    radius: number,
    rotSpeed: number,
    segmentCount: number,
    segmentHp: number,
    gapMode: 'bricks' | 'rotating-gap' = 'bricks',
    gapSizeRad: number = 0.628
  ) {
    this.ringIndex = ringIndex;
    this.radius = radius;
    this.rotSpeed = rotSpeed;
    this.angle = 0;
    this.gapMode = gapMode;
    this.gapAngle = 0;
    this.gapSize = gapSizeRad;
    this.segments = [];
    this.isCleared = false;

    const step = (Math.PI * 2) / segmentCount;
    for (let i = 0; i < segmentCount; i++) {
      const start = i * step;
      const end = (i + 1) * step;
      this.segments.push(new WallSegment(i, start, end, segmentHp));
    }
  }

  update(dt: number) {
    this.angle = (this.angle + this.rotSpeed * dt) % (Math.PI * 2);
    if (this.angle < 0) this.angle += Math.PI * 2;
    this.gapAngle = this.angle;

    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].update(dt);
    }
  }

  draw(
    context: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    strokeWidth: number,
    arenaColor: string
  ) {
    if (this.isCleared) {
      context.save();
      context.translate(cx, cy);
      context.rotate(this.angle);
      context.translate(-cx, -cy);
      context.beginPath();
      context.arc(cx, cy, this.radius, 0, Math.PI * 2);
      context.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      context.setLineDash([8, 8]);
      context.lineWidth = Math.max(1.8, strokeWidth * 0.35);
      context.stroke();
      context.restore();
      return;
    }

    context.save();
    context.translate(cx, cy);
    context.rotate(this.angle);
    context.translate(-cx, -cy);

    if (this.gapMode === 'rotating-gap') {
      const sAngle = this.gapSize / 2;
      const eAngle = Math.PI * 2 - this.gapSize / 2;

      context.save();
      let strokeStyle: string | CanvasGradient;
      let glowColor: string;

      if (arenaColor === 'rainbow') {
        if (typeof context.createConicGradient === 'function') {
          const grad = context.createConicGradient(0, cx, cy);
          grad.addColorStop(0.0, '#ff0055');
          grad.addColorStop(0.17, '#ff7700');
          grad.addColorStop(0.33, '#ffee00');
          grad.addColorStop(0.5, '#00ff66');
          grad.addColorStop(0.67, '#00f0ff');
          grad.addColorStop(0.83, '#b026ff');
          grad.addColorStop(1.0, '#ff0055');
          strokeStyle = grad;
        } else {
          strokeStyle = '#00f0ff';
        }
        glowColor = '#00f0ff';
      } else {
        strokeStyle = arenaColor;
        glowColor = arenaColor;
      }

      // Paroi principale néon
      context.strokeStyle = strokeStyle;
      context.shadowColor = glowColor;
      context.shadowBlur = 18;
      context.lineWidth = strokeWidth;
      context.lineCap = 'round';

      context.beginPath();
      context.arc(cx, cy, this.radius, sAngle, eAngle);
      context.stroke();

      // Cœur lumineux blanc (effet tube laser)
      context.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      context.shadowBlur = 0;
      context.lineWidth = Math.max(1.8, strokeWidth * 0.28);
      context.beginPath();
      context.arc(cx, cy, this.radius, sAngle, eAngle);
      context.stroke();

      // Embouts arrondis brillants aux deux extrémités de la brèche (lèvres)
      const cap1X = cx + Math.cos(sAngle) * this.radius;
      const cap1Y = cy + Math.sin(sAngle) * this.radius;
      const cap2X = cx + Math.cos(eAngle) * this.radius;
      const cap2Y = cy + Math.sin(eAngle) * this.radius;

      context.beginPath();
      context.arc(cap1X, cap1Y, strokeWidth * 0.55, 0, Math.PI * 2);
      context.arc(cap2X, cap2Y, strokeWidth * 0.55, 0, Math.PI * 2);
      context.fillStyle = '#ffffff';
      context.shadowColor = arenaColor === 'rainbow' ? '#00f0ff' : arenaColor;
      context.shadowBlur = 14;
      context.fill();

      // Arc d'aura subtil dans la brèche (effet portail d'évasion)
      context.beginPath();
      context.arc(cx, cy, this.radius, -this.gapSize / 2, this.gapSize / 2);
      context.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      context.setLineDash([4, 6]);
      context.lineWidth = 2;
      context.stroke();

      context.restore();
    } else {
      // Anneau découpé en briques d'arc
      for (let i = 0; i < this.segments.length; i++) {
        this.segments[i].draw(context, cx, cy, this.radius, strokeWidth, arenaColor);
      }
    }

    context.restore();
  }
}

export const BATTLE_COLORS = [
  '#00f0ff', // P1: Cyan
  '#ff007f', // P2: Rose
  '#ffd700', // P3: Jaune / Gold
  '#00ff66', // P4: Vert Laser
  '#b026ff', // P5: Violet Néon
  '#ff6600', // P6: Orange Vif
  '#ff3333', // P7: Rouge Flamme
  '#ffffff'  // P8: Blanc Pur
];

export const BATTLE_LABELS = [
  'CYAN',
  'ROSE',
  'JAUNE',
  'VERT',
  'VIOLET',
  'ORANGE',
  'ROUGE',
  'BLANC'
];

export class Ball {
  id: number;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  speed: number;
  trail: { x: number; y: number; color: string; size?: number }[];
  maxTrail: number;
  color: string;
  glowColor: string;
  flash: number;
  isEscaping: boolean;
  currentRingIndex: number; // Quel anneau la bille traverse (0 = intérieur)
  team?: string;
  label: string;
  bouncesCount: number;

  constructor(id: number = 0, x: number = 0, y: number = 0, initialRadius: number = 12, team?: string, label?: string) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = initialRadius;
    this.vx = 0;
    this.vy = 0;
    this.speed = 220;
    this.trail = [];
    this.maxTrail = 26;
    this.team = team;
    this.label = label || (team ? team.toUpperCase() : 'BALL');
    const defaultCol = team === 'p2' ? '#ff007f' : '#00f0ff';
    this.color = defaultCol;
    this.glowColor = defaultCol;
    this.flash = 0;
    this.isEscaping = false;
    this.currentRingIndex = 0;
    this.bouncesCount = 0;
  }

  reset(x: number, y: number, config: BallEscapeConfig, customAngle?: number, prng?: PRNG) {
    this.x = x;
    this.y = y;
    this.radius = config.BALL_RADIUS;
    this.trail = [];
    this.flash = 0;
    this.isEscaping = false;
    this.currentRingIndex = 0;
    this.bouncesCount = 0;

    let angle: number;
    if (customAngle !== undefined) {
      angle = customAngle;
    } else if (prng) {
      const base = prng.range(0.2, 0.8) * Math.PI;
      angle = prng.next() < 0.5 ? base : -base;
    } else {
      angle = (Math.random() * 0.6 + 0.2) * Math.PI * (Math.random() < 0.5 ? 1 : -1);
    }

    this.speed = config.INITIAL_SPEED;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.updateColor(config);
  }

  updateColor(config: BallEscapeConfig) {
    if (this.team === 'p1') {
      this.color = config.DUEL_P1_COLOR || '#00f0ff';
      this.label = config.DUEL_P1_LABEL || 'CYAN';
      this.glowColor = this.color;
      return;
    }
    if (this.team === 'p2') {
      this.color = config.DUEL_P2_COLOR || '#ff007f';
      this.label = config.DUEL_P2_LABEL || 'ROSE';
      this.glowColor = this.color;
      return;
    }
    if (this.team === 'p3') {
      this.color = config.DUEL_P3_COLOR || '#ffd700';
      this.label = config.DUEL_P3_LABEL || 'JAUNE';
      this.glowColor = this.color;
      return;
    }
    if (this.team === 'p4') {
      this.color = config.DUEL_P4_COLOR || '#00ff66';
      this.label = config.DUEL_P4_LABEL || 'VERT';
      this.glowColor = this.color;
      return;
    }
    if (this.team) {
      const idx = parseInt(this.team.replace('p', ''), 10) - 1;
      const validIdx = isNaN(idx) ? this.id : idx;
      this.color = BATTLE_COLORS[validIdx % BATTLE_COLORS.length];
      this.label = BATTLE_LABELS[validIdx % BATTLE_LABELS.length];
      this.glowColor = this.color;
      return;
    }

    const t = Math.min(
      1,
      Math.max(
        0,
        (this.speed - config.INITIAL_SPEED) / Math.max(1, config.MAX_SPEED - config.INITIAL_SPEED)
      )
    );
    let hue: number;
    if (t < 0.25) {
      hue = 185 - (t / 0.25) * 40;
    } else if (t < 0.55) {
      hue = 145 - ((t - 0.25) / 0.3) * 95;
    } else if (t < 0.85) {
      hue = 50 - ((t - 0.55) / 0.3) * 90;
      if (hue < 0) hue += 360;
    } else {
      hue = 320 - ((t - 0.85) / 0.15) * 20;
    }

    this.color = `hsl(${Math.round(hue)}, 100%, 62%)`;
    this.glowColor = `hsla(${Math.round(hue)}, 100%, 55%, 0.9)`;
    this.radius = config.BALL_RADIUS + t * 4.5;
  }

  static resolveBallBallCollision(
    b1: Ball,
    b2: Ball,
    prng?: PRNG,
    elasticity: number = 0.98,
    dirRandomness: number = 0.25,
    speedRandomness: number = 0.20
  ): boolean {
    if (b1.isEscaping || b2.isEscaping) return false;

    const dx = b1.x - b2.x;
    const dy = b1.y - b2.y;
    const dist = Math.hypot(dx, dy);
    const minDist = b1.radius + b2.radius;

    if (dist >= minDist || dist <= 0.0001) return false;

    const nx = dx / dist;
    const ny = dy / dist;

    // Repousser les billes pour éliminer le chevauchement (+ marge 0.5px)
    const overlap = minDist - dist + 0.5;
    b1.x += nx * (overlap * 0.5);
    b1.y += ny * (overlap * 0.5);
    b2.x -= nx * (overlap * 0.5);
    b2.y -= ny * (overlap * 0.5);

    const rvx = b1.vx - b2.vx;
    const rvy = b1.vy - b2.vy;
    const velAlongNormal = rvx * nx + rvy * ny;

    if (velAlongNormal > 0) return false;

    const impulse = -((1 + elasticity) * velAlongNormal) * 0.5;

    b1.vx += nx * impulse;
    b1.vy += ny * impulse;
    b2.vx -= nx * impulse;
    b2.vy -= ny * impulse;

    // 1. Déviation tangentielle aléatoire (direction)
    if (dirRandomness > 0) {
      const perpX = -ny;
      const perpY = nx;
      const deflectIntensity = dirRandomness * 60;
      const microDeflect = prng ? (prng.next() * 2 - 1) * deflectIntensity : (Math.random() - 0.5) * 2 * deflectIntensity;
      b1.vx += perpX * microDeflect;
      b1.vy += perpY * microDeflect;
      b2.vx -= perpX * microDeflect;
      b2.vy -= perpY * microDeflect;
    }

    // 2. Variation aléatoire de vitesse
    if (speedRandomness > 0) {
      const sRand1 = prng ? 1.0 + (prng.next() * 2 - 1) * (0.25 * speedRandomness) : 1.0;
      const sRand2 = prng ? 1.0 + (prng.next() * 2 - 1) * (0.25 * speedRandomness) : 1.0;
      b1.vx *= sRand1;
      b1.vy *= sRand1;
      b2.vx *= sRand2;
      b2.vy *= sRand2;
    }

    b1.speed = Math.hypot(b1.vx, b1.vy);
    b2.speed = Math.hypot(b2.vx, b2.vy);

    b1.flash = 0.7;
    b2.flash = 0.7;

    return true;
  }

  draw(context: CanvasRenderingContext2D, skin: BallSkin = 'neon', trailStyle: BallTrailStyle = 'neon') {
    // 1. Rendu de la traînée
    if (trailStyle !== 'none' && this.trail.length > 1) {
      for (let i = 1; i < this.trail.length; i++) {
        const p0 = this.trail[i - 1];
        const p1 = this.trail[i];
        const factor = i / this.trail.length;

        context.save();
        context.beginPath();
        context.moveTo(p0.x, p0.y);
        context.lineTo(p1.x, p1.y);

        let strokeCol = p1.color;
        if (trailStyle === 'rainbow') {
          strokeCol = `hsl(${(i * 14 + Date.now() * 0.2) % 360}, 100%, 60%)`;
        } else if (trailStyle === 'fire') {
          strokeCol = factor > 0.6 ? '#ffea00' : factor > 0.3 ? '#ff6600' : '#ff0033';
        } else if (trailStyle === 'sparkles') {
          strokeCol = '#ffffff';
        }

        context.strokeStyle = strokeCol;
        context.lineWidth = Math.max(2.5, this.radius * 1.5 * factor);
        context.lineCap = 'round';
        context.globalAlpha = factor * 0.7;
        context.shadowColor = strokeCol;
        context.shadowBlur = trailStyle === 'sparkles' ? 18 : 12 * factor;
        context.stroke();
        context.restore();
      }
    }

    // 2. Halo d'aura externe
    context.save();
    context.beginPath();
    context.arc(this.x, this.y, this.radius * 1.8, 0, Math.PI * 2);
    const aura = context.createRadialGradient(
      this.x,
      this.y,
      this.radius * 0.4,
      this.x,
      this.y,
      this.radius * 1.8
    );
    aura.addColorStop(0, this.glowColor);
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = aura;
    context.globalAlpha = 0.45;
    context.fill();
    context.restore();

    // 3. Corps de la Bille avec le Skin sélectionné
    context.save();
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    context.shadowColor = this.flash > 0 ? '#ffffff' : this.glowColor;
    context.shadowBlur = 24 + this.flash * 25;

    if (skin === 'fireball') {
      // 🔥 Boule de Feu / Météore
      const fireGrad = context.createRadialGradient(
        this.x - this.radius * 0.3,
        this.y - this.radius * 0.3,
        this.radius * 0.1,
        this.x,
        this.y,
        this.radius
      );
      fireGrad.addColorStop(0, '#ffffff');
      fireGrad.addColorStop(0.3, '#ffea00');
      fireGrad.addColorStop(0.7, '#ff5500');
      fireGrad.addColorStop(1, '#660000');
      context.fillStyle = fireGrad;
      context.fill();

    } else if (skin === 'planet') {
      // 🪐 Planète Cosmique
      const pGrad = context.createRadialGradient(
        this.x - this.radius * 0.35,
        this.y - this.radius * 0.35,
        this.radius * 0.1,
        this.x,
        this.y,
        this.radius
      );
      pGrad.addColorStop(0, '#c084fc');
      pGrad.addColorStop(0.5, '#6366f1');
      pGrad.addColorStop(1, '#0f172a');
      context.fillStyle = pGrad;
      context.fill();

      // Anneau planétaire incliné
      context.save();
      context.translate(this.x, this.y);
      context.rotate(-0.4);
      context.beginPath();
      context.ellipse(0, 0, this.radius * 1.4, this.radius * 0.4, 0, 0, Math.PI * 2);
      context.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      context.lineWidth = 2;
      context.stroke();
      context.restore();

    } else if (skin === 'sport') {
      // ⚽ Balle de Tennis / Sport
      const sGrad = context.createRadialGradient(
        this.x - this.radius * 0.3,
        this.y - this.radius * 0.3,
        this.radius * 0.1,
        this.x,
        this.y,
        this.radius
      );
      sGrad.addColorStop(0, '#ffffff');
      sGrad.addColorStop(0.4, '#a3e635');
      sGrad.addColorStop(1, '#4d7c0f');
      context.fillStyle = sGrad;
      context.fill();

      context.strokeStyle = '#ffffff';
      context.lineWidth = 1.6;
      context.beginPath();
      context.arc(this.x - this.radius * 0.5, this.y, this.radius * 0.7, -0.8, 0.8);
      context.stroke();
      context.beginPath();
      context.arc(this.x + this.radius * 0.5, this.y, this.radius * 0.7, Math.PI - 0.8, Math.PI + 0.8);
      context.stroke();

    } else if (skin === 'emoji') {
      // 💀 Emoji / Meme
      context.fillStyle = '#ffcc00';
      context.fill();

      // Lunettes de soleil néon
      context.fillStyle = '#111827';
      const eyeR = this.radius * 0.28;
      context.fillRect(this.x - this.radius * 0.7, this.y - eyeR, this.radius * 0.6, eyeR * 1.4);
      context.fillRect(this.x + this.radius * 0.1, this.y - eyeR, this.radius * 0.6, eyeR * 1.4);
      context.strokeStyle = '#ffffff';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(this.x - this.radius * 0.1, this.y);
      context.lineTo(this.x + this.radius * 0.1, this.y);
      context.stroke();

    } else if (skin === 'rainbow') {
      // 🌈 Rainbow Chroma
      const timeHue = (Date.now() * 0.15) % 360;
      const rGrad = context.createRadialGradient(
        this.x - this.radius * 0.3,
        this.y - this.radius * 0.3,
        this.radius * 0.1,
        this.x,
        this.y,
        this.radius
      );
      rGrad.addColorStop(0, '#ffffff');
      rGrad.addColorStop(0.5, `hsl(${timeHue}, 100%, 65%)`);
      rGrad.addColorStop(1, `hsl(${(timeHue + 60) % 360}, 100%, 25%)`);
      context.fillStyle = rGrad;
      context.fill();

    } else {
      // ⚡ Néon Plasma Électrique (Défaut)
      const grad = context.createRadialGradient(
        this.x - this.radius * 0.35,
        this.y - this.radius * 0.35,
        this.radius * 0.05,
        this.x,
        this.y,
        this.radius
      );

      if (this.flash > 0) {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.75, '#ffffff');
        grad.addColorStop(1, this.color);
      } else {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.28, '#ffffff');
        grad.addColorStop(0.55, this.color);
        grad.addColorStop(1, '#050a16');
      }

      context.fillStyle = grad;
      context.fill();
    }

    context.lineWidth = 1.8;
    context.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    context.stroke();
    context.restore();

    // Si la bille participe à un combat / duel : badge et halo distinctif
    if (this.team) {
      context.save();
      context.beginPath();
      context.arc(this.x, this.y, this.radius + 1.5, 0, Math.PI * 2);
      context.strokeStyle = this.color;
      context.lineWidth = 2.4;
      context.shadowColor = this.color;
      context.shadowBlur = 10;
      context.stroke();

      context.font = 'bold 10px system-ui, -apple-system, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'bottom';
      context.fillStyle = this.color;
      context.shadowColor = '#000000';
      context.shadowBlur = 6;
      context.fillText(this.label, this.x, this.y - this.radius - 4);
      context.restore();
    }

    if (this.flash > 0) {
      this.flash = Math.max(0, this.flash - 0.1);
    }
  }
}



