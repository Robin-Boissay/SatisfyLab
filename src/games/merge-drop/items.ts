import { MergeTier, SkinTheme, getTiersForTheme, getThemeDefinition, textureManager } from './types';

export class MergeBall {
  id: number;
  tier: number;
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  radius: number; // Rayon physique de collision (Hitbox)
  visualRadius: number; // Rayon visuel d'affichage de l'image
  mass: number;
  tierData: MergeTier;
  theme: SkinTheme;
  scale: number = 1.0;
  targetScale: number = 1.0;
  flash: number = 0;
  isMerging: boolean = false;
  mergeCooldown: number = 0;
  rotation: number = 0;
  rotSpeed: number = 0;
  age: number = 0; // Temps écoulé depuis l'apparition
  baseRadius: number = 16;
  hasLanded: boolean = false; // Vrai uniquement quand la bille a touché le fond ou la pile
  showOutline: boolean = true;
  hitboxScale: number = 1.0;
  showHitboxDebug: boolean = false;
  private currentTiers?: MergeTier[];

  constructor(
    id: number,
    tier: number,
    x: number,
    y: number,
    theme: SkinTheme = 'solar',
    isNewMerge: boolean = false,
    baseRadius: number = 16,
    customTiers?: MergeTier[],
    showOutline: boolean = true,
    hitboxScale: number = 1.0,
    showHitboxDebug: boolean = false
  ) {
    this.id = id;
    this.theme = theme;
    this.baseRadius = baseRadius;
    this.currentTiers = customTiers;
    this.showOutline = showOutline;
    this.hitboxScale = Math.max(0.4, Math.min(2.0, hitboxScale ?? 1.0));
    this.showHitboxDebug = showHitboxDebug ?? false;

    const tiers = customTiers || getTiersForTheme(theme, baseRadius);
    this.tier = Math.min(tier, tiers.length - 1);
    this.tierData = tiers[this.tier];
    this.visualRadius = this.tierData.visualRadius || this.tierData.radius;
    // Le rayon physique de collision s'ajuste avec l'échelle de hitbox
    this.radius = this.tierData.visualRadius
      ? this.tierData.radius
      : Math.max(4, Math.round(this.visualRadius * this.hitboxScale * 10) / 10);
    this.mass = Math.pow(this.radius, 2);
    this.x = x;
    this.y = y;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.6;

    if (isNewMerge) {
      this.scale = 1.45; // Pop élastique
      this.flash = 1.0;
      this.hasLanded = true; // Une bille issue d'une fusion a déjà atterri dans le jeu
      this.mergeCooldown = 0.16; // Délai d'immunité anti-fusion multiple instantanée
    }
  }

  public setActiveTiers(tiers: MergeTier[]) {
    this.currentTiers = tiers;
    this.tier = Math.min(this.tier, tiers.length - 1);
    this.tierData = tiers[this.tier];
    this.visualRadius = this.tierData.visualRadius || this.tierData.radius;
    this.radius = this.tierData.visualRadius
      ? this.tierData.radius
      : Math.max(4, Math.round(this.visualRadius * this.hitboxScale * 10) / 10);
    this.mass = Math.pow(this.radius, 2);
  }

  public setTheme(theme: SkinTheme, baseRadius?: number, activeTiers?: MergeTier[]) {
    this.theme = theme;
    if (baseRadius !== undefined) this.baseRadius = baseRadius;
    if (activeTiers) this.currentTiers = activeTiers;
    const tiers = this.currentTiers || getTiersForTheme(theme, this.baseRadius);
    this.tier = Math.min(this.tier, tiers.length - 1);
    this.tierData = tiers[this.tier];
    this.visualRadius = this.tierData.visualRadius || this.tierData.radius;
    this.radius = this.tierData.visualRadius
      ? this.tierData.radius
      : Math.max(4, Math.round(this.visualRadius * this.hitboxScale * 10) / 10);
    this.mass = Math.pow(this.radius, 2);
  }

  public setShowOutline(showOutline: boolean) {
    this.showOutline = showOutline;
  }

  public setHitboxScale(hitboxScale: number, activeTiers?: MergeTier[]) {
    this.hitboxScale = Math.max(0.4, Math.min(2.0, hitboxScale));
    if (activeTiers) this.currentTiers = activeTiers;
    const tiers = this.currentTiers || getTiersForTheme(this.theme, this.baseRadius);
    this.tier = Math.min(this.tier, tiers.length - 1);
    this.tierData = tiers[this.tier];
    this.visualRadius = this.tierData.visualRadius || this.tierData.radius;
    this.radius = this.tierData.visualRadius
      ? this.tierData.radius
      : Math.max(4, Math.round(this.visualRadius * this.hitboxScale * 10) / 10);
    this.mass = Math.pow(this.radius, 2);
  }

  public setShowHitboxDebug(show: boolean) {
    this.showHitboxDebug = show;
  }

  public updateRadius(baseRadius: number, activeTiers?: MergeTier[]) {
    this.baseRadius = baseRadius;
    if (activeTiers) this.currentTiers = activeTiers;
    const tiers = this.currentTiers || getTiersForTheme(this.theme, baseRadius);
    this.tier = Math.min(this.tier, tiers.length - 1);
    this.tierData = tiers[this.tier];
    this.visualRadius = this.tierData.visualRadius || this.tierData.radius;
    this.radius = this.tierData.visualRadius
      ? this.tierData.radius
      : Math.max(4, Math.round(this.visualRadius * this.hitboxScale * 10) / 10);
    this.mass = Math.pow(this.radius, 2);
  }

  update(dt: number) {
    this.age += dt;
    this.rotation += this.rotSpeed * dt;
    if (this.scale > this.targetScale) {
      this.scale = Math.max(this.targetScale, this.scale - 2.8 * dt);
    }
    if (this.flash > 0) {
      this.flash = Math.max(0, this.flash - 4.0 * dt);
    }
    if (this.mergeCooldown > 0) {
      this.mergeCooldown = Math.max(0, this.mergeCooldown - dt);
    }
  }

  draw(context: CanvasRenderingContext2D) {
    const visualR = (this.visualRadius || this.radius) * this.scale;
    const hitboxR = this.radius * this.scale;

    context.save();
    context.translate(this.x, this.y);

    const imageSrc = this.tierData.image;
    const img = imageSrc ? textureManager.getImage(imageSrc) : null;

    if (img) {
      this.drawSpriteBall(context, visualR, img);
    } else {
      const themeDef = getThemeDefinition(this.theme);
      switch (themeDef.renderStyle) {
        case 'solar':
          this.drawSolarBody(context, visualR);
          break;
        case 'neon':
          this.drawNeonOrb(context, visualR);
          break;
        case 'gem':
          this.drawGemStone(context, visualR);
          break;
        case 'glossy':
        default:
          this.drawGlossyBadge(context, visualR);
          break;
      }
    }

    // Affichage debug du contour de la hitbox physique ronde
    if (this.showHitboxDebug) {
      context.save();
      context.beginPath();
      context.arc(0, 0, hitboxR, 0, Math.PI * 2);
      context.strokeStyle = this.hitboxScale > 1.0 ? 'rgba(0, 240, 255, 0.95)' : 'rgba(0, 255, 102, 0.95)';
      context.lineWidth = 2.2;
      context.setLineDash([5, 4]);
      context.stroke();

      context.beginPath();
      context.arc(0, 0, 2.5, 0, Math.PI * 2);
      context.fillStyle = '#ffffff';
      context.fill();
      context.restore();
    }

    context.restore();
  }

  /**
   * Rendu Sprite d'image PNG/WebP avec rotation physique, glow et flash
   */
  private drawSpriteBall(context: CanvasRenderingContext2D, r: number, img: HTMLImageElement) {
    const td = this.tierData;

    // Halo / Aura extérieure (uniquement si l'option est active)
    if (this.showOutline) {
      context.save();
      context.beginPath();
      context.arc(0, 0, r * 1.25, 0, Math.PI * 2);
      const aura = context.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.25);
      aura.addColorStop(0, td.glowColor);
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      context.fillStyle = aura;
      context.globalAlpha = 0.55;
      context.fill();
      context.restore();
    }

    // Rendu du sprite avec rotation physique
    context.save();
    context.rotate(this.rotation);

    if (this.showOutline || this.flash > 0) {
      context.shadowColor = this.flash > 0 ? '#ffffff' : td.glowColor;
      context.shadowBlur = this.flash > 0 ? (12 + this.flash * 20) : 8;
    }

    const drawR = r * 0.98;
    context.drawImage(img, -drawR, -drawR, drawR * 2, drawR * 2);

    // Effet de flash blanc lors de la fusion
    if (this.flash > 0) {
      context.beginPath();
      context.arc(0, 0, drawR, 0, Math.PI * 2);
      context.fillStyle = `rgba(255, 255, 255, ${Math.min(0.85, this.flash)})`;
      context.fill();
    }
    context.restore();
  }

  /**
   * Rendu Stylisé Kawaii / Glossy Badge (Idéal Légumes, Animaux, Bonbons)
   */
  private drawGlossyBadge(context: CanvasRenderingContext2D, r: number) {
    const td = this.tierData;

    // Halo lumineux externe
    context.save();
    context.beginPath();
    context.arc(0, 0, r * 1.35, 0, Math.PI * 2);
    const aura = context.createRadialGradient(0, 0, r * 0.35, 0, 0, r * 1.35);
    aura.addColorStop(0, td.glowColor);
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = aura;
    context.globalAlpha = 0.5;
    context.fill();
    context.restore();

    // Sphère 3D stylisée
    context.save();
    context.beginPath();
    context.arc(0, 0, r, 0, Math.PI * 2);
    context.shadowColor = this.flash > 0 ? '#ffffff' : td.glowColor;
    context.shadowBlur = 16 + this.flash * 20;

    const grad = context.createRadialGradient(-r * 0.32, -r * 0.32, r * 0.05, 0, 0, r);
    if (this.flash > 0) {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.6, '#ffffff');
      grad.addColorStop(1, td.color);
    } else {
      grad.addColorStop(0, td.secondaryColor || '#ffffff');
      grad.addColorStop(0.4, td.color);
      grad.addColorStop(1, '#090d16');
    }
    context.fillStyle = grad;
    context.fill();

    // Reflet brillant en croissant supérieur
    if (this.flash <= 0) {
      context.save();
      context.beginPath();
      context.ellipse(-r * 0.15, -r * 0.38, r * 0.52, r * 0.22, -0.25, 0, Math.PI * 2);
      context.fillStyle = 'rgba(255, 255, 255, 0.42)';
      context.fill();
      context.restore();
    }

    // Bordure douce (si option active)
    if (this.showOutline) {
      context.lineWidth = Math.max(1.5, r * 0.05);
      context.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      context.stroke();
    }

    // Emoji / Symbole au centre (avec rotation physique douce)
    context.save();
    context.rotate(this.rotation * 0.3);
    const fontSize = Math.max(13, Math.round(r * 0.75));
    context.font = `${fontSize}px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.shadowColor = 'rgba(0, 0, 0, 0.6)';
    context.shadowBlur = 6;
    context.fillText(td.symbol, 0, 2);
    context.restore();

    context.restore();
  }

  /**
   * Rendu Gemme & Cristal facetté (Idéal Minerais & Trésors)
   */
  private drawGemStone(context: CanvasRenderingContext2D, r: number) {
    const td = this.tierData;

    // Halo étincelant
    context.save();
    context.beginPath();
    context.arc(0, 0, r * 1.45, 0, Math.PI * 2);
    const aura = context.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.45);
    aura.addColorStop(0, td.glowColor);
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = aura;
    context.globalAlpha = 0.6;
    context.fill();
    context.restore();

    // Orbe cristalline
    context.save();
    context.beginPath();
    context.arc(0, 0, r, 0, Math.PI * 2);
    context.shadowColor = this.flash > 0 ? '#ffffff' : td.glowColor;
    context.shadowBlur = 18 + this.flash * 20;

    const grad = context.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.02, 0, 0, r);
    if (this.flash > 0) {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(1, td.color);
    } else {
      grad.addColorStop(0, td.secondaryColor || '#ffffff');
      grad.addColorStop(0.45, td.color);
      grad.addColorStop(1, '#050a14');
    }
    context.fillStyle = grad;
    context.fill();

    // Facettes géométriques de cristal
    if (this.flash <= 0) {
      context.save();
      context.clip();
      context.rotate(this.rotation * 0.2);

      context.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      context.lineWidth = Math.max(1, r * 0.04);

      // Facette hexagonale intérieure
      context.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3;
        const fx = Math.cos(ang) * (r * 0.62);
        const fy = Math.sin(ang) * (r * 0.62);
        if (i === 0) context.moveTo(fx, fy);
        else context.lineTo(fx, fy);
      }
      context.closePath();
      context.stroke();

      // Rayons de facettes vers le bord
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3;
        context.beginPath();
        context.moveTo(Math.cos(ang) * (r * 0.62), Math.sin(ang) * (r * 0.62));
        context.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
        context.stroke();
      }

      // Éclat spéculaire étoile
      context.fillStyle = 'rgba(255, 255, 255, 0.85)';
      context.beginPath();
      context.arc(-r * 0.3, -r * 0.3, Math.max(2, r * 0.12), 0, Math.PI * 2);
      context.fill();

      context.restore();
    }

    // Bordure cristalline
    context.lineWidth = Math.max(1.5, r * 0.05);
    context.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    context.stroke();

    // Symbole / Emoji de gemme au centre
    context.save();
    const fontSize = Math.max(12, Math.round(r * 0.65));
    context.font = `${fontSize}px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.shadowColor = '#000000';
    context.shadowBlur = 6;
    context.fillText(td.symbol, 0, 1);
    context.restore();

    context.restore();
  }

  /**
   * Rendu visuel haute fidélité pour le Système Solaire (Planètes, textures détaillées, anneaux, Soleil)
   */
  private drawSolarBody(context: CanvasRenderingContext2D, r: number) {
    const td = this.tierData;
    const t = this.tier;

    // 1. Atmosphère / Rayonnement Céleste externe (Aura)
    context.save();
    context.beginPath();
    const auraRadius = t === 9 ? r * 1.9 : r * 1.38;
    context.arc(0, 0, auraRadius, 0, Math.PI * 2);
    const aura = context.createRadialGradient(0, 0, r * 0.45, 0, 0, auraRadius);
    aura.addColorStop(0, td.glowColor);
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = aura;
    context.globalAlpha = t === 9 ? 0.75 : 0.42;
    context.fill();
    context.restore();

    // 2. Soleil (Tier 9) : Flammes, éruptions coronales dynamiques
    if (t === 9) {
      context.save();
      const time = performance.now() * 0.003;
      context.rotate(this.rotation * 0.35);

      const spikes = 16;
      for (let i = 0; i < spikes; i++) {
        const ang = (i * Math.PI * 2) / spikes;
        const pulse = Math.sin(time * 2 + i * 1.7) * 8 + Math.cos(time * 3 + i) * 4;
        const outer = r * 1.32 + pulse;
        const cpAng1 = ang - 0.08;
        const cpAng2 = ang + 0.08;

        context.beginPath();
        context.moveTo(Math.cos(cpAng1) * (r * 0.95), Math.sin(cpAng1) * (r * 0.95));
        context.quadraticCurveTo(
          Math.cos(ang) * (outer * 1.15),
          Math.sin(ang) * (outer * 1.15),
          Math.cos(cpAng2) * (r * 0.95),
          Math.sin(cpAng2) * (r * 0.95)
        );
        context.fillStyle = i % 2 === 0 ? 'rgba(255, 215, 0, 0.65)' : 'rgba(255, 109, 0, 0.75)';
        context.shadowColor = '#ff6d00';
        context.shadowBlur = 14;
        context.fill();
      }
      context.restore();
    }

    // 3. Saturne (Tier 7) : Anneaux planétaires (Partie arrière, derrière la sphère)
    if (t === 7) {
      context.save();
      context.rotate(-0.38);
      // Anneau B & A arrière avec division de Cassini
      context.beginPath();
      context.ellipse(0, 0, r * 2.15, r * 0.58, 0, Math.PI, Math.PI * 2);
      context.strokeStyle = 'rgba(215, 204, 180, 0.4)';
      context.lineWidth = r * 0.22;
      context.stroke();

      context.beginPath();
      context.ellipse(0, 0, r * 1.72, r * 0.46, 0, Math.PI, Math.PI * 2);
      context.strokeStyle = 'rgba(255, 238, 140, 0.65)';
      context.lineWidth = r * 0.28;
      context.stroke();
      context.restore();
    }

    // 4. Corps principal sphérique 3D
    context.save();
    context.beginPath();
    context.arc(0, 0, r, 0, Math.PI * 2);

    context.shadowColor = this.flash > 0 ? '#ffffff' : td.glowColor;
    context.shadowBlur = 18 + this.flash * 22;

    const grad = context.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.04, 0, 0, r);

    if (this.flash > 0) {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.6, '#ffffff');
      grad.addColorStop(1, td.color);
    } else {
      grad.addColorStop(0, td.secondaryColor || '#ffffff');
      grad.addColorStop(0.45, td.color);
      grad.addColorStop(1, '#05070f');
    }

    context.fillStyle = grad;
    context.fill();

    // 5. Textures Spécifiques de chaque Planète / Astre
    if (this.flash <= 0) {
      context.save();
      context.clip(); // Clipper dans la sphère

      switch (t) {
        case 0: // Astéroïde : Cratères rugueux & texture rocheuse
          context.fillStyle = 'rgba(50, 50, 60, 0.45)';
          [
            [-r * 0.3, -r * 0.2, r * 0.22],
            [r * 0.25, r * 0.3, r * 0.28],
            [r * 0.1, -r * 0.4, r * 0.15],
            [-r * 0.2, r * 0.35, r * 0.18]
          ].forEach(([cx, cy, cr]) => {
            context.beginPath();
            context.arc(cx, cy, cr, 0, Math.PI * 2);
            context.fill();
            // Ombrage intérieur de cratère
            context.strokeStyle = 'rgba(20, 20, 25, 0.6)';
            context.lineWidth = 1.5;
            context.stroke();
          });
          break;

        case 1: // Mercure : Cratères d'impact & rayons d'éjectas
          context.fillStyle = 'rgba(90, 75, 70, 0.4)';
          [
            [-r * 0.25, -r * 0.15, r * 0.24],
            [r * 0.3, r * 0.2, r * 0.2],
            [-r * 0.05, r * 0.35, r * 0.16]
          ].forEach(([cx, cy, cr]) => {
            context.beginPath();
            context.arc(cx, cy, cr, 0, Math.PI * 2);
            context.fill();
          });
          // Rayons blancs d'éjecta
          context.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          context.lineWidth = 1;
          for (let k = 0; k < 6; k++) {
            const rayAng = (k * Math.PI) / 3;
            context.beginPath();
            context.moveTo(-r * 0.25, -r * 0.15);
            context.lineTo(-r * 0.25 + Math.cos(rayAng) * (r * 0.5), -r * 0.15 + Math.sin(rayAng) * (r * 0.5));
            context.stroke();
          }
          break;

        case 2: // Mars : Calotte glaciaire polaire blanche & volcans sombres
          // Calotte glaciaire au pôle nord
          context.fillStyle = 'rgba(255, 255, 255, 0.88)';
          context.beginPath();
          context.ellipse(0, -r * 0.82, r * 0.45, r * 0.18, 0, 0, Math.PI * 2);
          context.fill();
          // Taches d'oxydes et Syrtis Major
          context.fillStyle = 'rgba(100, 20, 15, 0.45)';
          context.beginPath();
          context.arc(-r * 0.2, r * 0.1, r * 0.38, 0, Math.PI * 2);
          context.arc(r * 0.3, r * 0.25, r * 0.28, 0, Math.PI * 2);
          context.fill();
          // Calotte polaire sud plus petite
          context.fillStyle = 'rgba(255, 255, 255, 0.65)';
          context.beginPath();
          context.ellipse(0, r * 0.85, r * 0.3, r * 0.12, 0, 0, Math.PI * 2);
          context.fill();
          break;

        case 3: // Vénus : Épaisse couche nuageuse d'acide sulfurique en tourbillons
          context.strokeStyle = 'rgba(255, 245, 180, 0.38)';
          context.lineWidth = Math.max(2, r * 0.12);
          [-0.55, -0.2, 0.15, 0.5].forEach((yFactor) => {
            context.beginPath();
            context.ellipse(0, r * yFactor, r * 0.95, r * 0.22, 0.2, 0, Math.PI * 2);
            context.stroke();
          });
          break;

        case 4: // Terre : Océans bleus, continents verts/ocres, masses nuageuses
          // Continents
          context.fillStyle = '#388e3c';
          context.beginPath();
          // Amériques / Eurasie stylisées
          context.arc(-r * 0.35, -r * 0.15, r * 0.34, 0, Math.PI * 2);
          context.arc(r * 0.3, r * 0.1, r * 0.4, 0, Math.PI * 2);
          context.arc(-r * 0.15, r * 0.45, r * 0.26, 0, Math.PI * 2);
          context.fill();
          // Nuages blancs vaporeux
          context.fillStyle = 'rgba(255, 255, 255, 0.6)';
          context.beginPath();
          context.ellipse(-r * 0.25, -r * 0.35, r * 0.45, r * 0.12, -0.3, 0, Math.PI * 2);
          context.ellipse(r * 0.2, r * 0.32, r * 0.5, r * 0.14, 0.25, 0, Math.PI * 2);
          context.fill();
          // Calotte Arctique & Antarctique
          context.fillStyle = 'rgba(255, 255, 255, 0.85)';
          context.beginPath();
          context.ellipse(0, -r * 0.9, r * 0.45, r * 0.15, 0, 0, Math.PI * 2);
          context.ellipse(0, r * 0.9, r * 0.4, r * 0.14, 0, 0, Math.PI * 2);
          context.fill();
          break;

        case 5: // Neptune : Bleu profond, tempêtes de méthane & Grande Tache Sombre
          context.strokeStyle = 'rgba(129, 212, 250, 0.35)';
          context.lineWidth = Math.max(2, r * 0.08);
          [-0.4, -0.1, 0.25, 0.6].forEach((yFactor) => {
            context.beginPath();
            context.ellipse(0, r * yFactor, r * 0.95, r * 0.15, 0, 0, Math.PI * 2);
            context.stroke();
          });
          // Grande Tache Sombre de Neptune
          context.fillStyle = 'rgba(1, 40, 90, 0.7)';
          context.beginPath();
          context.ellipse(r * 0.3, -r * 0.2, r * 0.26, r * 0.15, -0.15, 0, Math.PI * 2);
          context.fill();
          // Cirrus blancs de haute altitude
          context.fillStyle = 'rgba(255, 255, 255, 0.55)';
          context.beginPath();
          context.ellipse(r * 0.28, -r * 0.32, r * 0.22, r * 0.06, -0.1, 0, Math.PI * 2);
          context.fill();
          break;

        case 6: // Uranus : Géante glacée avec bandes délicates et reflets bleutés
          context.strokeStyle = 'rgba(224, 247, 250, 0.3)';
          context.lineWidth = Math.max(2, r * 0.1);
          [-0.5, -0.2, 0.1, 0.4].forEach((yFactor) => {
            context.beginPath();
            context.ellipse(0, r * yFactor, r * 0.95, r * 0.18, 0, 0, Math.PI * 2);
            context.stroke();
          });
          break;

        case 7: // Saturne : Bandes atmosphériques et ombre portée des anneaux sur le globe
          context.strokeStyle = 'rgba(239, 206, 143, 0.45)';
          context.lineWidth = Math.max(2, r * 0.1);
          [-0.6, -0.3, 0, 0.3, 0.6].forEach((yFactor) => {
            context.beginPath();
            context.ellipse(0, r * yFactor, r * 0.95, r * 0.16, 0, 0, Math.PI * 2);
            context.stroke();
          });
          // Ombre de l'anneau sur l'équateur
          context.save();
          context.rotate(-0.38);
          context.fillStyle = 'rgba(30, 20, 10, 0.4)';
          context.fillRect(-r, -r * 0.12, r * 2, r * 0.24);
          context.restore();
          break;

        case 8: // Jupiter : Bandes gazeuses complexes et Grande Tache Rouge
          // Bandes sombres et claires
          const jupBands = [
            { y: -0.62, h: 0.14, col: 'rgba(120, 50, 20, 0.45)' },
            { y: -0.35, h: 0.2, col: 'rgba(255, 230, 200, 0.35)' },
            { y: -0.1, h: 0.25, col: 'rgba(160, 70, 30, 0.5)' },
            { y: 0.2, h: 0.18, col: 'rgba(255, 240, 210, 0.35)' },
            { y: 0.45, h: 0.22, col: 'rgba(130, 60, 25, 0.48)' }
          ];
          jupBands.forEach((band) => {
            context.fillStyle = band.col;
            context.fillRect(-r, r * band.y, r * 2, r * band.h);
          });
          // Grande Tache Rouge iconique
          context.fillStyle = '#b71c1c';
          context.beginPath();
          context.ellipse(r * 0.32, r * 0.24, r * 0.24, r * 0.16, 0, 0, Math.PI * 2);
          context.fill();
          // Cœur interne de la tache
          context.fillStyle = '#e53935';
          context.beginPath();
          context.ellipse(r * 0.32, r * 0.24, r * 0.14, r * 0.09, 0, 0, Math.PI * 2);
          context.fill();
          break;

        case 9: // Le Soleil : Granulation convective et tourbillons d'énergie
          context.fillStyle = 'rgba(255, 245, 157, 0.35)';
          for (let g = 0; g < 7; g++) {
            const gx = Math.cos((g * Math.PI) / 3.5) * (r * 0.45);
            const gy = Math.sin((g * Math.PI) / 3.5) * (r * 0.45);
            context.beginPath();
            context.arc(gx, gy, r * 0.25, 0, Math.PI * 2);
            context.fill();
          }
          break;
      }

      context.restore();
    }

    // 6. Saturne (Tier 7) : Anneaux planétaires (Partie avant, passe DEVANT la sphère)
    if (t === 7) {
      context.save();
      context.rotate(-0.38);
      // Anneau B avant
      context.beginPath();
      context.ellipse(0, 0, r * 1.72, r * 0.46, 0, 0, Math.PI);
      context.strokeStyle = 'rgba(255, 243, 176, 0.88)';
      context.lineWidth = r * 0.28;
      context.stroke();

      // Division de Cassini (espace sombre)
      context.beginPath();
      context.ellipse(0, 0, r * 1.9, r * 0.51, 0, 0, Math.PI);
      context.strokeStyle = 'rgba(15, 10, 8, 0.7)';
      context.lineWidth = r * 0.06;
      context.stroke();

      // Anneau A externe avant
      context.beginPath();
      context.ellipse(0, 0, r * 2.15, r * 0.58, 0, 0, Math.PI);
      context.strokeStyle = 'rgba(215, 204, 180, 0.65)';
      context.lineWidth = r * 0.22;
      context.stroke();
      context.restore();
    }

    // 7. Halo de bordure atmosphérique
    context.lineWidth = Math.max(1.5, r * 0.05);
    context.strokeStyle = t === 9 ? 'rgba(255, 235, 59, 0.85)' : 'rgba(255, 255, 255, 0.7)';
    context.stroke();

    // 8. Symbole / Nom / Emoji de la planète
    context.fillStyle = '#ffffff';
    context.font = `bold ${Math.max(12, Math.round(r * 0.5))}px 'Inter', sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.shadowBlur = 5;
    context.shadowColor = '#000000';
    context.fillText(td.symbol, 0, 1);

    context.restore();
  }

  /**
   * Rendu classique Néon Cyberpunk
   */
  private drawNeonOrb(context: CanvasRenderingContext2D, r: number) {
    const td = this.tierData;

    // Halo néon externe
    context.beginPath();
    context.arc(0, 0, r * 1.5, 0, Math.PI * 2);
    const aura = context.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.5);
    aura.addColorStop(0, td.glowColor);
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = aura;
    context.globalAlpha = 0.4;
    context.fill();

    // Sphère principale
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

    // Bordure lumineuse
    context.lineWidth = Math.max(1.5, r * 0.06);
    context.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    context.stroke();

    // Symbole / Chiffre
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
    context.beginPath();
    context.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}
