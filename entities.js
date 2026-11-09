/**
 * ==============================================================================
 * ENTITÉS DU JEU : PARTICULES, ONDES, BRIQUES D'ARC & BILLE
 * ==============================================================================
 */

/**
 * Particule visuelle pour les étincelles de rebond et les confettis d'évasion.
 */
class Particle {
  constructor(x, y, vx, vy, color, size, life, decay, isGravity = false) {
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

  update(dt) {
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

  draw(context) {
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
      // Confetti rectangulaire festif
      context.fillRect(-this.size, -this.size * 0.5, this.size * 2, this.size);
    } else {
      // Micro-étincelle ronde
      context.beginPath();
      context.arc(0, 0, Math.max(0.5, this.size * progress), 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
}

/**
 * Onde de choc circulaire au point d'impact.
 */
class Shockwave {
  constructor(x, y, color, maxRadius = 55, speed = 4) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = 4;
    this.maxRadius = maxRadius;
    this.speed = speed;
    this.alpha = 0.9;
  }

  update(dt) {
    this.radius += this.speed * dt;
    this.alpha = Math.max(0, 1 - (this.radius / this.maxRadius));
  }

  draw(context) {
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

/**
 * Segment d'arc circulaire représentant une brique destructible de l'arène.
 */
class WallSegment {
  constructor(index, startAngle, endAngle) {
    this.index = index;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.maxHp = CONFIG.SEGMENT_HP;
    this.hp = this.maxHp;
    this.hitFlash = 0; // 0 à 1 pour le flash sur contact
  }

  get isAlive() {
    return this.hp > 0;
  }

  hit() {
    this.hp = Math.max(0, this.hp - 1);
    this.hitFlash = 1.0;
    return this.hp === 0; // Vrai si la brique vient d'être brisée
  }

  update(dt) {
    if (this.hitFlash > 0) {
      this.hitFlash = Math.max(0, this.hitFlash - 6.0 * dt);
    }
  }

  draw(context, cx, cy, radius) {
    // Si la brique est détruite, la brèche s'ouvre INSTANTANÉMENT
    if (!this.isAlive) return;

    context.save();
    const pad = 0.022; // Espacement esthétique entre les briques
    const sAngle = this.startAngle + pad;
    const eAngle = this.endAngle - pad;

    if (sAngle >= eAngle) {
      context.restore();
      return;
    }

    // Teinte et épaisseur selon les points de vie (HP) restants
    let strokeColor = '#00f0ff';
    let glowColor = 'rgba(0, 240, 255, 0.85)';
    let lineWidth = 13;

    if (CONFIG.BRICK_HP_COLORS && CONFIG.BRICK_HP_COLORS[this.hp]) {
      const conf = CONFIG.BRICK_HP_COLORS[this.hp];
      strokeColor = conf.stroke;
      glowColor = conf.glow;
      lineWidth = conf.width;
    } else {
      // Interpolation proportionnelle continue de Cyan (185) à Rouge (0)
      const ratio = Math.min(1, Math.max(0, (this.hp - 1) / Math.max(1, this.maxHp - 1)));
      const hue = ratio * 185;
      strokeColor = `hsl(${Math.round(hue)}, 100%, 55%)`;
      glowColor = `hsla(${Math.round(hue)}, 100%, 55%, 0.85)`;
      lineWidth = 8 + ratio * 6;
    }

    // Rendu Néon Tube double passe
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
      // 1ère passe : Halo néon externe diffus
      context.strokeStyle = strokeColor;
      context.shadowColor = glowColor;
      context.shadowBlur = 18;
      context.lineWidth = lineWidth;
      context.lineCap = 'round';
      context.beginPath();
      context.arc(cx, cy, radius, sAngle, eAngle);
      context.stroke();

      // 2ème passe : Cœur lumineux blanc néon
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

/**
 * La bille du simulateur avec gestion de couleur dynamique, traînée et flash.
 */
class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = CONFIG.BALL_RADIUS;
    this.vx = 0;
    this.vy = 0;
    this.speed = CONFIG.INITIAL_SPEED;
    this.trail = [];
    this.maxTrail = 24;
    this.color = '#00f0ff';
    this.glowColor = 'rgba(0, 240, 255, 0.9)';
    this.flash = 0;
    this.isEscaping = false;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.radius = CONFIG.BALL_RADIUS;
    this.trail = [];
    this.flash = 0;
    this.isEscaping = false;

    // Angle initial aléatoire non aligné avec les axes
    const angle = (Math.random() * 0.7 + 0.15) * Math.PI * (Math.random() < 0.5 ? 1 : -1);
    this.speed = CONFIG.INITIAL_SPEED;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.updateColor();
  }

  /**
   * Met à jour la couleur et le rayon en fonction de la vitesse actuelle.
   * Évolution chromatique électrique ultra-saturée :
   * Cyan néon (185) -> Vert émeraude (145) -> Or solaire (50) -> Magenta/Hot Pink (320)
   */
  updateColor() {
    const t = Math.min(1, Math.max(0, (this.speed - CONFIG.INITIAL_SPEED) / (CONFIG.MAX_SPEED - CONFIG.INITIAL_SPEED)));
    let hue;
    if (t < 0.25) {
      hue = 185 - (t / 0.25) * 40; // 185 -> 145 (Cyan vers Vert)
    } else if (t < 0.55) {
      hue = 145 - ((t - 0.25) / 0.3) * 95; // 145 -> 50 (Vert vers Jaune/Or)
    } else if (t < 0.85) {
      hue = 50 - ((t - 0.55) / 0.3) * 90; // 50 -> 320 (Jaune vers Magenta/Hot Pink)
      if (hue < 0) hue += 360;
    } else {
      hue = 320 - ((t - 0.85) / 0.15) * 20; // 320 -> 300 (Magenta électrique vers Violet)
    }

    this.color = `hsl(${Math.round(hue)}, 100%, 62%)`;
    this.glowColor = `hsla(${Math.round(hue)}, 100%, 55%, 0.9)`;
    this.radius = CONFIG.BALL_RADIUS + t * 4.5;
  }

  draw(context) {
    // 1. Rendu de la traînée néon continue (Ruban laser fluide)
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

    // 2. Halo d'ambiance externe (Aura d'énergie)
    context.save();
    context.beginPath();
    context.arc(this.x, this.y, this.radius * 1.8, 0, Math.PI * 2);
    const aura = context.createRadialGradient(this.x, this.y, this.radius * 0.4, this.x, this.y, this.radius * 1.8);
    aura.addColorStop(0, this.glowColor);
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = aura;
    context.globalAlpha = 0.45;
    context.fill();
    context.restore();

    // 3. Orbe de plasma avec cœur blanc-chaud et reflet 3D
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
      grad.addColorStop(0, '#ffffff');       // Point chaud blanc éclatant
      grad.addColorStop(0.28, '#ffffff');
      grad.addColorStop(0.55, this.color);    // Teinte néon saturée
      grad.addColorStop(1, '#050a16');        // Ombre de sphère 3D
    }

    context.fillStyle = grad;
    context.fill();

    // Anneau d'énergie contour blanc pur
    context.lineWidth = 1.8;
    context.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    context.stroke();

    context.restore();

    if (this.flash > 0) {
      this.flash = Math.max(0, this.flash - 0.1);
    }
  }
}

/**
 * Balle secondaire / obstacle mobile qui évolue dans le cercle.
 * - Ne sort JAMAIS du cercle (rebondit toujours sur la paroi, même s'il y a une brèche).
 * - Ne collisionne PAS avec les autres balles secondaires (fantômes entre elles).
 * - La balle principale rebondit dessus de façon élastique lorsqu'elle la touche.
 */
class SecondaryBall {
  constructor(config = {}) {
    this.name = config.name || 'Balle Secondaire';
    this.radius = config.radius || 12;
    this.baseSpeed = config.speed || 5;
    this.speed = this.baseSpeed;
    this.color = config.color || '#ff00aa';
    this.glowColor = config.glowColor || 'rgba(255, 0, 170, 0.85)';
    this.hasTrail = config.trail !== false;

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

  reset(x, y, angle) {
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

  /**
   * Crée une balle secondaire avec des attributs entièrement aléatoires
   * (taille, vitesse, teinte néon vibrante et direction).
   */
  static createRandom(x = CENTER_X, y = CENTER_Y, angle = null) {
    const minR = CONFIG.SECONDARY_BALL_MIN_RADIUS || 8;
    const maxR = CONFIG.SECONDARY_BALL_MAX_RADIUS || 16;
    const radius = Math.round(minR + Math.random() * (maxR - minR));

    const minS = CONFIG.SECONDARY_BALL_MIN_SPEED || 5.5;
    const maxS = CONFIG.SECONDARY_BALL_MAX_SPEED || 9.5;
    const speed = minS + Math.random() * (maxS - minS);

    const colors = CONFIG.SECONDARY_BALL_COLORS || [
      '#ff007f', // Rose néon
      '#00ffcc', // Cyan électrique
      '#ffaa00', // Ambre / Or
      '#9900ff', // Violet électrique
      '#00ff66', // Vert fluo
      '#ff2200', // Rouge vif
      '#00bfff', // Bleu laser
      '#ffe600'  // Jaune néon
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const ball = new SecondaryBall({
      radius: radius,
      speed: speed,
      color: color,
      glowColor: color,
      trail: true
    });

    const ang = angle !== null ? angle : Math.random() * Math.PI * 2;
    ball.reset(x, y, ang);
    return ball;
  }

  updatePhysics(subDt, segments = null, arenaAngle = 0) {
    // Gravité douce identique à l'arène
    this.vy += CONFIG.GRAVITY * subDt * 0.7;

    // Déplacement
    this.x += this.vx * subDt;
    this.y += this.vy * subDt;

    // Si la bille est en train de s'échapper à l'extérieur
    if (this.isEscaping) {
      if (this.x < -150 || this.x > VIRTUAL_WIDTH + 150 || this.y < -150 || this.y > VIRTUAL_HEIGHT + 150) {
        this.isDead = true;
      }
    } else {
      // Collision avec la paroi de l'arène
      const dx = this.x - CENTER_X;
      const dy = this.y - CENTER_Y;
      const dist = Math.hypot(dx, dy);
      const limitRadius = CONFIG.CIRCLE_RADIUS - this.radius;

      if (dist >= limitRadius) {
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        const dot = this.vx * nx + this.vy * ny;

        let canPass = false;
        if (CONFIG.SECONDARY_BALLS_CAN_ESCAPE && segments) {
          let angle = Math.atan2(dy, dx);
          if (angle < 0) angle += Math.PI * 2;
          let relAngle = (angle - arenaAngle) % (Math.PI * 2);
          if (relAngle < 0) relAngle += Math.PI * 2;
          const segIdx = Math.floor((relAngle / (Math.PI * 2)) * CONFIG.TOTAL_WALL_SEGMENTS) % CONFIG.TOTAL_WALL_SEGMENTS;
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
            // Replacement strict sur la frontière intérieure
            this.x = CENTER_X + nx * limitRadius;
            this.y = CENTER_Y + ny * limitRadius;

            // Réflexion élastique sur la normale
            this.vx = this.vx - 2 * dot * nx;
            this.vy = this.vy - 2 * dot * ny;

            // Micro-perturbation
            const perpX = -ny;
            const perpY = nx;
            this.vx += perpX * (Math.random() - 0.5) * 0.08;
            this.vy += perpY * (Math.random() - 0.5) * 0.08;

            this.flash = 0.6;
          }
        }
      }
    }

    // Traînée
    if (this.hasTrail) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.maxTrail) {
        this.trail.shift();
      }
    }
  }

  draw(context) {
    // 1. Rendu de la traînée
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

    // 2. Rendu de la balle secondaire
    const isDark = this.color === '#000000' || this.color === '#111111' || this.color === 'black';
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
      // Bille d'Obsidienne / Chrome sombre avec reflet vitré
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

