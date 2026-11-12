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
  RENDER_MODE: {
    id: 'RENDER_MODE',
    label: 'Moteur de Rendu Graphique',
    type: 'select',
    category: 'visuals',
    options: [
      { label: '🎨 Rendu 2D Flat & Néon (Classique)', value: '2d' },
      { label: '🔮 Rendu 3D Photoréaliste (Three.js ASMR)', value: '3d' }
    ],
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.RENDER_MODE,
    description: 'Basculez entre le style 2D fluide avec halos néon ou le rendu 3D Three.js avec sphères brillantes et verre transparent.'
  },
  ACTIVE_TIERS: {
    id: 'ACTIVE_TIERS',
    label: 'Billes Actives du Thème',
    type: 'tier-list',
    category: 'visuals',
    minCount: 5,
    maxCount: 10,
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.ACTIVE_TIERS,
    description: 'Cochez ou décochez les billes à inclure dans la partie (min 5, max 10).'
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
      { label: '🌈 Arc-en-ciel Animé RGB', value: 'rainbow' },
      { label: '⚡ Cyan Électrique', value: '#00f0ff' },
      { label: '💖 Rose Néon Fluo', value: '#ff007f' },
      { label: '🔥 Rose Bonbon Barbie', value: '#ff1493' },
      { label: '☀️ Or Solaire Brillant', value: '#ffd700' },
      { label: '🍋 Jaune Cyber Fluo', value: '#ffee00' },
      { label: '🌿 Vert Laser Fluo', value: '#00ff66' },
      { label: '🧪 Vert Toxique Acid', value: '#39ff14' },
      { label: '🔥 Orange Fluo Intense', value: '#ff5500' },
      { label: '🔮 Violet Néon Ultra', value: '#bf00ff' },
      { label: '🟣 Mauve Fluo Disco', value: '#e000ff' },
      { label: '💎 Bleu Turquoise Flash', value: '#00e5ff' },
      { label: '🤍 Blanc Pur Éclatant', value: '#ffffff' }
    ],
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.CONTAINER_COLOR,
    description: 'Personnalise la couleur néon ultra-flashy ou arc-en-ciel animé du conteneur.'
  },
  BACKGROUND_COLOR: {
    id: 'BACKGROUND_COLOR',
    label: 'Couleur de Fond',
    type: 'select',
    category: 'visuals',
    options: [
      // Fonds sombres ultra-contrastés (font ressortir les néons)
      { label: '🌌 Noir Spatial Profond', value: '#06080d' },
      { label: '⬛ Noir OLED Absolu', value: '#000000' },
      { label: '🟣 Nébuleuse Sombre', value: '#0a0518' },
      { label: '🔵 Bleu Nuit Abyssal', value: '#020b18' },
      // Fonds flashy vibrants & dynamiques pour TikTok
      { label: '🔮 Indigo / Cyber Synthwave', value: '#15082b' },
      { label: '🍷 Magenta / Minuit Pop', value: '#240019' },
      { label: '🌊 Bleu Océan Profond', value: '#001a33' },
      { label: '🌲 Vert Émeraude Sombre', value: '#001a12' },
      { label: '🔥 Rouge Braise Sombre', value: '#1a0408' },
      { label: '💜 Violet Vibrant Électrique', value: '#28004d' },
      { label: '💖 Rose Cyber Punk', value: '#3b0024' },
      { label: '💎 Bleu Cyan Cobalt', value: '#002244' }
    ],
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.BACKGROUND_COLOR,
    description: 'Teinte de base ou fond vibrant du Canvas pour faire ressortir les billes.'
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
  SHOW_BALL_OUTLINE: {
    id: 'SHOW_BALL_OUTLINE',
    label: 'Cercles & Halos autour des billes',
    type: 'boolean',
    category: 'visuals',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.SHOW_BALL_OUTLINE,
    description: 'Affiche ou masque les cercles lumineux et liserés tracés autour des billes (pratique à décocher si vos images n’ont pas une forme 100% ronde).'
  },
  SHOW_HITBOX_DEBUG: {
    id: 'SHOW_HITBOX_DEBUG',
    label: 'Visualiser la Hitbox Ronde (Debug)',
    type: 'boolean',
    category: 'visuals',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.SHOW_HITBOX_DEBUG,
    description: 'Trace le cercle physique de collision exact en pointillé vert/cyan pour ajuster visuellement la hitbox par rapport à vos images.'
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
    label: 'Cadence de tir fixe (billes/seconde)',
    type: 'range',
    category: 'gameplay',
    visibleIf: (values) => !values.AUTO_STREAM_RAMP_ENABLED,
    min: 1,
    max: 20,
    step: 1,
    unit: 'billes/s',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.AUTO_STREAM_RATE,
    description: 'Cadence constante si l’accélération progressive est désactivée.'
  },
  AUTO_STREAM_RAMP_ENABLED: {
    id: 'AUTO_STREAM_RAMP_ENABLED',
    label: 'Accélération Progressive de Tir (TikTok)',
    type: 'boolean',
    category: 'gameplay',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.AUTO_STREAM_RAMP_ENABLED,
    description: 'Démarre lentement pour poser le décor puis accélère par paliers jusqu’à une pluie intense de billes.'
  },
  AUTO_STREAM_START_RATE: {
    id: 'AUTO_STREAM_START_RATE',
    label: 'Cadence Initiale de Démarrage',
    type: 'range',
    category: 'gameplay',
    visibleIf: (values) => values.AUTO_STREAM_RAMP_ENABLED === true,
    min: 1,
    max: 10,
    step: 1,
    unit: 'billes/s',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.AUTO_STREAM_START_RATE,
    description: 'Vitesse de tir au début de la partie (ex: 2 billes/s).'
  },
  AUTO_STREAM_MAX_RATE: {
    id: 'AUTO_STREAM_MAX_RATE',
    label: 'Cadence Maximale Plafond',
    type: 'range',
    category: 'gameplay',
    visibleIf: (values) => values.AUTO_STREAM_RAMP_ENABLED === true,
    min: 2,
    max: 20,
    step: 1,
    unit: 'billes/s',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.AUTO_STREAM_MAX_RATE,
    description: 'Vitesse de tir maximale atteinte en fin de montée (ex: 10 billes/s).'
  },
  AUTO_STREAM_RAMP_STEP: {
    id: 'AUTO_STREAM_RAMP_STEP',
    label: 'Augmentation par Palier (+X billes/s)',
    type: 'range',
    category: 'gameplay',
    visibleIf: (values) => values.AUTO_STREAM_RAMP_ENABLED === true,
    min: 0.5,
    max: 5,
    step: 0.5,
    unit: 'billes/s',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.AUTO_STREAM_RAMP_STEP,
    description: 'Combien de billes par seconde on ajoute à chaque palier (ex: +1).'
  },
  AUTO_STREAM_RAMP_INTERVAL: {
    id: 'AUTO_STREAM_RAMP_INTERVAL',
    label: 'Intervalle d’Accélération (Toutes les X secondes)',
    type: 'range',
    category: 'gameplay',
    visibleIf: (values) => values.AUTO_STREAM_RAMP_ENABLED === true,
    min: 1,
    max: 15,
    step: 1,
    unit: 's',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.AUTO_STREAM_RAMP_INTERVAL,
    description: 'Délai en secondes entre chaque accélération de la cadence (ex: toutes les 4 secondes).'
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
  BALL_HITBOX_SCALE: {
    id: 'BALL_HITBOX_SCALE',
    label: 'Taille Hitbox vs Image',
    type: 'range',
    category: 'physics',
    min: 0.60,
    max: 1.40,
    step: 0.02,
    unit: 'x',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.BALL_HITBOX_SCALE,
    description: 'Ajuste la taille de la zone de collision ronde par rapport à l’image (ex: 0.85 = hitbox 15% plus petite pour des contacts plus serrés ; 1.15 = coussin invisible autour de l’image).'
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
    min: 0,
    max: 100,
    step: 5,
    unit: '%',
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
    min: 0,
    max: 100,
    step: 5,
    unit: '%',
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
    unit: 'x',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.SOUND_PITCH,
    description: 'Rend l’ensemble des sons plus grave (lourd) ou plus aigu (kawaii).'
  },
  VOICE_ANNOUNCER_ENABLED: {
    id: 'VOICE_ANNOUNCER_ENABLED',
    label: '🗣️ Voix IA Annonceur (Trend TikTok)',
    type: 'boolean',
    category: 'audio',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.VOICE_ANNOUNCER_ENABLED,
    description: 'Une voix IA annonce le nom de chaque fusion avec un pitch et un tempo de plus en plus graves et lents.'
  },
  VOICE_ANNOUNCER_MODE: {
    id: 'VOICE_ANNOUNCER_MODE',
    label: 'Moteur Vocal & Style',
    type: 'select',
    category: 'audio',
    visibleIf: (values) => values.VOICE_ANNOUNCER_ENABLED === true,
    options: [
      { label: '⚡ Nom du Palier (Web Audio 0ms Instantané)', value: 'tier_name' },
      { label: '🥔 Répéter "Patate" (Trend TikTok Pure 0ms)', value: 'repeat_prefix' },
      { label: '🌐 Synthèse Vocale Navigateur (Dynamique)', value: 'speech_synthesis' }
    ],
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.VOICE_ANNOUNCER_MODE,
    description: 'Les modes Web Audio 0ms démarrent instantanément dès le contact des billes sans aucun temps de chargement.'
  },
  VOICE_ANNOUNCER_PREFIX: {
    id: 'VOICE_ANNOUNCER_PREFIX',
    label: 'Préfixe Vocal (ex: Patate)',
    type: 'text',
    category: 'audio',
    visibleIf: (values) => values.VOICE_ANNOUNCER_ENABLED === true,
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.VOICE_ANNOUNCER_PREFIX,
    description: 'Texte facultatif répété avant chaque annonce (ex: "Patate", "C\'est une", ou laisser vide).'
  },
  VOICE_ANNOUNCER_PITCH_BASE: {
    id: 'VOICE_ANNOUNCER_PITCH_BASE',
    label: 'Tonalité Initiale (Palier 1 - Aigu)',
    type: 'range',
    category: 'audio',
    visibleIf: (values) => values.VOICE_ANNOUNCER_ENABLED === true,
    min: 0.8,
    max: 2.0,
    step: 0.05,
    unit: 'x',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.VOICE_ANNOUNCER_PITCH_BASE,
    description: 'Hauteur de note pour le premier palier fusionné (plus la valeur est haute, plus la voix est aiguë et cartoon).'
  },
  VOICE_ANNOUNCER_RATE_BASE: {
    id: 'VOICE_ANNOUNCER_RATE_BASE',
    label: 'Vitesse Initiale (Palier 1 - Rapide)',
    type: 'range',
    category: 'audio',
    visibleIf: (values) => values.VOICE_ANNOUNCER_ENABLED === true,
    min: 0.8,
    max: 2.0,
    step: 0.05,
    unit: 'x',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.VOICE_ANNOUNCER_RATE_BASE,
    description: 'Vitesse d’élocution pour le premier palier fusionné (plus la valeur est haute, plus la voix parle vite).'
  },
  VOICE_ANNOUNCER_PITCH_MIN: {
    id: 'VOICE_ANNOUNCER_PITCH_MIN',
    label: 'Gravité Maximale (Palier Final - Grave)',
    type: 'range',
    category: 'audio',
    visibleIf: (values) => values.VOICE_ANNOUNCER_ENABLED === true,
    min: 0.15,
    max: 0.8,
    step: 0.05,
    unit: 'x',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.VOICE_ANNOUNCER_PITCH_MIN,
    description: 'Tonalité de la voix pour le palier géant (plus la valeur est basse, plus la voix est sombre et démoniaque).'
  },
  VOICE_ANNOUNCER_RATE_MIN: {
    id: 'VOICE_ANNOUNCER_RATE_MIN',
    label: 'Vitesse Finale (Palier Final - Lent)',
    type: 'range',
    category: 'audio',
    visibleIf: (values) => values.VOICE_ANNOUNCER_ENABLED === true,
    min: 0.4,
    max: 1.2,
    step: 0.05,
    unit: 'x',
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.VOICE_ANNOUNCER_RATE_MIN,
    description: 'Vitesse d’élocution pour le palier géant (plus la valeur est basse, plus la voix est ralentie et lourde).'
  },
  VOICE_ANNOUNCER_SHOW_POPUP: {
    id: 'VOICE_ANNOUNCER_SHOW_POPUP',
    label: 'Pop-up Textuel Flottant au Merge',
    type: 'boolean',
    category: 'audio',
    visibleIf: (values) => values.VOICE_ANNOUNCER_ENABLED === true,
    defaultValue: DEFAULT_MERGE_DROP_CONFIG.VOICE_ANNOUNCER_SHOW_POPUP,
    description: 'Fait jaillir le nom du palier au-dessus de la bille créée avec un effet de rebond dynamique.'
  },
  GENERATE_THEME_VOICES: {
    id: 'GENERATE_THEME_VOICES',
    label: 'Générer les Voix du Thème Sélectionné',
    type: 'action-button',
    actionId: 'GENERATE_THEME_VOICES',
    buttonText: 'Générer les 10 Voix du Thème Actif (0ms)',
    category: 'audio',
    visibleIf: (values) => values.VOICE_ANNOUNCER_ENABLED === true,
    description: 'Synthétise par IA les 10 paliers du thème actuellement choisi (Patate, Fruits, Légumes, Planètes ou personnalisé) et supprime le silence avec FFmpeg pour un déclenchement instantané à 0.00ms.'
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
