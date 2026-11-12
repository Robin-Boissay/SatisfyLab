import { ConfigSchema } from '../../core/types';
import { DEFAULT_BALL_ESCAPE_CONFIG } from './types';

export const ballEscapeConfigSchema: ConfigSchema = {
  // ==========================================
  // --- VISUELS, THEMES & SAFE ZONE (GAUCHE) ---
  // ==========================================
  BALL_SKIN: {
    id: 'BALL_SKIN',
    label: 'Skin de la Bille',
    type: 'select',
    category: 'visuals',
    options: [
      { label: '⚡ Néon Plasma Électrique', value: 'neon' },
      { label: '🔥 Boule de Feu / Météore', value: 'fireball' },
      { label: '🪐 Planète Cosmique', value: 'planet' },
      { label: '⚽ Balle de Tennis / Sport', value: 'sport' },
      { label: '💀 Emoji / Meme Lunettes', value: 'emoji' },
      { label: '🌈 Arc-en-Ciel Chromatique', value: 'rainbow' }
    ],
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.BALL_SKIN,
    description: 'Style graphique et aura de la bille principale.'
  },
  BALL_TRAIL_STYLE: {
    id: 'BALL_TRAIL_STYLE',
    label: 'Traînée de la Bille',
    type: 'select',
    category: 'visuals',
    options: [
      { label: '✨ Ruban Néon Lumineux', value: 'neon' },
      { label: '🔥 Flammes & Braises', value: 'fire' },
      { label: '⭐ Poussière d’Étoiles', value: 'sparkles' },
      { label: '🌈 Arc-en-Ciel Dégradé', value: 'rainbow' },
      { label: '🚫 Sans Traînée', value: 'none' }
    ],
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.BALL_TRAIL_STYLE,
    description: 'Effet visuel laissé derrière la trajectoire de la bille.'
  },
  ARENA_COLOR: {
    id: 'ARENA_COLOR',
    label: 'Couleur de l’Arène',
    type: 'select',
    category: 'visuals',
    options: [
      { label: '🌈 Arc-en-Ciel Néon 360° (Rainbow)', value: 'rainbow' },
      { label: '⚡ Cyan Électrique Fluo', value: '#00f0ff' },
      { label: '💖 Rose Néon Flash', value: '#ff007f' },
      { label: '☀️ Or Solaire Brillant', value: '#ffd700' },
      { label: '🧪 Vert Laser Fluo', value: '#00ff66' },
      { label: '🔮 Violet Cyber Néon', value: '#b026ff' },
      { label: '🤍 Blanc Pur Éclatant', value: '#ffffff' }
    ],
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.ARENA_COLOR,
    description: 'Teinte néon des parois et des anneaux de l’arène.'
  },
  BACKGROUND_COLOR: {
    id: 'BACKGROUND_COLOR',
    label: 'Couleur de Fond',
    type: 'select',
    category: 'visuals',
    options: [
      { label: '🌌 Noir Spatial Profond', value: '#06080d' },
      { label: '⬛ Noir OLED Absolu', value: '#000000' },
      { label: '🟣 Nébuleuse Cyber Sombre', value: '#0a0518' },
      { label: '🔵 Bleu Nuit Abyssal', value: '#020b18' }
    ],
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.BACKGROUND_COLOR,
    description: 'Fond sombre optimisé pour faire ressortir les néons 9:16.'
  },
  BACKGROUND_EFFECT: {
    id: 'BACKGROUND_EFFECT',
    label: 'Animation de Fond (TikTok)',
    type: 'select',
    category: 'visuals',
    options: [
      { label: '✨ Étoiles Cosmiques', value: 'cosmic-stars' },
      { label: '☀️ Rayons Célestes Rotatifs', value: 'celestial-rays' },
      { label: '👾 Grille Synthwave 3D', value: 'cyber-grid' },
      { label: '🌌 Vagues Aurore Boréale', value: 'aurora-waves' },
      { label: '🌀 Tunnel Hypnotique', value: 'hypnotic-tunnel' },
      { label: '🖤 Sans Effet (Épuré)', value: 'none' }
    ],
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.BACKGROUND_EFFECT,
    description: 'Animations d’arrière-plan captivantes pour capter l’attention des spectateurs.'
  },
  ARENA_CENTER_Y: {
    id: 'ARENA_CENTER_Y',
    label: 'Position Verticale Arène (Safe Zone)',
    type: 'range',
    category: 'visuals',
    min: 360,
    max: 560,
    step: 10,
    unit: 'px',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.ARENA_CENTER_Y,
    description: 'Permet de remonter ou descendre l’arène pour éviter la zone de description TikTok en bas.'
  },
  ARENA_STROKE_WIDTH: {
    id: 'ARENA_STROKE_WIDTH',
    label: 'Épaisseur Parois Néon',
    type: 'range',
    category: 'visuals',
    min: 2,
    max: 16,
    step: 1,
    unit: 'px',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.ARENA_STROKE_WIDTH,
    description: 'Épaisseur du tracé néon pour une lisibilité parfaite sur mobile.'
  },
  SHOW_TOP_HUD: {
    id: 'SHOW_TOP_HUD',
    label: 'Afficher le HUD Canvas',
    type: 'boolean',
    category: 'visuals',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SHOW_TOP_HUD,
    description: 'Affiche ou masque les textes en haut pour les créateurs qui ajoutent leurs stickers TikTok.'
  },
  HUD_TOP_OFFSET: {
    id: 'HUD_TOP_OFFSET',
    label: 'Décalage Bas du HUD',
    type: 'range',
    category: 'visuals',
    min: 0,
    max: 80,
    step: 5,
    unit: 'px',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.HUD_TOP_OFFSET,
    visibleIf: (values) => values.SHOW_TOP_HUD !== false,
    description: 'Descend le titre sous la barre de recherche supérieure de TikTok.'
  },
  SCREEN_SHAKE_ENABLED: {
    id: 'SCREEN_SHAKE_ENABLED',
    label: 'Secousses d’Écran',
    type: 'boolean',
    category: 'visuals',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SCREEN_SHAKE_ENABLED
  },
  SCREEN_SHAKE_INTENSITY: {
    id: 'SCREEN_SHAKE_INTENSITY',
    label: 'Intensité des Secousses',
    type: 'range',
    category: 'visuals',
    min: 0.05,
    max: 0.8,
    step: 0.05,
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SCREEN_SHAKE_INTENSITY,
    visibleIf: (values) => values.SCREEN_SHAKE_ENABLED !== false
  },
  SHOCKWAVE_ENABLED: {
    id: 'SHOCKWAVE_ENABLED',
    label: 'Cercles d’Impact (Ondes de choc)',
    type: 'boolean',
    category: 'visuals',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SHOCKWAVE_ENABLED,
    description: 'Affiche des cercles lumineux qui s’étendent à chaque impact contre une brique ou paroi.'
  },
  SHOCKWAVE_DURATION: {
    id: 'SHOCKWAVE_DURATION',
    label: 'Durée d’Apparition des Cercles',
    type: 'range',
    category: 'visuals',
    min: 0.1,
    max: 2.0,
    step: 0.05,
    unit: 's',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SHOCKWAVE_DURATION,
    visibleIf: (values) => values.SHOCKWAVE_ENABLED !== false,
    description: 'Vitesse de dissipation des ondes de choc circulaires.'
  },

  // ==========================================
  // --- AUDIO ASMR PROCÉDURAL (GAUCHE) ---
  // ==========================================
  SOUND_BOUNCE_ENABLED: {
    id: 'SOUND_BOUNCE_ENABLED',
    label: 'Activer le Son des Rebonds',
    type: 'boolean',
    category: 'audio',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SOUND_BOUNCE_ENABLED
  },
  SOUND_BOUNCE_STYLE: {
    id: 'SOUND_BOUNCE_STYLE',
    label: 'Instrument des Rebonds',
    type: 'select',
    category: 'audio',
    options: [
      { label: '🎹 Piano ASMR Doux', value: 'piano' },
      { label: '🪵 Marimba Zen (Suika ASMR)', value: 'marimba' },
      { label: '⚡ Synthétiseur Cyber Néon', value: 'synth' },
      { label: '🫧 Pop Bulle ASMR', value: 'bubbly' },
      { label: '👾 Arcade 8-Bit Chiptune', value: '8bit' }
    ],
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SOUND_BOUNCE_STYLE,
    visibleIf: (values) => values.SOUND_BOUNCE_ENABLED !== false,
    description: 'Timbre instrumental des rebonds physiques.'
  },
  SOUND_MELODY_PRESET: {
    id: 'SOUND_MELODY_PRESET',
    label: 'Mélodie Virale TikTok',
    type: 'select',
    category: 'audio',
    options: [
      { label: '🎵 Gamme Pentatonique Ascendante', value: 'pentatonic' },
      { label: '💀 Megalovania (Undertale)', value: 'megalovania' },
      { label: '⚰️ Astronomia (Coffin Dance)', value: 'coffin-dance' },
      { label: '🚀 Interstellar (Hans Zimmer)', value: 'interstellar' },
      { label: '🎼 Pour Élise (Beethoven)', value: 'fur-elise' },
      { label: '🏴‍☠️ Pirates des Caraïbes', value: 'pirates' },
      { label: '🎹 Gamme Chromatique Infinie', value: 'chromatic' }
    ],
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SOUND_MELODY_PRESET,
    visibleIf: (values) => values.SOUND_BOUNCE_ENABLED !== false,
    description: 'Chaque rebond joue la note suivante du morceau culte.'
  },
  SOUND_BOUNCE_VOLUME: {
    id: 'SOUND_BOUNCE_VOLUME',
    label: 'Volume des Rebonds',
    type: 'range',
    category: 'audio',
    min: 0.0,
    max: 1.0,
    step: 0.05,
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SOUND_BOUNCE_VOLUME,
    visibleIf: (values) => values.SOUND_BOUNCE_ENABLED !== false
  },
  SOUND_BREAK_ENABLED: {
    id: 'SOUND_BREAK_ENABLED',
    label: 'Son Destruction Briques',
    type: 'boolean',
    category: 'audio',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SOUND_BREAK_ENABLED,
    visibleIf: (values) => values.GAME_MODE === 'classic' || values.RING_GAP_MODE === 'bricks'
  },
  SOUND_BREAK_STYLE: {
    id: 'SOUND_BREAK_STYLE',
    label: 'Style de Destruction',
    type: 'select',
    category: 'audio',
    options: [
      { label: '💥 Crunch Bruit Blanc Croustillant', value: 'crunch' },
      { label: '🔮 Bris Cristallin de Verre', value: 'glass' },
      { label: '⚡ Décharge Laser Électrique', value: 'laser' },
      { label: '💣 Sub-Bass Boom Percutant', value: 'boom' }
    ],
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SOUND_BREAK_STYLE,
    visibleIf: (values) =>
      values.SOUND_BREAK_ENABLED !== false &&
      (values.GAME_MODE === 'classic' || values.RING_GAP_MODE === 'bricks'),
    description: 'Effet sonore lors de la destruction complète d’une brique d’arène.'
  },
  SOUND_BREAK_VOLUME: {
    id: 'SOUND_BREAK_VOLUME',
    label: 'Volume Destructions',
    type: 'range',
    category: 'audio',
    min: 0.0,
    max: 1.0,
    step: 0.05,
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SOUND_BREAK_VOLUME,
    visibleIf: (values) =>
      values.SOUND_BREAK_ENABLED !== false &&
      (values.GAME_MODE === 'classic' || values.RING_GAP_MODE === 'bricks')
  },
  SOUND_ESCAPE_ENABLED: {
    id: 'SOUND_ESCAPE_ENABLED',
    label: 'Son Fanfare d’Évasion',
    type: 'boolean',
    category: 'audio',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SOUND_ESCAPE_ENABLED
  },
  SOUND_ESCAPE_VOLUME: {
    id: 'SOUND_ESCAPE_VOLUME',
    label: 'Volume Évasion',
    type: 'range',
    category: 'audio',
    min: 0.0,
    max: 1.0,
    step: 0.05,
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SOUND_ESCAPE_VOLUME,
    visibleIf: (values) => values.SOUND_ESCAPE_ENABLED !== false
  },
  SOUND_PITCH_MULT: {
    id: 'SOUND_PITCH_MULT',
    label: 'Tonalité Générale',
    type: 'range',
    category: 'audio',
    min: 0.5,
    max: 1.8,
    step: 0.05,
    unit: 'x',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SOUND_PITCH_MULT,
    visibleIf: (values) => values.SOUND_BOUNCE_ENABLED !== false || values.SOUND_BREAK_ENABLED !== false,
    description: 'Tonalité plus grave (< 1.0) ou plus aiguë (> 1.0).'
  },
  SOUND_COMBO_PITCH: {
    id: 'SOUND_COMBO_PITCH',
    label: 'Montée Harmonique des Rebonds',
    type: 'boolean',
    category: 'audio',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SOUND_COMBO_PITCH,
    visibleIf: (values) => values.SOUND_BOUNCE_ENABLED !== false,
    description: 'Fait monter le pitch au fur et à mesure des rebonds successifs.'
  },

  // ==========================================
  // --- TEXTES & HUD (GAUCHE) ---
  // ==========================================
  TEXT_TITLE: {
    id: 'TEXT_TITLE',
    label: 'Titre d’Accroche TikTok',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.TEXT_TITLE,
    description: 'Phrase choc affichée en haut de l’écran pour retenir l’attention.'
  },
  TEXT_METRIC_TIME: {
    id: 'TEXT_METRIC_TIME',
    label: 'Libellé Chronomètre',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.TEXT_METRIC_TIME,
    visibleIf: (values) => values.GAME_MODE === 'classic' || values.GAME_MODE === 'ball-storm'
  },
  TEXT_METRIC_BOUNCES: {
    id: 'TEXT_METRIC_BOUNCES',
    label: 'Libellé Rebonds',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.TEXT_METRIC_BOUNCES,
    visibleIf: (values) => values.GAME_MODE !== 'duel'
  },
  TEXT_STATUS_START: {
    id: 'TEXT_STATUS_START',
    label: 'Consigne de Départ',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.TEXT_STATUS_START
  },
  TEXT_STATUS_ESCAPE: {
    id: 'TEXT_STATUS_ESCAPE',
    label: 'Message d’Évasion',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.TEXT_STATUS_ESCAPE,
    visibleIf: (values) => values.GAME_MODE !== 'duel'
  },
  TEXT_STATUS_WIN: {
    id: 'TEXT_STATUS_WIN',
    label: 'Message de Victoire',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.TEXT_STATUS_WIN
  },
  TEXT_STATUS_LOSS: {
    id: 'TEXT_STATUS_LOSS',
    label: 'Message Temps Écoulé',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.TEXT_STATUS_LOSS
  },
  DUEL_P1_LABEL: {
    id: 'DUEL_P1_LABEL',
    label: 'Nom Équipe 1 (Duel)',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.DUEL_P1_LABEL,
    visibleIf: (values) => values.GAME_MODE === 'duel'
  },
  DUEL_P2_LABEL: {
    id: 'DUEL_P2_LABEL',
    label: 'Nom Équipe 2 (Duel)',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.DUEL_P2_LABEL,
    visibleIf: (values) => values.GAME_MODE === 'duel'
  },
  DUEL_P3_LABEL: {
    id: 'DUEL_P3_LABEL',
    label: 'Nom Équipe 3 (Combat)',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.DUEL_P3_LABEL,
    visibleIf: (values) => values.GAME_MODE === 'duel' && (values.BATTLE_BALL_COUNT || 2) >= 3
  },
  DUEL_P4_LABEL: {
    id: 'DUEL_P4_LABEL',
    label: 'Nom Équipe 4 (Combat)',
    type: 'text',
    category: 'texts',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.DUEL_P4_LABEL,
    visibleIf: (values) => values.GAME_MODE === 'duel' && (values.BATTLE_BALL_COUNT || 2) >= 4
  },

  // ==========================================
  // --- GAMEPLAY & RÈGLES (DROITE) ---
  // ==========================================
  GAME_MODE: {
    id: 'GAME_MODE',
    label: 'Mode de Jeu TikTok',
    type: 'select',
    category: 'gameplay',
    options: [
      { label: '🎯 Classique (1 Anneau & Briques)', value: 'classic' },
      { label: '🌪️ Multi-Anneaux Concentriques (Poupées Russes)', value: 'multi-ring' },
      { label: '⚔️ Duel & Combat Multi-Billes (2 à 8 Joueurs)', value: 'duel' },
      { label: '💥 Tempête de Billes x2 (Chaos Absolu)', value: 'ball-storm' }
    ],
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.GAME_MODE,
    description: 'Format de la simulation pour la vidéo.'
  },
  BATTLE_BALL_COUNT: {
    id: 'BATTLE_BALL_COUNT',
    label: 'Nombre de Billes Concurrentes',
    type: 'range',
    category: 'gameplay',
    min: 2,
    max: 8,
    step: 1,
    unit: 'billes',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.BATTLE_BALL_COUNT,
    visibleIf: (values) => values.GAME_MODE === 'duel',
    description: 'Nombre de billes qui s’affrontent en mode Duel / Battle Royale.'
  },
  DUEL_P1_COLOR: {
    id: 'DUEL_P1_COLOR',
    label: 'Couleur Bille 1 (Cyan)',
    type: 'select',
    category: 'gameplay',
    options: [
      { label: '⚡ Cyan Électrique Fluo', value: '#00f0ff' },
      { label: '💖 Rose Néon Flash', value: '#ff007f' },
      { label: '☀️ Jaune / Or Solaire', value: '#ffd700' },
      { label: '🧪 Vert Laser Fluo', value: '#00ff66' },
      { label: '🔮 Violet Cyber Néon', value: '#b026ff' },
      { label: '🔥 Orange Vif Incandescent', value: '#ff6600' },
      { label: '🔴 Rouge Flamme Éclatant', value: '#ff3333' },
      { label: '🤍 Blanc Pur Brillant', value: '#ffffff' }
    ],
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.DUEL_P1_COLOR,
    visibleIf: (values) => values.GAME_MODE === 'duel',
    description: 'Couleur de la première bille en mode Duel.'
  },
  DUEL_P2_COLOR: {
    id: 'DUEL_P2_COLOR',
    label: 'Couleur Bille 2 (Rose)',
    type: 'select',
    category: 'gameplay',
    options: [
      { label: '💖 Rose Néon Flash', value: '#ff007f' },
      { label: '⚡ Cyan Électrique Fluo', value: '#00f0ff' },
      { label: '☀️ Jaune / Or Solaire', value: '#ffd700' },
      { label: '🧪 Vert Laser Fluo', value: '#00ff66' },
      { label: '🔮 Violet Cyber Néon', value: '#b026ff' },
      { label: '🔥 Orange Vif Incandescent', value: '#ff6600' },
      { label: '🔴 Rouge Flamme Éclatant', value: '#ff3333' },
      { label: '🤍 Blanc Pur Brillant', value: '#ffffff' }
    ],
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.DUEL_P2_COLOR,
    visibleIf: (values) => values.GAME_MODE === 'duel',
    description: 'Couleur de la seconde bille en mode Duel.'
  },
  DUEL_P3_COLOR: {
    id: 'DUEL_P3_COLOR',
    label: 'Couleur Bille 3 (Jaune)',
    type: 'select',
    category: 'gameplay',
    options: [
      { label: '☀️ Jaune / Or Solaire', value: '#ffd700' },
      { label: '⚡ Cyan Électrique Fluo', value: '#00f0ff' },
      { label: '💖 Rose Néon Flash', value: '#ff007f' },
      { label: '🧪 Vert Laser Fluo', value: '#00ff66' },
      { label: '🔮 Violet Cyber Néon', value: '#b026ff' },
      { label: '🔥 Orange Vif Incandescent', value: '#ff6600' },
      { label: '🔴 Rouge Flamme Éclatant', value: '#ff3333' },
      { label: '🤍 Blanc Pur Brillant', value: '#ffffff' }
    ],
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.DUEL_P3_COLOR,
    visibleIf: (values) => values.GAME_MODE === 'duel' && (values.BATTLE_BALL_COUNT || 2) >= 3,
    description: 'Couleur de la 3e bille en lice.'
  },
  DUEL_P4_COLOR: {
    id: 'DUEL_P4_COLOR',
    label: 'Couleur Bille 4 (Vert)',
    type: 'select',
    category: 'gameplay',
    options: [
      { label: '🧪 Vert Laser Fluo', value: '#00ff66' },
      { label: '⚡ Cyan Électrique Fluo', value: '#00f0ff' },
      { label: '💖 Rose Néon Flash', value: '#ff007f' },
      { label: '☀️ Jaune / Or Solaire', value: '#ffd700' },
      { label: '🔮 Violet Cyber Néon', value: '#b026ff' },
      { label: '🔥 Orange Vif Incandescent', value: '#ff6600' },
      { label: '🔴 Rouge Flamme Éclatant', value: '#ff3333' },
      { label: '🤍 Blanc Pur Brillant', value: '#ffffff' }
    ],
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.DUEL_P4_COLOR,
    visibleIf: (values) => values.GAME_MODE === 'duel' && (values.BATTLE_BALL_COUNT || 2) >= 4,
    description: 'Couleur de la 4e bille en lice.'
  },
  RING_COUNT: {
    id: 'RING_COUNT',
    label: 'Nombre d’Anneaux Concentriques',
    type: 'range',
    category: 'gameplay',
    min: 1,
    max: 6,
    step: 1,
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.RING_COUNT,
    visibleIf: (values) => values.GAME_MODE !== 'classic',
    description: 'Nombre de cercles successifs que la bille doit traverser.'
  },
  RING_GAP_MODE: {
    id: 'RING_GAP_MODE',
    label: 'Type de Passage des Anneaux',
    type: 'select',
    category: 'gameplay',
    options: [
      { label: '🧱 Briques d’Arc Destructibles à PV', value: 'bricks' },
      { label: '🚪 Brèche Tournante Continue (Porte)', value: 'rotating-gap' }
    ],
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.RING_GAP_MODE,
    visibleIf: (values) => values.GAME_MODE !== 'classic',
    description: 'Comment la bille franchit chaque anneau.'
  },
  GAP_SIZE_DEGREES: {
    id: 'GAP_SIZE_DEGREES',
    label: 'Largeur de la Brèche Tournante',
    type: 'range',
    category: 'gameplay',
    min: 15,
    max: 90,
    step: 5,
    unit: '°',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.GAP_SIZE_DEGREES,
    visibleIf: (values) => values.GAME_MODE !== 'classic' && values.RING_GAP_MODE === 'rotating-gap',
    description: 'Taille de l’ouverture dans l’anneau pour s’échapper (plus petit = plus difficile).'
  },
  RING_SPACING: {
    id: 'RING_SPACING',
    label: 'Espacement entre Anneaux',
    type: 'range',
    category: 'gameplay',
    min: 24,
    max: 50,
    step: 2,
    unit: 'px',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.RING_SPACING,
    visibleIf: (values) => values.GAME_MODE !== 'classic' && (values.RING_COUNT || 1) > 1
  },
  ARENA_ROTATION_SPEED: {
    id: 'ARENA_ROTATION_SPEED',
    label: 'Vitesse de Rotation de l’Arène',
    type: 'range',
    category: 'gameplay',
    min: 0,
    max: 1.5,
    step: 0.05,
    unit: 'rad/s',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.ARENA_ROTATION_SPEED
  },
  TOTAL_WALL_SEGMENTS: {
    id: 'TOTAL_WALL_SEGMENTS',
    label: 'Nombre de Briques par Anneau',
    type: 'range',
    category: 'gameplay',
    min: 12,
    max: 48,
    step: 2,
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.TOTAL_WALL_SEGMENTS,
    visibleIf: (values) => values.GAME_MODE === 'classic' || values.RING_GAP_MODE === 'bricks'
  },
  SEGMENT_HP: {
    id: 'SEGMENT_HP',
    label: 'Points de Vie par Brique (HP)',
    type: 'range',
    category: 'gameplay',
    min: 1,
    max: 10,
    step: 1,
    unit: 'HP',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SEGMENT_HP,
    visibleIf: (values) => values.GAME_MODE === 'classic' || values.RING_GAP_MODE === 'bricks'
  },
  CHALLENGE_TIME_LIMIT: {
    id: 'CHALLENGE_TIME_LIMIT',
    label: 'Chronomètre Défi (secondes)',
    type: 'range',
    category: 'gameplay',
    min: 10,
    max: 90,
    step: 5,
    unit: 's',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.CHALLENGE_TIME_LIMIT
  },
  PERFECT_LOOP_ENABLED: {
    id: 'PERFECT_LOOP_ENABLED',
    label: 'Boucle Parfaite TikTok (Auto-Loop)',
    type: 'boolean',
    category: 'gameplay',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.PERFECT_LOOP_ENABLED,
    description: 'Relance automatiquement la simulation 2s après l’évasion pour créer une vidéo en boucle infinie.'
  },
  PERFECT_LOOP_DELAY: {
    id: 'PERFECT_LOOP_DELAY',
    label: 'Délai Avant Redémarrage',
    type: 'range',
    category: 'gameplay',
    min: 1.0,
    max: 4.0,
    step: 0.2,
    unit: 's',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.PERFECT_LOOP_DELAY,
    visibleIf: (values) => values.PERFECT_LOOP_ENABLED !== false
  },
  BALL_DUPLICATION_ON_BOUNCE: {
    id: 'BALL_DUPLICATION_ON_BOUNCE',
    label: 'Dédoublement Bille à Chaque Choc',
    type: 'boolean',
    category: 'gameplay',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.BALL_DUPLICATION_ON_BOUNCE,
    visibleIf: (values) => values.GAME_MODE !== 'duel',
    description: 'Fait naître de nouvelles billes à chaque impact mural.'
  },
  MAX_BALLS: {
    id: 'MAX_BALLS',
    label: 'Nombre Maximum de Billes Simultanées',
    type: 'range',
    category: 'gameplay',
    min: 2,
    max: 32,
    step: 1,
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.MAX_BALLS,
    visibleIf: (values) => values.GAME_MODE === 'ball-storm' || values.BALL_DUPLICATION_ON_BOUNCE === true,
    description: 'Plafond de billes actives dans l’arène lors des dédoublements.'
  },

  // ==========================================
  // --- MOTEUR PHYSIQUE (DROITE) ---
  // ==========================================
  SEED: {
    id: 'SEED',
    label: 'Graine Aléatoire (Seed)',
    type: 'range',
    category: 'physics',
    min: 1,
    max: 999999,
    step: 1,
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SEED,
    description: 'Graine déterministe pour reproduire exactement la même trajectoire et physique.'
  },
  GRAVITY: {
    id: 'GRAVITY',
    label: 'Gravité Verticale',
    type: 'range',
    category: 'physics',
    min: 0.0,
    max: 0.6,
    step: 0.02,
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.GRAVITY,
    description: 'Force attirant les balles vers le bas.'
  },
  INITIAL_SPEED: {
    id: 'INITIAL_SPEED',
    label: 'Vitesse de Départ',
    type: 'range',
    category: 'physics',
    min: 100,
    max: 400,
    step: 10,
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.INITIAL_SPEED
  },
  BOUNCE_SPEED_MULTIPLIER: {
    id: 'BOUNCE_SPEED_MULTIPLIER',
    label: 'Accélération par Rebond',
    type: 'range',
    category: 'physics',
    min: 1.0,
    max: 1.1,
    step: 0.01,
    unit: 'x',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.BOUNCE_SPEED_MULTIPLIER,
    description: 'Multiplicateur de vitesse à chaque collision.'
  },
  MAX_SPEED: {
    id: 'MAX_SPEED',
    label: 'Plafond Vitesse Max',
    type: 'range',
    category: 'physics',
    min: 250,
    max: 750,
    step: 25,
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.MAX_SPEED
  },
  BALL_RADIUS: {
    id: 'BALL_RADIUS',
    label: 'Rayon de la Bille',
    type: 'range',
    category: 'physics',
    min: 8,
    max: 24,
    step: 1,
    unit: 'px',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.BALL_RADIUS
  },
  BALL_COLLISION_ENABLED: {
    id: 'BALL_COLLISION_ENABLED',
    label: 'Collisions Entre Billes (Ball-to-Ball)',
    type: 'boolean',
    category: 'physics',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.BALL_COLLISION_ENABLED,
    visibleIf: (values) =>
      values.GAME_MODE === 'duel' || values.GAME_MODE === 'ball-storm' || values.BALL_DUPLICATION_ON_BOUNCE === true,
    description: 'Active les chocs physiques et répulsions élastiques entre toutes les billes.'
  },
  BALL_COLLISION_ELASTICITY: {
    id: 'BALL_COLLISION_ELASTICITY',
    label: 'Élasticité Chocs Inter-Billes',
    type: 'range',
    category: 'physics',
    min: 0.8,
    max: 1.05,
    step: 0.01,
    unit: 'x',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.BALL_COLLISION_ELASTICITY,
    visibleIf: (values) =>
      (values.GAME_MODE === 'duel' || values.GAME_MODE === 'ball-storm' || values.BALL_DUPLICATION_ON_BOUNCE === true) &&
      values.BALL_COLLISION_ENABLED !== false,
    description: 'Coefficient de rebond lorsque deux billes se heurtent.'
  },
  BOUNCE_DIR_RANDOMNESS: {
    id: 'BOUNCE_DIR_RANDOMNESS',
    label: 'Aléatoire Direction Rebond',
    type: 'range',
    category: 'physics',
    min: 0,
    max: 100,
    step: 5,
    unit: '%',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.BOUNCE_DIR_RANDOMNESS,
    description: 'Ajuste la déviation aléatoire de l’angle de rebond (0% = réflexion miroir pure, 100% = trajectoires chaotiques et imprévisibles).'
  },
  BOUNCE_SPEED_RANDOMNESS: {
    id: 'BOUNCE_SPEED_RANDOMNESS',
    label: 'Aléatoire Vitesse Rebond',
    type: 'range',
    category: 'physics',
    min: 0,
    max: 100,
    step: 5,
    unit: '%',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.BOUNCE_SPEED_RANDOMNESS,
    description: 'Ajuste la variation aléatoire de vitesse à chaque rebond (0% = accélération fixe, 100% = accélérations et décélérations surprises).'
  },
  WALL_SPIN_TRANSFER: {
    id: 'WALL_SPIN_TRANSFER',
    label: 'Transfert de Rotation Paroi (Effet Tourbillon)',
    type: 'range',
    category: 'physics',
    min: 0.0,
    max: 1.0,
    step: 0.05,
    unit: 'x',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.WALL_SPIN_TRANSFER,
    description: 'Frottement dynamique transmettant la rotation de l’arène à la vitesse tangentielle des billes.'
  },
  SUB_STEPS: {
    id: 'SUB_STEPS',
    label: 'Sous-Étapes Précision Physique (Sub-steps)',
    type: 'range',
    category: 'physics',
    min: 4,
    max: 20,
    step: 1,
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.SUB_STEPS,
    description: 'Nombre d’itérations physiques par frame pour éviter tout effet tunnel à grande vitesse.'
  },
  CIRCLE_RADIUS: {
    id: 'CIRCLE_RADIUS',
    label: 'Rayon Extérieur de l’Arène',
    type: 'range',
    category: 'physics',
    min: 120,
    max: 240,
    step: 5,
    unit: 'px',
    defaultValue: DEFAULT_BALL_ESCAPE_CONFIG.CIRCLE_RADIUS
  }
};

