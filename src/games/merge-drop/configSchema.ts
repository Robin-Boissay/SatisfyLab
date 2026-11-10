import { ConfigSchema } from '../../core/types';
import { DEFAULT_MERGE_DROP_CONFIG, THEME_OPTIONS } from './types';

export const mergeDropConfigSchema: ConfigSchema = {
  // --- PERSONNALISATION & VISUELS ---
  SKIN_THEME: {
    id: 'SKIN_THEME',
    label: 'Thème des Skins',
    type: 'select',
    category: 'visuals',
    options: THEME_OPTIONS,
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.SKIN_THEME,
    description: 'Change l’apparence des astres / orbes / skins. Studio IA : /theme-studio.html'
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
  SHOW_EVOLUTION_BAR: {
    id: 'SHOW_EVOLUTION_BAR',
    label: 'Frise d’Évolution (10 Paliers)',
    type: 'boolean',
    category: 'visuals',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.SHOW_EVOLUTION_BAR,
    description: 'Affiche les 10 cercles qui se débloquent avec le palier max (idéal rétention vidéo).'
  },
  SHOW_TOP_HUD: {
    id: 'SHOW_TOP_HUD',
    label: 'Afficher le HUD du haut (Titre & Score)',
    type: 'boolean',
    category: 'visuals',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.SHOW_TOP_HUD,
    description: 'Active ou masque les textes du haut (titre, score, niveau max).'
  },
  HUD_TOP_OFFSET: {
    id: 'HUD_TOP_OFFSET',
    label: 'Décalage haut du HUD (Zone Safe TikTok)',
    type: 'range',
    category: 'visuals',
    visibleIf: (values) => values.SHOW_TOP_HUD !== false,
    min: 0,
    max: 70,
    step: 5,
    unit: 'px',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.HUD_TOP_OFFSET,
    description: 'Descend le titre et le score sous les onglets et la recherche de TikTok.'
  },
  CONTAINER_STROKE_WIDTH: {
    id: 'CONTAINER_STROKE_WIDTH',
    label: 'Épaisseur des parois du conteneur',
    type: 'range',
    category: 'visuals',
    min: 1.5,
    max: 10,
    step: 0.5,
    unit: 'px',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.CONTAINER_STROKE_WIDTH,
    description: 'Rend les contours néon du bocal plus épais et visibles sur mobile.'
  },
  CONTAINER_TOP_Y: {
    id: 'CONTAINER_TOP_Y',
    label: 'Hauteur Haut du conteneur (Y min)',
    type: 'range',
    category: 'visuals',
    min: 100,
    max: 300,
    step: 5,
    unit: 'px',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.CONTAINER_TOP_Y,
    description: 'Ajuste la position du haut du conteneur et de l’entonnoir de largage.'
  },
  CONTAINER_BOTTOM_Y: {
    id: 'CONTAINER_BOTTOM_Y',
    label: 'Hauteur Bas du conteneur (Y max)',
    type: 'range',
    category: 'visuals',
    min: 550,
    max: 920,
    step: 5,
    unit: 'px',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.CONTAINER_BOTTOM_Y,
    description: 'Remonte le fond du conteneur pour laisser la place à la barre des 10 icônes ou aux overlays TikTok.'
  },
  EVOLUTION_BAR_LAYOUT: {
    id: 'EVOLUTION_BAR_LAYOUT',
    label: 'Disposition de la Frise',
    type: 'select',
    category: 'visuals',
    visibleIf: (values) => values.SHOW_EVOLUTION_BAR !== false,
    options: [
      { label: '1 Ligne (10 cercles alignés)', value: '1row' },
      { label: '2 Lignes (5×2 Cercles Géants)', value: '2rows' }
    ],
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.EVOLUTION_BAR_LAYOUT,
    description: 'Choisissez entre 1 ligne ou 2 lignes de 5 cercles plus grands et lisibles.'
  },
  EVOLUTION_BAR_SIZE: {
    id: 'EVOLUTION_BAR_SIZE',
    label: 'Taille des cercles de progression',
    type: 'range',
    category: 'visuals',
    visibleIf: (values) => values.SHOW_EVOLUTION_BAR !== false,
    min: 14,
    max: 26,
    step: 1,
    unit: 'px',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.EVOLUTION_BAR_SIZE,
    description: 'Agrandit les icônes de la frise pour les voir nettement sur smartphone.'
  },
  EVOLUTION_BAR_Y: {
    id: 'EVOLUTION_BAR_Y',
    label: 'Hauteur verticale de la Frise',
    type: 'range',
    category: 'visuals',
    visibleIf: (values) => values.SHOW_EVOLUTION_BAR !== false,
    min: 90,
    max: 920,
    step: 10,
    unit: 'px',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.EVOLUTION_BAR_Y,
    description: 'Placez la frise en haut (120 px) ou au-dessus des hashtags TikTok (780 px).'
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

  // --- SONS & AUDIO ASMR ---
  SOUND_MERGE_ENABLED: {
    id: 'SOUND_MERGE_ENABLED',
    label: 'Activer le Son des Fusions',
    type: 'boolean',
    category: 'audio',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.SOUND_MERGE_ENABLED,
    description: 'Joue un effet sonore jubilatoire lorsque 2 billes identiques fusionnent.'
  },
  SOUND_MERGE_STYLE: {
    id: 'SOUND_MERGE_STYLE',
    label: 'Style Sonore des Fusions',
    type: 'select',
    category: 'audio',
    visibleIf: (values) => values.SOUND_MERGE_ENABLED !== false,
    options: [
      { label: '🫧 Pop / Bulles ASMR (Viral TikTok)', value: 'bubbly' },
      { label: '🪵 Bois / Marimba Zen (Suika)', value: 'marimba' },
      { label: '👾 Rétro Arcade 8-Bit (Chiptune)', value: 'arcade' },
      { label: '🎪 Cartoon / Boing Élastique', value: 'cartoon' },
      { label: '✨ Carillon Cristallin & Céleste', value: 'crystal' }
    ],
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.SOUND_MERGE_STYLE,
    description: 'Personnalise la texture acoustique lors des fusions.'
  },
  SOUND_MERGE_VOLUME: {
    id: 'SOUND_MERGE_VOLUME',
    label: 'Volume des Fusions',
    type: 'range',
    category: 'audio',
    visibleIf: (values) => values.SOUND_MERGE_ENABLED !== false,
    min: 0.1,
    max: 1.0,
    step: 0.05,
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.SOUND_MERGE_VOLUME,
    description: 'Dose l’intensité du son de fusion.'
  },
  SOUND_COLLISION_ENABLED: {
    id: 'SOUND_COLLISION_ENABLED',
    label: 'Bruits de Chocs & Parois (ASMR)',
    type: 'boolean',
    category: 'audio',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.SOUND_COLLISION_ENABLED,
    description: 'Joue de discrets cliquetis physiques quand les billes se heurtent ou touchent les parois.'
  },
  SOUND_COLLISION_STYLE: {
    id: 'SOUND_COLLISION_STYLE',
    label: 'Style Sonore des Collisions',
    type: 'select',
    category: 'audio',
    visibleIf: (values) => values.SOUND_COLLISION_ENABLED !== false,
    options: [
      { label: '🪵 Toc Bois / Noisette (Doux & Sec)', value: 'wood' },
      { label: '🔮 Choc Verre / Bille Cristalline', value: 'glass' },
      { label: '🫧 Micro Plop Liquide', value: 'bubble' },
      { label: '⚽ Rebond Caoutchouc / Thud Feutré', value: 'rubber' },
      { label: '👾 Petit Clic 8-Bit', value: 'arcade' }
    ],
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.SOUND_COLLISION_STYLE,
    description: 'Type de matière simulée pour les chocs et rebonds.'
  },
  SOUND_COLLISION_VOLUME: {
    id: 'SOUND_COLLISION_VOLUME',
    label: 'Volume des Collisions',
    type: 'range',
    category: 'audio',
    visibleIf: (values) => values.SOUND_COLLISION_ENABLED !== false,
    min: 0.05,
    max: 1.0,
    step: 0.05,
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.SOUND_COLLISION_VOLUME,
    description: 'Ajuste le niveau sonore des petits chocs physiques.'
  },
  SOUND_DROP_ENABLED: {
    id: 'SOUND_DROP_ENABLED',
    label: 'Son au Lâcher de Bille',
    type: 'boolean',
    category: 'audio',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.SOUND_DROP_ENABLED,
    description: 'Petit clic ou bruitage feutré à l’apparition de chaque bille.'
  },
  SOUND_COMBO_PITCH: {
    id: 'SOUND_COMBO_PITCH',
    label: 'Montée en Gamme des Combos',
    type: 'boolean',
    category: 'audio',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.SOUND_COMBO_PITCH,
    description: 'Augmente la tonalité à chaque fusion en chaîne (effet récompense addictive).'
  },
  SOUND_PITCH: {
    id: 'SOUND_PITCH',
    label: 'Tonalité Globale (Pitch)',
    type: 'range',
    category: 'audio',
    min: 0.7,
    max: 1.4,
    step: 0.05,
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.SOUND_PITCH,
    description: 'Rend l’ensemble des sons plus grave (lourd) ou plus aigu (kawaii).'
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
