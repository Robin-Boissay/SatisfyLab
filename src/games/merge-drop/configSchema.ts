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
      { label: '🔮 Fiole Ronde & Tube', value: 'circle' },
      { label: '✨ Sur-mesure', value: 'custom' },
      { label: '🧪 Tube & Cuve', value: 'tube' }
    ],
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.CONTAINER_SHAPE,
    description: 'Sélectionne le réceptacle dans lequel les billes tombent.'
  },
  CONTAINER_COLOR: {
    id: 'CONTAINER_COLOR',
    label: 'Couleur de la Forme',
    type: 'select',
    category: 'visuals',
    options: [
      { label: '⚡ Cyan Néon', value: '#00f0ff' },
      { label: '💖 Rose Magenta', value: '#ff007f' },
      { label: '☀️ Or Solaire', value: '#ffd700' },
      { label: '🌿 Vert Laser', value: '#00ff88' },
      { label: '🔮 Violet Cosmique', value: '#b026ff' },
      { label: '🔥 Orange Plasma', value: '#ff6d00' },
      { label: '🤍 Blanc Pur', value: '#ffffff' }
    ],
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.CONTAINER_COLOR,
    description: 'Personnalise la couleur néon des parois du réceptacle.'
  },
  BACKGROUND_COLOR: {
    id: 'BACKGROUND_COLOR',
    label: 'Couleur de Fond',
    type: 'select',
    category: 'visuals',
    options: [
      { label: '🌌 Noir Spatial', value: '#06080d' },
      { label: '⬛ Noir Pur OLED', value: '#000000' },
      { label: '🟣 Nébuleuse Sombre', value: '#0a0518' },
      { label: '🔵 Bleu Cyber Abyssal', value: '#030c18' },
      { label: '🔴 Rouge Minuit', value: '#14040a' }
    ],
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.BACKGROUND_COLOR,
    description: 'Teinte de base de l’arrière-plan du Canvas.'
  },
  BACKGROUND_EFFECT: {
    id: 'BACKGROUND_EFFECT',
    label: 'Animation de Fond (TikTok)',
    type: 'select',
    category: 'visuals',
    options: [
      { label: '✨ Étoiles Cosmiques', value: 'cosmic-stars' },
      { label: '☀️ Rayons Lumineux', value: 'celestial-rays' },
      { label: '👾 Grille Synthwave 3D', value: 'cyber-grid' },
      { label: '🌌 Vagues Aurora', value: 'aurora-waves' },
      { label: '🌀 Tunnel Hypnotique', value: 'hypnotic-tunnel' },
      { label: '🖤 Sans Effet (Épuré)', value: 'none' }
    ],
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.BACKGROUND_EFFECT,
    description: 'Effets d’arrière-plan animés captivants pour formats courts TikTok / Reels.'
  },

  // --- GÉNÉRATEUR DE FORME PERSONNALISÉE ---
  CUSTOM_PRESET: {
    id: 'CUSTOM_PRESET',
    label: 'Préréglage de Forme',
    type: 'select',
    category: 'visuals',
    visibleIf: (values) => values.CONTAINER_SHAPE === 'custom',
    options: [
      { label: '🧪 Erlenmeyer', value: 'erlenmeyer' },
      { label: '⏳ Sablier', value: 'hourglass' },
      { label: '🏺 Amphore', value: 'vase' },
      { label: '💎 Diamant', value: 'diamond' },
      { label: '🌪️ Entonnoir', value: 'funnel' },
      { label: '🌊 Ondulé', value: 'wavy' }
    ],
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.CUSTOM_PRESET,
    description: 'Modèle de départ pour sculpter votre réceptacle.'
  },
  CUSTOM_NECK_WIDTH: {
    id: 'CUSTOM_NECK_WIDTH',
    label: 'Largeur du Col / Haut',
    type: 'range',
    category: 'visuals',
    visibleIf: (values) => values.CONTAINER_SHAPE === 'custom',
    min: 35,
    max: 180,
    step: 5,
    unit: 'px',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.CUSTOM_NECK_WIDTH,
    description: 'Demi-largeur de l’ouverture supérieure par laquelle les billes entrent.'
  },
  CUSTOM_BELLY_WIDTH: {
    id: 'CUSTOM_BELLY_WIDTH',
    label: 'Largeur de la Panse / Milieu',
    type: 'range',
    category: 'visuals',
    visibleIf: (values) => values.CONTAINER_SHAPE === 'custom',
    min: 60,
    max: 235,
    step: 5,
    unit: 'px',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.CUSTOM_BELLY_WIDTH,
    description: 'Demi-largeur au point le plus renflé ou resserré.'
  },
  CUSTOM_BELLY_POSITION: {
    id: 'CUSTOM_BELLY_POSITION',
    label: 'Hauteur de la Panse',
    type: 'range',
    category: 'visuals',
    visibleIf: (values) => values.CONTAINER_SHAPE === 'custom',
    min: 0.2,
    max: 0.8,
    step: 0.05,
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.CUSTOM_BELLY_POSITION,
    description: 'Position verticale du renflement (haut, milieu ou bas).'
  },
  CUSTOM_BOTTOM_WIDTH: {
    id: 'CUSTOM_BOTTOM_WIDTH',
    label: 'Largeur du Fond',
    type: 'range',
    category: 'visuals',
    visibleIf: (values) => values.CONTAINER_SHAPE === 'custom',
    min: 40,
    max: 235,
    step: 5,
    unit: 'px',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.CUSTOM_BOTTOM_WIDTH,
    description: 'Demi-largeur de la base plate du réceptacle.'
  },
  CUSTOM_CURVATURE: {
    id: 'CUSTOM_CURVATURE',
    label: 'Arrondi & Galbe (0=Angulaire, 1=Courbe)',
    type: 'range',
    category: 'visuals',
    visibleIf: (values) => values.CONTAINER_SHAPE === 'custom',
    min: 0.0,
    max: 1.0,
    step: 0.05,
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.CUSTOM_CURVATURE,
    description: '0 = Lignes droites géométriques (style polygone/fiole), 1 = Galbe organique doux.'
  },
  CUSTOM_WAVE_COUNT: {
    id: 'CUSTOM_WAVE_COUNT',
    label: 'Ondulations des Parois',
    type: 'range',
    category: 'visuals',
    visibleIf: (values) => values.CONTAINER_SHAPE === 'custom',
    min: 0,
    max: 6,
    step: 1,
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.CUSTOM_WAVE_COUNT,
    description: 'Nombre de vagues ou de crans le long des parois verticales.'
  },
  CUSTOM_WAVE_AMPLITUDE: {
    id: 'CUSTOM_WAVE_AMPLITUDE',
    label: 'Profondeur des Ondulations des Parois',
    type: 'range',
    category: 'visuals',
    visibleIf: (values) => values.CONTAINER_SHAPE === 'custom',
    min: 0,
    max: 25,
    step: 1,
    unit: 'px',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.CUSTOM_WAVE_AMPLITUDE,
    description: 'Intensité du relief et des paliers de rebond latéraux.'
  },
  CUSTOM_BOTTOM_WAVE_COUNT: {
    id: 'CUSTOM_BOTTOM_WAVE_COUNT',
    label: 'Ondulations du Fond / Sol',
    type: 'range',
    category: 'visuals',
    visibleIf: (values) => values.CONTAINER_SHAPE === 'custom',
    min: 0,
    max: 6,
    step: 1,
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.CUSTOM_BOTTOM_WAVE_COUNT,
    description: 'Nombre de collines et vallées sur la ligne du sol du récipient.'
  },
  CUSTOM_BOTTOM_WAVE_AMPLITUDE: {
    id: 'CUSTOM_BOTTOM_WAVE_AMPLITUDE',
    label: 'Hauteur des Ondulations du Fond',
    type: 'range',
    category: 'visuals',
    visibleIf: (values) => values.CONTAINER_SHAPE === 'custom',
    min: 0,
    max: 35,
    step: 1,
    unit: 'px',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.CUSTOM_BOTTOM_WAVE_AMPLITUDE,
    description: 'Hauteur des bosses et creux du sol où les billes se calent et roulent.'
  },
  CUSTOM_BOTTOM_WAVE_STYLE: {
    id: 'CUSTOM_BOTTOM_WAVE_STYLE',
    label: 'Style du Relief du Fond',
    type: 'select',
    category: 'visuals',
    visibleIf: (values) => values.CONTAINER_SHAPE === 'custom' && (values.CUSTOM_BOTTOM_WAVE_COUNT || 0) > 0,
    options: [
      { label: '🌊 Vagues (Arrondi)', value: 'smooth' },
      { label: '⚡ Piques (Triangles)', value: 'spikes' }
    ],
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.CUSTOM_BOTTOM_WAVE_STYLE,
    description: 'Vagues douces arrondies ou piques triangulaires pointues.'
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
  BASE_BALL_RADIUS: {
    id: 'BASE_BALL_RADIUS',
    label: 'Taille bille minimum (base)',
    type: 'range',
    category: 'physics',
    min: 10,
    max: 26,
    step: 1,
    unit: 'px',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.BASE_BALL_RADIUS,
    description: "Rayon de la plus petite bille (niveau 0). Toutes les autres sphères s'adaptent proportionnellement."
  },
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
