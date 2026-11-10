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
  image?: string; // Chemin optionnel vers une texture PNG / WebP (ex: '/themes/vegetables/tier_0.png')
}

export type ThemeRenderStyle = 'solar' | 'neon' | 'glossy' | 'gem';

export interface MergeThemeDefinition {
  id: string;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
  renderStyle: ThemeRenderStyle;
  defaultTitle: string;
  defaultTitleEn: string;
  metricMaxLabel: string;
  metricMaxLabelEn: string;
  victoryText: string;
  victoryTextEn: string;
  streamStartLabel: string;
  streamStartLabelEn: string;
  streamStopLabel: string;
  streamStopLabelEn: string;
  defaultContainerColor?: string;
  defaultBackgroundColor?: string;
  tiers: MergeTier[];
}

/**
 * Cache et préchargement fluide des textures PNG / WebP pour le Canvas
 */
class ImageTextureManager {
  private cache: Map<string, HTMLImageElement> = new Map();
  private loading: Set<string> = new Set();
  private failed: Set<string> = new Set();

  public getImage(src: string): HTMLImageElement | null {
    if (!src || this.failed.has(src)) return null;

    const existing = this.cache.get(src);
    if (existing && existing.complete && existing.naturalWidth > 0) {
      return existing;
    }

    if (!this.loading.has(src)) {
      this.loading.add(src);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      img.onload = () => {
        this.cache.set(src, img);
        this.loading.delete(src);
      };
      img.onerror = () => {
        this.loading.delete(src);
        this.failed.add(src);
      };
    }

    return null;
  }

  public preloadThemeImages(tiers: MergeTier[]): void {
    for (const tier of tiers) {
      if (tier.image) {
        this.getImage(tier.image);
      }
    }
  }
}

export const textureManager = new ImageTextureManager();

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

export const VEGETABLES_TIERS: MergeTier[] = [
  { tier: 0, name: 'Petit Pois', nameEn: 'Green Pea', symbol: '🟢', radius: 16, baseRadius: 16, color: '#7cb342', secondaryColor: '#aed581', glowColor: 'rgba(124, 179, 66, 0.8)', points: 2, image: '/themes/vegetables/tier_0.png' },
  { tier: 1, name: 'Tomate Cerise', nameEn: 'Cherry Tomato', symbol: '🍅', radius: 22, baseRadius: 22, color: '#e53935', secondaryColor: '#ff8a80', glowColor: 'rgba(229, 57, 53, 0.8)', points: 4, image: '/themes/vegetables/tier_1.png' },
  { tier: 2, name: 'Champignon', nameEn: 'Mushroom', symbol: '🍄', radius: 28, baseRadius: 28, color: '#d7ccc8', secondaryColor: '#a1887f', glowColor: 'rgba(161, 136, 127, 0.8)', points: 8, image: '/themes/vegetables/tier_2.png' },
  { tier: 3, name: 'Oignon Doux', nameEn: 'Sweet Onion', symbol: '🧅', radius: 36, baseRadius: 36, color: '#d4a373', secondaryColor: '#faedcd', glowColor: 'rgba(212, 163, 115, 0.8)', points: 16, image: '/themes/vegetables/tier_3.png' },
  { tier: 4, name: 'Carotte Sucrée', nameEn: 'Sweet Carrot', symbol: '🥕', radius: 44, baseRadius: 44, color: '#fb8500', secondaryColor: '#ffb703', glowColor: 'rgba(251, 133, 0, 0.85)', points: 32, image: '/themes/vegetables/tier_4.png' },
  { tier: 5, name: 'Maïs Croustillant', nameEn: 'Golden Corn', symbol: '🌽', radius: 52, baseRadius: 52, color: '#ffb703', secondaryColor: '#ffe66d', glowColor: 'rgba(255, 183, 3, 0.85)', points: 64, image: '/themes/vegetables/tier_5.png' },
  { tier: 6, name: 'Poivron Rouge', nameEn: 'Red Pepper', symbol: '🫑', radius: 62, baseRadius: 62, color: '#d90429', secondaryColor: '#ff4d6d', glowColor: 'rgba(217, 4, 41, 0.85)', points: 128, image: '/themes/vegetables/tier_6.png' },
  { tier: 7, name: 'Aubergine Brillante', nameEn: 'Glossy Eggplant', symbol: '🍆', radius: 72, baseRadius: 72, color: '#7209b7', secondaryColor: '#b5179e', glowColor: 'rgba(114, 9, 183, 0.85)', points: 256, image: '/themes/vegetables/tier_7.png' },
  { tier: 8, name: 'Brocoli Géant', nameEn: 'Giant Broccoli', symbol: '🥦', radius: 82, baseRadius: 82, color: '#2d6a4f', secondaryColor: '#52b788', glowColor: 'rgba(45, 106, 79, 0.9)', points: 512, image: '/themes/vegetables/tier_8.png' },
  { tier: 9, name: '🎃 CITROUILLE ROYALE 🎃', nameEn: '🎃 ROYAL PUMPKIN 🎃', symbol: '🎃', radius: 94, baseRadius: 94, color: '#f77f00', secondaryColor: '#fcbf49', glowColor: 'rgba(247, 127, 0, 1.0)', points: 1024, image: '/themes/vegetables/tier_9.png' }
];

export const MINERALS_TIERS: MergeTier[] = [
  { tier: 0, name: 'Charbon Brut', nameEn: 'Raw Coal', symbol: '🪨', radius: 16, baseRadius: 16, color: '#37474f', secondaryColor: '#263238', glowColor: 'rgba(96, 125, 139, 0.7)', points: 2, image: '/themes/minerals/tier_0.png' },
  { tier: 1, name: 'Minerai de Cuivre', nameEn: 'Copper Ore', symbol: '🥉', radius: 22, baseRadius: 22, color: '#b87333', secondaryColor: '#d78b43', glowColor: 'rgba(184, 115, 51, 0.8)', points: 4, image: '/themes/minerals/tier_1.png' },
  { tier: 2, name: 'Lingot de Fer', nameEn: 'Iron Ore', symbol: '⚪', radius: 28, baseRadius: 28, color: '#cfd8dc', secondaryColor: '#90a4ae', glowColor: 'rgba(207, 216, 220, 0.85)', points: 8, image: '/themes/minerals/tier_2.png' },
  { tier: 3, name: 'Lapis-Lazuli', nameEn: 'Lapis Lazuli', symbol: '🔷', radius: 36, baseRadius: 36, color: '#1565c0', secondaryColor: '#1e88e5', glowColor: 'rgba(21, 101, 192, 0.85)', points: 16, image: '/themes/minerals/tier_3.png' },
  { tier: 4, name: 'Pépite d’Or', nameEn: 'Gold Nugget', symbol: '🪙', radius: 44, baseRadius: 44, color: '#ffd700', secondaryColor: '#fff176', glowColor: 'rgba(255, 215, 0, 0.85)', points: 32, image: '/themes/minerals/tier_4.png' },
  { tier: 5, name: 'Améthyste Pure', nameEn: 'Pure Amethyst', symbol: '🔮', radius: 52, baseRadius: 52, color: '#9c27b0', secondaryColor: '#e1bee7', glowColor: 'rgba(156, 39, 176, 0.85)', points: 64, image: '/themes/minerals/tier_5.png' },
  { tier: 6, name: 'Émeraude Éclatante', nameEn: 'Radiant Emerald', symbol: '❇️', radius: 62, baseRadius: 62, color: '#00c853', secondaryColor: '#b9f6ca', glowColor: 'rgba(0, 200, 83, 0.85)', points: 128, image: '/themes/minerals/tier_6.png' },
  { tier: 7, name: 'Rubis Flamboyant', nameEn: 'Blazing Ruby', symbol: '💎', radius: 72, baseRadius: 72, color: '#d50000', secondaryColor: '#ff8a80', glowColor: 'rgba(213, 0, 0, 0.9)', points: 256, image: '/themes/minerals/tier_7.png' },
  { tier: 8, name: 'Saphir Astral', nameEn: 'Astral Sapphire', symbol: '🔹', radius: 82, baseRadius: 82, color: '#0d47a1', secondaryColor: '#82b1ff', glowColor: 'rgba(13, 71, 161, 0.9)', points: 512, image: '/themes/minerals/tier_8.png' },
  { tier: 9, name: '⭐ DIAMANT COSMIQUE ⭐', nameEn: '⭐ COSMIC DIAMOND ⭐', symbol: '💎✨', radius: 94, baseRadius: 94, color: '#00e5ff', secondaryColor: '#ffffff', glowColor: 'rgba(0, 229, 255, 1.0)', points: 1024, image: '/themes/minerals/tier_9.png' }
];

export const ANIMALS_TIERS: MergeTier[] = [
  { tier: 0, name: 'Poussin Chibi', nameEn: 'Baby Chick', symbol: '🐥', radius: 16, baseRadius: 16, color: '#ffea00', secondaryColor: '#fff59d', glowColor: 'rgba(255, 234, 0, 0.8)', points: 2, image: '/themes/animals/tier_0.png' },
  { tier: 1, name: 'Rainette Joyeuse', nameEn: 'Happy Frog', symbol: '🐸', radius: 22, baseRadius: 22, color: '#4caf50', secondaryColor: '#a5d6a7', glowColor: 'rgba(76, 175, 80, 0.8)', points: 4, image: '/themes/animals/tier_1.png' },
  { tier: 2, name: 'Petite Souris', nameEn: 'Little Mouse', symbol: '🐭', radius: 28, baseRadius: 28, color: '#b0bec5', secondaryColor: '#eceff1', glowColor: 'rgba(176, 190, 197, 0.8)', points: 8, image: '/themes/animals/tier_2.png' },
  { tier: 3, name: 'Lapin Coton', nameEn: 'Cotton Bunny', symbol: '🐰', radius: 36, baseRadius: 36, color: '#f8bbd0', secondaryColor: '#fce4ec', glowColor: 'rgba(248, 187, 208, 0.85)', points: 16, image: '/themes/animals/tier_3.png' },
  { tier: 4, name: 'Chaton Ronron', nameEn: 'Playful Kitten', symbol: '🐱', radius: 44, baseRadius: 44, color: '#ff9800', secondaryColor: '#ffe0b2', glowColor: 'rgba(255, 152, 0, 0.85)', points: 32, image: '/themes/animals/tier_4.png' },
  { tier: 5, name: 'Renard Rusé', nameEn: 'Clever Fox', symbol: '🦊', radius: 52, baseRadius: 52, color: '#f4511e', secondaryColor: '#ffab91', glowColor: 'rgba(244, 81, 30, 0.85)', points: 64, image: '/themes/animals/tier_5.png' },
  { tier: 6, name: 'Panda Rondouillard', nameEn: 'Chubby Panda', symbol: '🐼', radius: 62, baseRadius: 62, color: '#37474f', secondaryColor: '#ffffff', glowColor: 'rgba(100, 116, 139, 0.85)', points: 128, image: '/themes/animals/tier_6.png' },
  { tier: 7, name: 'Singe Fripon', nameEn: 'Mischievous Monkey', symbol: '🐵', radius: 72, baseRadius: 72, color: '#795548', secondaryColor: '#d7ccc8', glowColor: 'rgba(121, 85, 72, 0.85)', points: 256, image: '/themes/animals/tier_7.png' },
  { tier: 8, name: 'Lionceau Brave', nameEn: 'Brave Cub', symbol: '🦁', radius: 82, baseRadius: 82, color: '#fbc02d', secondaryColor: '#fff59d', glowColor: 'rgba(251, 192, 45, 0.9)', points: 512, image: '/themes/animals/tier_8.png' },
  { tier: 9, name: '🐳 BALEINE MAGIQUE 🐳', nameEn: '🐳 MAGICAL WHALE 🐳', symbol: '🐳', radius: 94, baseRadius: 94, color: '#00b0ff', secondaryColor: '#80d8ff', glowColor: 'rgba(0, 176, 255, 1.0)', points: 1024, image: '/themes/animals/tier_9.png' }
];

export const FRUITS_TIERS: MergeTier[] = [
  { tier: 0, name: 'Cerise Gourmande', nameEn: 'Cherry', symbol: '🍒', radius: 16, baseRadius: 16, color: '#d00000', secondaryColor: '#ff4d6d', glowColor: 'rgba(208, 0, 0, 0.8)', points: 2, image: '/themes/fruits/tier_0.png' },
  { tier: 1, name: 'Fraise Rubis', nameEn: 'Strawberry', symbol: '🍓', radius: 22, baseRadius: 22, color: '#e63946', secondaryColor: '#ff758f', glowColor: 'rgba(230, 57, 70, 0.8)', points: 4, image: '/themes/fruits/tier_1.png' },
  { tier: 2, name: 'Raisin Royal', nameEn: 'Grape', symbol: '🍇', radius: 28, baseRadius: 28, color: '#7209b7', secondaryColor: '#b5179e', glowColor: 'rgba(114, 9, 183, 0.8)', points: 8, image: '/themes/fruits/tier_2.png' },
  { tier: 3, name: 'Clémentine Solaire', nameEn: 'Clementine', symbol: '🍊', radius: 36, baseRadius: 36, color: '#f77f00', secondaryColor: '#fcbf49', glowColor: 'rgba(247, 127, 0, 0.85)', points: 16, image: '/themes/fruits/tier_3.png' },
  { tier: 4, name: 'Kaki Doré', nameEn: 'Persimmon', symbol: '🥭', radius: 44, baseRadius: 44, color: '#fb8500', secondaryColor: '#ffb703', glowColor: 'rgba(251, 133, 0, 0.85)', points: 32, image: '/themes/fruits/tier_4.png' },
  { tier: 5, name: 'Pomme Rouge', nameEn: 'Red Apple', symbol: '🍎', radius: 52, baseRadius: 52, color: '#c1121f', secondaryColor: '#fdf0d5', glowColor: 'rgba(193, 18, 31, 0.85)', points: 64, image: '/themes/fruits/tier_5.png' },
  { tier: 6, name: 'Poire Sucrée', nameEn: 'Sweet Pear', symbol: '🍐', radius: 62, baseRadius: 62, color: '#90be6d', secondaryColor: '#d8f3dc', glowColor: 'rgba(144, 190, 109, 0.85)', points: 128, image: '/themes/fruits/tier_6.png' },
  { tier: 7, name: 'Pêche Douce', nameEn: 'Peach', symbol: '🍑', radius: 72, baseRadius: 72, color: '#f4a261', secondaryColor: '#fcd5ce', glowColor: 'rgba(244, 162, 97, 0.9)', points: 256, image: '/themes/fruits/tier_7.png' },
  { tier: 8, name: 'Ananas Exotique', nameEn: 'Pineapple', symbol: '🍍', radius: 82, baseRadius: 82, color: '#e9c46a', secondaryColor: '#fefae0', glowColor: 'rgba(233, 196, 106, 0.9)', points: 512, image: '/themes/fruits/tier_8.png' },
  { tier: 9, name: '🍉 PASTÈQUE GÉANTE 🍉', nameEn: '🍉 GIANT WATERMELON 🍉', symbol: '🍉', radius: 94, baseRadius: 94, color: '#2a9d8f', secondaryColor: '#e76f51', glowColor: 'rgba(42, 157, 143, 1.0)', points: 1024, image: '/themes/fruits/tier_9.png' }
];

export const SWEETS_TIERS: MergeTier[] = [
  { tier: 0, name: 'Bonbon Acidulé', nameEn: 'Sour Candy', symbol: '🍬', radius: 16, baseRadius: 16, color: '#ff007f', secondaryColor: '#ffb3d9', glowColor: 'rgba(255, 0, 127, 0.8)', points: 2, image: '/themes/sweets/tier_0.png' },
  { tier: 1, name: 'Guimauve Douce', nameEn: 'Marshmallow', symbol: '🍥', radius: 22, baseRadius: 22, color: '#d8b4e2', secondaryColor: '#f7d6e0', glowColor: 'rgba(216, 180, 226, 0.8)', points: 4, image: '/themes/sweets/tier_1.png' },
  { tier: 2, name: 'Macaron Vanille', nameEn: 'Macaron', symbol: '🍪', radius: 28, baseRadius: 28, color: '#f5ebe0', secondaryColor: '#e3d5ca', glowColor: 'rgba(245, 235, 224, 0.8)', points: 8, image: '/themes/sweets/tier_2.png' },
  { tier: 3, name: 'Chocolat Fondant', nameEn: 'Chocolate', symbol: '🍫', radius: 36, baseRadius: 36, color: '#582f0e', secondaryColor: '#7f4f24', glowColor: 'rgba(88, 47, 14, 0.85)', points: 16, image: '/themes/sweets/tier_3.png' },
  { tier: 4, name: 'Sucette Spirale', nameEn: 'Lollipop', symbol: '🍭', radius: 44, baseRadius: 44, color: '#ff5400', secondaryColor: '#ff9e00', glowColor: 'rgba(255, 84, 0, 0.85)', points: 32, image: '/themes/sweets/tier_4.png' },
  { tier: 5, name: 'Donut Glacé', nameEn: 'Glazed Donut', symbol: '🍩', radius: 52, baseRadius: 52, color: '#f72585', secondaryColor: '#7209b7', glowColor: 'rgba(247, 37, 133, 0.85)', points: 64, image: '/themes/sweets/tier_5.png' },
  { tier: 6, name: 'Cupcake Givré', nameEn: 'Cupcake', symbol: '🧁', radius: 62, baseRadius: 62, color: '#4cc9f0', secondaryColor: '#f72585', glowColor: 'rgba(76, 201, 240, 0.85)', points: 128, image: '/themes/sweets/tier_6.png' },
  { tier: 7, name: 'Glace Fraise', nameEn: 'Ice Cream', symbol: '🍨', radius: 72, baseRadius: 72, color: '#ff70a6', secondaryColor: '#ffd670', glowColor: 'rgba(255, 112, 166, 0.9)', points: 256, image: '/themes/sweets/tier_7.png' },
  { tier: 8, name: 'Tarte Dorée', nameEn: 'Fruit Tart', symbol: '🥧', radius: 82, baseRadius: 82, color: '#ff9770', secondaryColor: '#e9ff70', glowColor: 'rgba(255, 151, 112, 0.9)', points: 512, image: '/themes/sweets/tier_8.png' },
  { tier: 9, name: '🎂 GÂTEAU DE FÊTE GÉANT 🎂', nameEn: '🎂 GIANT CELEBRATION CAKE 🎂', symbol: '🎂', radius: 94, baseRadius: 94, color: '#ff007f', secondaryColor: '#ffd700', glowColor: 'rgba(255, 0, 127, 1.0)', points: 1024, image: '/themes/sweets/tier_9.png' }
];

export const MERGE_THEMES: Record<string, MergeThemeDefinition> = {
  solar: {
    id: 'solar',
    label: '🪐 Système Solaire',
    labelEn: '🪐 Solar System',
    description: 'De l’astéroïde au Soleil éclatant avec anneaux et couronnes solaires.',
    descriptionEn: 'From asteroid to radiant Sun with rings and solar flares.',
    renderStyle: 'solar',
    defaultTitle: '🪐 SYSTÈME SOLAIRE',
    defaultTitleEn: '🪐 SOLAR SYSTEM',
    metricMaxLabel: 'PLANÈTE MAX',
    metricMaxLabelEn: 'MAX PLANET',
    victoryText: '☀️ SOLEIL CRÉÉ ! VICTOIRE COSMIQUE ☀️',
    victoryTextEn: '☀️ SUN CREATED! COSMIC VICTORY ☀️',
    streamStartLabel: 'LANCER RAFALE ASTÉROÏDES',
    streamStartLabelEn: 'LAUNCH ASTEROID STREAM',
    streamStopLabel: 'ARRÊTER RAFALE ASTÉROÏDES',
    streamStopLabelEn: 'STOP ASTEROID STREAM',
    defaultContainerColor: '#00f0ff',
    defaultBackgroundColor: '#06080d',
    tiers: SOLAR_TIERS
  },
  animals: {
    id: 'animals',
    label: '🐾 Animaux Mignons',
    labelEn: '🐾 Kawaii Animals',
    description: 'Des poussins adorables jusqu’à la majestueuse Baleine Magique.',
    descriptionEn: 'From cute chicks to the majestic Cosmic Whale.',
    renderStyle: 'glossy',
    defaultTitle: 'Animales',
    defaultTitleEn: 'Animals',
    metricMaxLabel: 'PALIER MAX',
    metricMaxLabelEn: 'MAX TIER',
    victoryText: '👑 PALIER ULTIME ATTEINT ! 👑',
    victoryTextEn: '👑 ULTIMATE TIER REACHED! 👑',
    streamStartLabel: 'LANCER RAFALE NIVEAU 1',
    streamStartLabelEn: 'LAUNCH TIER 1 STREAM',
    streamStopLabel: 'ARRÊTER RAFALE NIVEAU 1',
    streamStopLabelEn: 'STOP TIER 1 STREAM',
    defaultContainerColor: '#ff007f',
    defaultBackgroundColor: '#0d0614',
    tiers: ANIMALS_TIERS
  },
  vegetables: {
    id: 'vegetables',
    label: '🥕 Légumes du Potager',
    labelEn: '🥕 Garden Vegetables',
    description: 'Du petit pois croquant jusqu’à la Citrouille royale.',
    descriptionEn: 'From tiny green pea up to the Royal Pumpkin.',
    renderStyle: 'glossy',
    defaultTitle: '🥕 POTAGER GOURMAND',
    defaultTitleEn: '🥕 GARDEN HARVEST',
    metricMaxLabel: 'LÉGUME MAX',
    metricMaxLabelEn: 'MAX VEGGIE',
    victoryText: '🎃 CITROUILLE GÉANTE RÉCOLTÉE ! 🎃',
    victoryTextEn: '🎃 GIANT PUMPKIN HARVESTED! 🎃',
    streamStartLabel: 'LANCER PLUIE DE PETITS POIS',
    streamStartLabelEn: 'LAUNCH PEA STREAM',
    streamStopLabel: 'ARRÊTER PLUIE DE PETITS POIS',
    streamStopLabelEn: 'STOP PEA STREAM',
    defaultContainerColor: '#00ff88',
    defaultBackgroundColor: '#07160d',
    tiers: VEGETABLES_TIERS
  },
  minerals: {
    id: 'minerals',
    label: '💎 Minerais & Gemmes',
    labelEn: '💎 Minerals & Gems',
    description: 'Du charbon brut jusqu’au légendaire Diamant Cosmique.',
    descriptionEn: 'From rough coal to the legendary Cosmic Diamond.',
    renderStyle: 'gem',
    defaultTitle: '💎 MINE AUX TRÉSORS',
    defaultTitleEn: '💎 GEMSTONE MINE',
    metricMaxLabel: 'GEMME MAX',
    metricMaxLabelEn: 'MAX GEM',
    victoryText: '⭐ DIAMANT COSMIQUE EXTRAIT ! ⭐',
    victoryTextEn: '⭐ COSMIC DIAMOND EXTRACTED! ⭐',
    streamStartLabel: 'LANCER RAFALE NIVEAU 1',
    streamStartLabelEn: 'LAUNCH TIER 1 STREAM',
    streamStopLabel: 'ARRÊTER RAFALE NIVEAU 1',
    streamStopLabelEn: 'STOP TIER 1 STREAM',
    tiers: MINERALS_TIERS
  },
  fruits: {
    id: 'fruits',
    label: '🍉 Fruits Juteux (Suika)',
    labelEn: '🍉 Juicy Fruits (Suika)',
    description: 'De la petite cerise gourmande jusqu’à la Pastèque géante.',
    descriptionEn: 'From tiny sweet cherry up to the Giant Watermelon.',
    renderStyle: 'glossy',
    defaultTitle: '🍉 VERGER SUIKA',
    defaultTitleEn: '🍉 SUIKA ORCHARD',
    metricMaxLabel: 'FRUIT MAX',
    metricMaxLabelEn: 'MAX FRUIT',
    victoryText: '🍉 PASTÈQUE GÉANTE RÉCOLTÉE ! 🍉',
    victoryTextEn: '🍉 GIANT WATERMELON HARVESTED! 🍉',
    streamStartLabel: 'LANCER RAFALE DE CERISES',
    streamStartLabelEn: 'LAUNCH CHERRY STREAM',
    streamStopLabel: 'ARRÊTER RAFALE DE CERISES',
    streamStopLabelEn: 'STOP CHERRY STREAM',
    defaultContainerColor: '#2a9d8f',
    defaultBackgroundColor: '#0a1410',
    tiers: FRUITS_TIERS
  },
  sweets: {
    id: 'sweets',
    label: '🍬 Bonbons & Délices',
    labelEn: '🍬 Sweets & Candy',
    description: 'Du bonbon acidulé jusqu’au Gâteau de fête géant.',
    descriptionEn: 'From sour candy up to the Giant Celebration Cake.',
    renderStyle: 'glossy',
    defaultTitle: '🍬 PALAIS DES DÉLICES',
    defaultTitleEn: '🍬 SWEET PARADISE',
    metricMaxLabel: 'DÉLICE MAX',
    metricMaxLabelEn: 'MAX SWEET',
    victoryText: '🎂 GÂTEAU DE FÊTE CRÉÉ ! 🎂',
    victoryTextEn: '🎂 CELEBRATION CAKE CREATED! 🎂',
    streamStartLabel: 'LANCER PLUIE DE BONBONS',
    streamStartLabelEn: 'LAUNCH CANDY STREAM',
    streamStopLabel: 'ARRÊTER PLUIE DE BONBONS',
    streamStopLabelEn: 'STOP CANDY STREAM',
    defaultContainerColor: '#ff007f',
    defaultBackgroundColor: '#140610',
    tiers: SWEETS_TIERS
  },
  neon: {
    id: 'neon',
    label: '⚡ Néon Cyberpunk',
    labelEn: '⚡ Cyberpunk Neon',
    description: 'Orbes d’énergie pure pulsant au rythme des fusions lumineuses.',
    descriptionEn: 'Pure energy orbs pulsing with intense neon merges.',
    renderStyle: 'neon',
    defaultTitle: '⚡ NEON MERGE DROP',
    defaultTitleEn: '⚡ NEON MERGE DROP',
    metricMaxLabel: 'ORBE MAX',
    metricMaxLabelEn: 'MAX ORB',
    victoryText: '⭐ FUSION ULTIME ATTEINTE ! ⭐',
    victoryTextEn: '⭐ ULTIMATE MERGE REACHED! ⭐',
    streamStartLabel: 'LANCER RAFALE NIVEAU 1',
    streamStartLabelEn: 'LAUNCH TIER 1 STREAM',
    streamStopLabel: 'ARRÊTER RAFALE NIVEAU 1',
    streamStopLabelEn: 'STOP TIER 1 STREAM',
    defaultContainerColor: '#00f0ff',
    defaultBackgroundColor: '#05070f',
    tiers: NEON_TIERS
  }
};

export const THEME_OPTIONS = Object.values(MERGE_THEMES).map((theme) => ({
  label: theme.label,
  value: theme.id
}));

export function getThemeDefinition(themeId: string): MergeThemeDefinition {
  return MERGE_THEMES[themeId] || MERGE_THEMES.solar;
}

export function getTiersForTheme(themeId: string, baseRadius: number = 16): MergeTier[] {
  const def = getThemeDefinition(themeId);
  const ratio = baseRadius / 16;
  return def.tiers.map((t) => ({
    ...t,
    radius: Math.round(t.baseRadius * ratio)
  }));
}

export function getTierLocalizedName(tier: MergeTier, isEn: boolean): string {
  return isEn ? tier.nameEn : tier.name;
}

