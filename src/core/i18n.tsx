import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'fr' | 'en';

export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  getGameMeta: (gameId: string) => {
    name: string;
    shortDescription: string;
    description: string;
    badge?: string;
    tags?: string[];
  };
  getFieldMeta: (fieldId: string) => {
    label?: string;
    description?: string;
  };
  getDefaultTexts: (gameId: string, lang: Language) => Record<string, string>;
}

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  fr: {
    // Top Bar & Navigation
    'app.hub_home': 'ACCUEIL HUB',
    'app.settings': 'Paramètres',
    'app.hub_short': 'Hub',
    'app.tagline': 'Laboratoire de mini-jeux physiques satisfaisants',
    'app.format_badge': 'Format 9:16 Shorts/TikTok',
    'app.audio_badge': 'Web Audio Procédural',

    // Hub
    'hub.hero_badge': '{count} Expériences Physiques Disponibles',
    'hub.hero_title_1': 'Mini-Jeux Physiques & ',
    'hub.hero_title_2': 'Oddly Satisfying',
    'hub.hero_desc': 'Choisis une simulation ci-dessous pour lancer la physique en direct à 60 FPS. Personnalise chaque paramètre physique, visuel et textuel en temps réel pour tes vidéos ou pour le plaisir des yeux.',
    'hub.play_btn': 'Lancer la simulation',
    'hub.feature1_title': 'Format 9:16 Vertical',
    'hub.feature1_desc': 'Rendu parfait et centré, prêt pour l’enregistrement vidéo Shorts, TikTok et Reels.',
    'hub.feature2_title': 'Audio 100% Procédural',
    'hub.feature2_desc': 'Synthèse sonore dynamique en temps réel via Web Audio API. Zéro fichier audio lourd.',
    'hub.feature3_title': 'Contrôle Total en Direct',
    'hub.feature3_desc': 'Ajustez gravité, rebonds, nombres de billes et tous les textes à l’écran sans recharger.',
    'hub.footer': 'SatisfyLab • simulations physiques 60 FPS • Raccourcis : [R] Relancer • [M] Son • [Espace] Jouer • [V] Enregistrer',

    // Viewport Controls & Recorder
    'viewport.reset_title': 'Relancer (R)',
    'viewport.rec_idle_title': 'Enregistrer clip 9:16 vertical (V)',
    'viewport.rec_active_title': "Arrêter l'enregistrement et télécharger la vidéo (V)",
    'viewport.mute_title': 'Muet / Son (M)',
    'viewport.fullscreen_title': 'Plein écran (F)',
    'viewport.rec_badge': 'REC 9:16',
    'viewport.click_to_play': 'Clique ou Appuie pour Jouer',

    // Recorder notifications
    'recorder.not_supported': '⚠️ Capture vidéo non supportée par votre navigateur',
    'recorder.canvas_not_found': '⚠️ Canvas introuvable pour la capture',
    'recorder.started': '● Enregistrement 9:16 démarré (Touche V pour stopper)',
    'recorder.exported': '✓ Vidéo 9:16 exportée avec succès !',
    'recorder.failed': "⚠️ Échec de lancement de l'enregistrement",

    // Settings Panel
    'settings.back_to_hub': 'RETOUR AU HUB',
    'settings.current_game': 'Jeu en cours',
    'settings.view_all': 'Voir tout',
    'settings.title': 'Paramètres en Direct',
    'settings.subtitle': 'Mise à jour 60 FPS',
    'settings.reset_all': 'Réinitialiser les paramètres',

    // Tabs
    'tabs.all': 'Tous',
    'tabs.gameplay': 'Jeu',
    'tabs.physics': 'Physique',
    'tabs.visuals': 'Visuels',
    'tabs.texts': 'Textes'
  },
  en: {
    // Top Bar & Navigation
    'app.hub_home': 'HUB HOME',
    'app.settings': 'Settings',
    'app.hub_short': 'Hub',
    'app.tagline': 'Satisfying physics mini-game laboratory',
    'app.format_badge': '9:16 Shorts/TikTok Format',
    'app.audio_badge': 'Procedural Web Audio',

    // Hub
    'hub.hero_badge': '{count} Physics Experiences Available',
    'hub.hero_title_1': 'Physics Mini-Games & ',
    'hub.hero_title_2': 'Oddly Satisfying',
    'hub.hero_desc': 'Choose a simulation below to launch 60 FPS live physics. Customize every physics, visual and text setting in real time for your videos or pure visual pleasure.',
    'hub.play_btn': 'Launch simulation',
    'hub.feature1_title': 'Vertical 9:16 Format',
    'hub.feature1_desc': 'Pixel-perfect centered rendering, ready for Shorts, TikTok and Reels video recording.',
    'hub.feature2_title': '100% Procedural Audio',
    'hub.feature2_desc': 'Real-time dynamic sound synthesis via Web Audio API. Zero heavy audio assets.',
    'hub.feature3_title': 'Total Live Control',
    'hub.feature3_desc': 'Adjust gravity, bounces, ball count and all on-screen text without reloading.',
    'hub.footer': 'SatisfyLab • 60 FPS physics simulations • Shortcuts: [R] Restart • [M] Sound • [Space] Play • [V] Record',

    // Viewport Controls & Recorder
    'viewport.reset_title': 'Restart (R)',
    'viewport.rec_idle_title': 'Record vertical 9:16 clip (V)',
    'viewport.rec_active_title': 'Stop recording and download video (V)',
    'viewport.mute_title': 'Mute / Unmute (M)',
    'viewport.fullscreen_title': 'Fullscreen (F)',
    'viewport.rec_badge': 'REC 9:16',
    'viewport.click_to_play': 'Click or Tap to Play',

    // Recorder notifications
    'recorder.not_supported': '⚠️ Video capture not supported by your browser',
    'recorder.canvas_not_found': '⚠️ Canvas not found for capture',
    'recorder.started': '● 9:16 recording started (Press V to stop)',
    'recorder.exported': '✓ 9:16 video exported successfully!',
    'recorder.failed': '⚠️ Failed to start recording',

    // Settings Panel
    'settings.back_to_hub': 'BACK TO HUB',
    'settings.current_game': 'Current Game',
    'settings.view_all': 'View all',
    'settings.title': 'Live Settings',
    'settings.subtitle': '60 FPS Real-time update',
    'settings.reset_all': 'Reset settings',

    // Tabs
    'tabs.all': 'All',
    'tabs.gameplay': 'Gameplay',
    'tabs.physics': 'Physics',
    'tabs.visuals': 'Visuals',
    'tabs.texts': 'Texts'
  }
};

export const GAME_METADATA_TRANSLATIONS: Record<string, Record<Language, {
  name: string;
  shortDescription: string;
  description: string;
  badge?: string;
  tags?: string[];
}>> = {
  'ball-escape': {
    fr: {
      name: 'Ball Escape 30s',
      shortDescription: 'Défi chrono dans une arène circulaire en rotation avec briques destructibles.',
      description: 'Une bille lancée au cœur d’une arène circulaire fermée accélère à chaque rebond contre les parois. Brisez les briques d’arc pour ouvrir une brèche et tentez de vous évader avant la fin du temps imparti. Sons de montée harmonique et climax en bullet time.',
      badge: 'Populaire',
      tags: ['Arène 360°', 'Accélération exponentielle', 'Bullet Time', 'Sons harmoniques']
    },
    en: {
      name: 'Ball Escape 30s',
      shortDescription: 'Timed challenge in a rotating circular arena with breakable bricks.',
      description: 'A ball launched inside a closed circular arena accelerates with each wall bounce. Break arc bricks to create an escape opening before time runs out. Harmonic rising audio and bullet time climax.',
      badge: 'Popular',
      tags: ['360° Arena', 'Exponential Acceleration', 'Bullet Time', 'Harmonic Sounds']
    }
  },
  'merge-drop': {
    fr: {
      name: 'Neon & Solar Merge Drop',
      shortDescription: 'Fusion de billes physique type Suika avec skins Néon ou Planètes.',
      description: 'Lâchez des sphères dans une jarre en verre néon. Lorsqu’elles se touchent, elles fusionnent en un palier supérieur jusqu’au grand Soleil central. Mode rafale automatique pour un spectacle ultra satisfaisant.',
      badge: 'Satisfaisant',
      tags: ['Physique Suika', 'Skin Système Solaire', 'Effets Cosmiques', 'Mode Rafale']
    },
    en: {
      name: 'Neon & Solar Merge Drop',
      shortDescription: 'Suika-style physical ball merge with Neon or Planet skins.',
      description: 'Drop spheres into a glowing neon glass jar. When matching tiers touch, they merge into the next tier up to the giant central Sun. Automatic stream mode for an ultra-satisfying spectacle.',
      badge: 'Satisfying',
      tags: ['Suika Physics', 'Solar System Skin', 'Cosmic Effects', 'Stream Mode']
    }
  },
  'ball-duel': {
    fr: {
      name: 'Ball Duel - Gauche vs Droite',
      shortDescription: 'Duel de destruction de barres horizontales avec améliorations exponentielles.',
      description: 'Deux camps s’affrontent en parallèle pour briser un mur de barres horizontales blindées. Chaque barre détruite offre un multiplicateur ou une amélioration d’attaque aux billes de son camp. Première équipe à percer le fond gagne le duel.',
      badge: 'Compétitif',
      tags: ['Deux Colonnes', 'Brise-Briques HP', 'Multiplicateurs x2/x3', 'Balle Tranchante']
    },
    en: {
      name: 'Ball Duel - Left vs Right',
      shortDescription: 'Horizontal bar destruction duel with exponential upgrades.',
      description: 'Two teams compete side-by-side to break reinforced horizontal bars. Each broken bar grants a multiplier or attack upgrade to the team\'s balls. First side to pierce through wins the duel.',
      badge: 'Competitive',
      tags: ['Dual Columns', 'Breakable HP Bars', 'Multipliers x2/x3', 'Sharp Ball']
    }
  },
  'territory-war': {
    fr: {
      name: 'Territory War - Cyan vs Rose',
      shortDescription: 'Bataille de conquête de grille 100% autonome inspirée de Day vs Night.',
      description: 'Deux billes rivales rebondissent à toute allure dans une grille 2D. Chaque impact convertit les tuiles adverses à sa couleur. Mode Overdrive, renforts et K.O. final magnétique garantissent une victoire à 100.0% spectaculaire.',
      badge: 'Nouveau',
      tags: ['Day vs Night', 'Conquête de Tuiles', 'Mode Overdrive', 'K.O. Garanti 100%']
    },
    en: {
      name: 'Territory War - Cyan vs Pink',
      shortDescription: 'Autonomous grid conquest battle inspired by Day vs Night.',
      description: 'Two rival balls bounce at high speed across a 2D grid. Each impact converts opponent tiles to its team color. Overdrive mode, reinforcements and final magnetic K.O. ensure a spectacular 100.0% victory.',
      badge: 'New',
      tags: ['Day vs Night', 'Tile Conquest', 'Overdrive Mode', 'Guaranteed 100% K.O.']
    }
  }
};

export const FIELD_METADATA_TRANSLATIONS: Record<string, Record<Language, { label: string; description?: string }>> = {
  // --- Global / Physics ---
  GRAVITY: {
    fr: { label: 'Gravité', description: 'Intensité de la pesanteur vers le bas.' },
    en: { label: 'Gravity', description: 'Downward gravitational pull strength.' }
  },
  INITIAL_SPEED: {
    fr: { label: 'Vitesse initiale', description: 'Vitesse de départ des billes.' },
    en: { label: 'Initial Speed', description: 'Starting velocity of the balls.' }
  },
  MAX_SPEED: {
    fr: { label: 'Vitesse maximale', description: 'Plafond absolu de vitesse.' },
    en: { label: 'Maximum Speed', description: 'Absolute maximum velocity cap.' }
  },
  BALL_RADIUS: {
    fr: { label: 'Rayon de la bille', description: 'Taille physique de la sphère.' },
    en: { label: 'Ball Radius', description: 'Physical radius of the sphere.' }
  },
  BOUNCE_SPEED_MULTIPLIER: {
    fr: { label: 'Multiplicateur de rebond', description: 'Gain de vitesse à chaque collision.' },
    en: { label: 'Bounce Multiplier', description: 'Speed gain multiplier on each bounce.' }
  },
  SCREEN_SHAKE_ENABLED: {
    fr: { label: 'Tremblement d\'écran', description: 'Secousse visuelle de la caméra lors des gros impacts.' },
    en: { label: 'Screen Shake', description: 'Visual camera shake during heavy impacts.' }
  },

  // --- Ball Escape ---
  CHALLENGE_TIME_LIMIT: {
    fr: { label: 'Chronomètre Défi (secondes)', description: 'Durée limite pour que la bille s\'évade.' },
    en: { label: 'Challenge Timer (seconds)', description: 'Time limit for the ball to escape.' }
  },
  ARENA_ROTATION_SPEED: {
    fr: { label: 'Vitesse de rotation de l\'arène', description: 'Vitesse angulaire de l\'anneau.' },
    en: { label: 'Arena Rotation Speed', description: 'Angular rotation speed of the arena ring.' }
  },
  SEGMENT_HP: {
    fr: { label: 'Points de vie par brique (HP)', description: 'Rebonds nécessaires pour détruire une brique.' },
    en: { label: 'HP per Brick', description: 'Hits needed to destroy an arena brick.' }
  },
  TOTAL_WALL_SEGMENTS: {
    fr: { label: 'Nombre total de briques', description: 'Découpage circulaire de l\'anneau.' },
    en: { label: 'Total Wall Bricks', description: 'Number of brick segments around the ring.' }
  },
  CIRCLE_RADIUS: {
    fr: { label: 'Rayon de l\'arène', description: 'Diamètre intérieur de l\'enceinte.' },
    en: { label: 'Arena Radius', description: 'Inner radius of the circular arena.' }
  },
  SECONDARY_BALLS_CAN_ESCAPE: {
    fr: { label: 'Billes bonus peuvent sortir', description: 'Permet aux billes secondaires de s\'échapper.' },
    en: { label: 'Bonus Balls Can Escape', description: 'Allows secondary balls to exit through gaps.' }
  },
  SPAWN_SECONDARY_BALL_ON_BRICK_HIT: {
    fr: { label: 'Apparition de billes bonus', description: 'Fait apparaître de petites billes aux impacts.' },
    en: { label: 'Spawn Bonus Balls', description: 'Spawns small extra balls on brick impacts.' }
  },
  MAX_SECONDARY_BALLS: {
    fr: { label: 'Nombre max de billes bonus', description: 'Limite de billes secondaires en jeu.' },
    en: { label: 'Max Bonus Balls', description: 'Maximum secondary balls in the arena.' }
  },

  // --- Merge Drop ---
  SKIN_THEME: {
    fr: { label: 'Thème Visuel', description: 'Billes Néon Minimalistes ou Planètes du Système Solaire.' },
    en: { label: 'Visual Theme', description: 'Minimalist Neon or Solar System Planets.' }
  },
  BASE_BALL_RADIUS: {
    fr: { label: 'Taille bille minimum (base)', description: 'Rayon de la plus petite bille (niveau 0). Toutes les autres sphères s\'adaptent proportionnellement.' },
    en: { label: 'Minimum Ball Size (base)', description: 'Base radius of the smallest ball (Tier 0). All other spheres scale proportionally.' }
  },
  AUTO_STREAM_ACTIVE: {
    fr: { label: 'Lancage Automatique (Niveau 1)', description: 'Lâche des billes niveau 1 en continu dans le tube jusqu’à arrêt.' },
    en: { label: 'Continuous Auto Stream (Tier 1)', description: 'Automatically drops Tier 1 balls continuously into the tube until stopped.' }
  },
  AUTO_STREAM_RATE: {
    fr: { label: 'Cadence de tir (billes/s)', description: 'Nombre de billes lâchées par seconde en mode automatique.' },
    en: { label: 'Stream Fire Rate (balls/s)', description: 'Number of balls dropped per second in auto stream mode.' }
  },
  SPAWN_MAX_TIER: {
    fr: { label: 'Niveau max des boules (manuel)', description: 'Palier maximal pour les boules lâchées manuellement.' },
    en: { label: 'Max Spawn Tier (manual)', description: 'Maximum tier for manually dropped balls.' }
  },
  RESTITUTION: {
    fr: { label: 'Élasticité des rebonds', description: 'Rebondissement lors des contacts.' },
    en: { label: 'Bounce Elasticity', description: 'Restitution coefficient on impacts.' }
  },
  FRICTION: {
    fr: { label: 'Friction des billes', description: 'Frottement entre les sphères.' },
    en: { label: 'Friction', description: 'Friction between rolling spheres.' }
  },
  AUTO_STREAM_DELAY_MS: {
    fr: { label: 'Cadence de la rafale (ms)', description: 'Délai entre deux lâchers automatiques.' },
    en: { label: 'Stream Rate (ms)', description: 'Delay between automatic ball drops.' }
  },
  CONTAINER_SHAPE: {
    fr: { label: 'Forme du récipient', description: 'Jarre en verre évasée ou Tube droit.' },
    en: { label: 'Container Shape', description: 'Flared Glass Jar or Straight Tube.' }
  },

  // --- Ball Duel ---
  TOTAL_BARS: {
    fr: { label: 'Nombre de barres par camp', description: 'Épaisseur du mur protecteur de chaque côté.' },
    en: { label: 'Bars per Column', description: 'Number of breakable bars on each side.' }
  },
  BAR_BASE_HP: {
    fr: { label: 'Points de vie de base (HP)', description: 'Solidité initiale de chaque barre.' },
    en: { label: 'Base Bar HP', description: 'Initial durability of each horizontal bar.' }
  },
  LEFT_INITIAL_BALLS: {
    fr: { label: 'Billes départ GAUCHE', description: 'Quantité de billes initiales pour l\'équipe gauche.' },
    en: { label: 'LEFT Starting Balls', description: 'Initial ball count for left team.' }
  },
  RIGHT_INITIAL_BALLS: {
    fr: { label: 'Billes départ DROITE', description: 'Quantité de billes initiales pour l\'équipe droite.' },
    en: { label: 'RIGHT Starting Balls', description: 'Initial ball count for right team.' }
  },
  LEFT_UPGRADE_MODE: {
    fr: { label: 'Amélioration GAUCHE', description: 'Effet bonus obtenu par la gauche lors d\'une destruction.' },
    en: { label: 'LEFT Upgrade Mode', description: 'Bonus effect granted to left side on bar destruction.' }
  },
  RIGHT_UPGRADE_MODE: {
    fr: { label: 'Amélioration DROITE', description: 'Effet bonus obtenu par la droite lors d\'une destruction.' },
    en: { label: 'RIGHT Upgrade Mode', description: 'Bonus effect granted to right side on bar destruction.' }
  },
  LEFT_UPGRADE_TARGET: {
    fr: { label: 'Cible Amélioration GAUCHE', description: 'Améliore le nombre de billes ou les dégâts d\'impact.' },
    en: { label: 'LEFT Upgrade Target', description: 'Upgrades ball count or impact damage.' }
  },
  RIGHT_UPGRADE_TARGET: {
    fr: { label: 'Cible Amélioration DROITE', description: 'Améliore le nombre de billes ou les dégâts d\'impact.' },
    en: { label: 'RIGHT Upgrade Target', description: 'Upgrades ball count or impact damage.' }
  },

  // --- Territory War ---
  GRID_COLS: {
    fr: { label: 'Nombre de colonnes', description: 'Résolution horizontale de la grille.' },
    en: { label: 'Grid Columns', description: 'Horizontal resolution of the territory grid.' }
  },
  GRID_ROWS: {
    fr: { label: 'Nombre de lignes', description: 'Résolution verticale de la grille.' },
    en: { label: 'Grid Rows', description: 'Vertical resolution of the territory grid.' }
  },
  BALLS_PER_TEAM: {
    fr: { label: 'Billes par équipe', description: 'Nombre de billes conquérantes par camp au départ.' },
    en: { label: 'Balls per Team', description: 'Starting conquering balls per team.' }
  },
  OVERDRIVE_THRESHOLD: {
    fr: { label: 'Seuil d\'Overdrive (%)', description: 'Pourcentage de domination déclenchant le boost de vitesse.' },
    en: { label: 'Overdrive Threshold (%)', description: 'Domination percentage triggering speed & splash boosts.' }
  },
  KNOCKOUT_THRESHOLD: {
    fr: { label: 'Seuil d\'élimination K.O. (%)', description: 'Pourcentage critique provoquant l\'explosion du camp vaincu.' },
    en: { label: 'K.O. Elimination Threshold (%)', description: 'Critical territory percentage triggering final magnetic K.O.' }
  },

  // --- Text Fields ---
  TEXT_TITLE: {
    fr: { label: 'Titre affiché en haut', description: 'Titre principal visible sur le Canvas et dans la vidéo.' },
    en: { label: 'Top Display Title', description: 'Main title drawn on the Canvas and in the video.' }
  },
  TEXT_METRIC_TIME: {
    fr: { label: 'Libellé Chronomètre', description: 'Texte au-dessus du temps restant.' },
    en: { label: 'Timer Label', description: 'Text label above remaining time.' }
  },
  TEXT_METRIC_BOUNCES: {
    fr: { label: 'Libellé Rebonds', description: 'Texte au-dessus du compteur de rebonds.' },
    en: { label: 'Bounces Label', description: 'Text label above bounce counter.' }
  },
  TEXT_STATUS_START: {
    fr: { label: 'Message de Départ', description: 'Consigne affichée avant de démarrer.' },
    en: { label: 'Start Message', description: 'Prompt displayed before starting.' }
  },
  TEXT_STATUS_ESCAPE: {
    fr: { label: 'Message d\'Évasion', description: 'Message affiché lors de l\'évasion.' },
    en: { label: 'Escape Message', description: 'Message displayed upon escape.' }
  },
  TEXT_STATUS_WIN: {
    fr: { label: 'Message de Victoire', description: 'Message de célébration finale.' },
    en: { label: 'Victory Message', description: 'Final victory celebration message.' }
  },
  TEXT_STATUS_LOSS: {
    fr: { label: 'Message Temps Écoulé', description: 'Message affiché si le temps est écoulé.' },
    en: { label: 'Time\'s Up Message', description: 'Message displayed when time limit expires.' }
  },
  TEXT_METRIC_SCORE: {
    fr: { label: 'Libellé du Score', description: 'Texte au-dessus du score.' },
    en: { label: 'Score Label', description: 'Text label above the score counter.' }
  },
  TEXT_METRIC_MAX_TIER: {
    fr: { label: 'Libellé Palier Max', description: 'Texte au-dessus du palier maximal atteint.' },
    en: { label: 'Max Tier Label', description: 'Text label above max tier reached.' }
  },
  TEXT_STATUS_VICTORY: {
    fr: { label: 'Message Victoire Cosmique', description: 'Message célébrant l\'apparition du Soleil.' },
    en: { label: 'Cosmic Victory Message', description: 'Message celebrating Sun creation.' }
  },
  TEXT_ACTION_STREAM_START: {
    fr: { label: 'Bouton Lancer Rafale', description: 'Texte du bouton d\'action rafale continue.' },
    en: { label: 'Start Stream Button', description: 'Text on continuous stream button.' }
  },
  TEXT_ACTION_STREAM_STOP: {
    fr: { label: 'Bouton Arrêter Rafale', description: 'Texte du bouton d\'arrêt de rafale.' },
    en: { label: 'Stop Stream Button', description: 'Text on stream stop button.' }
  },
  TEXT_LABEL_LEFT: {
    fr: { label: 'Nom Camp Gauche', description: 'Nom de l\'équipe bleue / gauche.' },
    en: { label: 'Left Team Name', description: 'Name of the blue / left team.' }
  },
  TEXT_LABEL_RIGHT: {
    fr: { label: 'Nom Camp Droit', description: 'Nom de l\'équipe rouge / droite.' },
    en: { label: 'Right Team Name', description: 'Name of the red / right team.' }
  },
  TEXT_START_PROMPT: {
    fr: { label: 'Message d\'invitation', description: 'Texte invitant à cliquer pour commencer.' },
    en: { label: 'Start Prompt', description: 'Text prompting player to click to start.' }
  },
  TEXT_WIN_LEFT: {
    fr: { label: 'Victoire Gauche', description: 'Bannière de victoire pour le camp gauche.' },
    en: { label: 'Left Victory', description: 'Victory banner for left side.' }
  },
  TEXT_WIN_RIGHT: {
    fr: { label: 'Victoire Droite', description: 'Bannière de victoire pour le camp droit.' },
    en: { label: 'Right Victory', description: 'Victory banner for right side.' }
  },
  TEXT_TEAM_A: {
    fr: { label: 'Nom Équipe A (Cyan)', description: 'Nom affiché pour l\'équipe Cyan.' },
    en: { label: 'Team A Name (Cyan)', description: 'Name displayed for Cyan team.' }
  },
  TEXT_TEAM_B: {
    fr: { label: 'Nom Équipe B (Rose)', description: 'Nom affiché pour l\'équipe Rose.' },
    en: { label: 'Team B Name (Pink)', description: 'Name displayed for Pink team.' }
  },
  TEXT_WIN_A: {
    fr: { label: 'Victoire Équipe A', description: 'Message de victoire à 100% pour l\'équipe Cyan.' },
    en: { label: 'Team A Victory', description: '100% conquest victory message for Cyan team.' }
  },
  TEXT_WIN_B: {
    fr: { label: 'Victoire Équipe B', description: 'Message de victoire à 100% pour l\'équipe Rose.' },
    en: { label: 'Team B Victory', description: '100% conquest victory message for Pink team.' }
  }
};

export const GAME_DEFAULT_TEXTS: Record<string, Record<Language, Record<string, string>>> = {
  'ball-escape': {
    fr: {
      TEXT_TITLE: "CAN THE BALL ESCAPE IN 30s?",
      TEXT_METRIC_TIME: "TEMPS RESTANT",
      TEXT_METRIC_BOUNCES: "REBONDS",
      TEXT_STATUS_START: "Clique pour démarrer",
      TEXT_STATUS_ESCAPE: "Évasion réussie !",
      TEXT_STATUS_WIN: "VICTOIRE !",
      TEXT_STATUS_LOSS: "TEMPS ÉCOULÉ !"
    },
    en: {
      TEXT_TITLE: "CAN THE BALL ESCAPE IN 30s?",
      TEXT_METRIC_TIME: "TIME LEFT",
      TEXT_METRIC_BOUNCES: "BOUNCES",
      TEXT_STATUS_START: "Click to start",
      TEXT_STATUS_ESCAPE: "Escape successful!",
      TEXT_STATUS_WIN: "VICTORY!",
      TEXT_STATUS_LOSS: "TIME'S UP!"
    }
  },
  'merge-drop': {
    fr: {
      TEXT_TITLE: "🪐 SYSTÈME SOLAIRE",
      TEXT_METRIC_SCORE: "SCORE",
      TEXT_METRIC_MAX_TIER: "PLANÈTE MAX",
      TEXT_STATUS_VICTORY: "☀️ SOLEIL CRÉÉ ! VICTOIRE COSMIQUE ☀️",
      TEXT_ACTION_STREAM_START: "LANCER RAFALE NIVEAU 1",
      TEXT_ACTION_STREAM_STOP: "ARRÊTER RAFALE NIVEAU 1"
    },
    en: {
      TEXT_TITLE: "🪐 SOLAR SYSTEM",
      TEXT_METRIC_SCORE: "SCORE",
      TEXT_METRIC_MAX_TIER: "MAX PLANET",
      TEXT_STATUS_VICTORY: "☀️ SUN CREATED! COSMIC VICTORY ☀️",
      TEXT_ACTION_STREAM_START: "START LEVEL 1 STREAM",
      TEXT_ACTION_STREAM_STOP: "STOP LEVEL 1 STREAM"
    }
  },
  'ball-duel': {
    fr: {
      TEXT_TITLE: "⚔️ GAUCHE VS DROITE ⚔️",
      TEXT_LABEL_LEFT: "GAUCHE",
      TEXT_LABEL_RIGHT: "DROITE",
      TEXT_START_PROMPT: "Clique pour lancer le duel",
      TEXT_WIN_LEFT: "🏆 VICTOIRE GAUCHE ! 🏆",
      TEXT_WIN_RIGHT: "🏆 VICTOIRE DROITE ! 🏆"
    },
    en: {
      TEXT_TITLE: "⚔️ LEFT VS RIGHT ⚔️",
      TEXT_LABEL_LEFT: "LEFT",
      TEXT_LABEL_RIGHT: "RIGHT",
      TEXT_START_PROMPT: "Click to start duel",
      TEXT_WIN_LEFT: "🏆 LEFT VICTORY! 🏆",
      TEXT_WIN_RIGHT: "🏆 RIGHT VICTORY! 🏆"
    }
  },
  'territory-war': {
    fr: {
      TEXT_TITLE: "⚔️ GUERRE DE TERRITOIRE ⚔️",
      TEXT_TEAM_A: "CYAN",
      TEXT_TEAM_B: "ROSE",
      TEXT_WIN_A: "🏆 VICTOIRE CYAN (100%) ! 🏆",
      TEXT_WIN_B: "🏆 VICTOIRE ROSE (100%) ! 🏆",
      TEXT_START_PROMPT: "Clique pour lancer la conquête"
    },
    en: {
      TEXT_TITLE: "⚔️ TERRITORY WAR ⚔️",
      TEXT_TEAM_A: "CYAN",
      TEXT_TEAM_B: "PINK",
      TEXT_WIN_A: "🏆 CYAN VICTORY (100%)! 🏆",
      TEXT_WIN_B: "🏆 PINK VICTORY (100%)! 🏆",
      TEXT_START_PROMPT: "Click to start conquest"
    }
  }
};

const I18nContext = createContext<I18nContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('arcade_hub_lang');
      if (saved === 'fr' || saved === 'en') return saved;
    } catch (_) {}
    return 'fr';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('arcade_hub_lang', lang);
    } catch (_) {}
  };

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.fr;
    let text = dict[key] || TRANSLATIONS.fr[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return text;
  };

  const getGameMeta = (gameId: string) => {
    const game = GAME_METADATA_TRANSLATIONS[gameId];
    if (game && game[language]) {
      return game[language];
    }
    if (game && game.fr) {
      return game.fr;
    }
    return {
      name: gameId,
      shortDescription: '',
      description: ''
    };
  };

  const getFieldMeta = (fieldId: string) => {
    const field = FIELD_METADATA_TRANSLATIONS[fieldId];
    if (field && field[language]) {
      return field[language];
    }
    if (field && field.fr) {
      return field.fr;
    }
    return {};
  };

  const getDefaultTexts = (gameId: string, lang: Language) => {
    const entry = GAME_DEFAULT_TEXTS[gameId];
    if (entry && entry[lang]) {
      return entry[lang];
    }
    return {};
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        getGameMeta,
        getFieldMeta,
        getDefaultTexts
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export function useLanguage(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}

