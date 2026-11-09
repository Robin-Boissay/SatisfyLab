import { GameInstance, GameHUDState } from '../../core/types';
import { sound } from '../../core/SoundEngine';
import { drawCanvasHUD } from '../../core/canvasHUD';
import {
  TerritoryWarConfig,
  DEFAULT_TERRITORY_WAR_CONFIG,
  TeamId
} from './types';
import {
  TerritoryBall,
  Tile,
  TerritoryParticle
} from './entities';

const VIRTUAL_WIDTH = 540;
const VIRTUAL_HEIGHT = 960;

export class TerritoryWarGame implements GameInstance {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onHUDUpdate: (hud: GameHUDState) => void;
  public config: TerritoryWarConfig;

  private isDestroyed: boolean = false;
  private animFrameId: number | null = null;
  private lastTime: number = performance.now();

  private state: 'WAITING' | 'RUNNING' | 'FINISHED' = 'WAITING';
  private winnerTeam: TeamId | null = null;
  private restartTimer: number = 0;
  private bounceCount: number = 0;
  private currentHUD: GameHUDState = {};

  // Géométrie de l'arène
  public readonly arenaX = 25;
  public readonly arenaY = 160;
  public readonly arenaWidth = 490;
  public readonly arenaHeight = 710;

  // Grille
  private tiles: Tile[] = [];
  private cols: number = 16;
  private rows: number = 26;
  private tileW: number = 0;
  private tileH: number = 0;

  // Balles & Particules
  private balls: TerritoryBall[] = [];
  private particles: TerritoryParticle[] = [];

  // Statistiques de terrain
  private cyanTilesCount: number = 0;
  private magentaTilesCount: number = 0;
  private totalTilesCount: number = 0;

  // Renforts & Overdrive
  private cyanReinforcementSpawned: boolean = false;
  private magentaReinforcementSpawned: boolean = false;
  private knockoutTeam: TeamId | null = null;
  private comboCount: { cyan: number; magenta: number } = { cyan: 0, magenta: 0 };

  // Visuels & Secousses
  private screenShake: number = 0;
  private shakeX: number = 0;
  private shakeY: number = 0;
  private viewScale: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    initialConfig: TerritoryWarConfig,
    onHUDUpdate: (hud: GameHUDState) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onHUDUpdate = onHUDUpdate;
    this.config = { ...DEFAULT_TERRITORY_WAR_CONFIG, ...initialConfig };

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
    this.winnerTeam = null;
    this.restartTimer = 0;
    this.bounceCount = 0;
    this.particles = [];
    this.cyanReinforcementSpawned = false;
    this.magentaReinforcementSpawned = false;
    this.knockoutTeam = null;
    this.comboCount = { cyan: 0, magenta: 0 };

    this.cols = Math.max(8, Math.min(28, Math.round(this.config.GRID_COLUMNS)));
    this.rows = Math.max(12, Math.min(40, Math.round(this.config.GRID_ROWS)));
    this.tileW = this.arenaWidth / this.cols;
    this.tileH = this.arenaHeight / this.rows;
    this.totalTilesCount = this.cols * this.rows;

    // 1. Génération de la grille (moitié gauche Cyan, moitié droite Magenta)
    this.tiles = [];
    this.cyanTilesCount = 0;
    this.magentaTilesCount = 0;

    const midCol = Math.floor(this.cols / 2);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const team: TeamId = c < midCol ? 'cyan' : 'magenta';
        if (team === 'cyan') this.cyanTilesCount++;
        else this.magentaTilesCount++;

        this.tiles.push(
          new Tile(
            c,
            r,
            this.arenaX + c * this.tileW,
            this.arenaY + r * this.tileH,
            this.tileW,
            this.tileH,
            team
          )
        );
      }
    }

    // 2. Initialisation des balles
    // La balle Cyan commence dans le camp Magenta (droite) pour le conquérir
    // La balle Magenta commence dans le camp Cyan (gauche) pour le conquérir
    this.balls = [];
    let ballId = 1;
    const ballsPerTeam = Math.max(1, Math.min(5, this.config.BALLS_PER_TEAM));
    const speed = this.config.INITIAL_SPEED;

    // Balles Cyan (côté droit)
    for (let i = 0; i < ballsPerTeam; i++) {
      const angle = (Math.PI * 0.75) + (Math.random() - 0.5) * 0.8;
      this.balls.push(
        new TerritoryBall(
          ballId++,
          'cyan',
          this.arenaX + this.arenaWidth * 0.75 + (Math.random() - 0.5) * 40,
          this.arenaY + this.arenaHeight * (0.3 + 0.4 * (i / ballsPerTeam)),
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          this.config.BALL_RADIUS
        )
      );
    }

    // Balles Magenta (côté gauche)
    for (let i = 0; i < ballsPerTeam; i++) {
      const angle = (-Math.PI * 0.25) + (Math.random() - 0.5) * 0.8;
      this.balls.push(
        new TerritoryBall(
          ballId++,
          'magenta',
          this.arenaX + this.arenaWidth * 0.25 + (Math.random() - 0.5) * 40,
          this.arenaY + this.arenaHeight * (0.3 + 0.4 * (i / ballsPerTeam)),
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          this.config.BALL_RADIUS
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

  public updateConfig(newConfig: Partial<TerritoryWarConfig>) {
    const prevCols = this.config.GRID_COLUMNS;
    const prevRows = this.config.GRID_ROWS;
    const prevBalls = this.config.BALLS_PER_TEAM;

    this.config = { ...this.config, ...newConfig };

    if (
      newConfig.GRID_COLUMNS !== undefined && newConfig.GRID_COLUMNS !== prevCols ||
      newConfig.GRID_ROWS !== undefined && newConfig.GRID_ROWS !== prevRows ||
      newConfig.BALLS_PER_TEAM !== undefined && newConfig.BALLS_PER_TEAM !== prevBalls
    ) {
      this.initGame();
    }

    this.syncHUD();
  }

  private syncHUD() {
    const cyanPct = (this.cyanTilesCount / this.totalTilesCount) * 100;
    const magentaPct = 100 - cyanPct;

    let statusText: string | undefined;
    const threshold = this.config.OVERDRIVE_THRESHOLD || 55;
    const isEn = this.config.TEXT_TEAM_B === 'PINK';

    if (this.state === 'WAITING') {
      statusText = this.config.TEXT_START_PROMPT || (isEn ? 'Click to start conquest' : 'Clique pour lancer la conquête');
    } else if (this.state === 'FINISHED') {
      statusText = this.winnerTeam === 'cyan'
        ? (this.config.TEXT_WIN_A || (isEn ? '🏆 CYAN VICTORY (100%)! 🏆' : '🏆 VICTOIRE CYAN (100%) ! 🏆'))
        : (this.config.TEXT_WIN_B || (isEn ? '🏆 PINK VICTORY (100%)! 🏆' : '🏆 VICTOIRE ROSE (100%) ! 🏆'));
    } else if (this.state === 'RUNNING') {
      if (this.knockoutTeam) {
        const winningName = this.knockoutTeam === 'cyan' ? (this.config.TEXT_TEAM_B || (isEn ? 'PINK' : 'ROSE')) : (this.config.TEXT_TEAM_A || 'CYAN');
        statusText = isEn ? `⚡ ENEMY K.O.! ${winningName} COMPLETING 100%...` : `⚡ K.O. ADVERSE ! ${winningName} FINALISE LE 100%...`;
      } else if (cyanPct >= 75) {
        statusText = isEn ? '⚡ MEGA RUSH CYAN (75%+)!' : '⚡ MEGA RUSH CYAN (75%+) !';
      } else if (cyanPct >= threshold) {
        statusText = isEn ? `🔥 OVERDRIVE ${this.config.TEXT_TEAM_A || 'CYAN'} ACTIVATED!` : `🔥 OVERDRIVE ${this.config.TEXT_TEAM_A || 'CYAN'} ACTIVÉ !`;
      } else if (magentaPct >= 75) {
        statusText = isEn ? `⚡ MEGA RUSH ${this.config.TEXT_TEAM_B || 'PINK'} (75%+)!` : `⚡ MEGA RUSH ${this.config.TEXT_TEAM_B || 'ROSE'} (75%+) !`;
      } else if (magentaPct >= threshold) {
        statusText = isEn ? `🔥 OVERDRIVE ${this.config.TEXT_TEAM_B || 'PINK'} ACTIVATED!` : `🔥 OVERDRIVE ${this.config.TEXT_TEAM_B || 'ROSE'} ACTIVÉ !`;
      }
    }

    this.currentHUD = {
      title: this.config.TEXT_TITLE || '⚔️ GUERRE DE TERRITOIRE ⚔️',
      primaryMetricLabel: this.config.TEXT_TEAM_A || 'CYAN',
      primaryMetricValue: `${cyanPct.toFixed(1)}%`,
      primaryMetricColor: '#00f0ff',
      secondaryMetricLabel: this.config.TEXT_TEAM_B || 'ROSE',
      secondaryMetricValue: `${magentaPct.toFixed(1)}%`,
      secondaryMetricColor: '#ff007f',
      statusText,
      isWaitingToStart: this.state === 'WAITING',
      overlayPromptText: this.config.TEXT_START_PROMPT || 'Clique pour lancer la conquête',
      isFinished: this.state === 'FINISHED'
    };
    this.onHUDUpdate(this.currentHUD);
  }

  private spawnReinforcement(team: TeamId) {
    const angle = team === 'cyan' ? Math.PI * 0.75 : -Math.PI * 0.25;
    const speed = this.config.INITIAL_SPEED * (this.config.OVERDRIVE_SPEED_BOOST || 1.35);
    const startX = this.arenaX + (team === 'cyan' ? this.arenaWidth * 0.65 : this.arenaWidth * 0.35);
    const startY = this.arenaY + this.arenaHeight * 0.5;

    const newBall = new TerritoryBall(
      this.balls.length + 1,
      team,
      startX,
      startY,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      this.config.BALL_RADIUS
    );
    newBall.isOverdrive = true;
    this.balls.push(newBall);

    // Effet d'apparition fracassant
    sound.playWallDestroy();
    const color = team === 'cyan' ? '#00f0ff' : '#ff007f';
    for (let i = 0; i < 30; i++) {
      this.particles.push(new TerritoryParticle(startX, startY, color));
    }
    this.screenShake = 4.5;
  }

  private eliminateTeamBalls(team: TeamId) {
    this.knockoutTeam = team;
    const eliminatedBalls = this.balls.filter((b) => b.team === team);
    this.balls = this.balls.filter((b) => b.team !== team);

    sound.playWallDestroy();

    const color = team === 'cyan' ? '#00f0ff' : '#ff007f';
    for (const b of eliminatedBalls) {
      for (let i = 0; i < 40; i++) {
        this.particles.push(new TerritoryParticle(b.x, b.y, color));
      }
    }
    this.screenShake = 6.0;
    this.syncHUD();
  }

  private updatePhysics(dt: number) {
    if (this.state === 'WAITING') return;

    const gravity = this.config.GRAVITY;
    const speedMultiplier = this.config.BOUNCE_SPEED_MULTIPLIER || 1.002;
    const minX = this.arenaX;
    const maxX = this.arenaX + this.arenaWidth;
    const minY = this.arenaY;
    const maxY = this.arenaY + this.arenaHeight;

    const cyanPct = (this.cyanTilesCount / this.totalTilesCount) * 100;
    const magentaPct = 100 - cyanPct;
    const threshold = this.config.OVERDRIVE_THRESHOLD || 55;

    const isCyanOverdrive = cyanPct >= threshold;
    const isMagentaOverdrive = magentaPct >= threshold;

    // 1. Déclenchement des renforts dès le seuil de domination franchi
    if (this.config.REINFORCEMENTS_ENABLED) {
      if (isCyanOverdrive && !this.cyanReinforcementSpawned) {
        this.cyanReinforcementSpawned = true;
        this.spawnReinforcement('cyan');
      }
      if (isMagentaOverdrive && !this.magentaReinforcementSpawned) {
        this.magentaReinforcementSpawned = true;
        this.spawnReinforcement('magenta');
      }
    }

    // 2. K.O. Final : Élimination des billes adverses acculées pour empêcher la reconquête infinie
    if (this.config.KNOCKOUT_ENABLED) {
      const koPct = (this.config.KNOCKOUT_THRESHOLD || 6) / 100;
      const koTileThreshold = Math.max(3, Math.round(this.totalTilesCount * koPct));

      if (this.cyanTilesCount <= koTileThreshold && this.balls.some((b) => b.team === 'cyan')) {
        this.eliminateTeamBalls('cyan');
      } else if (this.magentaTilesCount <= koTileThreshold && this.balls.some((b) => b.team === 'magenta')) {
        this.eliminateTeamBalls('magenta');
      }
    }

    for (let i = 0; i < this.balls.length; i++) {
      const b = this.balls[i];
      const isOverdrive = (b.team === 'cyan' && isCyanOverdrive) || (b.team === 'magenta' && isMagentaOverdrive);
      const teamPct = b.team === 'cyan' ? cyanPct : magentaPct;

      b.isOverdrive = isOverdrive;

      // Vitesse adaptée selon le mode Overdrive / Mega Rush
      const baseSpeed = this.config.INITIAL_SPEED;
      let targetSpeed = baseSpeed;
      if (isOverdrive) {
        targetSpeed = baseSpeed * (teamPct >= 75 ? 1.45 : this.config.OVERDRIVE_SPEED_BOOST || 1.3);
      }

      // 1. Déplacement de la bille
      b.update(dt, gravity, minX, maxX, minY, maxY);

      // 2. Traque Magnétique douce en vol libre (courbe la trajectoire sans annuler les rebonds)
      if (this.config.MAGNETIC_HUNT && isOverdrive) {
        let closestDistSq = Infinity;
        let targetX = -1;
        let targetY = -1;
        const step = this.tiles.length > 500 ? 3 : 2;

        for (let j = 0; j < this.tiles.length; j += step) {
          const t = this.tiles[j];
          if (t.team !== b.team) {
            const cx = t.x + t.width / 2;
            const cy = t.y + t.height / 2;
            const distSq = (cx - b.x) * (cx - b.x) + (cy - b.y) * (cy - b.y);
            if (distSq < closestDistSq) {
              closestDistSq = distSq;
              targetX = cx;
              targetY = cy;
            }
          }
        }

        if (targetX !== -1 && closestDistSq > 100) {
          const currentAngle = Math.atan2(b.vy, b.vx);
          const desiredAngle = Math.atan2(targetY - b.y, targetX - b.x);
          let angleDiff = desiredAngle - currentAngle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

          const maxTurn = (teamPct >= 75 ? 2.5 : 1.4) * dt;
          const turn = Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
          const newAngle = currentAngle + turn;
          b.vx = Math.cos(newAngle) * targetSpeed;
          b.vy = Math.sin(newAngle) * targetSpeed;
        }
      }

      // 3. Détection de collision et REBOND contre une tuile adverse
      // On teste les points cardinaux du périmètre de la bille dans le sens du mouvement
      const checkPoints = [
        { x: b.x + Math.sign(b.vx) * (b.radius * 0.8), y: b.y },
        { x: b.x, y: b.y + Math.sign(b.vy) * (b.radius * 0.8) },
        { x: b.x, y: b.y }
      ];

      let hasBounced = false;

      for (const pt of checkPoints) {
        if (hasBounced) break;

        const col = Math.floor((pt.x - this.arenaX) / this.tileW);
        const row = Math.floor((pt.y - this.arenaY) / this.tileH);

        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
          const index = row * this.cols + col;
          const tile = this.tiles[index];

          if (tile && tile.team !== b.team) {
            hasBounced = true;

            // Capture de la tuile heurtée
            tile.capture(b.team);
            if (b.team === 'cyan') {
              this.cyanTilesCount++;
              this.magentaTilesCount--;
              this.comboCount.cyan++;
              this.comboCount.magenta = 0;
            } else {
              this.magentaTilesCount++;
              this.cyanTilesCount--;
              this.comboCount.magenta++;
              this.comboCount.cyan = 0;
            }

            // Calcul du rebond physique net et repositionnement
            const tileCenterX = tile.x + tile.width / 2;
            const tileCenterY = tile.y + tile.height / 2;
            const diffX = b.x - tileCenterX;
            const diffY = b.y - tileCenterY;
            const normX = Math.abs(diffX) / (tile.width / 2);
            const normY = Math.abs(diffY) / (tile.height / 2);

            if (normX >= normY) {
              // Rebond horizontal net
              b.vx = diffX >= 0 ? Math.abs(b.vx) : -Math.abs(b.vx);
              b.x = tileCenterX + Math.sign(diffX || 1) * (tile.width / 2 + b.radius + 1);
            } else {
              // Rebond vertical net
              b.vy = diffY >= 0 ? Math.abs(b.vy) : -Math.abs(b.vy);
              b.y = tileCenterY + Math.sign(diffY || 1) * (tile.height / 2 + b.radius + 1);
            }

            // Légère composante aléatoire pour des angles variés
            b.vx += (Math.random() - 0.5) * 20;
            b.vy += (Math.random() - 0.5) * 20;

            // Normaliser à la vitesse cible
            const spd = Math.hypot(b.vx, b.vy);
            if (spd > 0) {
              b.vx = (b.vx / spd) * targetSpeed;
              b.vy = (b.vy / spd) * targetSpeed;
            }

            b.flash = 1.0;
            sound.playBounce(this.bounceCount++, 0.65);

            // Rayon de Splash progressif : s'élargit en Overdrive
            let effectiveSplash = Math.max(1, this.config.SPLASH_RADIUS || 1);
            if (isOverdrive) {
              effectiveSplash = teamPct >= 75 ? Math.max(3, effectiveSplash + 2) : Math.max(2, effectiveSplash + 1);
            }
            if (effectiveSplash > 1) {
              this.applySplash(col, row, b.team, effectiveSplash);
            }

            // Onde de choc en combo
            const currentCombo = b.team === 'cyan' ? this.comboCount.cyan : this.comboCount.magenta;
            if (this.config.COMBO_SHOCKWAVE && currentCombo >= 3) {
              this.applySplash(col, row, b.team, effectiveSplash + 1);
            }

            // Particules
            for (let p = 0; p < (isOverdrive ? 12 : 6); p++) {
              this.particles.push(
                new TerritoryParticle(
                  tileCenterX,
                  tileCenterY,
                  b.team === 'cyan' ? '#00f0ff' : '#ff007f'
                )
              );
            }

            if (this.config.SCREEN_SHAKE_ENABLED) {
              this.screenShake = isOverdrive ? 3.0 : 1.5;
            }

            this.syncHUD();

            // Vérification de victoire 100%
            if (this.cyanTilesCount >= this.totalTilesCount) {
              this.triggerVictory('cyan');
              break;
            } else if (this.magentaTilesCount >= this.totalTilesCount) {
              this.triggerVictory('magenta');
              break;
            }
          }
        }
      }
    }

    // Mise à jour des tuiles
    for (let i = 0; i < this.tiles.length; i++) {
      this.tiles[i].update(dt);
    }

    // Particules
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Secousses d'écran
    if (this.screenShake > 0) {
      this.shakeX = (Math.random() - 0.5) * this.screenShake;
      this.shakeY = (Math.random() - 0.5) * this.screenShake;
      this.screenShake = Math.max(0, this.screenShake - 14 * dt);
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }

    // Compte à rebours de fin de partie
    if (this.state === 'FINISHED') {
      this.restartTimer += dt;
      if (this.restartTimer >= 4.0) {
        this.initGame();
        this.state = 'RUNNING';
        this.syncHUD();
      }
    }
  }

  private applySplash(centerCol: number, centerRow: number, team: TeamId, radius: number) {
    const maxOffset = radius - 1;
    for (let dr = -maxOffset; dr <= maxOffset; dr++) {
      for (let dc = -maxOffset; dc <= maxOffset; dc++) {
        if (Math.abs(dr) + Math.abs(dc) > maxOffset) continue;
        const c = centerCol + dc;
        const r = centerRow + dr;
        if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
          const idx = r * this.cols + c;
          const t = this.tiles[idx];
          if (t && t.team !== team) {
            t.capture(team);
            if (team === 'cyan') {
              this.cyanTilesCount++;
              this.magentaTilesCount--;
            } else {
              this.magentaTilesCount++;
              this.cyanTilesCount--;
            }
          }
        }
      }
    }
  }

  private triggerVictory(winner: TeamId) {
    this.state = 'FINISHED';
    this.winnerTeam = winner;
    this.restartTimer = 0;

    sound.playEscape();

    // Explosion de confettis
    const color = winner === 'cyan' ? '#00f0ff' : '#ff007f';
    for (let i = 0; i < 90; i++) {
      this.particles.push(
        new TerritoryParticle(
          this.arenaX + this.arenaWidth / 2,
          this.arenaY + this.arenaHeight / 2,
          color
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

    // 1. Rendu des tuiles du terrain
    for (let i = 0; i < this.tiles.length; i++) {
      this.tiles[i].draw(ctx);
    }

    // 2. Cadre néon de l'arène
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.arenaX, this.arenaY, this.arenaWidth, this.arenaHeight);

    // Jauge de territoire en bas
    this.drawBottomTerritoryBar();

    // 3. Particules
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].draw(ctx);
    }

    // 4. Balles
    for (let i = 0; i < this.balls.length; i++) {
      this.balls[i].draw(ctx);
    }

    // 5. Bannière de Victoire si terminée
    if (this.state === 'FINISHED' && this.winnerTeam) {
      this.drawVictoryBanner();
    }

    // 6. Dessin du HUD textuel en haut du Canvas (inclus dans la vidéo 9:16)
    drawCanvasHUD(ctx, this.currentHUD, VIRTUAL_WIDTH);

    ctx.restore();
    ctx.restore();
  }

  private drawBottomTerritoryBar() {
    const ctx = this.ctx;
    const barY = this.arenaY + this.arenaHeight + 16;
    const barH = 12;
    const cyanRatio = Math.max(0, Math.min(1, this.cyanTilesCount / this.totalTilesCount));

    ctx.save();
    // Fond jauge
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(this.arenaX, barY, this.arenaWidth, barH);

    // Partie Cyan
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.fillRect(this.arenaX, barY, this.arenaWidth * cyanRatio, barH);

    // Partie Magenta
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.fillRect(
      this.arenaX + this.arenaWidth * cyanRatio,
      barY,
      this.arenaWidth * (1 - cyanRatio),
      barH
    );
    ctx.shadowBlur = 0;

    // Bordure
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.arenaX, barY, this.arenaWidth, barH);

    // Repères visuels du seuil Overdrive
    const thresholdRatio = (this.config.OVERDRIVE_THRESHOLD || 55) / 100;
    [1 - thresholdRatio, thresholdRatio].forEach((tRatio) => {
      ctx.beginPath();
      ctx.moveTo(this.arenaX + this.arenaWidth * tRatio, barY - 2);
      ctx.lineTo(this.arenaX + this.arenaWidth * tRatio, barY + barH + 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Pourcentages textuels sous la jauge
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'left';
    ctx.fillText(`${(cyanRatio * 100).toFixed(1)}% ${this.config.TEXT_TEAM_A || 'CYAN'}`, this.arenaX, barY + barH + 16);

    ctx.fillStyle = '#ff007f';
    ctx.textAlign = 'right';
    ctx.fillText(`${this.config.TEXT_TEAM_B || 'ROSE'} ${((1 - cyanRatio) * 100).toFixed(1)}%`, this.arenaX + this.arenaWidth, barY + barH + 16);

    ctx.restore();
  }

  private drawVictoryBanner() {
    const ctx = this.ctx;
    const isEn = this.config.TEXT_TEAM_B === 'PINK';
    const isCyan = this.winnerTeam === 'cyan';
    const winColor = isCyan ? '#00f0ff' : '#ff007f';
    const winText = isCyan
      ? (this.config.TEXT_WIN_A || '🏆 VICTOIRE CYAN (100%) ! 🏆')
      : (this.config.TEXT_WIN_B || '🏆 VICTOIRE ROSE (100%) ! 🏆');

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(VIRTUAL_WIDTH / 2 - 190, 480, 380, 80, 16);
    ctx.fillStyle = 'rgba(6, 8, 13, 0.94)';
    ctx.strokeStyle = winColor;
    ctx.shadowColor = winColor;
    ctx.shadowBlur = 24;
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.font = '900 16px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(winText, VIRTUAL_WIDTH / 2, 514);

    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = winColor;
    ctx.fillText(isEn ? 'Auto looping restart...' : 'Relance automatique en boucle...', VIRTUAL_WIDTH / 2, 540);
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

