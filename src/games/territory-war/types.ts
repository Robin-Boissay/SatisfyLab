export type TeamId = 'cyan' | 'magenta';

export interface TerritoryWarConfig {
  // Grille & Terrain
  GRID_COLUMNS: number;
  GRID_ROWS: number;
  SPLASH_RADIUS: number; // 1 = 1 seule tuile, 2 = croix 3x3, etc.

  // Dynamique de Victoire & Overdrive
  OVERDRIVE_THRESHOLD: number; // Seuil % pour enclencher l'Overdrive (ex: 55%)
  OVERDRIVE_SPEED_BOOST: number; // Multiplicateur de vitesse en Overdrive
  REINFORCEMENTS_ENABLED: boolean; // Spawn d'une bille de renfort quand un camp mène
  MAGNETIC_HUNT: boolean; // Attraction magnétique vers les dernières tuiles ennemies
  COMBO_SHOCKWAVE: boolean; // Ondes de choc en série de captures
  KNOCKOUT_THRESHOLD: number; // Seuil % restant pour éliminer les billes adverses et garantir le 100%
  KNOCKOUT_ENABLED: boolean; // Active le K.O. final de la bille ennemie acculée

  // Balles
  BALLS_PER_TEAM: number;
  INITIAL_SPEED: number;
  BOUNCE_SPEED_MULTIPLIER: number;
  BALL_RADIUS: number;

  // Physique & Effets
  GRAVITY: number; // 0 = apesanteur classique TikTok, >0 = trajectoires courbées
  SCREEN_SHAKE_ENABLED: boolean;

  // Textes personnalisables
  TEXT_TITLE: string;
  TEXT_TEAM_A: string;
  TEXT_TEAM_B: string;
  TEXT_WIN_A: string;
  TEXT_WIN_B: string;
  TEXT_START_PROMPT: string;
}

export const DEFAULT_TERRITORY_WAR_CONFIG: TerritoryWarConfig = {
  GRID_COLUMNS: 16,
  GRID_ROWS: 26,
  SPLASH_RADIUS: 1,

  OVERDRIVE_THRESHOLD: 55, // Déclenchement dès 55% pour briser le plafond des 65% !
  OVERDRIVE_SPEED_BOOST: 1.35,
  REINFORCEMENTS_ENABLED: true,
  MAGNETIC_HUNT: true,
  COMBO_SHOCKWAVE: true,
  KNOCKOUT_THRESHOLD: 6, // K.O. quand l'ennemi n'a plus que 6% de tuiles restantes
  KNOCKOUT_ENABLED: true,

  BALLS_PER_TEAM: 1,
  INITIAL_SPEED: 340,
  BOUNCE_SPEED_MULTIPLIER: 1.002,
  BALL_RADIUS: 10,

  GRAVITY: 0.0,
  SCREEN_SHAKE_ENABLED: true,

  TEXT_TITLE: "⚔️ GUERRE DE TERRITOIRE ⚔️",
  TEXT_TEAM_A: "CYAN",
  TEXT_TEAM_B: "ROSE",
  TEXT_WIN_A: "🏆 VICTOIRE CYAN (100%) ! 🏆",
  TEXT_WIN_B: "🏆 VICTOIRE ROSE (100%) ! 🏆",
  TEXT_START_PROMPT: "Clique pour lancer la conquête"
};

