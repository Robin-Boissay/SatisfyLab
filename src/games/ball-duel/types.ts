export type UpgradeTarget = 'balls' | 'damage' | 'both';
export type UpgradeMode = 'add' | 'multiply' | 'power' | 'fibonacci';

export const FIBONACCI_SERIES = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610];

export interface BallDuelConfig {
  // Gameplay & Barres
  BARS_COUNT: number;
  BASE_BAR_HP: number;
  BAR_HP_MULTIPLIER: number;
  MAX_TOTAL_BALLS_PER_SIDE: number;

  // Colonne Gauche
  LEFT_INITIAL_BALLS: number;
  LEFT_INITIAL_DAMAGE: number;
  LEFT_UPGRADE_TARGET: UpgradeTarget;
  LEFT_UPGRADE_MODE: UpgradeMode;
  LEFT_UPGRADE_VALUE: number;

  // Colonne Droite
  RIGHT_INITIAL_BALLS: number;
  RIGHT_INITIAL_DAMAGE: number;
  RIGHT_UPGRADE_TARGET: UpgradeTarget;
  RIGHT_UPGRADE_MODE: UpgradeMode;
  RIGHT_UPGRADE_VALUE: number;

  // Physique & Collisions
  GRAVITY: number;
  BOUNCE: number;
  BALL_RADIUS: number;
  SCREEN_SHAKE_ENABLED: boolean;

  // Textes modifiables à l'écran
  TEXT_TITLE: string;
  TEXT_LABEL_LEFT: string;
  TEXT_LABEL_RIGHT: string;
  TEXT_WIN_LEFT: string;
  TEXT_WIN_RIGHT: string;
  TEXT_START_PROMPT: string;
}

export const DEFAULT_BALL_DUEL_CONFIG: BallDuelConfig = {
  BARS_COUNT: 5,
  BASE_BAR_HP: 25,
  BAR_HP_MULTIPLIER: 2.2,
  MAX_TOTAL_BALLS_PER_SIDE: 150,

  // Gauche : commence avec 4 balles, dégâts 1, boost x2 balles par barre
  LEFT_INITIAL_BALLS: 4,
  LEFT_INITIAL_DAMAGE: 1,
  LEFT_UPGRADE_TARGET: 'balls',
  LEFT_UPGRADE_MODE: 'multiply',
  LEFT_UPGRADE_VALUE: 2,

  // Droite : commence avec 2 balles, dégâts 3, boost +4 balles et +1 dégât par barre
  RIGHT_INITIAL_BALLS: 2,
  RIGHT_INITIAL_DAMAGE: 3,
  RIGHT_UPGRADE_TARGET: 'both',
  RIGHT_UPGRADE_MODE: 'add',
  RIGHT_UPGRADE_VALUE: 3,

  GRAVITY: 0.85,
  BOUNCE: 0.72,
  BALL_RADIUS: 9,
  SCREEN_SHAKE_ENABLED: true,

  TEXT_TITLE: "⚔️ GAUCHE VS DROITE ⚔️",
  TEXT_LABEL_LEFT: "GAUCHE",
  TEXT_LABEL_RIGHT: "DROITE",
  TEXT_WIN_LEFT: "🏆 VICTOIRE GAUCHE ! 🏆",
  TEXT_WIN_RIGHT: "🏆 VICTOIRE DROITE ! 🏆",
  TEXT_START_PROMPT: "Clique pour lancer le duel"
};

