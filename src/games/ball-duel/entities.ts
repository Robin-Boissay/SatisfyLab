export class DuelBall {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public radius: number;
  public side: 'left' | 'right';
  public damage: number;
  public flash: number = 0;
  private trail: { x: number; y: number; alpha: number }[] = [];

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    side: 'left' | 'right',
    damage: number
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.side = side;
    this.damage = damage;
  }

  public update(dt: number, gravity: number, minX: number, maxX: number, bounce: number) {
    this.vy += gravity * 1200 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Traînée lumineuse
    this.trail.unshift({ x: this.x, y: this.y, alpha: 0.6 });
    if (this.trail.length > 5) {
      this.trail.pop();
    }
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].alpha *= 0.8;
    }

    if (this.flash > 0) {
      this.flash = Math.max(0, this.flash - dt * 4);
    }

    // Rebond parois latérales
    if (this.x - this.radius < minX) {
      this.x = minX + this.radius;
      this.vx = Math.abs(this.vx) * bounce;
    } else if (this.x + this.radius > maxX) {
      this.x = maxX - this.radius;
      this.vx = -Math.abs(this.vx) * bounce;
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    const isLeft = this.side === 'left';
    const baseColor = isLeft ? '#00f0ff' : '#ff007f';
    const glowColor = isLeft ? 'rgba(0, 240, 255, 0.8)' : 'rgba(255, 0, 127, 0.8)';

    // Traînée
    for (let i = 0; i < this.trail.length; i++) {
      const pt = this.trail[i];
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, this.radius * (1 - (i + 1) / (this.trail.length + 1)), 0, Math.PI * 2);
      ctx.fillStyle = isLeft
        ? `rgba(0, 240, 255, ${pt.alpha * 0.4})`
        : `rgba(255, 0, 127, ${pt.alpha * 0.4})`;
      ctx.fill();
    }

    // Bille
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.flash > 0 ? '#ffffff' : baseColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = this.flash > 0 ? 16 : 8;
    ctx.fill();

    // Reflet blanc intérieur
    ctx.beginPath();
    ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.shadowBlur = 0;
    ctx.fill();

    ctx.restore();
  }
}

export class HorizontalBar {
  public index: number;
  public side: 'left' | 'right';
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public maxHp: number;
  public currentHp: number;
  public isBroken: boolean = false;
  public hitFlash: number = 0;
  private shakeOffset: number = 0;

  constructor(
    index: number,
    side: 'left' | 'right',
    x: number,
    y: number,
    width: number,
    height: number,
    hp: number
  ) {
    this.index = index;
    this.side = side;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.maxHp = Math.max(1, Math.round(hp));
    this.currentHp = this.maxHp;
  }

  public hit(damage: number): boolean {
    if (this.isBroken) return false;
    this.currentHp -= damage;
    this.hitFlash = 1.0;
    this.shakeOffset = (Math.random() - 0.5) * 6;

    if (this.currentHp <= 0) {
      this.currentHp = 0;
      this.isBroken = true;
      return true; // Brisé !
    }
    return false;
  }

  public update(dt: number) {
    if (this.hitFlash > 0) {
      this.hitFlash = Math.max(0, this.hitFlash - dt * 5);
    }
    this.shakeOffset *= 0.85;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    if (this.isBroken) return;

    const isLeft = this.side === 'left';
    const mainColor = isLeft ? '#00f0ff' : '#ff007f';
    const glowColor = isLeft ? 'rgba(0, 240, 255, 0.7)' : 'rgba(255, 0, 127, 0.7)';
    const hpRatio = Math.max(0, Math.min(1, this.currentHp / this.maxHp));

    const drawX = this.x;
    const drawY = this.y + this.shakeOffset;
    const radius = 6;

    ctx.save();

    // 1. Fond sombre de la barre
    ctx.beginPath();
    ctx.roundRect(drawX, drawY, this.width, this.height, radius);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fill();

    // 2. Remplissage dégressif des HP
    const fillWidth = Math.max(4, this.width * hpRatio);
    ctx.beginPath();
    ctx.roundRect(drawX, drawY, fillWidth, this.height, radius);
    if (this.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      const grad = ctx.createLinearGradient(drawX, drawY, drawX + fillWidth, drawY);
      if (isLeft) {
        grad.addColorStop(0, '#0088cc');
        grad.addColorStop(1, '#00f0ff');
      } else {
        grad.addColorStop(0, '#aa0055');
        grad.addColorStop(1, '#ff007f');
      }
      ctx.fillStyle = grad;
    }
    ctx.fill();

    // 3. Contour néon lumineux
    ctx.beginPath();
    ctx.roundRect(drawX, drawY, this.width, this.height, radius);
    ctx.strokeStyle = this.hitFlash > 0 ? '#ffffff' : mainColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = this.hitFlash > 0 ? 14 : 8;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. Texte HP centré et lisible
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.currentHp} HP`, drawX + this.width / 2, drawY + this.height / 2);

    ctx.restore();
  }
}

export class DuelParticle {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public radius: number;
  public color: string;
  public alpha: number = 1.0;
  public life: number = 1.0;
  public decay: number;

  constructor(x: number, y: number, color: string, speedScale: number = 1.0) {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 180 + 40) * speedScale;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = Math.random() * 3 + 1.5;
    this.decay = Math.random() * 1.5 + 1.2;
  }

  public update(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 300 * dt; // légère gravité
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

export class FloatingNotification {
  public x: number;
  public y: number;
  public text: string;
  public color: string;
  public alpha: number = 1.0;
  public life: number = 1.2;

  constructor(x: number, y: number, text: string, color: string) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
  }

  public update(dt: number) {
    this.y -= 45 * dt;
    this.life -= dt;
    this.alpha = Math.max(0, this.life / 1.2);
  }

  public draw(ctx: CanvasRenderingContext2D) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.font = '900 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

