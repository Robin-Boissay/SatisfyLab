import { TeamId } from './types';

export class TerritoryBall {
  public id: number;
  public team: TeamId;
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public radius: number;
  public flash: number = 0;
  public isOverdrive: boolean = false;
  private trail: { x: number; y: number; alpha: number }[] = [];

  constructor(
    id: number,
    team: TeamId,
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number
  ) {
    this.id = id;
    this.team = team;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
  }

  public update(
    dt: number,
    gravity: number,
    minX: number,
    maxX: number,
    minY: number,
    maxY: number
  ) {
    this.vy += gravity * 800 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Enregistrement traînée
    this.trail.unshift({ x: this.x, y: this.y, alpha: 0.7 });
    if (this.trail.length > 7) {
      this.trail.pop();
    }
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].alpha *= 0.85;
    }

    if (this.flash > 0) {
      this.flash = Math.max(0, this.flash - dt * 5);
    }

    // Rebond parois extérieures
    if (this.x - this.radius < minX) {
      this.x = minX + this.radius;
      this.vx = Math.abs(this.vx);
    } else if (this.x + this.radius > maxX) {
      this.x = maxX - this.radius;
      this.vx = -Math.abs(this.vx);
    }

    if (this.y - this.radius < minY) {
      this.y = minY + this.radius;
      this.vy = Math.abs(this.vy);
    } else if (this.y + this.radius > maxY) {
      this.y = maxY - this.radius;
      this.vy = -Math.abs(this.vy);
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    const isCyan = this.team === 'cyan';
    const mainColor = isCyan ? '#00f0ff' : '#ff007f';
    const glowColor = isCyan ? 'rgba(0, 240, 255, 0.9)' : 'rgba(255, 0, 127, 0.9)';

    // Traînée lumineuse
    for (let i = 0; i < this.trail.length; i++) {
      const pt = this.trail[i];
      const scale = (1 - (i + 1) / (this.trail.length + 1));
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, this.radius * scale, 0, Math.PI * 2);
      ctx.fillStyle = isCyan
        ? `rgba(0, 240, 255, ${pt.alpha * 0.45})`
        : `rgba(255, 0, 127, ${pt.alpha * 0.45})`;
      ctx.fill();
    }

    // Corps de la bille
    ctx.save();

    // Aura Overdrive
    if (this.isOverdrive) {
      const pulse = (Math.sin(performance.now() * 0.015) + 1) * 0.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * (1.6 + pulse * 0.4), 0, Math.PI * 2);
      ctx.fillStyle = isCyan ? 'rgba(0, 240, 255, 0.25)' : 'rgba(255, 0, 127, 0.25)';
      ctx.shadowColor = mainColor;
      ctx.shadowBlur = 20;
      ctx.fill();

      // Éclairs / anneau électrique
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * (1.3 + pulse * 0.2), 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.flash > 0 ? '#ffffff' : mainColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = this.flash > 0 ? 22 : (this.isOverdrive ? 18 : 10);
    ctx.fill();

    // Cœur blanc
    ctx.beginPath();
    ctx.arc(
      this.x - this.radius * 0.28,
      this.y - this.radius * 0.28,
      this.radius * 0.35,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 0;
    ctx.fill();
    ctx.restore();
  }
}

export class Tile {
  public col: number;
  public row: number;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public team: TeamId;
  public flipAnim: number = 0;

  constructor(
    col: number,
    row: number,
    x: number,
    y: number,
    width: number,
    height: number,
    initialTeam: TeamId
  ) {
    this.col = col;
    this.row = row;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.team = initialTeam;
  }

  public capture(newTeam: TeamId): boolean {
    if (this.team === newTeam) return false;
    this.team = newTeam;
    this.flipAnim = 1.0;
    return true;
  }

  public update(dt: number) {
    if (this.flipAnim > 0) {
      this.flipAnim = Math.max(0, this.flipAnim - dt * 3.5);
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    const isCyan = this.team === 'cyan';
    const margin = 0.6;
    const drawX = this.x + margin;
    const drawY = this.y + margin;
    const drawW = Math.max(1, this.width - margin * 2);
    const drawH = Math.max(1, this.height - margin * 2);

    ctx.save();

    if (this.flipAnim > 0) {
      // Effet d'impulsion / pop néon lors de la capture
      const scale = 1 + this.flipAnim * 0.2;
      const centerX = drawX + drawW / 2;
      const centerY = drawY + drawH / 2;
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);
      ctx.translate(-centerX, -centerY);

      ctx.fillStyle = isCyan ? '#ffffff' : '#ffffff';
      ctx.shadowColor = isCyan ? '#00f0ff' : '#ff007f';
      ctx.shadowBlur = 12;
      ctx.fillRect(drawX, drawY, drawW, drawH);
    } else {
      ctx.fillStyle = isCyan ? 'rgba(0, 180, 240, 0.72)' : 'rgba(230, 0, 115, 0.72)';
      ctx.fillRect(drawX, drawY, drawW, drawH);

      // Bordure discrète
      ctx.strokeStyle = isCyan ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 0, 127, 0.3)';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(drawX, drawY, drawW, drawH);
    }

    ctx.restore();
  }
}

export class TerritoryParticle {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public radius: number;
  public color: string;
  public alpha: number = 1.0;
  public life: number = 1.0;
  public decay: number;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 120 + 30;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = Math.random() * 2.5 + 1.2;
    this.decay = Math.random() * 2.0 + 1.5;
  }

  public update(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= this.decay * dt;
    this.alpha = Math.max(0, this.life);
  }

  public draw(ctx: CanvasRenderingContext2D) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.restore();
  }
}

