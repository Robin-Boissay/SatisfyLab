import { ConfigSchema } from '../../core/types';
import { DEFAULT_TERRITORY_WAR_CONFIG } from './types';

export const territoryWarConfigSchema: ConfigSchema = {
  // --- GRILLE & GAMEPLAY ---
  GRID_COLUMNS: {
    id: 'GRID_COLUMNS',
    label: 'Nombre de colonnes de tuiles',
    type: 'range',
    category: 'gameplay',
    min: 10,
    max: 24,
    step: 2,
    defaultValue: DEFAULT_TERRITORY_WAR_CONFIG.GRID_COLUMNS,
    description: 'Densité horizontale des cases du terrain.'
  },
  GRID_ROWS: {
    id: 'GRID_ROWS',
    label: 'Nombre de lignes de tuiles',
    type: 'range',
    category: 'gameplay',
    min: 16,
    max: 36,
    step: 2,
    defaultValue: DEFAULT_TERRITORY_WAR_CONFIG.GRID_ROWS,
    description: 'Densité verticale des cases du terrain.'
  },
  BALLS_PER_TEAM: {
    id: 'BALLS_PER_TEAM',
    label: 'Nombre de billes par camp',
    type: 'range',
    category: 'gameplay',
    min: 1,
    max: 4,
    step: 1,
    defaultValue: DEFAULT_TERRITORY_WAR_CONFIG.BALLS_PER_TEAM,
    description: '1 bille classique ou plusieurs pour plus de chaos.'
  },
  SPLASH_RADIUS: {
    id: 'SPLASH_RADIUS',
    label: 'Rayon de capture par impact',
    type: 'range',
    category: 'gameplay',
    min: 1,
    max: 3,
    step: 1,
    defaultValue: DEFAULT_TERRITORY_WAR_CONFIG.SPLASH_RADIUS,
    description: '1 = tuile touchée seule, 2 = croix 3x3, 3 = explosion 5x5.'
  },

  // --- DYNAMIQUE DE VICTOIRE & OVERDRIVE ---
  OVERDRIVE_THRESHOLD: {
    id: 'OVERDRIVE_THRESHOLD',
    label: "Seuil déclenchement Overdrive (%)",
    type: 'range',
    category: 'gameplay',
    min: 52,
    max: 70,
    step: 1,
    unit: '%',
    defaultValue: DEFAULT_TERRITORY_WAR_CONFIG.OVERDRIVE_THRESHOLD,
    description: 'Dès que ce pourcentage de domination est franchi, le mode Overdrive s’enclenche.'
  },
  REINFORCEMENTS_ENABLED: {
    id: 'REINFORCEMENTS_ENABLED',
    label: "Renfort de bille pour l'équipe en tête",
    type: 'boolean',
    category: 'gameplay',
    defaultValue: DEFAULT_TERRITORY_WAR_CONFIG.REINFORCEMENTS_ENABLED,
    description: "Fait apparaître une bille alliée supplémentaire pour submerger l'adversaire."
  },
  MAGNETIC_HUNT: {
    id: 'MAGNETIC_HUNT',
    label: 'Attraction vers les dernières tuiles',
    type: 'boolean',
    category: 'gameplay',
    defaultValue: DEFAULT_TERRITORY_WAR_CONFIG.MAGNETIC_HUNT,
    description: 'Courbe légèrement la trajectoire pour traquer les dernières poches ennemies.'
  },
  COMBO_SHOCKWAVE: {
    id: 'COMBO_SHOCKWAVE',
    label: 'Ondes de choc en combo',
    type: 'boolean',
    category: 'visuals',
    defaultValue: DEFAULT_TERRITORY_WAR_CONFIG.COMBO_SHOCKWAVE,
    description: 'Déclenche des détonations néon lors des séries de captures rapides.'
  },
  KNOCKOUT_ENABLED: {
    id: 'KNOCKOUT_ENABLED',
    label: "K.O. Final de la bille adverse acculée",
    type: 'boolean',
    category: 'gameplay',
    defaultValue: DEFAULT_TERRITORY_WAR_CONFIG.KNOCKOUT_ENABLED,
    description: "Élimine la bille adverse quand son camp n'a presque plus de tuiles pour garantir le 100%."
  },
  KNOCKOUT_THRESHOLD: {
    id: 'KNOCKOUT_THRESHOLD',
    label: "Seuil de K.O. (% restant adverse)",
    type: 'range',
    category: 'gameplay',
    min: 3,
    max: 12,
    step: 1,
    unit: '%',
    defaultValue: DEFAULT_TERRITORY_WAR_CONFIG.KNOCKOUT_THRESHOLD,
    description: "Pourcentage de tuiles sous lequel la bille ennemie est éliminée (ex: 6%)."
  },

  // --- PHYSIQUE ---
  INITIAL_SPEED: {
    id: 'INITIAL_SPEED',
    label: 'Vitesse de déplacement',
    type: 'range',
    category: 'physics',
    min: 200,
    max: 550,
    step: 25,
    unit: 'px/s',
    defaultValue: DEFAULT_TERRITORY_WAR_CONFIG.INITIAL_SPEED,
    description: 'Vitesse scalaire des billes sur le terrain.'
  },
  BOUNCE_SPEED_MULTIPLIER: {
    id: 'BOUNCE_SPEED_MULTIPLIER',
    label: 'Accélération aux rebonds',
    type: 'range',
    category: 'physics',
    min: 1.0,
    max: 1.015,
    step: 0.001,
    defaultValue: DEFAULT_TERRITORY_WAR_CONFIG.BOUNCE_SPEED_MULTIPLIER,
    description: 'Léger boost de vitesse à chaque capture de tuile.'
  },
  GRAVITY: {
    id: 'GRAVITY',
    label: 'Gravité verticale',
    type: 'range',
    category: 'physics',
    min: 0.0,
    max: 0.4,
    step: 0.05,
    defaultValue: DEFAULT_TERRITORY_WAR_CONFIG.GRAVITY,
    description: '0 = apesanteur totale (classique TikTok), >0 = paraboles.'
  },
  SCREEN_SHAKE_ENABLED: {
    id: 'SCREEN_SHAKE_ENABLED',
    label: "Secousses d'impact",
    type: 'boolean',
    category: 'visuals',
    defaultValue: DEFAULT_TERRITORY_WAR_CONFIG.SCREEN_SHAKE_ENABLED
  },

  // --- TEXTES AFFICHÉS ---
  TEXT_TITLE: {
    id: 'TEXT_TITLE',
    label: 'Titre de la Conquête',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_TERRITORY_WAR_CONFIG.TEXT_TITLE,
    description: "Titre principal en haut de l'écran."
  },
  TEXT_TEAM_A: {
    id: 'TEXT_TEAM_A',
    label: 'Nom Équipe Cyan',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_TERRITORY_WAR_CONFIG.TEXT_TEAM_A,
    description: 'Nom du camp Cyan.'
  },
  TEXT_TEAM_B: {
    id: 'TEXT_TEAM_B',
    label: 'Nom Équipe Rose',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_TERRITORY_WAR_CONFIG.TEXT_TEAM_B,
    description: 'Nom du camp Rose.'
  },
  TEXT_WIN_A: {
    id: 'TEXT_WIN_A',
    label: 'Message Victoire Cyan',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_TERRITORY_WAR_CONFIG.TEXT_WIN_A,
    description: 'Message proclamé quand Cyan contrôle 100% du terrain.'
  },
  TEXT_WIN_B: {
    id: 'TEXT_WIN_B',
    label: 'Message Victoire Rose',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_TERRITORY_WAR_CONFIG.TEXT_WIN_B,
    description: 'Message proclamé quand Rose contrôle 100% du terrain.'
  },
  TEXT_START_PROMPT: {
    id: 'TEXT_START_PROMPT',
    label: 'Message de Départ',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_TERRITORY_WAR_CONFIG.TEXT_START_PROMPT,
    description: 'Consigne pour lancer la partie.'
  }
};

