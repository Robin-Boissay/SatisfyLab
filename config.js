/**
 * ==============================================================================
 * CONFIGURATION DU SIMULATEUR BALL ESCAPE
 * ==============================================================================
 * Modifiez facilement les variables physiques, graphiques et de gameplay ici.
 * Chaque paramètre est documenté avec sa valeur par défaut et son impact.
 */

const CONFIG = {
  // ---------------------------------------------------------------------------
  // 1. PHYSIQUE & DYNAMIQUE DE LA BILLE
  // ---------------------------------------------------------------------------

  /**
   * Gravité verticale appliquée vers le bas.
   * Valeur réactive pour des paraboles vives et nerveuses.
   * Défaut : 0.22
   */
  GRAVITY: 0.22,

  /**
   * Vitesse scalaire initiale de la bille lors du lancement.
   * Plus rapide et dynamique au démarrage.
   * Défaut : 12.0
   */
  INITIAL_SPEED: 220.0,

  /**
   * Facteur multiplicateur de vitesse appliqué à CHAQUE rebond (+5% par rebond).
   * Défaut : 1.05
   */
  BOUNCE_SPEED_MULTIPLIER: 1.03,

  /**
   * Vitesse scalaire maximale (plafond de vitesse très élevé).
   * Défaut : 48.0
   */
  MAX_SPEED: 360.0,

  /**
   * Rayon initial de la bille en pixels (espace logique).
   * Défaut : 14
   */
  BALL_RADIUS: 12,

  /**
   * Nombre de sous-pas par trame (Sub-stepping anti-tunneling).
   * Garantit des collisions 100% parfaites même à 48 px/frame.
   * Défaut : 16
   */
  SUB_STEPS: 12,

  // ---------------------------------------------------------------------------
  // 2. ARÈNE CIRCULAIRE & BRIQUES D'ARC
  // ---------------------------------------------------------------------------

  /**
   * Rayon intérieur de l'arène circulaire.
   * Défaut : 220
   */
  CIRCLE_RADIUS: 180,

  /**
   * Nombre total de segments (briques d'arc) formant le pourtour du cercle.
   * 36 segments = 10 degrés par segment.
   * Défaut : 36
   */
  TOTAL_WALL_SEGMENTS: 28,

  /**
   * Points de vie (HP) de chaque brique d'arc.
   * Chaque impact réduit de 1 HP et fait changer la brique de couleur.
   * À 0 HP, la brique se détruit et ouvre la brèche vers l'extérieur.
   * Défaut : 5
   */
  SEGMENT_HP: 3,

  /**
   * Couleurs néon ultra-captivantes d'affaiblissement des briques selon leurs HP restants :
   * - HP 5 (100%) : Violet Cyberpunk néon (#b026ff) - Bouclier énergétique royal
   * - HP 4 (80%)  : Cyan Électrique néon (#00f0ff) - Haute résonance
   * - HP 3 (60%)  : Vert Laser néon (#00ff88) - Surcharge d'énergie
   * - HP 2 (40%)  : Jaune Solaire néon (#ffcc00) - Fissures incandescentes
   * - HP 1 (20%)  : Crimson / Rose Fluo néon (#ff0055) - Rupture critique (1 coup restant !)
   */
  BRICK_HP_COLORS: {
    5: { stroke: '#b026ff', glow: 'rgba(176, 38, 255, 0.95)', width: 14 },
    4: { stroke: '#00f0ff', glow: 'rgba(0, 240, 255, 0.95)', width: 13 },
    3: { stroke: '#00ff88', glow: 'rgba(0, 255, 136, 0.95)', width: 12 },
    2: { stroke: '#ffcc00', glow: 'rgba(255, 204, 0, 0.95)', width: 10 },
    1: { stroke: '#ff0055', glow: 'rgba(255, 0, 85, 1.0)', width: 8 }
  },

  /**
   * Vitesse de rotation continue de l'arène (en radians par seconde).
   * Fait tourner le cercle sur lui-même pour varier les points d'impact et faire voyager les brèches.
   * Ex : 0.35 rad/s correspond à un tour complet en environ 18s.
   * Défaut : 0.35
   */
  ARENA_ROTATION_SPEED: 0.35,

  // ---------------------------------------------------------------------------
  // 3. DÉFI CHRONOMÉTRÉ & ÉVASION (30 SECONDES)
  // ---------------------------------------------------------------------------

  /**
   * Titre accrocheur affiché en haut de l'écran en anglais (mode défi).
   * Défaut : "CAN THE BALL ESCAPE IN 30s?"
   */
  CHALLENGE_TITLE: "CAN THE BALL ESCAPE IN 30s?",

  /**
   * Durée du compte à rebours en secondes.
   * Le chronomètre descend seconde par seconde (30, 29, 28...).
   * Défaut : 3030
   */
  CHALLENGE_TIME_LIMIT: 45,

  /**
   * Temps en secondes pendant lequel la bille continue sa trajectoire avant que l'écran ne se fige.
   * Défaut : 1.0 (l'écran se fige exactement 1 seconde après que la balle a quitté le cercle)
   */
  FREEZE_DELAY_AFTER_ESCAPE: 1.0,

  /**
   * Nombre d'étincelles propulsées lors de l'évasion réussie.
   * Défaut : 180
   */
  CONFETTI_COUNT: 180,

  // ---------------------------------------------------------------------------
  // 4. AUDIO PROCÉDURAL
  // ---------------------------------------------------------------------------

  /**
   * Fréquence de base (en Hertz) du son de rebond initial.
   * 220 Hz = Note La3 (A3).
   * Défaut : 220
   */
  AUDIO_BASE_FREQ: 220,

  /**
   * Volume maître par défaut (0.0 à 1.0).
   * Défaut : 0.45
   */
  AUDIO_MASTER_VOLUME: 0.45,

  // ---------------------------------------------------------------------------
  // 5. BALLES SECONDAIRES & APPARITION DYNAMIQUE
  // ---------------------------------------------------------------------------

  /**
   * Nombre de balles secondaires au départ de la partie.
   * Défaut : 0 (aucune balle au début comme demandé)
   */
  INITIAL_SECONDARY_BALLS_COUNT: 0,

  /**
   * À chaque collision de la balle principale contre une brique :
   * Une nouvelle balle secondaire apparaît au centre et part dans une direction aléatoire !
   * Défaut : true
   */
  SPAWN_SECONDARY_BALL_ON_BRICK_HIT: true,

  /**
   * Nombre maximum de balles secondaires simultanées dans l'arène (maintien 60 FPS).
   * Défaut : 40
   */
  MAX_SECONDARY_BALLS: 8,

  /**
   * Tailles minimale et maximale aléatoires des balles secondaires générées.
   */
  SECONDARY_BALL_MIN_RADIUS: 7,
  SECONDARY_BALL_MAX_RADIUS: 9,

  /**
   * Vitesses minimale et maximale aléatoires des balles secondaires générées.
   */
  SECONDARY_BALL_MIN_SPEED: 50,
  SECONDARY_BALL_MAX_SPEED: 66,

  /**
   * Palette de couleurs néon éclatantes aléatoires attribuées aux balles secondaires.
   */
  SECONDARY_BALL_COLORS: [
    /*'#ff007f', // Rose néon
    '#00ffcc', // Cyan électrique
    '#ffaa00', // Ambre / Or
    '#9900ff', // Violet électrique
    '#00ff66', // Vert fluo
    '#ff2200', // Rouge vif
    '#00bfff', // Bleu laser
    '#ffe600',  // Jaune néon*/
    '#000000'
  ],

  /**
   * Si vrai, percuter une balle secondaire incrémente le compteur de rebonds.
   * Défaut : true
   */
  SECONDARY_BALL_COUNTS_AS_BOUNCE: false,

  /**
   * Multiplicateur de vitesse lors d'un rebond sur une balle secondaire.
   * La vitesse de la balle principale est GARANTIE de ne JAMAIS diminuer (>= vitesse avant impact).
   * Valeur par défaut : 1.04 (+4% d'accélération)
   */
  SECONDARY_BALL_BOUNCE_MULTIPLIER: 1.04,

  /**
   * Définit si les billes secondaires peuvent s'échapper du cercle par les briques disparues.
   * - true  : Les billes secondaires traversent les brèches et sortent du cercle.
   * - false : Les billes secondaires restent toujours confinées à l'intérieur du cercle.
   * Défaut : true
   */
  SECONDARY_BALLS_CAN_ESCAPE: true,

  // ---------------------------------------------------------------------------
  // 6. EFFET DE TREMBLEMENT D'ÉCRAN (SCREEN SHAKE)
  // ---------------------------------------------------------------------------

  /**
   * Active ou désactive l'effet de secousse de l'écran lors des impacts.
   * Défaut : true (mettre à false pour supprimer totalement les tremblements)
   */
  SCREEN_SHAKE_ENABLED: true,

  /**
   * Multiplicateur d'intensité du tremblement (0.0 = aucun, 0.25 = subtil, 1.0 = fort).
   * Grandement diminué pour un confort visuel optimal sans vibrations excessives.
   * Défaut : 0.25
   */
  SCREEN_SHAKE_INTENSITY: 0.15,

  /**
   * Plafond maximal de secousse en pixels.
   * Empêche l'écran de trembler violemment même à très haute vitesse.
   * Défaut : 3.0
   */
  SCREEN_SHAKE_MAX: 3.0,

  /**
   * Vitesse d'atténuation du tremblement (décroissance par seconde).
   * Plus cette valeur est élevée, plus le tremblement s'arrête vite après un impact.
   * Défaut : 18.0
   */
  SCREEN_SHAKE_DECAY: 18.0
};

// Dimensions de l'espace logique de référence (Ratio 9:16)
const VIRTUAL_WIDTH = 540;
const VIRTUAL_HEIGHT = 960;
const CENTER_X = VIRTUAL_WIDTH / 2;
const CENTER_Y = VIRTUAL_HEIGHT / 2;
