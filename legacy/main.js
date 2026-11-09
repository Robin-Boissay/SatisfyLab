/**
 * ==============================================================================
 * SIMULATEUR BALL ESCAPE - MOTEUR PRINCIPAL & BOUCLE DE JEU (LEGACY STANDALONE)
 * ==============================================================================
 */

// Instanciation du moteur audio
const sound = new SoundEngine();

// Éléments du DOM
const viewport = document.getElementById('viewport');
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

const challengeTitle = document.getElementById('challengeTitle');
const timerDisplay = document.getElementById('timerDisplay');
const startPrompt = document.getElementById('startPrompt');

const btnRestart = document.getElementById('btnRestart');
const btnAudio = document.getElementById('btnAudio');
const btnFullscreen = document.getElementById('btnFullscreen');
const audioIconOn = document.getElementById('audioIconOn');
const audioIconOff = document.getElementById('audioIconOff');

/**
 * Classe centrale gérant la simulation, la physique 60 FPS et le rendu Canvas.
 */
class Simulation {
  constructor() {
    this.state = 'WAITING'; // 'WAITING', 'RUNNING', 'ESCAPED', 'FROZEN'
    this.bounces = 0;
    this.timeScale = 1.0;
    this.arenaAngle = 0; // Angle de rotation continue du cercle de briques
    this.screenShake = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.timeLimit = CONFIG.CHALLENGE_TIME_LIMIT !== undefined ? CONFIG.CHALLENGE_TIME_LIMIT : 30;
    this.timeLeft = this.timeLimit;
    this.freezeDelay = CONFIG.FREEZE_DELAY_AFTER_ESCAPE !== undefined ? CONFIG.FREEZE_DELAY_AFTER_ESCAPE : 1.0;
    this.freezeTimer = 0;
    this.hasEscaped = false;
    this.maxSpeedReached = CONFIG.INITIAL_SPEED;

    this.segments = [];
    this.particles = [];
    this.shockwaves = [];
    this.ball = new Ball(CENTER_X, CENTER_Y);
    this.secondaryBalls = [];

    this.initSegments();
    this.initSecondaryBalls();
    this.setupEventListeners();
    this.resize();

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  /**
   * Crée les briques d'arc formant le cercle extérieur de l'arène.
   */
  initSegments() {
    this.segments = [];
    const step = (Math.PI * 2) / CONFIG.TOTAL_WALL_SEGMENTS;
    for (let i = 0; i < CONFIG.TOTAL_WALL_SEGMENTS; i++) {
      const start = i * step;
      const end = (i + 1) * step;
      this.segments.push(new WallSegment(i, start, end));
    }
  }

  /**
   * Initialise les balles secondaires.
   */
  initSecondaryBalls() {
    this.secondaryBalls = [];
    const count = CONFIG.INITIAL_SECONDARY_BALLS_COUNT || 0;
    for (let i = 0; i < count; i++) {
      this.secondaryBalls.push(SecondaryBall.createRandom(CENTER_X, CENTER_Y));
    }
  }

  /**
   * Démarre la simulation lors du premier clic ou appui.
   */
  start() {
    sound.init();
    if (this.state === 'WAITING' || this.state === 'ESCAPED' || this.state === 'FROZEN') {
      this.resetGame();
    }
    startPrompt.classList.add('hidden');
    this.state = 'RUNNING';
  }

  /**
   * Réinitialise entièrement l'état du jeu (arène, bille, chronomètre).
   */
  resetGame() {
    this.state = 'RUNNING';
    this.bounces = 0;
    this.timeScale = 1.0;
    this.arenaAngle = 0;
    this.screenShake = 0;
    this.timeLeft = this.timeLimit;
    this.freezeTimer = 0;
    this.hasEscaped = false;
    this.particles = [];
    this.shockwaves = [];
    this.maxSpeedReached = CONFIG.INITIAL_SPEED;

    this.initSegments();
    this.initSecondaryBalls();
    this.ball.reset(CENTER_X, CENTER_Y);

    this.updateHUD();
  }

  /**
   * Met à jour les éléments de l'affichage tête haute (Chronomètre 30s & Titre).
   */
  updateHUD() {
    if (timerDisplay) {
      const sec = Math.max(0, Math.ceil(this.timeLeft));
      timerDisplay.textContent = `${sec}s`;
      if (sec <= 5 && this.state === 'RUNNING') {
        timerDisplay.classList.add('danger');
      } else {
        timerDisplay.classList.remove('danger');
      }
    }
    if (challengeTitle && CONFIG.CHALLENGE_TITLE) {
      challengeTitle.textContent = CONFIG.CHALLENGE_TITLE;
    }
  }

  /**
   * Gestion d'un rebond sur une brique d'arc intacte.
   */
  handleBounce(segment, contactX, contactY, normalX, normalY) {
    this.bounces++;

    // Accélération exponentielle
    const currentSpeed = Math.hypot(this.ball.vx, this.ball.vy);
    const newSpeed = Math.min(CONFIG.MAX_SPEED, currentSpeed * CONFIG.BOUNCE_SPEED_MULTIPLIER);
    const norm = currentSpeed > 0 ? newSpeed / currentSpeed : 1;
    this.ball.vx *= norm;
    this.ball.vy *= norm;
    this.ball.speed = newSpeed;
    if (newSpeed > this.maxSpeedReached) {
      this.maxSpeedReached = newSpeed;
    }

    this.ball.flash = 1.0;
    this.ball.updateColor();

    // Dégâts sur la brique d'arc
    const destroyed = segment.hit();

    const speedRatio = (this.ball.speed - CONFIG.INITIAL_SPEED) / (CONFIG.MAX_SPEED - CONFIG.INITIAL_SPEED);
    sound.playBounce(this.bounces, speedRatio);

    if (destroyed) {
      sound.playWallDestroy();
      this.spawnDebris(contactX, contactY, segment);
      this.triggerScreenShake(6);
    } else {
      this.triggerScreenShake(2 + speedRatio * 3);
    }

    // Étincelles et onde de choc sur le point d'impact
    this.spawnWallSparks(contactX, contactY, normalX, normalY);
    this.shockwaves.push(new Shockwave(contactX, contactY, this.ball.color, 45, 5));

    // Apparition d'une bille secondaire au centre dans une direction aléatoire
    if (CONFIG.SPAWN_SECONDARY_BALL_ON_BRICK_HIT) {
      const maxBalls = CONFIG.MAX_SECONDARY_BALLS || 40;
      if (this.secondaryBalls.length < maxBalls) {
        const newBall = SecondaryBall.createRandom(CENTER_X, CENTER_Y);
        this.secondaryBalls.push(newBall);

        // Flash et étincelles de naissance au centre
        this.shockwaves.push(new Shockwave(CENTER_X, CENTER_Y, newBall.color, 32, 5));
        for (let b = 0; b < 6; b++) {
          const sAng = Math.random() * Math.PI * 2;
          const sSpd = 2 + Math.random() * 4;
          this.particles.push(new Particle(
            CENTER_X, CENTER_Y,
            Math.cos(sAng) * sSpd, Math.sin(sAng) * sSpd,
            newBall.color, 2, 0.35, 2.5
          ));
        }
      }
    }

    this.updateHUD();
  }

  /**
   * Évasion réussie : déclenché dès que la bille franchit l'ouverture vers l'extérieur.
   */
  handleEscape() {
    if (this.hasEscaped) return;

    this.hasEscaped = true;
    this.state = 'ESCAPED';
    this.freezeTimer = this.freezeDelay;

    sound.playEscape();
    this.triggerScreenShake(8);

    this.spawnEscapeFireworks(this.ball.x, this.ball.y);
  }

  /**
   * Fin du temps imparti.
   */
  handleTimeUp() {
    if (this.state === 'FROZEN') return;
    this.state = 'FROZEN';
    if (timerDisplay) {
      timerDisplay.textContent = '0s';
      timerDisplay.classList.add('danger');
    }
    if (challengeTitle) {
      challengeTitle.textContent = 'TIME OVER!';
    }
    this.triggerScreenShake(4);
  }

  spawnWallSparks(x, y, nx, ny) {
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

  spawnDebris(x, y, segment) {
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

  spawnEscapeFireworks(x, y) {
    const colors = ['#00f0ff', '#ffe600', '#ff0055', '#a6ff00', '#ffffff', '#ff9900'];
    const count = CONFIG.CONFETTI_COUNT || 90;
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

  triggerScreenShake(intensity) {
    if (CONFIG.SCREEN_SHAKE_ENABLED === false) return;
    const mult = CONFIG.SCREEN_SHAKE_INTENSITY !== undefined ? CONFIG.SCREEN_SHAKE_INTENSITY : 0.25;
    const maxShake = CONFIG.SCREEN_SHAKE_MAX !== undefined ? CONFIG.SCREEN_SHAKE_MAX : 3.0;
    const effective = Math.min(maxShake, intensity * mult);
    this.screenShake = Math.max(this.screenShake, effective);
  }

  updatePhysics(dt) {
    if (this.state === 'WAITING' || this.state === 'FROZEN') return;

    if (this.state === 'RUNNING') {
      const prevSec = Math.ceil(this.timeLeft);
      this.timeLeft -= dt;
      const newSec = Math.ceil(this.timeLeft);
      if (newSec !== prevSec) {
        this.updateHUD();
      }
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.updateHUD();
        this.handleTimeUp();
        return;
      }
    }

    const rotSpeed = CONFIG.ARENA_ROTATION_SPEED || 0;
    const subSteps = CONFIG.SUB_STEPS;
    const subDt = (dt * this.timeScale) / subSteps;

    for (let s = 0; s < subSteps; s++) {
      this.arenaAngle = (this.arenaAngle + rotSpeed * subDt) % (Math.PI * 2);
      if (this.arenaAngle < 0) this.arenaAngle += Math.PI * 2;

      for (let i = this.secondaryBalls.length - 1; i >= 0; i--) {
        const sec = this.secondaryBalls[i];
        sec.updatePhysics(subDt, this.segments, this.arenaAngle);
        if (sec.isDead) {
          this.secondaryBalls.splice(i, 1);
        }
      }

      this.ball.vy += CONFIG.GRAVITY * subDt;
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
                const secLimit = CONFIG.CIRCLE_RADIUS - sec.radius;
                if (secDist > secLimit) {
                  sec.x = CENTER_X + (sec.x - CENTER_X) / secDist * secLimit;
                  sec.y = CENTER_Y + (sec.y - CENTER_Y) / secDist * secLimit;
                }
              }

              const speedBefore = Math.max(this.ball.speed, Math.hypot(this.ball.vx, this.ball.vy));

              const dotBall = this.ball.vx * cnx + this.ball.vy * cny;
              if (dotBall < 0) {
                this.ball.vx -= 2 * dotBall * cnx;
                this.ball.vy -= 2 * dotBall * cny;
              }

              this.ball.vx += (-cny) * (Math.random() - 0.5) * 0.1;
              this.ball.vy += (cnx) * (Math.random() - 0.5) * 0.1;

              const mult = CONFIG.SECONDARY_BALL_COUNTS_AS_BOUNCE 
                ? (CONFIG.SECONDARY_BALL_BOUNCE_MULTIPLIER || 1.03) 
                : 1.0;
              const targetSpeed = Math.min(CONFIG.MAX_SPEED, Math.max(speedBefore, speedBefore * mult));

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

              sec.vx = -cnx * sec.baseSpeed + (-cny) * (Math.random() - 0.5) * sec.baseSpeed * 0.5;
              sec.vy = -cny * sec.baseSpeed + (cnx) * (Math.random() - 0.5) * sec.baseSpeed * 0.5;
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

              if (CONFIG.SECONDARY_BALL_COUNTS_AS_BOUNCE) {
                this.bounces++;
                this.ball.updateColor();

                const speedRatio = (this.ball.speed - CONFIG.INITIAL_SPEED) / (CONFIG.MAX_SPEED - CONFIG.INITIAL_SPEED);
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
        if (dist >= CONFIG.CIRCLE_RADIUS + this.ball.radius * 0.4) {
          this.handleEscape();
          break;
        }
        continue;
      }

      const limitRadius = CONFIG.CIRCLE_RADIUS - this.ball.radius;

      if (dist >= limitRadius) {
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        const dot = this.ball.vx * nx + this.ball.vy * ny;

        let angle = Math.atan2(dy, dx);
        if (angle < 0) angle += Math.PI * 2;

        let relAngle = (angle - this.arenaAngle) % (Math.PI * 2);
        if (relAngle < 0) relAngle += Math.PI * 2;

        const segmentIndex = Math.floor((relAngle / (Math.PI * 2)) * CONFIG.TOTAL_WALL_SEGMENTS) % CONFIG.TOTAL_WALL_SEGMENTS;
        const segment = this.segments[segmentIndex];

        if (segment && segment.isAlive) {
          if (dot > 0) {
            this.ball.x = CENTER_X + nx * limitRadius;
            this.ball.y = CENTER_Y + ny * limitRadius;

            this.ball.vx = this.ball.vx - 2 * dot * nx;
            this.ball.vy = this.ball.vy - 2 * dot * ny;

            const tanVx = -ny * rotSpeed * CONFIG.CIRCLE_RADIUS * 0.08;
            const tanVy = nx * rotSpeed * CONFIG.CIRCLE_RADIUS * 0.08;
            this.ball.vx += tanVx;
            this.ball.vy += tanVy;

            const perpX = -ny;
            const perpY = nx;
            const jitter = (Math.random() - 0.5) * 0.12;
            this.ball.vx += perpX * jitter;
            this.ball.vy += perpY * jitter;

            const contactX = CENTER_X + nx * CONFIG.CIRCLE_RADIUS;
            const contactY = CENTER_Y + ny * CONFIG.CIRCLE_RADIUS;

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
      }
    }
  }

  updateEntities(dt) {
    if (this.state === 'FROZEN') return;

    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].update(dt);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt * this.timeScale);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.update(dt * this.timeScale);
      if (sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    if (this.screenShake > 0) {
      this.shakeX = (Math.random() - 0.5) * this.screenShake;
      this.shakeY = (Math.random() - 0.5) * this.screenShake;
      const decay = CONFIG.SCREEN_SHAKE_DECAY !== undefined ? CONFIG.SCREEN_SHAKE_DECAY : 18.0;
      this.screenShake = Math.max(0, this.screenShake - decay * dt);
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  render() {
    ctx.save();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = this.viewScale;
    const offX = this.offsetX || 0;
    const offY = this.offsetY || 0;
    ctx.translate(offX + this.shakeX * scale, offY + this.shakeY * scale);
    ctx.scale(scale, scale);

    this.drawBackground();
    this.drawArena();

    for (let i = 0; i < this.shockwaves.length; i++) {
      this.shockwaves[i].draw(ctx);
    }

    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].draw(ctx);
    }

    for (let i = 0; i < this.secondaryBalls.length; i++) {
      this.secondaryBalls[i].draw(ctx);
    }

    this.ball.draw(ctx);

    ctx.restore();
  }

  drawBackground() {
    ctx.save();
    const bgGrad = ctx.createRadialGradient(CENTER_X, CENTER_Y, 15, CENTER_X, CENTER_Y, CONFIG.CIRCLE_RADIUS);
    bgGrad.addColorStop(0, 'rgba(176, 38, 255, 0.09)');
    bgGrad.addColorStop(0.45, 'rgba(0, 240, 255, 0.04)');
    bgGrad.addColorStop(0.9, 'rgba(0, 0, 0, 0.2)');
    bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, CONFIG.CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, CONFIG.CIRCLE_RADIUS - 10, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fill();
    ctx.restore();
  }

  drawArena() {
    ctx.save();
    ctx.translate(CENTER_X, CENTER_Y);
    ctx.rotate(this.arenaAngle);
    ctx.translate(-CENTER_X, -CENTER_Y);
    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].draw(ctx, CENTER_X, CENTER_Y, CONFIG.CIRCLE_RADIUS);
    }
    ctx.restore();
  }

  loop(timestamp) {
    const rawDt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    const dt = Math.min(0.05, rawDt);

    this.updatePhysics(dt);
    this.updateEntities(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  resize() {
    const rect = viewport.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    const scaleX = canvas.width / VIRTUAL_WIDTH;
    const scaleY = canvas.height / VIRTUAL_HEIGHT;
    this.viewScale = Math.min(scaleX, scaleY);
    this.offsetX = (canvas.width - VIRTUAL_WIDTH * this.viewScale) / 2;
    this.offsetY = (canvas.height - VIRTUAL_HEIGHT * this.viewScale) / 2;
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.resize());

    viewport.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.hud-bottom')) return;
      if (this.state === 'WAITING' || this.state === 'FROZEN') {
        this.start();
      }
    });

    startPrompt.addEventListener('click', () => {
      this.start();
    });

    btnRestart.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.init();
      this.resetGame();
    });

    btnAudio.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.init();
      const muted = sound.toggleMute();
      audioIconOn.style.display = muted ? 'none' : 'block';
      audioIconOff.style.display = muted ? 'block' : 'none';
    });

    btnFullscreen.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!document.fullscreenElement) {
        viewport.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    window.addEventListener('keydown', (e) => {
      sound.init();
      if (e.code === 'KeyR') {
        this.resetGame();
      } else if (e.code === 'KeyM') {
        const muted = sound.toggleMute();
        audioIconOn.style.display = muted ? 'none' : 'block';
        audioIconOff.style.display = muted ? 'block' : 'none';
      } else if (e.code === 'KeyF') {
        if (!document.fullscreenElement) {
          viewport.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      } else if (e.code === 'Space') {
        if (this.state === 'WAITING' || this.state === 'FROZEN') {
          this.start();
        } else {
          this.resetGame();
        }
      }
    });
  }
}

// Initialisation au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
  new Simulation();
});
