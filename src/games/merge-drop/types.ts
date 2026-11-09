export type SkinTheme = 'neon' | 'solar';
export type ContainerShape = 'tube' | 'jar';

export interface MergeTier {
  tier: number;
  name: string;
  nameEn: string;
  symbol: string;
  radius: number;
  baseRadius: number;
  color: string;
  secondaryColor?: string;
  glowColor: string;
  points: number;
}

export const NEON_TIERS: MergeTier[] = [
  { tier: 0, name: 'Micro Rose', nameEn: 'Micro Pink', symbol: '1', radius: 16, baseRadius: 16, color: '#ff007f', glowColor: 'rgba(255, 0, 127, 0.8)', points: 2 },
  { tier: 1, name: 'Cyan Orb', nameEn: 'Cyan Orb', symbol: '2', radius: 22, baseRadius: 22, color: '#00f0ff', glowColor: 'rgba(0, 240, 255, 0.8)', points: 4 },
  { tier: 2, name: 'Laser Lime', nameEn: 'Laser Lime', symbol: '3', radius: 28, baseRadius: 28, color: '#00ff88', glowColor: 'rgba(0, 255, 136, 0.8)', points: 8 },
  { tier: 3, name: 'Solar Sun', nameEn: 'Solar Sun', symbol: '4', radius: 36, baseRadius: 36, color: '#ffe600', glowColor: 'rgba(255, 230, 0, 0.8)', points: 16 },
  { tier: 4, name: 'Sunset Spark', nameEn: 'Sunset Spark', symbol: '5', radius: 44, baseRadius: 44, color: '#ff7700', glowColor: 'rgba(255, 119, 0, 0.8)', points: 32 },
  { tier: 5, name: 'Cosmic Violet', nameEn: 'Cosmic Violet', symbol: '6', radius: 52, baseRadius: 52, color: '#b026ff', glowColor: 'rgba(176, 38, 255, 0.8)', points: 64 },
  { tier: 6, name: 'Ruby Core', nameEn: 'Ruby Core', symbol: '7', radius: 62, baseRadius: 62, color: '#ff1493', glowColor: 'rgba(255, 20, 147, 0.8)', points: 128 },
  { tier: 7, name: 'Deep Electric', nameEn: 'Deep Electric', symbol: '8', radius: 72, baseRadius: 72, color: '#2979ff', glowColor: 'rgba(41, 121, 255, 0.8)', points: 256 },
  { tier: 8, name: 'Emerald Giant', nameEn: 'Emerald Giant', symbol: '9', radius: 82, baseRadius: 82, color: '#00e676', glowColor: 'rgba(0, 230, 118, 0.8)', points: 512 },
  { tier: 9, name: '⭐ SUN COLLAPSE ⭐', nameEn: '⭐ SUN COLLAPSE ⭐', symbol: '👑', radius: 94, baseRadius: 94, color: '#ffd700', glowColor: 'rgba(255, 215, 0, 0.95)', points: 1024 }
];

export const SOLAR_TIERS: MergeTier[] = [
  { tier: 0, name: 'Astéroïde', nameEn: 'Asteroid', symbol: '🪨', radius: 16, baseRadius: 16, color: '#8d8d99', secondaryColor: '#545464', glowColor: 'rgba(160, 160, 175, 0.7)', points: 2 },
  { tier: 1, name: 'Mercure', nameEn: 'Mercury', symbol: '🌑', radius: 22, baseRadius: 22, color: '#bcaaa4', secondaryColor: '#8d6e63', glowColor: 'rgba(188, 170, 164, 0.8)', points: 4 },
  { tier: 2, name: 'Mars', nameEn: 'Mars', symbol: '🔴', radius: 28, baseRadius: 28, color: '#e53935', secondaryColor: '#b71c1c', glowColor: 'rgba(229, 57, 53, 0.85)', points: 8 },
  { tier: 3, name: 'Vénus', nameEn: 'Venus', symbol: '🟡', radius: 36, baseRadius: 36, color: '#ffb300', secondaryColor: '#f57f17', glowColor: 'rgba(255, 179, 0, 0.85)', points: 16 },
  { tier: 4, name: 'Terre', nameEn: 'Earth', symbol: '🌍', radius: 44, baseRadius: 44, color: '#1e88e5', secondaryColor: '#43a047', glowColor: 'rgba(30, 136, 229, 0.85)', points: 32 },
  { tier: 5, name: 'Neptune', nameEn: 'Neptune', symbol: '🔵', radius: 52, baseRadius: 52, color: '#0288d1', secondaryColor: '#01579b', glowColor: 'rgba(2, 136, 209, 0.85)', points: 64 },
  { tier: 6, name: 'Uranus', nameEn: 'Uranus', symbol: '🌀', radius: 62, baseRadius: 62, color: '#26c6da', secondaryColor: '#0097a7', glowColor: 'rgba(38, 198, 218, 0.85)', points: 128 },
  { tier: 7, name: 'Saturne', nameEn: 'Saturn', symbol: '🪐', radius: 72, baseRadius: 72, color: '#fdd835', secondaryColor: '#d7ccc8', glowColor: 'rgba(253, 216, 53, 0.9)', points: 256 },
  { tier: 8, name: 'Jupiter', nameEn: 'Jupiter', symbol: '🌕', radius: 82, baseRadius: 82, color: '#d87d4a', secondaryColor: '#ffe0b2', glowColor: 'rgba(216, 125, 74, 0.9)', points: 512 },
  { tier: 9, name: '☀️ LE SOLEIL ☀️', nameEn: '☀️ THE SUN ☀️', symbol: '☀️', radius: 94, baseRadius: 94, color: '#ff6d00', secondaryColor: '#fff59d', glowColor: 'rgba(255, 109, 0, 1.0)', points: 1024 }
];

export function getTiersForTheme(theme: SkinTheme, baseRadius: number = 16): MergeTier[] {
  const tiers = theme === 'solar' ? SOLAR_TIERS : NEON_TIERS;
  const ratio = baseRadius / 16;
  return tiers.map((t) => ({
    ...t,
    radius: Math.round(t.baseRadius * ratio)
  }));
}

export function getTierLocalizedName(tier: MergeTier, isEn: boolean): string {
  return isEn ? tier.nameEn : tier.name;
}

export interface MergeDropConfig {
  SKIN_THEME: SkinTheme; // 'neon' | 'solar'
  CONTAINER_SHAPE: ContainerShape; // 'tube' | 'jar'
  BASE_BALL_RADIUS: number; // Taille de la plus petite bille (base échelle)
  GRAVITY: number;
  RESTITUTION: number; // Rebond
  FRICTION: number;
  SPAWN_MAX_TIER: number; // Tier max qui peut spawner en mode manuel
  AUTO_STREAM_ACTIVE: boolean; // Lanceur automatique de billes niveau 1
  AUTO_STREAM_RATE: number; // Nombre de billes niveau 1 par seconde
  SCREEN_SHAKE_ENABLED: boolean;

  // Textes personnalisables à l'écran
  TEXT_TITLE: string;
  TEXT_METRIC_SCORE: string;
  TEXT_METRIC_MAX_TIER: string;
  TEXT_STATUS_VICTORY: string;
  TEXT_ACTION_STREAM_START: string;
  TEXT_ACTION_STREAM_STOP: string;
}

export const DEFAULT_MERGE_DROP_CONFIG: MergeDropConfig = {
  SKIN_THEME: 'solar', // On active par défaut le Système Solaire demandé !
  CONTAINER_SHAPE: 'jar', // On active par défaut la Jarre demandée !
  BASE_BALL_RADIUS: 16,
  GRAVITY: 1.25,
  RESTITUTION: 0.22,
  FRICTION: 0.985,
  SPAWN_MAX_TIER: 2,
  AUTO_STREAM_ACTIVE: false,
  AUTO_STREAM_RATE: 5,
  SCREEN_SHAKE_ENABLED: true,

  // Textes par défaut
  TEXT_TITLE: "🪐 SYSTÈME SOLAIRE",
  TEXT_METRIC_SCORE: "SCORE",
  TEXT_METRIC_MAX_TIER: "PLANÈTE MAX",
  TEXT_STATUS_VICTORY: "☀️ SOLEIL CRÉÉ ! VICTOIRE COSMIQUE ☀️",
  TEXT_ACTION_STREAM_START: "LANCER RAFALE NIVEAU 1",
  TEXT_ACTION_STREAM_STOP: "ARRÊTER RAFALE NIVEAU 1"
};
