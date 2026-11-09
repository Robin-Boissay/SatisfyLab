import { BallEscapeConfig } from './types';

export const VIRTUAL_WIDTH = 540;
export const VIRTUAL_HEIGHT = 960;
export const CENTER_X = VIRTUAL_WIDTH / 2;
export const CENTER_Y = VIRTUAL_HEIGHT / 2;

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
  speed: number;
  alpha: number;

  constructor(x: number, y: number, color: string, maxRadius = 55, speed = 4) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = 4;
    this.maxRadius = maxRadius;
    this.speed = speed;
    this.alpha = 0.9;
  }

  update(dt: number) {
    this.radius += this.speed * dt;
    this.alpha = Math.max(0, 1 - this.radius / this.maxRadius);
  }

  draw(context: CanvasRenderingContext2D) {
    if (this.alpha <= 0) return;
    context.save();
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.strokeStyle = this.color;
    context.lineWidth = 3 * this.alpha;
    context.globalAlpha = this.alpha;
    context.shadowColor = this.color;
    context.shadowBlur = 12;
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

  draw(context: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
    if (!this.isAlive) return;

    context.save();
    const pad = 0.022;
    const sAngle = this.startAngle + pad;
    const eAngle = this.endAngle - pad;

    if (sAngle >= eAngle) {
      context.restore();
      return;
    }

    const hpColors: Record<number, { stroke: string; glow: string; width: number }> = {
      5: { stroke: '#b026ff', glow: 'rgba(176, 38, 255, 0.95)', width: 14 },
      4: { stroke: '#00f0ff', glow: 'rgba(0, 240, 255, 0.95)', width: 13 },
      3: { stroke: '#00ff88', glow: 'rgba(0, 255, 136, 0.95)', width: 12 },
      2: { stroke: '#ffcc00', glow: 'rgba(255, 204, 0, 0.95)', width: 10 },
      1: { stroke: '#ff0055', glow: 'rgba(255, 0, 85, 1.0)', width: 8 }
    };

    let strokeColor = '#00f0ff';
    let glowColor = 'rgba(0, 240, 255, 0.85)';
    let lineWidth = 13;

    if (hpColors[this.hp]) {
      const conf = hpColors[this.hp];
      strokeColor = conf.stroke;
      glowColor = conf.glow;
      lineWidth = conf.width;
    } else {
      const ratio = Math.min(1, Math.max(0, (this.hp - 1) / Math.max(1, this.maxHp - 1)));
      const hue = ratio * 185;
      strokeColor = `hsl(${Math.round(hue)}, 100%, 55%)`;
      glowColor = `hsla(${Math.round(hue)}, 100%, 55%, 0.85)`;
      lineWidth = 8 + ratio * 6;
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
      context.shadowBlur = 18;
      context.lineWidth = lineWidth;
      context.lineCap = 'round';
      context.beginPath();
      context.arc(cx, cy, radius, sAngle, eAngle);
      context.stroke();

      context.save();
      context.shadowBlur = 0;
      context.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      context.lineWidth = Math.max(2, lineWidth * 0.28);
      context.beginPath();
      context.arc(cx, cy, radius, sAngle, eAngle);
      context.stroke();
      context.restore();
    }

    context.restore();
  }
}

export class Ball {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  speed: number;
  trail: { x: number; y: number; color: string }[];
  maxTrail: number;
  color: string;
  glowColor: string;
  flash: number;
  isEscaping: boolean;

  constructor(x: number, y: number, initialRadius: number) {
    this.x = x;
    this.y = y;
    this.radius = initialRadius;
    this.vx = 0;
    this.vy = 0;
    this.speed = 220;
    this.trail = [];
    this.maxTrail = 24;
    this.color = '#00f0ff';
    this.glowColor = 'rgba(0, 240, 255, 0.9)';
    this.flash = 0;
    this.isEscaping = false;
  }

  reset(x: number, y: number, config: BallEscapeConfig) {
    this.x = x;
    this.y = y;
    this.radius = config.BALL_RADIUS;
    this.trail = [];
    this.flash = 0;
    this.isEscaping = false;

    const angle = (Math.random() * 0.7 + 0.15) * Math.PI * (Math.random() < 0.5 ? 1 : -1);
    this.speed = config.INITIAL_SPEED;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.updateColor(config);
  }

  updateColor(config: BallEscapeConfig) {
    const t = Math.min(
      1,
      Math.max(0, (this.speed - config.INITIAL_SPEED) / Math.max(1, config.MAX_SPEED - config.INITIAL_SPEED))
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

  draw(context: CanvasRenderingContext2D) {
    if (this.trail.length > 1) {
      for (let i = 1; i < this.trail.length; i++) {
        const p0 = this.trail[i - 1];
        const p1 = this.trail[i];
        const factor = i / this.trail.length;

        context.save();
        context.beginPath();
        context.moveTo(p0.x, p0.y);
        context.lineTo(p1.x, p1.y);
        context.strokeStyle = p1.color;
        context.lineWidth = Math.max(3, this.radius * 1.6 * factor);
        context.lineCap = 'round';
        context.globalAlpha = factor * 0.65;
        context.shadowColor = p1.color;
        context.shadowBlur = 14 * factor;
        context.stroke();
        context.restore();
      }
    }

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

    context.save();
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    context.shadowColor = this.flash > 0 ? '#ffffff' : this.glowColor;
    context.shadowBlur = 24 + this.flash * 25;

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

    context.lineWidth = 1.8;
    context.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    context.stroke();

    context.restore();

    if (this.flash > 0) {
      this.flash = Math.max(0, this.flash - 0.1);
    }
  }
}

export class SecondaryBall {
  radius: number;
  baseSpeed: number;
  speed: number;
  color: string;
  glowColor: string;
  hasTrail: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
  maxTrail: number;
  flash: number;
  isEscaping: boolean;
  isDead: boolean;

  constructor(radius = 8, speed = 50, color = '#000000') {
    this.radius = radius;
    this.baseSpeed = speed;
    this.speed = this.baseSpeed;
    this.color = color;
    this.glowColor = color;
    this.hasTrail = true;

    this.x = CENTER_X;
    this.y = CENTER_Y;
    this.vx = 0;
    this.vy = 0;
    this.trail = [];
    this.maxTrail = 18;
    this.flash = 0;
    this.isEscaping = false;
    this.isDead = false;
  }

  reset(x: number, y: number, angle?: number) {
    this.x = x;
    this.y = y;
    this.speed = this.baseSpeed;
    const ang = angle !== undefined ? angle : Math.random() * Math.PI * 2;
    this.vx = Math.cos(ang) * this.speed;
    this.vy = Math.sin(ang) * this.speed;
    this.trail = [];
    this.flash = 0;
    this.isEscaping = false;
    this.isDead = false;
  }

  static createRandom(config: BallEscapeConfig, x = CENTER_X, y = CENTER_Y): SecondaryBall {
    const minR = config.SECONDARY_BALL_MIN_RADIUS || 7;
    const maxR = config.SECONDARY_BALL_MAX_RADIUS || 9;
    const radius = Math.round(minR + Math.random() * (maxR - minR));

    const minS = config.SECONDARY_BALL_MIN_SPEED || 50;
    const maxS = config.SECONDARY_BALL_MAX_SPEED || 66;
    const speed = minS + Math.random() * (maxS - minS);

    const colors = ['#000000', '#111111'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const ball = new SecondaryBall(radius, speed, color);
    ball.reset(x, y);
    return ball;
  }

  updatePhysics(
    subDt: number,
    config: BallEscapeConfig,
    segments: WallSegment[] | null = null,
    arenaAngle: number = 0
  ) {
    this.vy += config.GRAVITY * subDt * 0.7;
    this.x += this.vx * subDt;
    this.y += this.vy * subDt;

    if (this.isEscaping) {
      if (
        this.x < -150 ||
        this.x > VIRTUAL_WIDTH + 150 ||
        this.y < -150 ||
        this.y > VIRTUAL_HEIGHT + 150
      ) {
        this.isDead = true;
      }
    } else {
      const dx = this.x - CENTER_X;
      const dy = this.y - CENTER_Y;
      const dist = Math.hypot(dx, dy);
      const limitRadius = config.CIRCLE_RADIUS - this.radius;

      if (dist >= limitRadius) {
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        const dot = this.vx * nx + this.vy * ny;

        let canPass = false;
        if (config.SECONDARY_BALLS_CAN_ESCAPE && segments) {
          let angle = Math.atan2(dy, dx);
          if (angle < 0) angle += Math.PI * 2;
          let relAngle = (angle - arenaAngle) % (Math.PI * 2);
          if (relAngle < 0) relAngle += Math.PI * 2;
          const segIdx =
            Math.floor((relAngle / (Math.PI * 2)) * config.TOTAL_WALL_SEGMENTS) %
            config.TOTAL_WALL_SEGMENTS;
          const seg = segments[segIdx];
          if (!seg || !seg.isAlive) {
            canPass = true;
          }
        }

        if (canPass) {
          if (dot > 0) {
            this.isEscaping = true;
          }
        } else {
          if (dot > 0) {
            this.x = CENTER_X + nx * limitRadius;
            this.y = CENTER_Y + ny * limitRadius;

            this.vx = this.vx - 2 * dot * nx;
            this.vy = this.vy - 2 * dot * ny;

            const perpX = -ny;
            const perpY = nx;
            this.vx += perpX * (Math.random() - 0.5) * 0.08;
            this.vy += perpY * (Math.random() - 0.5) * 0.08;

            this.flash = 0.6;
          }
        }
      }
    }

    if (this.hasTrail) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.maxTrail) {
        this.trail.shift();
      }
    }
  }

  draw(context: CanvasRenderingContext2D) {
    if (this.hasTrail) {
      for (let i = 0; i < this.trail.length; i++) {
        const pt = this.trail[i];
        const factor = i / this.trail.length;
        const trailRadius = Math.max(1.5, this.radius * factor * 0.75);

        context.save();
        context.beginPath();
        context.arc(pt.x, pt.y, trailRadius, 0, Math.PI * 2);
        context.fillStyle = this.color;
        context.globalAlpha = factor * 0.35;
        context.shadowColor = this.color;
        context.shadowBlur = 8 * factor;
        context.fill();
        context.restore();
      }
    }

    const isDark = this.color === '#000000' || this.color === '#111111';
    const effectiveGlow = isDark ? 'rgba(0, 240, 255, 0.85)' : this.glowColor;

    context.save();
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    context.shadowColor = this.flash > 0 ? '#ffffff' : effectiveGlow;
    context.shadowBlur = 14 + this.flash * 20;

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
      grad.addColorStop(0.6, '#ffffff');
      grad.addColorStop(1, isDark ? '#1a2234' : this.color);
    } else if (isDark) {
      grad.addColorStop(0, '#90a4ae');
      grad.addColorStop(0.25, '#37474f');
      grad.addColorStop(1, '#070a0e');
    } else {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, this.color);
      grad.addColorStop(1, '#0c0715');
    }

    context.fillStyle = grad;
    context.fill();

    context.lineWidth = 1.6;
    context.strokeStyle = isDark ? 'rgba(0, 240, 255, 0.85)' : 'rgba(255, 255, 255, 0.75)';
    context.stroke();

    context.restore();

    if (this.flash > 0) {
      this.flash = Math.max(0, this.flash - 0.08);
    }
  }
}
