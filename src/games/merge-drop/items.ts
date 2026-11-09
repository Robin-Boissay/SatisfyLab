import { MergeTier, SkinTheme, getTiersForTheme } from './types';

export class MergeBall {
  id: number;
  tier: number;
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  radius: number;
  mass: number;
  tierData: MergeTier;
  theme: SkinTheme;
  scale: number = 1.0;
  targetScale: number = 1.0;
  flash: number = 0;
  isMerging: boolean = false;
  rotation: number = 0;
  rotSpeed: number = 0;

  constructor(
    id: number,
    tier: number,
    x: number,
    y: number,
    theme: SkinTheme = 'solar',
    isNewMerge: boolean = false
  ) {
    this.id = id;
    this.theme = theme;
    const tiers = getTiersForTheme(theme);
    this.tier = Math.min(tier, tiers.length - 1);
    this.tierData = tiers[this.tier];
    this.radius = this.tierData.radius;
    this.mass = Math.pow(this.radius, 2);
    this.x = x;
    this.y = y;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.8;

    if (isNewMerge) {
      this.scale = 1.4; // Pop élastique
      this.flash = 1.0;
    }
  }

  public setTheme(theme: SkinTheme) {
    this.theme = theme;
    const tiers = getTiersForTheme(theme);
    this.tierData = tiers[this.tier];
  }

  update(dt: number) {
    this.rotation += this.rotSpeed * dt;
    if (this.scale > this.targetScale) {
      this.scale = Math.max(this.targetScale, this.scale - 2.8 * dt);
    }
    if (this.flash > 0) {
      this.flash = Math.max(0, this.flash - 4.0 * dt);
    }
  }

  draw(context: CanvasRenderingContext2D) {
    const currentRadius = this.radius * this.scale;

    context.save();
    context.translate(this.x, this.y);

    if (this.theme === 'solar') {
      this.drawSolarBody(context, currentRadius);
    } else {
      this.drawNeonOrb(context, currentRadius);
    }

    context.restore();
  }

  /**
   * Rendu spécifique pour le Système Solaire (Planètes, Anneaux, Atmosphères, Soleil)
   */
  private drawSolarBody(context: CanvasRenderingContext2D, r: number) {
    const td = this.tierData;

    // 1. Atmosphère / Rayonnement Céleste externe
    context.save();
    context.beginPath();
    const auraRadius = this.tier === 9 ? r * 1.8 : r * 1.35;
    context.arc(0, 0, auraRadius, 0, Math.PI * 2);
    const aura = context.createRadialGradient(0, 0, r * 0.4, 0, 0, auraRadius);
    aura.addColorStop(0, td.glowColor);
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = aura;
    context.globalAlpha = this.tier === 9 ? 0.65 : 0.4;
    context.fill();
    context.restore();

    // 2. Pour le Soleil (Niveau 9) : Rayons solaires incandescents
    if (this.tier === 9) {
      context.save();
      context.rotate(this.rotation * 0.5);
      const spikes = 12;
      for (let i = 0; i < spikes; i++) {
        const ang = (i * Math.PI * 2) / spikes;
        const outer = r * 1.35 + Math.sin(performance.now() * 0.005 + i) * 6;
        context.beginPath();
        context.moveTo(Math.cos(ang) * (r * 0.9), Math.sin(ang) * (r * 0.9));
        context.lineTo(Math.cos(ang) * outer, Math.sin(ang) * outer);
        context.strokeStyle = i % 2 === 0 ? 'rgba(255, 215, 0, 0.7)' : 'rgba(255, 109, 0, 0.8)';
        context.lineWidth = 4;
        context.lineCap = 'round';
        context.stroke();
      }
      context.restore();
    }

    // 3. Pour Saturne (Niveau 7) : Anneaux planétaires majestueux (partie arrière)
    if (this.tier === 7) {
      context.save();
      context.rotate(-0.35);
      context.beginPath();
      context.ellipse(0, 0, r * 1.8, r * 0.55, 0, Math.PI, Math.PI * 2);
      context.strokeStyle = 'rgba(215, 204, 200, 0.6)';
      context.lineWidth = 5;
      context.stroke();
      context.restore();
    }

    // 4. Corps principal sphérique 3D
    context.save();
    context.beginPath();
    context.arc(0, 0, r, 0, Math.PI * 2);

    context.shadowColor = this.flash > 0 ? '#ffffff' : td.glowColor;
    context.shadowBlur = 16 + this.flash * 20;

    const grad = context.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.05, 0, 0, r);

    if (this.flash > 0) {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.6, '#ffffff');
      grad.addColorStop(1, td.color);
    } else {
      grad.addColorStop(0, td.secondaryColor || '#ffffff');
      grad.addColorStop(0.35, td.color);
      grad.addColorStop(1, '#05070c');
    }

    context.fillStyle = grad;
    context.fill();

    // 5. Bandes gazeuses (Jupiter) ou continents (Terre)
    if (this.tier === 8 && this.flash <= 0) {
      // Bandes horizontales de Jupiter
      context.save();
      context.clip();
      context.strokeStyle = 'rgba(255, 224, 178, 0.5)';
      context.lineWidth = 6;
      [-r * 0.5, -r * 0.1, r * 0.3].forEach((yBand) => {
        context.beginPath();
        context.moveTo(-r, yBand);
        context.lineTo(r, yBand);
        context.stroke();
      });
      // Grande Tache Rouge
      context.beginPath();
      context.arc(r * 0.3, r * 0.25, r * 0.16, 0, Math.PI * 2);
      context.fillStyle = '#b71c1c';
      context.fill();
      context.restore();
    } else if (this.tier === 4 && this.flash <= 0) {
      // Continents de la Terre
      context.save();
      context.clip();
      context.fillStyle = '#43a047';
      context.beginPath();
      context.arc(-r * 0.2, -r * 0.1, r * 0.32, 0, Math.PI * 2);
      context.arc(r * 0.25, r * 0.2, r * 0.28, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    // 6. Anneau de Saturne (partie avant)
    if (this.tier === 7) {
      context.save();
      context.rotate(-0.35);
      context.beginPath();
      context.ellipse(0, 0, r * 1.8, r * 0.55, 0, 0, Math.PI);
      context.strokeStyle = 'rgba(255, 238, 88, 0.9)';
      context.lineWidth = 6;
      context.stroke();
      context.beginPath();
      context.ellipse(0, 0, r * 2.05, r * 0.65, 0, 0, Math.PI);
      context.strokeStyle = 'rgba(215, 204, 200, 0.6)';
      context.lineWidth = 3;
      context.stroke();
      context.restore();
    }

    // Contour atmosphérique
    context.lineWidth = Math.max(1.5, r * 0.05);
    context.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    context.stroke();

    // Symbole / Emoji de la planète
    context.fillStyle = '#ffffff';
    context.font = `bold ${Math.max(12, Math.round(r * 0.52))}px 'Inter', sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.shadowBlur = 4;
    context.shadowColor = '#000000';
    context.fillText(td.symbol, 0, 1);

    context.restore();
  }

  /**
   * Rendu classique Néon Cyberpunk
   */
  private drawNeonOrb(context: CanvasRenderingContext2D, r: number) {
    const td = this.tierData;

    // Halo
    context.beginPath();
    context.arc(0, 0, r * 1.5, 0, Math.PI * 2);
    const aura = context.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.5);
    aura.addColorStop(0, td.glowColor);
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = aura;
    context.globalAlpha = 0.4;
    context.fill();

    // Sphère
    context.beginPath();
    context.arc(0, 0, r, 0, Math.PI * 2);
    context.shadowColor = this.flash > 0 ? '#ffffff' : td.glowColor;
    context.shadowBlur = 18 + this.flash * 20;

    const grad = context.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.05, 0, 0, r);
    if (this.flash > 0) {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.6, '#ffffff');
      grad.addColorStop(1, td.color);
    } else {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.25, '#ffffff');
      grad.addColorStop(0.65, td.color);
      grad.addColorStop(1, '#070913');
    }
    context.fillStyle = grad;
    context.fill();

    // Bordure néon
    context.lineWidth = Math.max(1.5, r * 0.06);
    context.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    context.stroke();

    // Numéro de niveau
    context.fillStyle = '#ffffff';
    context.font = `bold ${Math.max(11, Math.round(r * 0.55))}px 'JetBrains Mono', sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.shadowBlur = 4;
    context.shadowColor = '#000000';
    context.fillText(this.tier === 9 ? '👑' : `${this.tier + 1}`, 0, 1);
  }
}

export class MergeSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const spd = 2 + Math.random() * 8;
    this.vx = Math.cos(angle) * spd;
    this.vy = Math.sin(angle) * spd;
    this.color = color;
    this.size = 2.5 + Math.random() * 3.5;
    this.life = 0.5 + Math.random() * 0.35;
    this.maxLife = this.life;
  }

  update(dt: number) {
    this.vy += 0.2 * dt;
    this.vx *= 0.97;
    this.vy *= 0.97;
    this.x += this.vx;
    this.y += this.vy;
    this.life -= dt;
  }

  draw(context: CanvasRenderingContext2D) {
    if (this.life <= 0) return;
    const alpha = Math.max(0, this.life / this.maxLife);
    context.save();
    context.globalAlpha = alpha;
    context.fillStyle = this.color;
    context.shadowColor = this.color;
    context.shadowBlur = 8;
    context.beginPath();
    context.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}
