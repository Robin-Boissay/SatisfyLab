import { SoundMergeStyle, SoundCollisionStyle } from '../../core/SoundEngine';

export type SkinTheme = 'solar' | 'vegetables' | 'minerals' | 'animals' | 'neon' | string;
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
  textureManager,
  getThemeDefinition,
  getTiersForTheme,
  getTierLocalizedName
} from './themeRegistry';

export interface MergeDropConfig {
  SKIN_THEME: SkinTheme; // 'neon' | 'solar'
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
  GRAVITY: number;
  RESTITUTION: number; // Rebond
  FRICTION: number;
  SPAWN_MAX_TIER: number; // Tier max qui peut spawner en mode manuel
  AUTO_STREAM_ACTIVE: boolean; // Lanceur automatique de billes niveau 1
  AUTO_STREAM_RATE: number; // Nombre de billes niveau 1 par seconde
  SCREEN_SHAKE_ENABLED: boolean;
  SHOW_EVOLUTION_BAR: boolean; // Frise des 10 paliers

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
  GRAVITY: 1.25,
  RESTITUTION: 0.22,
  FRICTION: 0.985,
  SPAWN_MAX_TIER: 2,
  AUTO_STREAM_ACTIVE: false,
  AUTO_STREAM_RATE: 5,
  SCREEN_SHAKE_ENABLED: true,
  SHOW_EVOLUTION_BAR: true,
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
  SOUND_MERGE_VOLUME: 0.8,
  SOUND_COLLISION_ENABLED: true,
  SOUND_COLLISION_STYLE: 'wood', // 🪵 Toc Bois ASMR par défaut
  SOUND_COLLISION_VOLUME: 0.35,
  SOUND_DROP_ENABLED: true,
  SOUND_PITCH: 1.0,
  SOUND_COMBO_PITCH: true,

  // Textes par défaut
  TEXT_TITLE: "🪐 SYSTÈME SOLAIRE",
  TEXT_METRIC_SCORE: "SCORE",
  TEXT_METRIC_MAX_TIER: "PLANÈTE MAX",
  TEXT_STATUS_VICTORY: "☀️ SOLEIL CRÉÉ ! VICTOIRE COSMIQUE ☀️",
  TEXT_ACTION_STREAM_START: "LANCER RAFALE NIVEAU 1",
  TEXT_ACTION_STREAM_STOP: "ARRÊTER RAFALE NIVEAU 1"
};
