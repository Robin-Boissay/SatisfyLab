import { ConfigSchema } from '../../core/types';
import { DEFAULT_MERGE_DROP_CONFIG } from './types';

export const mergeDropConfigSchema: ConfigSchema = {
  // --- PERSONNALISATION & VISUELS ---
  SKIN_THEME: {
    id: 'SKIN_THEME',
    label: 'Thème des Skins',
    type: 'select',
    category: 'visuals',
    options: [
      { label: '🪐 Système Solaire', value: 'solar' },
      { label: '⚡ Néon Cyberpunk', value: 'neon' }
    ],
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.SKIN_THEME,
    description: 'Change l’apparence des astres / orbes et leurs noms.'
  },
  CONTAINER_SHAPE: {
    id: 'CONTAINER_SHAPE',
    label: 'Forme du Contenant',
    type: 'select',
    category: 'visuals',
    options: [
      { label: '🏺 Jarre Galbée', value: 'jar' },
      { label: '🧪 Tube & Cuve', value: 'tube' }
    ],
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.CONTAINER_SHAPE,
    description: 'Sélectionne le réceptacle dans lequel les billes tombent.'
  },

  // --- GAMEPLAY & MITRAILLETTE NIVEAU 1 ---
  AUTO_STREAM_ACTIVE: {
    id: 'AUTO_STREAM_ACTIVE',
    label: 'Lancage Automatique (Niveau 1)',
    type: 'boolean',
    category: 'gameplay',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.AUTO_STREAM_ACTIVE,
    description: 'Lâche des billes niveau 1 en continu dans le tube jusqu’à arrêt.'
  },
  AUTO_STREAM_RATE: {
    id: 'AUTO_STREAM_RATE',
    label: 'Cadence de tir (billes/seconde)',
    type: 'range',
    category: 'gameplay',
    min: 1,
    max: 20,
    step: 1,
    unit: 'billes/s',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.AUTO_STREAM_RATE,
    description: 'Nombre de billes lâchées par seconde en mode automatique.'
  },
  SPAWN_MAX_TIER: {
    id: 'SPAWN_MAX_TIER',
    label: 'Niveau max des boules (lâcher manuel)',
    type: 'range',
    category: 'gameplay',
    min: 1,
    max: 4,
    step: 1,
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.SPAWN_MAX_TIER,
    description: 'Palier maximal pour les boules lâchées manuellement.'
  },

  // --- PHYSIQUE ---
  GRAVITY: {
    id: 'GRAVITY',
    label: 'Gravité de chute',
    type: 'range',
    category: 'physics',
    min: 0.5,
    max: 3.0,
    step: 0.1,
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.GRAVITY,
    description: 'Vitesse et puissance d’attraction vers le bas.'
  },
  RESTITUTION: {
    id: 'RESTITUTION',
    label: 'Rebond & Élasticité',
    type: 'range',
    category: 'physics',
    min: 0.0,
    max: 0.6,
    step: 0.02,
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.RESTITUTION,
    description: 'Énergie conservée lors des rebonds entre boules.'
  },
  FRICTION: {
    id: 'FRICTION',
    label: 'Friction de glissement',
    type: 'range',
    category: 'physics',
    min: 0.92,
    max: 0.999,
    step: 0.005,
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.FRICTION,
    description: 'Stabilisation des boules au repos dans le récipient.'
  },

  SCREEN_SHAKE_ENABLED: {
    id: 'SCREEN_SHAKE_ENABLED',
    label: 'Secousses lors des fusions',
    type: 'boolean',
    category: 'visuals',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.SCREEN_SHAKE_ENABLED
  },

  // --- TEXTES AFFICHÉS ---
  TEXT_TITLE: {
    id: 'TEXT_TITLE',
    label: 'Titre du Jeu',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.TEXT_TITLE,
    description: "Titre principal affiché en haut de l'écran."
  },
  TEXT_METRIC_SCORE: {
    id: 'TEXT_METRIC_SCORE',
    label: 'Libellé Score',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.TEXT_METRIC_SCORE,
    description: 'Texte au-dessus du compteur de points.'
  },
  TEXT_METRIC_MAX_TIER: {
    id: 'TEXT_METRIC_MAX_TIER',
    label: 'Libellé Palier / Planète Max',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.TEXT_METRIC_MAX_TIER,
    description: 'Texte au-dessus de la planète ou du palier maximal atteint.'
  },
  TEXT_STATUS_VICTORY: {
    id: 'TEXT_STATUS_VICTORY',
    label: 'Message de Victoire Finale',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.TEXT_STATUS_VICTORY,
    description: 'Message affiché lors de la création du Soleil / Tier 9.'
  },
  TEXT_ACTION_STREAM_START: {
    id: 'TEXT_ACTION_STREAM_START',
    label: 'Bouton Lancer Rafale',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.TEXT_ACTION_STREAM_START,
    description: "Texte sur le bouton d'action pour activer la rafale continue."
  },
  TEXT_ACTION_STREAM_STOP: {
    id: 'TEXT_ACTION_STREAM_STOP',
    label: 'Bouton Arrêter Rafale',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.TEXT_ACTION_STREAM_STOP,
    description: "Texte sur le bouton d'action quand la rafale est en cours."
  }
};
