import {
  BallSoundInstrument,
  BallMelodyPreset,
  BallBreakStyle
} from '../../core/SoundEngine';

export type GameMode = 'classic' | 'multi-ring' | 'duel' | 'ball-storm';
export type RingGapMode = 'bricks' | 'rotating-gap';
export type BallSkin = 'neon' | 'fireball' | 'planet' | 'sport' | 'emoji' | 'rainbow';
export type BallTrailStyle = 'neon' | 'fire' | 'sparkles' | 'rainbow' | 'none';
export type BackgroundEffect =
  | 'cosmic-stars'
  | 'celestial-rays'
  | 'cyber-grid'
  | 'aurora-waves'
  | 'hypnotic-tunnel'
  | 'none';

export interface BallEscapeConfig {
  // 1. Safe Zone TikTok (9:16)
  ARENA_CENTER_Y: number;
  CIRCLE_RADIUS: number;
  ARENA_STROKE_WIDTH: number;
  SHOW_TOP_HUD: boolean;
  HUD_TOP_OFFSET: number;

  // 2. Modes de jeu & Règles
  GAME_MODE: GameMode;
  CHALLENGE_TIME_LIMIT: number;
  PERFECT_LOOP_ENABLED: boolean;
  PERFECT_LOOP_DELAY: number;
  BULLET_TIME_FACTOR: number;
  CHALLENGE_TITLE: string;
  FREEZE_DELAY_AFTER_ESCAPE: number;

  // 3. Multi-Anneaux Concentriques
  RING_COUNT: number;
  RING_GAP_MODE: RingGapMode;
  GAP_SIZE_DEGREES: number;
  RING_SPACING: number;
  TOTAL_WALL_SEGMENTS: number;
  SEGMENT_HP: number;
  ARENA_ROTATION_SPEED: number;

  // 4. Mode Duel & Combat Multi-Billes (2 à 8 Joueurs)
  BATTLE_BALL_COUNT: number;
  DUEL_P1_COLOR: string;
  DUEL_P2_COLOR: string;
  DUEL_P3_COLOR: string;
  DUEL_P4_COLOR: string;
  DUEL_P1_LABEL: string;
  DUEL_P2_LABEL: string;
  DUEL_P3_LABEL: string;
  DUEL_P4_LABEL: string;

  // 5. Duplication & Tempête de Balles
  BALL_DUPLICATION_ON_BOUNCE: boolean;
  MAX_BALLS: number;

  // 6. Visuels, Thèmes & Skins
  BALL_SKIN: BallSkin;
  BALL_TRAIL_STYLE: BallTrailStyle;
  ARENA_COLOR: string;
  BACKGROUND_COLOR: string;
  BACKGROUND_EFFECT: BackgroundEffect;
  CONFETTI_COUNT: number;
  SHOCKWAVE_ENABLED: boolean;
  SHOCKWAVE_DURATION: number;

  // 7. Tremblement d'écran
  SCREEN_SHAKE_ENABLED: boolean;
  SCREEN_SHAKE_INTENSITY: number;
  SCREEN_SHAKE_MAX: number;
  SCREEN_SHAKE_DECAY: number;

  // 8. Audio ASMR Procédural
  SOUND_BOUNCE_ENABLED: boolean;
  SOUND_BOUNCE_STYLE: BallSoundInstrument;
  SOUND_BOUNCE_VOLUME: number;
  SOUND_MELODY_PRESET: BallMelodyPreset;
  SOUND_BREAK_ENABLED: boolean;
  SOUND_BREAK_STYLE: BallBreakStyle;
  SOUND_BREAK_VOLUME: number;
  SOUND_ESCAPE_ENABLED: boolean;
  SOUND_ESCAPE_VOLUME: number;
  SOUND_PITCH_MULT: number;
  SOUND_COMBO_PITCH: boolean;

  // 9. Moteur Physique & Collisions
  SEED: number;
  GRAVITY: number;
  INITIAL_SPEED: number;
  BOUNCE_SPEED_MULTIPLIER: number;
  MAX_SPEED: number;
  BALL_RADIUS: number;
  SUB_STEPS: number;
  BALL_COLLISION_ENABLED: boolean;
  BALL_COLLISION_ELASTICITY: number;
  BOUNCE_DEFLECTION: number;
  BOUNCE_RANDOMNESS?: number;
  BOUNCE_DIR_RANDOMNESS: number;
  BOUNCE_SPEED_RANDOMNESS: number;
  WALL_SPIN_TRANSFER: number;

  // 10. Textes & HUD personnalisables
  TEXT_TITLE: string;
  TEXT_METRIC_TIME: string;
  TEXT_METRIC_BOUNCES: string;
  TEXT_STATUS_START: string;
  TEXT_STATUS_ESCAPE: string;
  TEXT_STATUS_WIN: string;
  TEXT_STATUS_LOSS: string;
}

export const DEFAULT_BALL_ESCAPE_CONFIG: BallEscapeConfig = {
  // Safe Zone
  ARENA_CENTER_Y: 480,
  CIRCLE_RADIUS: 180,
  ARENA_STROKE_WIDTH: 8,
  SHOW_TOP_HUD: true,
  HUD_TOP_OFFSET: 0,

  // Modes & Défi
  GAME_MODE: 'classic',
  CHALLENGE_TIME_LIMIT: 30,
  PERFECT_LOOP_ENABLED: true,
  PERFECT_LOOP_DELAY: 2.2,
  BULLET_TIME_FACTOR: 0.25,
  CHALLENGE_TITLE: 'CAN THE BALL ESCAPE IN 30s?',
  FREEZE_DELAY_AFTER_ESCAPE: 1.0,

  // Multi-Anneaux
  RING_COUNT: 1,
  RING_GAP_MODE: 'rotating-gap',
  GAP_SIZE_DEGREES: 36,
  RING_SPACING: 36,
  TOTAL_WALL_SEGMENTS: 28,
  SEGMENT_HP: 3,
  ARENA_ROTATION_SPEED: 0.35,

  // Duel & Combat Multi-Billes
  BATTLE_BALL_COUNT: 2,
  DUEL_P1_COLOR: '#00f0ff',
  DUEL_P2_COLOR: '#ff007f',
  DUEL_P3_COLOR: '#ffd700',
  DUEL_P4_COLOR: '#00ff66',
  DUEL_P1_LABEL: 'CYAN',
  DUEL_P2_LABEL: 'ROSE',
  DUEL_P3_LABEL: 'JAUNE',
  DUEL_P4_LABEL: 'VERT',

  // Duplication & Tempête
  BALL_DUPLICATION_ON_BOUNCE: false,
  MAX_BALLS: 16,

  // Visuels & Skins
  BALL_SKIN: 'neon',
  BALL_TRAIL_STYLE: 'neon',
  ARENA_COLOR: 'rainbow',
  BACKGROUND_COLOR: '#06080d',
  BACKGROUND_EFFECT: 'cosmic-stars',
  CONFETTI_COUNT: 180,
  SHOCKWAVE_ENABLED: true,
  SHOCKWAVE_DURATION: 0.45,

  // Screen shake
  SCREEN_SHAKE_ENABLED: true,
  SCREEN_SHAKE_INTENSITY: 0.15,
  SCREEN_SHAKE_MAX: 3.0,
  SCREEN_SHAKE_DECAY: 18.0,

  // Audio ASMR
  SOUND_BOUNCE_ENABLED: true,
  SOUND_BOUNCE_STYLE: 'piano',
  SOUND_BOUNCE_VOLUME: 0.85,
  SOUND_MELODY_PRESET: 'pentatonic',
  SOUND_BREAK_ENABLED: true,
  SOUND_BREAK_STYLE: 'crunch',
  SOUND_BREAK_VOLUME: 0.75,
  SOUND_ESCAPE_ENABLED: true,
  SOUND_ESCAPE_VOLUME: 0.85,
  SOUND_PITCH_MULT: 1.0,
  SOUND_COMBO_PITCH: true,

  // Physique & Collisions
  SEED: 12345,
  GRAVITY: 0.22,
  INITIAL_SPEED: 220.0,
  BOUNCE_SPEED_MULTIPLIER: 1.03,
  MAX_SPEED: 420.0,
  BALL_RADIUS: 12,
  SUB_STEPS: 12,
  BALL_COLLISION_ENABLED: true,
  BALL_COLLISION_ELASTICITY: 0.98,
  BOUNCE_DEFLECTION: 0.06,
  BOUNCE_RANDOMNESS: 25,
  BOUNCE_DIR_RANDOMNESS: 25,
  BOUNCE_SPEED_RANDOMNESS: 20,
  WALL_SPIN_TRANSFER: 0.45,

  // Textes
  TEXT_TITLE: 'CAN THE BALL ESCAPE IN 30s?',
  TEXT_METRIC_TIME: 'TEMPS RESTANT',
  TEXT_METRIC_BOUNCES: 'REBONDS',
  TEXT_STATUS_START: 'Clique pour démarrer',
  TEXT_STATUS_ESCAPE: 'Évasion réussie !',
  TEXT_STATUS_WIN: 'VICTOIRE !',
  TEXT_STATUS_LOSS: 'TEMPS ÉCOULÉ !'
};
