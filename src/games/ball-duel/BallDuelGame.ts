import { GameInstance, GameHUDState } from '../../core/types';
import { sound } from '../../core/SoundEngine';
import { drawCanvasHUD } from '../../core/canvasHUD';
import {
  BallDuelConfig,
  DEFAULT_BALL_DUEL_CONFIG,
  FIBONACCI_SERIES
} from './types';
import {
  DuelBall,
  HorizontalBar,
  DuelParticle,
  FloatingNotification
} from './entities';

const VIRTUAL_WIDTH = 540;
const VIRTUAL_HEIGHT = 960;

export class BallDuelGame implements GameInstance {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onHUDUpdate: (hud: GameHUDState) => void;
  public config: BallDuelConfig;

  private isDestroyed: boolean = false;
  private animFrameId: number | null = null;
  private lastTime: number = performance.now();

  private state: 'WAITING' | 'RUNNING' | 'FINISHED' = 'WAITING';
  private winnerSide: 'left' | 'right' | null = null;
  private restartTimer: number = 0;
  private currentHUD: GameHUDState = {};
  private bounceCombo: number = 0;

  // Géométrie des colonnes
  public readonly leftColX = 20;
  public readonly leftColWidth = 245;
  public readonly dividerX = 265;
  public readonly dividerWidth = 10;
  public readonly rightColX = 275;
  public readonly rightColWidth = 245;
  public readonly topLimit = 155;
  public readonly bottomLimit = 875;

  // Entités
  private leftBalls: DuelBall[] = [];
  private rightBalls: DuelBall[] = [];
  private leftBars: HorizontalBar[] = [];
  private rightBars: HorizontalBar[] = [];
  private particles: DuelParticle[] = [];
  private notifications: FloatingNotification[] = [];

  // Paliers d'évolution
  private leftBreakCount: number = 0;
  private rightBreakCount: number = 0;
  private currentLeftDamage: number = 1;
  private currentRightDamage: number = 1;

  // Écran & Rendu
  private screenShake: number = 0;
  private shakeX: number = 0;
  private shakeY: number = 0;
  private viewScale: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    initialConfig: BallDuelConfig,
    onHUDUpdate: (hud: GameHUDState) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onHUDUpdate = onHUDUpdate;
    this.config = { ...DEFAULT_BALL_DUEL_CONFIG, ...initialConfig };

    this.initGame();
    this.resize();

    window.addEventListener('resize', this.handleResize);

    this.syncHUD();
    this.loop(performance.now());
  }

  private handleResize = () => {
    this.resize();
  };

  private initGame() {
    this.state = 'WAITING';
    this.winnerSide = null;
    this.restartTimer = 0;
    this.bounceCombo = 0;
    this.leftBreakCount = 0;
    this.rightBreakCount = 0;
    this.particles = [];
    this.notifications = [];

    this.currentLeftDamage = this.config.LEFT_INITIAL_DAMAGE;
    this.currentRightDamage = this.config.RIGHT_INITIAL_DAMAGE;

    // 1. Initialisation des barres
    this.leftBars = [];
    this.rightBars = [];
    const barsCount = Math.max(2, Math.min(8, this.config.BARS_COUNT));
    const startY = 300;
    const endY = 820;
    const stepY = (endY - startY) / (barsCount - 1);
    const barHeight = 22;

    for (let i = 0; i < barsCount; i++) {
      const y = startY + i * stepY;
      const hp = Math.round(
        this.config.BASE_BAR_HP * Math.pow(this.config.BAR_HP_MULTIPLIER, i)
      );

      // Barre Gauche
      this.leftBars.push(
        new HorizontalBar(
          i,
          'left',
          this.leftColX + 8,
          y,
          this.leftColWidth - 16,
          barHeight,
          hp
        )
      );

      // Barre Droite
      this.rightBars.push(
        new HorizontalBar(
          i,
          'right',
          this.rightColX + 8,
          y,
          this.rightColWidth - 16,
          barHeight,
          hp
        )
      );
    }

    // 2. Initialisation des balles
    this.leftBalls = [];
    this.rightBalls = [];

    const leftStartX = this.leftColX + this.leftColWidth / 2;
    for (let i = 0; i < this.config.LEFT_INITIAL_BALLS; i++) {
      const angle = (Math.PI * 2 * i) / this.config.LEFT_INITIAL_BALLS;
      const vx = Math.cos(angle) * 50 + (Math.random() - 0.5) * 30;
      const vy = Math.abs(Math.sin(angle)) * 60 + 40;
      this.leftBalls.push(
        new DuelBall(
          leftStartX + (Math.random() - 0.5) * 30,
          this.topLimit + 30 + (Math.random() - 0.5) * 15,
          vx,
          vy,
          this.config.BALL_RADIUS,
          'left',
          this.currentLeftDamage
        )
      );
    }

    const rightStartX = this.rightColX + this.rightColWidth / 2;
    for (let i = 0; i < this.config.RIGHT_INITIAL_BALLS; i++) {
      const angle = (Math.PI * 2 * i) / this.config.RIGHT_INITIAL_BALLS;
      const vx = Math.cos(angle) * 50 + (Math.random() - 0.5) * 30;
      const vy = Math.abs(Math.sin(angle)) * 60 + 40;
      this.rightBalls.push(
        new DuelBall(
          rightStartX + (Math.random() - 0.5) * 30,
          this.topLimit + 30 + (Math.random() - 0.5) * 15,
          vx,
          vy,
          this.config.BALL_RADIUS,
          'right',
          this.currentRightDamage
        )
      );
    }
  }

  public start() {
    sound.init();
    if (this.state === 'WAITING') {
      this.state = 'RUNNING';
      this.syncHUD();
    } else if (this.state === 'FINISHED') {
      this.initGame();
      this.state = 'RUNNING';
      this.syncHUD();
    }
  }

  public reset() {
    this.initGame();
    this.syncHUD();
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
  }

  public updateConfig(newConfig: Partial<BallDuelConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.syncHUD();
  }

  private syncHUD() {
    const leftActiveBars = this.leftBars.filter((b) => !b.isBroken).length;
    const rightActiveBars = this.rightBars.filter((b) => !b.isBroken).length;

    let statusText: string | undefined;
    if (this.state === 'WAITING') {
      statusText = this.config.TEXT_START_PROMPT || 'Clique pour lancer le duel';
    } else if (this.state === 'FINISHED') {
      if (this.winnerSide === 'left') {
        statusText = this.config.TEXT_WIN_LEFT || '🏆 VICTOIRE GAUCHE ! 🏆';
      } else {
        statusText = this.config.TEXT_WIN_RIGHT || '🏆 VICTOIRE DROITE ! 🏆';
      }
    }

    this.currentHUD = {
      title: this.config.TEXT_TITLE || '⚔️ GAUCHE VS DROITE ⚔️',
      primaryMetricLabel: `${this.config.TEXT_LABEL_LEFT || 'GAUCHE'} (BARRES)`,
      primaryMetricValue: `${this.leftBars.length - leftActiveBars}/${this.leftBars.length}`,
      primaryMetricColor: '#00f0ff',
      secondaryMetricLabel: `${this.config.TEXT_LABEL_RIGHT || 'DROITE'} (BARRES)`,
      secondaryMetricValue: `${this.rightBars.length - rightActiveBars}/${this.rightBars.length}`,
      secondaryMetricColor: '#ff007f',
      statusText,
      isWaitingToStart: this.state === 'WAITING',
      overlayPromptText: this.config.TEXT_START_PROMPT || 'Clique pour lancer le duel',
      isFinished: this.state === 'FINISHED'
    };
    this.onHUDUpdate(this.currentHUD);
  }

  /**
   * Calcul & Application de l'amélioration lors de la destruction d'une barre
   */
  private handleBarBreak(side: 'left' | 'right', bar: HorizontalBar) {
    const isLeft = side === 'left';
    const target = isLeft ? this.config.LEFT_UPGRADE_TARGET : this.config.RIGHT_UPGRADE_TARGET;
    const mode = isLeft ? this.config.LEFT_UPGRADE_MODE : this.config.RIGHT_UPGRADE_MODE;
    const value = Math.max(1, isLeft ? this.config.LEFT_UPGRADE_VALUE : this.config.RIGHT_UPGRADE_VALUE);

    if (isLeft) {
      this.leftBreakCount++;
    } else {
      this.rightBreakCount++;
    }
    const breakCount = isLeft ? this.leftBreakCount : this.rightBreakCount;

    // 1. Dégâts
    if (target === 'damage' || target === 'both') {
      if (mode === 'add') {
        if (isLeft) this.currentLeftDamage += value;
        else this.currentRightDamage += value;
      } else if (mode === 'multiply') {
        if (isLeft) this.currentLeftDamage = Math.round(this.currentLeftDamage * value);
        else this.currentRightDamage = Math.round(this.currentRightDamage * value);
      } else if (mode === 'power') {
        const factor = Math.pow(value, breakCount);
        if (isLeft) this.currentLeftDamage = Math.round(this.config.LEFT_INITIAL_DAMAGE * factor);
        else this.currentRightDamage = Math.round(this.config.RIGHT_INITIAL_DAMAGE * factor);
      } else if (mode === 'fibonacci') {
        const fibIndex = Math.min(FIBONACCI_SERIES.length - 1, breakCount);
        const fibVal = FIBONACCI_SERIES[fibIndex];
        if (isLeft) this.currentLeftDamage = fibVal;
        else this.currentRightDamage = fibVal;
      }

      // Mettre à jour les balles existantes
      const newDmg = isLeft ? this.currentLeftDamage : this.currentRightDamage;
      const balls = isLeft ? this.leftBalls : this.rightBalls;
      balls.forEach((b) => (b.damage = newDmg));
    }

    // 2. Balles
    let ballsToAdd = 0;
    if (target === 'balls' || target === 'both') {
      const currentCount = isLeft ? this.leftBalls.length : this.rightBalls.length;
      if (mode === 'add') {
        ballsToAdd = value;
      } else if (mode === 'multiply') {
        ballsToAdd = Math.max(1, currentCount * (value - 1));
      } else if (mode === 'power') {
        const targetTotal = Math.round((isLeft ? this.config.LEFT_INITIAL_BALLS : this.config.RIGHT_INITIAL_BALLS) * Math.pow(value, breakCount));
        ballsToAdd = Math.max(1, targetTotal - currentCount);
      } else if (mode === 'fibonacci') {
        const fibIndex = Math.min(FIBONACCI_SERIES.length - 1, breakCount + 1);
        const targetTotal = FIBONACCI_SERIES[fibIndex];
        ballsToAdd = Math.max(1, targetTotal - currentCount);
      }

      // Limiter pour préserver les 60 FPS
      const maxBalls = this.config.MAX_TOTAL_BALLS_PER_SIDE || 150;
      ballsToAdd = Math.min(ballsToAdd, maxBalls - currentCount);

      if (ballsToAdd > 0) {
        const balls = isLeft ? this.leftBalls : this.rightBalls;
        const dmg = isLeft ? this.currentLeftDamage : this.currentRightDamage;
        for (let i = 0; i < ballsToAdd; i++) {
          const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.8;
          const speed = Math.random() * 220 + 80;
          balls.push(
            new DuelBall(
              bar.x + bar.width * 0.5 + (Math.random() - 0.5) * 40,
              bar.y - 10,
              Math.cos(angle) * speed,
              Math.sin(angle) * speed,
              this.config.BALL_RADIUS,
              side,
              dmg
            )
          );
        }
      }
    }

    // 3. Notification flottante valorisante
    let notifText = '';
    if (target === 'balls') {
      notifText = `+${ballsToAdd} BILLES !`;
    } else if (target === 'damage') {
      const dmg = isLeft ? this.currentLeftDamage : this.currentRightDamage;
      notifText = `DÉGÂTS : ${dmg} !`;
    } else {
      const dmg = isLeft ? this.currentLeftDamage : this.currentRightDamage;
      notifText = `+${ballsToAdd} B. | DÉG: ${dmg}!`;
    }

    this.notifications.push(
      new FloatingNotification(
        bar.x + bar.width / 2,
        bar.y,
        notifText,
        isLeft ? '#00f0ff' : '#ff007f'
      )
    );

    // 4. Explosion de particules
    for (let i = 0; i < 20; i++) {
      this.particles.push(
        new DuelParticle(
          bar.x + Math.random() * bar.width,
          bar.y + Math.random() * bar.height,
          isLeft ? '#00f0ff' : '#ff007f',
          1.5
        )
      );
    }

    if (this.config.SCREEN_SHAKE_ENABLED) {
      this.screenShake = 4.5;
    }
  }

  private updatePhysics(dt: number) {
    if (this.state === 'WAITING') return;

    const gravity = this.config.GRAVITY;
    const bounce = this.config.BOUNCE;

    // Mise à jour balles Gauche
    for (let i = 0; i < this.leftBalls.length; i++) {
      const b = this.leftBalls[i];
      b.update(
        dt,
        gravity,
        this.leftColX,
        this.leftColX + this.leftColWidth,
        bounce
      );

      // Rebond plafond
      if (b.y - b.radius < this.topLimit) {
        b.y = this.topLimit + b.radius;
        b.vy = Math.abs(b.vy) * bounce;
      }

      // Collisions avec les barres gauches
      for (let j = 0; j < this.leftBars.length; j++) {
        const bar = this.leftBars[j];
        if (bar.isBroken) continue;

        if (
          b.x + b.radius > bar.x &&
          b.x - b.radius < bar.x + bar.width &&
          b.y + b.radius > bar.y &&
          b.y - b.radius < bar.y + bar.height
        ) {
          // Détection face d'impact
          if (b.vy > 0 && b.y < bar.y + bar.height * 0.5) {
            b.y = bar.y - b.radius;
            b.vy = -Math.abs(b.vy) * bounce - 35;
          } else {
            b.y = bar.y + bar.height + b.radius;
            b.vy = Math.abs(b.vy) * bounce + 25;
          }
          b.vx += (Math.random() - 0.5) * 50;
          b.flash = 1.0;

          sound.playBounce(this.bounceCombo++, 0.5);

          const destroyed = bar.hit(b.damage);
          if (destroyed) {
            sound.playWallDestroy();
            this.handleBarBreak('left', bar);
            this.syncHUD();
          }
        }
      }

      // Victoire Gauche si toutes les barres sont détruites et une balle passe la ligne
      const leftActive = this.leftBars.filter((bar) => !bar.isBroken).length;
      if (leftActive === 0 && b.y > this.bottomLimit - 15) {
        if (this.state === 'RUNNING') {
          this.triggerVictory('left');
        }
      }
    }

    // Mise à jour balles Droite
    for (let i = 0; i < this.rightBalls.length; i++) {
      const b = this.rightBalls[i];
      b.update(
        dt,
        gravity,
        this.rightColX,
        this.rightColX + this.rightColWidth,
        bounce
      );

      // Rebond plafond
      if (b.y - b.radius < this.topLimit) {
        b.y = this.topLimit + b.radius;
        b.vy = Math.abs(b.vy) * bounce;
      }

      // Collisions avec les barres droites
      for (let j = 0; j < this.rightBars.length; j++) {
        const bar = this.rightBars[j];
        if (bar.isBroken) continue;

        if (
          b.x + b.radius > bar.x &&
          b.x - b.radius < bar.x + bar.width &&
          b.y + b.radius > bar.y &&
          b.y - b.radius < bar.y + bar.height
        ) {
          if (b.vy > 0 && b.y < bar.y + bar.height * 0.5) {
            b.y = bar.y - b.radius;
            b.vy = -Math.abs(b.vy) * bounce - 35;
          } else {
            b.y = bar.y + bar.height + b.radius;
            b.vy = Math.abs(b.vy) * bounce + 25;
          }
          b.vx += (Math.random() - 0.5) * 50;
          b.flash = 1.0;

          sound.playBounce(this.bounceCombo++, 0.7);

          const destroyed = bar.hit(b.damage);
          if (destroyed) {
            sound.playWallDestroy();
            this.handleBarBreak('right', bar);
            this.syncHUD();
          }
        }
      }

      // Victoire Droite
      const rightActive = this.rightBars.filter((bar) => !bar.isBroken).length;
      if (rightActive === 0 && b.y > this.bottomLimit - 15) {
        if (this.state === 'RUNNING') {
          this.triggerVictory('right');
        }
      }
    }

    // Mise à jour des barres
    this.leftBars.forEach((bar) => bar.update(dt));
    this.rightBars.forEach((bar) => bar.update(dt));

    // Particules
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Notifications flottantes
    for (let i = this.notifications.length - 1; i >= 0; i--) {
      const n = this.notifications[i];
      n.update(dt);
      if (n.life <= 0) {
        this.notifications.splice(i, 1);
      }
    }

    // Tremblement d'écran
    if (this.screenShake > 0) {
      this.shakeX = (Math.random() - 0.5) * this.screenShake;
      this.shakeY = (Math.random() - 0.5) * this.screenShake;
      this.screenShake = Math.max(0, this.screenShake - 12 * dt);
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }

    // Décompte de victoire pour rejouer en boucle
    if (this.state === 'FINISHED') {
      this.restartTimer += dt;
      if (this.restartTimer >= 4.0) {
        this.initGame();
        this.state = 'RUNNING';
        this.syncHUD();
      }
    }
  }

  private triggerVictory(winner: 'left' | 'right') {
    this.state = 'FINISHED';
    this.winnerSide = winner;
    this.restartTimer = 0;

    sound.playEscape();

    // Pluie de confettis victorieux
    const color = winner === 'left' ? '#00f0ff' : '#ff007f';
    for (let i = 0; i < 70; i++) {
      this.particles.push(
        new DuelParticle(
          winner === 'left' ? 142.5 : 397.5,
          this.bottomLimit - 40,
          color,
          2.0
        )
      );
    }

    this.syncHUD();
  }

  private render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const scale = this.viewScale;
    const offX = this.offsetX || 0;
    const offY = this.offsetY || 0;
    ctx.translate(offX + this.shakeX * scale, offY + this.shakeY * scale);
    ctx.scale(scale, scale);

    // 1. Fond des colonnes
    this.drawColumnsBackground();

    // 2. Barres horizontales
    this.leftBars.forEach((bar) => bar.draw(ctx));
    this.rightBars.forEach((bar) => bar.draw(ctx));

    // 3. Balles
    this.leftBalls.forEach((ball) => ball.draw(ctx));
    this.rightBalls.forEach((ball) => ball.draw(ctx));

    // 4. Particules
    this.particles.forEach((p) => p.draw(ctx));

    // 5. Notifications flottantes
    this.notifications.forEach((n) => n.draw(ctx));

    // 6. Bannière d'arrivée & victoire
    this.drawFinishLine();

    // 7. Dessin du HUD textuel en haut du Canvas (inclus dans la vidéo 9:16)
    drawCanvasHUD(ctx, this.currentHUD, VIRTUAL_WIDTH);

    ctx.restore();
  }

  private drawColumnsBackground() {
    const ctx = this.ctx;

    // Fond colonne gauche
    ctx.fillStyle = 'rgba(0, 240, 255, 0.03)';
    ctx.fillRect(this.leftColX, this.topLimit, this.leftColWidth, this.bottomLimit - this.topLimit);

    // Fond colonne droite
    ctx.fillStyle = 'rgba(255, 0, 127, 0.03)';
    ctx.fillRect(this.rightColX, this.topLimit, this.rightColWidth, this.bottomLimit - this.topLimit);

    // Séparateur central néon
    ctx.beginPath();
    ctx.moveTo(this.dividerX + this.dividerWidth / 2, this.topLimit);
    ctx.lineTo(this.dividerX + this.dividerWidth / 2, this.bottomLimit);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.dividerX + this.dividerWidth / 2, this.topLimit);
    ctx.lineTo(this.dividerX + this.dividerWidth / 2, this.bottomLimit);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Parois extérieures gauche et droite
    ctx.beginPath();
    ctx.moveTo(this.leftColX, this.topLimit);
    ctx.lineTo(this.leftColX, this.bottomLimit);
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.rightColX + this.rightColWidth, this.topLimit);
    ctx.lineTo(this.rightColX + this.rightColWidth, this.bottomLimit);
    ctx.strokeStyle = '#ff007f';
    ctx.shadowColor = 'rgba(255, 0, 127, 0.5)';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // En-têtes de colonnes (Nom & stats)
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';

    const isEn = this.config.TEXT_LABEL_LEFT === 'LEFT';
    const dmgLabel = isEn ? 'Dmg' : 'Dég';

    // En-tête gauche
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(
      `${this.config.TEXT_LABEL_LEFT || 'GAUCHE'} (x${this.leftBalls.length} | ${dmgLabel}: ${this.currentLeftDamage})`,
      this.leftColX + this.leftColWidth / 2,
      this.topLimit - 12
    );

    // En-tête droite
    ctx.fillStyle = '#ff007f';
    ctx.fillText(
      `${this.config.TEXT_LABEL_RIGHT || 'DROITE'} (x${this.rightBalls.length} | ${dmgLabel}: ${this.currentRightDamage})`,
      this.rightColX + this.rightColWidth / 2,
      this.topLimit - 12
    );
  }

  private drawFinishLine() {
    const ctx = this.ctx;
    const y = this.bottomLimit;
    const isEn = this.config.TEXT_LABEL_LEFT === 'LEFT';

    // Ligne d'arrivée en damier / glowing finish
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([12, 8]);
    ctx.moveTo(this.leftColX, y);
    ctx.lineTo(this.rightColX + this.rightColWidth, y);
    ctx.strokeStyle = '#ffd700';
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(isEn ? '🏁 FINISH LINE 🏁' : '🏁 LIGNE D\'ARRIVÉE 🏁', VIRTUAL_WIDTH / 2, y + 18);

    // Affichage Victoire si terminé
    if (this.state === 'FINISHED' && this.winnerSide) {
      const isLeft = this.winnerSide === 'left';
      const winColor = isLeft ? '#00f0ff' : '#ff007f';
      const winText = isLeft
        ? (this.config.TEXT_WIN_LEFT || (isEn ? '🏆 LEFT VICTORY! 🏆' : '🏆 VICTOIRE GAUCHE ! 🏆'))
        : (this.config.TEXT_WIN_RIGHT || (isEn ? '🏆 RIGHT VICTORY! 🏆' : '🏆 VICTOIRE DROITE ! 🏆'));

      ctx.beginPath();
      ctx.roundRect(VIRTUAL_WIDTH / 2 - 180, 440, 360, 75, 16);
      ctx.fillStyle = 'rgba(6, 8, 13, 0.92)';
      ctx.strokeStyle = winColor;
      ctx.shadowColor = winColor;
      ctx.shadowBlur = 24;
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.font = '900 16px "Inter", sans-serif';
      ctx.fillText(winText, VIRTUAL_WIDTH / 2, 470);

      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillStyle = winColor;
      ctx.fillText(isEn ? 'Restarting in a moment...' : 'Recommence dans un instant...', VIRTUAL_WIDTH / 2, 495);
    }

    ctx.restore();
  }

  public handlePointerDown = (e: MouseEvent | TouchEvent, clientX: number, clientY: number) => {
    this.start();
  };

  private loop = (timestamp: number) => {
    if (this.isDestroyed) return;

    const rawDt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    const dt = Math.min(0.05, rawDt);

    // Si victoire : ralenti cinématique
    const timeScale = this.state === 'FINISHED' ? 0.35 : 1.0;
    this.updatePhysics(dt * timeScale);
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

