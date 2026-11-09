import { ConfigSchema } from '../../core/types';
import { DEFAULT_BALL_DUEL_CONFIG } from './types';

export const ballDuelConfigSchema: ConfigSchema = {
  // --- BARRES & STRUCTURE ---
  BARS_COUNT: {
    id: 'BARS_COUNT',
    label: 'Nombre de barres horizontales',
    type: 'range',
    category: 'gameplay',
    min: 3,
    max: 8,
    step: 1,
    defaultValue: DEFAULT_BALL_DUEL_CONFIG.BARS_COUNT,
    description: 'Nombre de barrières à franchir dans chaque colonne.'
  },
  BASE_BAR_HP: {
    id: 'BASE_BAR_HP',
    label: 'PV de la première barre',
    type: 'range',
    category: 'gameplay',
    min: 5,
    max: 100,
    step: 5,
    defaultValue: DEFAULT_BALL_DUEL_CONFIG.BASE_BAR_HP,
    description: 'Points de vie de la première barre en haut.'
  },
  BAR_HP_MULTIPLIER: {
    id: 'BAR_HP_MULTIPLIER',
    label: 'Progression des PV des barres',
    type: 'range',
    category: 'gameplay',
    min: 1.2,
    max: 3.5,
    step: 0.1,
    unit: 'x',
    defaultValue: DEFAULT_BALL_DUEL_CONFIG.BAR_HP_MULTIPLIER,
    description: 'Multiplicateur de PV à chaque niveau descendant.'
  },

  // --- COLONNE GAUCHE (BLEUE) ---
  LEFT_INITIAL_BALLS: {
    id: 'LEFT_INITIAL_BALLS',
    label: 'Balles initiales (Gauche)',
    type: 'range',
    category: 'gameplay',
    min: 1,
    max: 25,
    step: 1,
    defaultValue: DEFAULT_BALL_DUEL_CONFIG.LEFT_INITIAL_BALLS,
    description: 'Nombre de balles lâchées au départ à gauche.'
  },
  LEFT_INITIAL_DAMAGE: {
    id: 'LEFT_INITIAL_DAMAGE',
    label: 'Dégâts initiaux (Gauche)',
    type: 'range',
    category: 'gameplay',
    min: 1,
    max: 20,
    step: 1,
    defaultValue: DEFAULT_BALL_DUEL_CONFIG.LEFT_INITIAL_DAMAGE,
    description: 'Dégâts infligés par chaque balle à chaque impact.'
  },
  LEFT_UPGRADE_TARGET: {
    id: 'LEFT_UPGRADE_TARGET',
    label: "Amélioration Gauche : Cible",
    type: 'select',
    category: 'gameplay',
    options: [
      { label: 'Nombre de Balles', value: 'balls' },
      { label: 'Puissance / Dégâts', value: 'damage' },
      { label: 'Balles & Dégâts (Les deux)', value: 'both' }
    ],
    defaultValue: DEFAULT_BALL_DUEL_CONFIG.LEFT_UPGRADE_TARGET,
    description: 'Ce qui augmente quand une barre se brise à gauche.'
  },
  LEFT_UPGRADE_MODE: {
    id: 'LEFT_UPGRADE_MODE',
    label: "Amélioration Gauche : Formule",
    type: 'select',
    category: 'gameplay',
    options: [
      { label: 'Multiplication (xN)', value: 'multiply' },
      { label: 'Addition (+N)', value: 'add' },
      { label: 'Puissance (N^k)', value: 'power' },
      { label: 'Suite de Fibonacci', value: 'fibonacci' }
    ],
    defaultValue: DEFAULT_BALL_DUEL_CONFIG.LEFT_UPGRADE_MODE,
    description: 'Règle mathématique appliquée à chaque barre détruite.'
  },
  LEFT_UPGRADE_VALUE: {
    id: 'LEFT_UPGRADE_VALUE',
    label: "Valeur du boost Gauche (+N ou ×N)",
    type: 'range',
    category: 'gameplay',
    min: 1,
    max: 10,
    step: 1,
    defaultValue: DEFAULT_BALL_DUEL_CONFIG.LEFT_UPGRADE_VALUE,
    description: 'Facteur ou montant ajouté/multiplié à gauche.'
  },

  // --- COLONNE DROITE (ROSE) ---
  RIGHT_INITIAL_BALLS: {
    id: 'RIGHT_INITIAL_BALLS',
    label: 'Balles initiales (Droite)',
    type: 'range',
    category: 'gameplay',
    min: 1,
    max: 25,
    step: 1,
    defaultValue: DEFAULT_BALL_DUEL_CONFIG.RIGHT_INITIAL_BALLS,
    description: 'Nombre de balles lâchées au départ à droite.'
  },
  RIGHT_INITIAL_DAMAGE: {
    id: 'RIGHT_INITIAL_DAMAGE',
    label: 'Dégâts initiaux (Droite)',
    type: 'range',
    category: 'gameplay',
    min: 1,
    max: 20,
    step: 1,
    defaultValue: DEFAULT_BALL_DUEL_CONFIG.RIGHT_INITIAL_DAMAGE,
    description: 'Dégâts infligés par chaque balle de droite.'
  },
  RIGHT_UPGRADE_TARGET: {
    id: 'RIGHT_UPGRADE_TARGET',
    label: "Amélioration Droite : Cible",
    type: 'select',
    category: 'gameplay',
    options: [
      { label: 'Nombre de Balles', value: 'balls' },
      { label: 'Puissance / Dégâts', value: 'damage' },
      { label: 'Balles & Dégâts (Les deux)', value: 'both' }
    ],
    defaultValue: DEFAULT_BALL_DUEL_CONFIG.RIGHT_UPGRADE_TARGET,
    description: 'Ce qui augmente quand une barre se brise à droite.'
  },
  RIGHT_UPGRADE_MODE: {
    id: 'RIGHT_UPGRADE_MODE',
    label: "Amélioration Droite : Formule",
    type: 'select',
    category: 'gameplay',
    options: [
      { label: 'Addition (+N)', value: 'add' },
      { label: 'Multiplication (xN)', value: 'multiply' },
      { label: 'Puissance (N^k)', value: 'power' },
      { label: 'Suite de Fibonacci', value: 'fibonacci' }
    ],
    defaultValue: DEFAULT_BALL_DUEL_CONFIG.RIGHT_UPGRADE_MODE,
    description: 'Règle mathématique appliquée à chaque barre détruite.'
  },
  RIGHT_UPGRADE_VALUE: {
    id: 'RIGHT_UPGRADE_VALUE',
    label: "Valeur du boost Droite (+N ou ×N)",
    type: 'range',
    category: 'gameplay',
    min: 1,
    max: 10,
    step: 1,
    defaultValue: DEFAULT_BALL_DUEL_CONFIG.RIGHT_UPGRADE_VALUE,
    description: 'Facteur ou montant ajouté/multiplié à droite.'
  },

  // --- PHYSIQUE ---
  GRAVITY: {
    id: 'GRAVITY',
    label: 'Gravité verticale',
    type: 'range',
    category: 'physics',
    min: 0.3,
    max: 2.0,
    step: 0.05,
    defaultValue: DEFAULT_BALL_DUEL_CONFIG.GRAVITY,
    description: 'Vitesse de chute des billes.'
  },
  BOUNCE: {
    id: 'BOUNCE',
    label: 'Élasticité du rebond',
    type: 'range',
    category: 'physics',
    min: 0.4,
    max: 0.95,
    step: 0.02,
    defaultValue: DEFAULT_BALL_DUEL_CONFIG.BOUNCE,
    description: 'Énergie conservée lors des rebonds sur les barres et parois.'
  },

  // --- TEXTES AFFICHÉS ---
  TEXT_TITLE: {
    id: 'TEXT_TITLE',
    label: 'Titre du Duel',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_DUEL_CONFIG.TEXT_TITLE,
    description: "Titre principal affiché en haut de l'écran."
  },
  TEXT_LABEL_LEFT: {
    id: 'TEXT_LABEL_LEFT',
    label: 'Nom Colonne Gauche',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_DUEL_CONFIG.TEXT_LABEL_LEFT,
    description: 'Nom ou libellé de la colonne de gauche.'
  },
  TEXT_LABEL_RIGHT: {
    id: 'TEXT_LABEL_RIGHT',
    label: 'Nom Colonne Droite',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_DUEL_CONFIG.TEXT_LABEL_RIGHT,
    description: 'Nom ou libellé de la colonne de droite.'
  },
  TEXT_WIN_LEFT: {
    id: 'TEXT_WIN_LEFT',
    label: 'Message Victoire Gauche',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_DUEL_CONFIG.TEXT_WIN_LEFT,
    description: 'Message proclamé quand la colonne gauche gagne.'
  },
  TEXT_WIN_RIGHT: {
    id: 'TEXT_WIN_RIGHT',
    label: 'Message Victoire Droite',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_DUEL_CONFIG.TEXT_WIN_RIGHT,
    description: 'Message proclamé quand la colonne droite gagne.'
  },
  TEXT_START_PROMPT: {
    id: 'TEXT_START_PROMPT',
    label: 'Message de Départ',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_DUEL_CONFIG.TEXT_START_PROMPT,
    description: 'Consigne pour démarrer le duel.'
  }
};

