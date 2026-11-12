import { SoundMergeStyle, SoundCollisionStyle } from '../../core/SoundEngine';

export type SkinTheme = 'solar' | 'vegetables' | 'minerals' | 'animals' | 'dragons' | 'neon' | string;
export type ContainerShape = 'jar' | 'circle' | 'custom' | 'tube';
export type BottomWaveStyle = 'smooth' | 'spikes';
export type { SoundMergeStyle, SoundCollisionStyle };
export type BackgroundEffect =
  | 'none'
  | 'cosmic-stars'
  | 'celestial-rays'
  | 'cyber-grid'
  | 'aurora-waves'
  | 'hypnotic-tunnel';

export type CustomShapePreset =
  | 'erlenmeyer'
  | 'hourglass'
  | 'vase'
  | 'diamond'
  | 'funnel'
  | 'wavy'
  | 'custom';

export {
  type MergeTier,
  type MergeThemeDefinition,
  type ThemeRenderStyle,
  MERGE_THEMES,
  THEME_OPTIONS,
  NEON_TIERS,
  SOLAR_TIERS,
  VEGETABLES_TIERS,
  MINERALS_TIERS,
  ANIMALS_TIERS,
  FRUITS_TIERS,
  SWEETS_TIERS,
  DRAGONS_TIERS,
  textureManager,
  getThemeDefinition,
  getTiersForTheme,
  getTierLocalizedName
} from './themeRegistry';

export interface MergeDropConfig {
  SKIN_THEME: SkinTheme; // 'neon' | 'solar'
  RENDER_MODE: '2d' | '3d'; // Mode de rendu visuel (2D Canvas néon ou 3D Three.js ASMR)
  ACTIVE_TIERS: number[]; // Paliers/Billes sélectionnés et actifs (min 5, max 10, ex: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  CONTAINER_SHAPE: ContainerShape; // 'jar' | 'circle' | 'custom' | 'tube'
  CONTAINER_COLOR: string; // Couleur néon du contour ('#00f0ff', '#ff007f', etc.)
  BACKGROUND_COLOR: string; // Teinte du fond ('#06080d', '#000000', etc.)
  BACKGROUND_EFFECT: BackgroundEffect; // Animation d'arrière-plan pour TikTok/Reels

  // Générateur de forme personnalisable
  CUSTOM_PRESET: CustomShapePreset;
  CUSTOM_NECK_WIDTH: number; // 35 à 180 (demi-largeur du col en px)
  CUSTOM_BELLY_WIDTH: number; // 60 à 235 (demi-largeur de la panse en px)
  CUSTOM_BELLY_POSITION: number; // 0.2 à 0.8 (hauteur relative de la panse)
  CUSTOM_BOTTOM_WIDTH: number; // 40 à 235 (demi-largeur du fond en px)
  CUSTOM_CURVATURE: number; // 0.0 (angulaire/polygonale) à 1.0 (galbe doux)
  CUSTOM_WAVE_COUNT: number; // 0 à 6 (nombre d'ondulations)
  CUSTOM_WAVE_AMPLITUDE: number; // 0 à 25 px (amplitude des crans/vagues)
  CUSTOM_BOTTOM_WAVE_COUNT: number; // 0 à 6 (nombre de vagues/bosses sur le fond)
  CUSTOM_BOTTOM_WAVE_AMPLITUDE: number; // 0 à 35 px (hauteur du relief du fond)
  CUSTOM_BOTTOM_WAVE_STYLE: BottomWaveStyle; // 'smooth' (arrondi) | 'spikes' (pointu/piques)

  BASE_BALL_RADIUS: number; // Taille de la plus petite bille (base échelle)
  BALL_HITBOX_SCALE: number; // Échelle de la hitbox ronde de collision par rapport à l'image (0.60 à 1.40, défaut 1.0)
  SHOW_HITBOX_DEBUG: boolean; // Afficher le contour de la hitbox ronde en surbrillance debug (défaut: false)
  SPAWN_MAX_TIER: number; // Palier max aléatoire lors des lâchers manuels
  GRAVITY: number;
  RESTITUTION: number; // Rebond
  FRICTION: number;
  AUTO_STREAM_ACTIVE: boolean; // Lanceur automatique de billes niveau 1
  AUTO_STREAM_RATE: number; // Nombre de billes niveau 1 par seconde (mode fixe)
  AUTO_STREAM_RAMP_ENABLED: boolean; // Activer l'accélération progressive de cadence
  AUTO_STREAM_START_RATE: number; // Cadence initiale de démarrage (ex: 2 billes/s)
  AUTO_STREAM_MAX_RATE: number; // Cadence maximale plafond (ex: 10 billes/s)
  AUTO_STREAM_RAMP_STEP: number; // Augmentation de cadence à chaque palier (ex: +1 bille/s)
  AUTO_STREAM_RAMP_INTERVAL: number; // Intervalle entre chaque accélération (en secondes, ex: 4s)
  SCREEN_SHAKE_ENABLED: boolean;
  SHOW_EVOLUTION_BAR: boolean; // Frise des 10 paliers
  SHOW_BALL_OUTLINE: boolean; // Afficher ou masquer les cercles et liserés ronds tracés autour des billes (pratique si les images ne sont pas parfaitement rondes)

  // Réglages TikTok & Visibilité
  SHOW_TOP_HUD: boolean; // Masquer ou afficher le HUD textuel du haut (titre, score, niveau max)
  HUD_TOP_OFFSET: number; // Abaissement du HUD sous les onglets TikTok (0 à 80 px)
  CONTAINER_STROKE_WIDTH: number; // Épaisseur des parois du conteneur (1.5 à 10 px)
  CONTAINER_TOP_Y: number; // Position verticale du haut du conteneur (100 à 300 px)
  CONTAINER_BOTTOM_Y: number; // Position verticale du fond du conteneur (550 à 920 px)
  EVOLUTION_BAR_Y: number; // Position verticale de la frise (100 à 930 px)
  EVOLUTION_BAR_SIZE: number; // Rayon des cercles de progression (15 à 26 px)
  EVOLUTION_BAR_LAYOUT: '1row' | '2rows'; // 1 ligne ou 2 lignes de 5 (format géant)

  // Réglages Audio & Effets ASMR
  SOUND_MERGE_ENABLED: boolean; // Activer/désactiver le son des fusions
  SOUND_MERGE_STYLE: SoundMergeStyle; // 'bubbly' | 'marimba' | 'arcade' | 'cartoon' | 'crystal'
  SOUND_MERGE_VOLUME: number; // Volume des fusions (0 à 1)
  SOUND_COLLISION_ENABLED: boolean; // Activer/désactiver les bruits de chocs physiques
  SOUND_COLLISION_STYLE: SoundCollisionStyle; // 'wood' | 'glass' | 'bubble' | 'rubber' | 'arcade'
  SOUND_COLLISION_VOLUME: number; // Volume des chocs physiques (0 à 1)
  SOUND_DROP_ENABLED: boolean; // Bruit feutré au lâcher de boule
  SOUND_PITCH: number; // Tonalité globale (0.7 à 1.4)
  SOUND_COMBO_PITCH: boolean; // Montée en pitch lors des réactions en chaîne

  // Annonceur Vocal IA (Trend TikTok Patate)
  VOICE_ANNOUNCER_ENABLED: boolean; // Activer la voix IA annonçant chaque merge
  VOICE_ANNOUNCER_MODE: 'tier_name' | 'repeat_prefix' | 'speech_synthesis'; // Mode vocal (Web Audio 0ms ou Synthèse)
  VOICE_ANNOUNCER_PREFIX: string; // Préfixe optionnel (ex: "Patate", "C'est", etc.)
  VOICE_ANNOUNCER_PITCH_BASE: number; // Tonalité initiale pour le niveau 1 (0.8 à 2.0, aigu/kawaii)
  VOICE_ANNOUNCER_RATE_BASE: number; // Vitesse initiale pour le niveau 1 (0.8 à 2.0, rapide)
  VOICE_ANNOUNCER_PITCH_MIN: number; // Gravité minimale de la voix pour le palier géant (0.15 à 0.8)
  VOICE_ANNOUNCER_RATE_MIN: number; // Vitesse minimale de la voix pour le palier géant (0.4 à 1.2)
  VOICE_ANNOUNCER_SHOW_POPUP: boolean; // Afficher le texte dynamique animé à l'écran lors de la fusion

  // Textes personnalisables à l'écran
  TEXT_TITLE: string;
  TEXT_METRIC_SCORE: string;
  TEXT_METRIC_MAX_TIER: string;
  TEXT_STATUS_VICTORY: string;
  TEXT_ACTION_STREAM_START: string;
  TEXT_ACTION_STREAM_STOP: string;
}

export const CUSTOM_SHAPE_PRESETS: Record<CustomShapePreset, Partial<MergeDropConfig>> = {
  erlenmeyer: {
    CUSTOM_PRESET: 'erlenmeyer',
    CUSTOM_NECK_WIDTH: 45,
    CUSTOM_BELLY_WIDTH: 135,
    CUSTOM_BELLY_POSITION: 0.55,
    CUSTOM_BOTTOM_WIDTH: 220,
    CUSTOM_CURVATURE: 0.05,
    CUSTOM_WAVE_COUNT: 0,
    CUSTOM_WAVE_AMPLITUDE: 0,
    CUSTOM_BOTTOM_WAVE_COUNT: 0,
    CUSTOM_BOTTOM_WAVE_AMPLITUDE: 0,
    CUSTOM_BOTTOM_WAVE_STYLE: 'smooth'
  },
  hourglass: {
    CUSTOM_PRESET: 'hourglass',
    CUSTOM_NECK_WIDTH: 190,
    CUSTOM_BELLY_WIDTH: 55,
    CUSTOM_BELLY_POSITION: 0.5,
    CUSTOM_BOTTOM_WIDTH: 190,
    CUSTOM_CURVATURE: 0.85,
    CUSTOM_WAVE_COUNT: 0,
    CUSTOM_WAVE_AMPLITUDE: 0,
    CUSTOM_BOTTOM_WAVE_COUNT: 0,
    CUSTOM_BOTTOM_WAVE_AMPLITUDE: 0,
    CUSTOM_BOTTOM_WAVE_STYLE: 'smooth'
  },
  vase: {
    CUSTOM_PRESET: 'vase',
    CUSTOM_NECK_WIDTH: 48,
    CUSTOM_BELLY_WIDTH: 220,
    CUSTOM_BELLY_POSITION: 0.42,
    CUSTOM_BOTTOM_WIDTH: 130,
    CUSTOM_CURVATURE: 0.85,
    CUSTOM_WAVE_COUNT: 0,
    CUSTOM_WAVE_AMPLITUDE: 0,
    CUSTOM_BOTTOM_WAVE_COUNT: 0,
    CUSTOM_BOTTOM_WAVE_AMPLITUDE: 0,
    CUSTOM_BOTTOM_WAVE_STYLE: 'smooth'
  },
  diamond: {
    CUSTOM_PRESET: 'diamond',
    CUSTOM_NECK_WIDTH: 55,
    CUSTOM_BELLY_WIDTH: 225,
    CUSTOM_BELLY_POSITION: 0.35,
    CUSTOM_BOTTOM_WIDTH: 55,
    CUSTOM_CURVATURE: 0.0,
    CUSTOM_WAVE_COUNT: 0,
    CUSTOM_WAVE_AMPLITUDE: 0,
    CUSTOM_BOTTOM_WAVE_COUNT: 0,
    CUSTOM_BOTTOM_WAVE_AMPLITUDE: 0,
    CUSTOM_BOTTOM_WAVE_STYLE: 'smooth'
  },
  funnel: {
    CUSTOM_PRESET: 'funnel',
    CUSTOM_NECK_WIDTH: 215,
    CUSTOM_BELLY_WIDTH: 140,
    CUSTOM_BELLY_POSITION: 0.5,
    CUSTOM_BOTTOM_WIDTH: 65,
    CUSTOM_CURVATURE: 0.25,
    CUSTOM_WAVE_COUNT: 0,
    CUSTOM_WAVE_AMPLITUDE: 0,
    CUSTOM_BOTTOM_WAVE_COUNT: 0,
    CUSTOM_BOTTOM_WAVE_AMPLITUDE: 0,
    CUSTOM_BOTTOM_WAVE_STYLE: 'smooth'
  },
  wavy: {
    CUSTOM_PRESET: 'wavy',
    CUSTOM_NECK_WIDTH: 75,
    CUSTOM_BELLY_WIDTH: 190,
    CUSTOM_BELLY_POSITION: 0.5,
    CUSTOM_BOTTOM_WIDTH: 175,
    CUSTOM_CURVATURE: 0.65,
    CUSTOM_WAVE_COUNT: 4,
    CUSTOM_WAVE_AMPLITUDE: 18,
    CUSTOM_BOTTOM_WAVE_COUNT: 3,
    CUSTOM_BOTTOM_WAVE_AMPLITUDE: 15,
    CUSTOM_BOTTOM_WAVE_STYLE: 'smooth'
  },
  custom: {
    CUSTOM_PRESET: 'custom'
  }
};

export const DEFAULT_MERGE_DROP_CONFIG: MergeDropConfig = {
  SKIN_THEME: 'solar', // On active par défaut le Système Solaire demandé !
  RENDER_MODE: '2d', // Rendu 2D Flat & Néon par défaut (ou 3D Three.js ASMR)
  ACTIVE_TIERS: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // Les 10 billes sont actives par défaut (min 5, max 10)
  CONTAINER_SHAPE: 'jar', // On active par défaut la Jarre demandée !
  CONTAINER_COLOR: '#00f0ff',
  BACKGROUND_COLOR: '#06080d',
  BACKGROUND_EFFECT: 'cosmic-stars', // Arrière-plan animé TikTok activé par défaut !

  // Réglages du conteneur personnalisable
  CUSTOM_PRESET: 'erlenmeyer',
  CUSTOM_NECK_WIDTH: 45,
  CUSTOM_BELLY_WIDTH: 135,
  CUSTOM_BELLY_POSITION: 0.55,
  CUSTOM_BOTTOM_WIDTH: 220,
  CUSTOM_CURVATURE: 0.05,
  CUSTOM_WAVE_COUNT: 0,
  CUSTOM_WAVE_AMPLITUDE: 0,
  CUSTOM_BOTTOM_WAVE_COUNT: 0,
  CUSTOM_BOTTOM_WAVE_AMPLITUDE: 0,
  CUSTOM_BOTTOM_WAVE_STYLE: 'smooth',

  BASE_BALL_RADIUS: 16,
  BALL_HITBOX_SCALE: 1.0,
  SHOW_HITBOX_DEBUG: false,
  GRAVITY: 1.25,
  RESTITUTION: 0.22,
  FRICTION: 0.985,
  SPAWN_MAX_TIER: 2,
  AUTO_STREAM_ACTIVE: false,
  AUTO_STREAM_RATE: 5,
  AUTO_STREAM_RAMP_ENABLED: true,
  AUTO_STREAM_START_RATE: 2,
  AUTO_STREAM_MAX_RATE: 10,
  AUTO_STREAM_RAMP_STEP: 1,
  AUTO_STREAM_RAMP_INTERVAL: 4,
  SCREEN_SHAKE_ENABLED: true,
  SHOW_EVOLUTION_BAR: true,
  SHOW_BALL_OUTLINE: true,
  SHOW_TOP_HUD: true,
  HUD_TOP_OFFSET: 65,
  CONTAINER_STROKE_WIDTH: 4.5,
  CONTAINER_TOP_Y: 190,
  CONTAINER_BOTTOM_Y: 790, // Remonté à 790px par défaut pour laisser de l'espace en bas
  EVOLUTION_BAR_Y: 810, // Placé sous le HUD en haut par défaut : 100% visible et hors des zones mortes TikTok
  EVOLUTION_BAR_SIZE: 23,
  EVOLUTION_BAR_LAYOUT: '1row',

  // Audio par défaut
  SOUND_MERGE_ENABLED: true,
  SOUND_MERGE_STYLE: 'bubbly', // 🫧 Pop / Bulle ASMR par défaut (viral TikTok)
  SOUND_MERGE_VOLUME: 80,
  SOUND_COLLISION_ENABLED: true,
  SOUND_COLLISION_STYLE: 'wood', // 🪵 Toc Bois ASMR par défaut
  SOUND_COLLISION_VOLUME: 35,
  SOUND_DROP_ENABLED: true,
  SOUND_PITCH: 1.0,
  SOUND_COMBO_PITCH: true,

  // Annonceur Vocal IA
  VOICE_ANNOUNCER_ENABLED: false,
  VOICE_ANNOUNCER_MODE: 'tier_name',
  VOICE_ANNOUNCER_PREFIX: 'Patate',
  VOICE_ANNOUNCER_PITCH_BASE: 1.6,
  VOICE_ANNOUNCER_RATE_BASE: 1.25,
  VOICE_ANNOUNCER_PITCH_MIN: 0.35,
  VOICE_ANNOUNCER_RATE_MIN: 0.65,
  VOICE_ANNOUNCER_SHOW_POPUP: true,

  // Textes par défaut
  TEXT_TITLE: "🪐 SYSTÈME SOLAIRE",
  TEXT_METRIC_SCORE: "SCORE",
  TEXT_METRIC_MAX_TIER: "PLANÈTE MAX",
  TEXT_STATUS_VICTORY: "☀️ SOLEIL CRÉÉ ! VICTOIRE COSMIQUE ☀️",
  TEXT_ACTION_STREAM_START: "LANCER RAFALE NIVEAU 1",
  TEXT_ACTION_STREAM_STOP: "ARRÊTER RAFALE NIVEAU 1"
};
