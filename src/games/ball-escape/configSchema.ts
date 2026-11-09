import { ConfigSchema } from '../../core/types';
import { DEFAULT_BALL_ESCAPE_CONFIG } from './types';

export const ballEscapeConfigSchema: ConfigSchema = {
  // --- GAMEPLAY & DÉFI ---
  CHALLENGE_TIME_LIMIT: {
    id: 'CHALLENGE_TIME_LIMIT',
    label: 'Chronomètre Défi (secondes)',
    type: 'range',
    category: 'gameplay',
    min: 10,
    max: 90,
    step: 5,
    unit: 's',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.CHALLENGE_TIME_LIMIT,
    description: 'Durée limite pour que la bille parvienne à s’échapper.'
  },
  ARENA_ROTATION_SPEED: {
    id: 'ARENA_ROTATION_SPEED',
    label: "Vitesse de rotation de l'arène",
    type: 'range',
    category: 'gameplay',
    min: 0,
    max: 1.5,
    step: 0.05,
    unit: 'rad/s',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.ARENA_ROTATION_SPEED,
    description: "Vitesse à laquelle l'anneau tourne sur lui-même."
  },
  SEGMENT_HP: {
    id: 'SEGMENT_HP',
    label: 'Points de vie par brique (HP)',
    type: 'range',
    category: 'gameplay',
    min: 1,
    max: 10,
    step: 1,
    unit: 'HP',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SEGMENT_HP,
    description: "Nombre de rebonds nécessaires pour détruire une brique d'arc."
  },
  TOTAL_WALL_SEGMENTS: {
    id: 'TOTAL_WALL_SEGMENTS',
    label: 'Nombre total de briques',
    type: 'range',
    category: 'gameplay',
    min: 12,
    max: 48,
    step: 2,
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.TOTAL_WALL_SEGMENTS,
    description: "Découpage de l'anneau circulaire."
  },

  // --- BALLES SECONDAIRES ---
  SECONDARY_BALLS_CAN_ESCAPE: {
    id: 'SECONDARY_BALLS_CAN_ESCAPE',
    label: 'Billes secondaires peuvent sortir',
    type: 'boolean',
    category: 'gameplay',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SECONDARY_BALLS_CAN_ESCAPE,
    description: 'Si activé, les billes secondaires peuvent s’échapper par les brèches ouvertes.'
  },
  SPAWN_SECONDARY_BALL_ON_BRICK_HIT: {
    id: 'SPAWN_SECONDARY_BALL_ON_BRICK_HIT',
    label: 'Apparition de bille à chaque brique touchée',
    type: 'boolean',
    category: 'gameplay',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SPAWN_SECONDARY_BALL_ON_BRICK_HIT,
    description: 'Fait naître une bille secondaire au centre lors d’un impact.'
  },
  MAX_SECONDARY_BALLS: {
    id: 'MAX_SECONDARY_BALLS',
    label: 'Nombre max de billes secondaires',
    type: 'range',
    category: 'gameplay',
    min: 0,
    max: 30,
    step: 1,
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.MAX_SECONDARY_BALLS,
    description: 'Limite le nombre de billes secondaires en jeu pour la clarté.'
  },

  // --- PHYSIQUE ---
  GRAVITY: {
    id: 'GRAVITY',
    label: 'Gravité verticale',
    type: 'range',
    category: 'physics',
    min: 0.0,
    max: 0.6,
    step: 0.02,
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.GRAVITY,
    description: 'Force attirant les balles vers le bas.'
  },
  INITIAL_SPEED: {
    id: 'INITIAL_SPEED',
    label: 'Vitesse de départ',
    type: 'range',
    category: 'physics',
    min: 100,
    max: 400,
    step: 10,
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.INITIAL_SPEED,
    description: 'Vitesse de lancement de la bille principale.'
  },
  BOUNCE_SPEED_MULTIPLIER: {
    id: 'BOUNCE_SPEED_MULTIPLIER',
    label: 'Accélération par rebond',
    type: 'range',
    category: 'physics',
    min: 1.0,
    max: 1.1,
    step: 0.01,
    unit: 'x',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.BOUNCE_SPEED_MULTIPLIER,
    description: 'Facteur multiplicateur de vitesse à chaque collision.'
  },
  MAX_SPEED: {
    id: 'MAX_SPEED',
    label: 'Plafond de vitesse max',
    type: 'range',
    category: 'physics',
    min: 250,
    max: 600,
    step: 25,
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.MAX_SPEED,
    description: 'Vitesse maximale autorisée pour la bille.'
  },
  BALL_RADIUS: {
    id: 'BALL_RADIUS',
    label: 'Rayon de la bille',
    type: 'range',
    category: 'physics',
    min: 8,
    max: 24,
    step: 1,
    unit: 'px',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.BALL_RADIUS
  },

  // --- VISUELS & EFFETS ---
  SCREEN_SHAKE_ENABLED: {
    id: 'SCREEN_SHAKE_ENABLED',
    label: "Activer les secousses d'écran",
    type: 'boolean',
    category: 'visuals',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SCREEN_SHAKE_ENABLED
  },
  SCREEN_SHAKE_INTENSITY: {
    id: 'SCREEN_SHAKE_INTENSITY',
    label: 'Intensité des secousses',
    type: 'range',
    category: 'visuals',
    min: 0.05,
    max: 0.8,
    step: 0.05,
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SCREEN_SHAKE_INTENSITY
  },

  // --- TEXTES AFFICHÉS ---
  TEXT_TITLE: {
    id: 'TEXT_TITLE',
    label: 'Titre du Défi',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.TEXT_TITLE,
    description: "Titre principal affiché en haut de l'écran."
  },
  TEXT_METRIC_TIME: {
    id: 'TEXT_METRIC_TIME',
    label: 'Libellé Chronomètre',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.TEXT_METRIC_TIME,
    description: 'Texte au-dessus du compte à rebours.'
  },
  TEXT_METRIC_BOUNCES: {
    id: 'TEXT_METRIC_BOUNCES',
    label: 'Libellé Rebonds',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.TEXT_METRIC_BOUNCES,
    description: 'Texte au-dessus du compteur de rebonds.'
  },
  TEXT_STATUS_START: {
    id: 'TEXT_STATUS_START',
    label: 'Message de Départ',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.TEXT_STATUS_START,
    description: 'Consigne affichée avant de lancer la bille.'
  },
  TEXT_STATUS_ESCAPE: {
    id: 'TEXT_STATUS_ESCAPE',
    label: "Message d'Évasion",
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.TEXT_STATUS_ESCAPE,
    description: 'Message affiché dès que la bille franchit la brèche.'
  },
  TEXT_STATUS_WIN: {
    id: 'TEXT_STATUS_WIN',
    label: 'Message de Victoire',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.TEXT_STATUS_WIN,
    description: 'Message de célébration finale.'
  },
  TEXT_STATUS_LOSS: {
    id: 'TEXT_STATUS_LOSS',
    label: 'Message Temps Écoulé',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.TEXT_STATUS_LOSS,
    description: 'Message affiché si le temps limite est atteint.'
  }
};
