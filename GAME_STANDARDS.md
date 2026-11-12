# 🎮 SATISFYLAB — STANDARD UNIVERSEL DE DÉVELOPPEMENT DE JEUX
> **Document de référence maître pour l'IA et les développeurs.**  
> Tout jeu ajouté ou modernisé dans SatisfyLab doit respecter cette charte afin de garantir une expérience virale maximale pour les créateurs de vidéos courtes (TikTok, Instagram Reels, YouTube Shorts) et une uniformité parfaite de la plateforme.

---

## 🧭 Sommaire
1. [Vision & Spécificités Format Vidéo Court](#1-vision--spécificités-format-vidéo-court)
2. [Zone Safe TikTok / Reels / Shorts (9:16)](#2-zone-safe-tiktok--reels--shorts-916)
3. [Architecture & Structure du Code](#3-architecture--structure-du-code)
4. [Standard Audio & ASMR Procédural](#4-standard-audio--asmr-procédural)
5. [Standard Visuel, Thèmes & Assets IA](#5-standard-visuel-thèmes--assets-ia)
6. [Physique, "Juiciness" & Rétention Vidéo](#6-physique-juiciness--rétention-vidéo)
7. [HUD Natif sur Canvas & Enregistrement 60 FPS](#7-hud-natif-sur-canvas--enregistrement-60-fps)
8. [Organisation des Panneaux de Contrôle](#8-organisation-des-panneaux-de-contrôle)
9. [Checklist de Validation pour Nouveau Jeu](#9-checklist-de-validation-pour-nouveau-jeu)

---

## 1. Vision & Spécificités Format Vidéo Court
SatisfyLab conçoit des simulateurs web 2D ultra-satisfaisants combinant **physique réaliste, dopamine visuelle et ASMR sonore**.
- **Public cible :** Créateurs de contenu TikTok / Reels / Shorts et spectateurs en quête de relaxation / curiosité.
- **Règle d'or :** L'enregistrement d'écran brut (ou l'export MediaRecorder) doit donner une vidéo **prête à publier immédiatement**, sans avoir besoin de logiciel de montage pour ajouter du texte, du son ou recadrer.

---

## 2. Zone Safe TikTok / Reels / Shorts (9:16)
Les applications mobiles superposent de nombreuses interfaces par-dessus la vidéo qui masquent le contenu.

```
+-------------------------------------------------------+ 0 px (Haut)
| [Recherche]        [Pour Toi / Abonnements]           | <-- ZONE MORTE HAUTE (0 à 80-140 px)
|                                                       |     Le HUD doit pouvoir être abaissé ou masqué.
| ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ |
|                                                       |
|                                                       |
|                     ZONE UTILE                        |
|                  100% VISIBLE                         |
|             (Action, arène, bocal, jeu)               | [Like]
|                                                       | [Comment]
|                                                       | [Share]
|                                                       | [Bookmark]
| ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ |
| @PseudoCréateur                                       | <-- ZONE MORTE BASSE (780 à 960 px)
| Description de la vidéo #hashtag #satisfying          |     Le bas de l'arène/bocal doit pouvoir
| ♫ Son original - Musique en bas                       |     être remonté au-dessus de cette ligne !
+-------------------------------------------------------+ 960 px (Bas)
```

### Règles obligatoires pour chaque jeu :
1. **Hauteur Basse Réglable (`CONTAINER_BOTTOM_Y` / `ARENA_BOTTOM_Y`)** :
   - Le fond de l'arène ou du conteneur ne doit **jamais** être bloqué tout en bas (Y = 880-920).
   - Toujours fournir un curseur (ex: 550 px à 920 px, pas de 5 px) permettant de remonter le sol à **780-820 px** pour dégager la zone de description TikTok.
2. **Hauteur Haute Réglable (`CONTAINER_TOP_Y` / `ARENA_TOP_Y`)** :
   - L'ouverture ou le sommet de l'arène doit pouvoir être ajusté (ex: 100 px à 300 px) pour laisser de la place au HUD ou s'adapter au cadrage.
3. **Décalage & Masquage du HUD (`HUD_TOP_OFFSET` & `SHOW_TOP_HUD`)** :
   - `HUD_TOP_OFFSET` (0 à 80 px) : permet de descendre le titre et le score sous la barre de recherche TikTok.
   - `SHOW_TOP_HUD` (boolean) : permet de **masquer complètement** les textes du haut pour les créateurs qui souhaitent une vidéo 100% épurée ou qui ajoutent leurs stickers dans TikTok.
4. **Jauges et Barres d'Évolution Déplaçables (`PROGRESS_BAR_Y`)** :
   - Si le jeu a une barre de progression (ex: les 10 icônes d'évolution), sa position Y et sa taille doivent être configurables pour être placées soit en haut sous le HUD, soit en bas juste au-dessus des hashtags.
5. **Épaisseur des Parois (`CONTAINER_STROKE_WIDTH`)** :
   - Sur smartphone et après compression vidéo TikTok, les lignes fines de 1 px deviennent floues ou invisibles.
   - Offrir un curseur de `1.5 px` à `10 px` (pas de 0.5) avec glow néon renforcé.

---

## 3. Architecture & Structure du Code
Chaque jeu est encapsulé dans `src/games/<nom-du-jeu>/` avec les 4 fichiers standardisés :

```
src/games/<nom-du-jeu>/
├── <NomJeu>Game.ts     # Moteur Canvas 2D natif 60 FPS (physique, rendu, audio)
├── types.ts            # Interfaces TypeScript, TConfig et DEFAULT_CONFIG
├── configSchema.ts     # Définition des champs UI pour les panneaux de contrôle
└── index.ts            # Implémentation du GameModule exporté vers le registre
```

### Le Registre de Thèmes (`themeRegistry.ts`)
Pour les jeux à skins / thèmes (comme *Merge Drop* ou de futurs jeux) :
- Séparer les données de thèmes dans `themeRegistry.ts`.
- Stocker les images dans `public/themes/<theme_id>/tier_X.png`.
- Toujours utiliser `textureManager` pour précharger les images sans bloquer la boucle de jeu.
- Toujours prévoir un **fallback procédural** (dessin Canvas / néon / 3D) si les images PNG ne sont pas présentes sur le disque.

---

## 4. Standard Audio & ASMR Procédural
> **Règle absolue : Zéro asset audio externe (`.mp3` ou `.wav`).**  
> Tout est généré en temps réel via `SoundEngine` (`Web Audio API`). Zéro temps de chargement, zéro latence, 100% capturé par le magnétoscope vidéo.

### A. Les 5 Packs Sonores Officiels pour les Actions / Fusions
Chaque jeu doit supporter un menu déroulant `SOUND_ACTION_STYLE` ou `SOUND_MERGE_STYLE` :
1. 🫧 **`bubbly` (Pop / Bulles ASMR — Viral TikTok)** : Sweep de fréquence montant ultra-rapide (pitch sweep de 0.04s) avec micro-clic d'éclatement.
2. 🪵 **`marimba` (Bois / Percussion Zen Suika)** : Fondamentale sinusoïdale + 2ème harmonique percussive (4x) très brève.
3. 👾 **`arcade` (8-Bit Chiptune)** : Double arpeggio en onde carrée (`square`) à +4 et +7 demi-tons.
4. 🎪 **`cartoon` (Boing Élastique)** : Onde sinusoïdale modulée en fréquence (vibrato de ressort comique).
5. ✨ **`crystal` (Carillon Céleste)** : Accord de deux ondes sinusoïdale + triangle avec decay scintillant.

### B. Les 5 Packs Sonores pour les Collisions / Rebonds Physiques
Option `SOUND_COLLISION_STYLE` :
1. 🪵 **`wood` (Toc Bois / Noisette)** : Bruit d'impact sec, mat et organique.
2. 🔮 **`glass` (Tintement Verre / Bille)** : Clink cristallin à 1200-1400 Hz.
3. 🫧 **`bubble` (Micro Plop Doux)** : Mini bulle d'eau feutrée.
4. ⚽ **`rubber` (Rebond Caoutchouc / Thud)** : Impact sourd à basse fréquence.
5. 👾 **`arcade` (Clic 8-Bit)** : Micro pulse chiptune.

### C. Règles de Contrôle Sonore Obligatoires :
- **Contrôles distincts :** Possibilité d'activer/désactiver indépendamment l'action principale (`SOUND_MERGE_ENABLED`) et les chocs (`SOUND_COLLISION_ENABLED`).
- **Volumes en Pourcentage (0% à 100%) :**
  - Volume de l'action (`SOUND_MERGE_VOLUME`) : défaut ~80%.
  - Volume des chocs physiques (`SOUND_COLLISION_VOLUME`) : défaut ~35%.
- **Throttling anti-saturation sonore :**
  - En physique 2D, des dizaines de chocs surviennent par seconde.
  - Limiter les impacts à **1 son toutes les 35 ms maximum (~28 impacts/s)** pour garder un son limpide sans bruit blanc ni grésillement.
- **Effet Dopamine "Combo Cascade" :**
  - Si des actions s'enchaînent rapidement (< 0.5s), chaque fusion successive augmente le pitch d'un demi-ton (`pitch * pow(1.08, comboIndex)`).
  - Paramètre `SOUND_COMBO_PITCH` (boolean) pour activer/désactiver.
- **Tonalité Globale (`SOUND_PITCH`) :**
  - Curseur de `0.7x` (grave/lourd) à `1.4x` (aigu/mignon).

---

## 5. Standard Visuel, Thèmes & Assets IA

### A. Rendu des Sprites PNG
- **Dimensions standard :** `256×256 px` avec fond transparent (RGBA 32 bits).
- **Découpe au pixel près :** Toujours appliquer `ctx.clip()` sur un arc circulaire avant de faire `drawImage`. Cela élimine les résidus de bordures ou coins carrés d'une génération IA.
- **Opacité 100% :** Ne jamais laisser traîner de `globalAlpha < 1.0` sur le sprite principal.
- **Aura & Glow propre :** Dessiner l'aura sous forme de `createRadialGradient` en arrière-plan du sprite pour éviter toute bouillie de couleur baveuse.

### B. Le Studio de Thèmes (`/theme-studio.html`)
Pour tout jeu basé sur des paliers ou des skins :
- Mettre à disposition un prompt de grille IA (ex: 5x2 ou 4x3).
- Proposer l'outil de découpage automatique dans l'interface pour permettre au créateur d'importer une image Midjourney/Flux et d'obtenir ses PNGs découpés en 1 clic.

---

## 6. Physique, "Juiciness" & Rétention Vidéo

### A. Stabilité Physique
- **Privilégier les colliders circulaires :** Les polygones irréguliers (ex: formes de carottes ou d'étoiles) s'encastrent, bloquent l'écoulement des flux et créent des bugs de chevauchement. Garder un hitbox circulaire physique et dessiner l'illustration à l'intérieur.
- **Déplacement sous-échantillonné (Sub-stepping) :** Découper chaque frame en 4 à 8 sous-étapes physiques (`subDt = dt / 6`) pour éviter qu'une bille traverse une paroi ou le sol lors de vitesses élevées.
- **Antidote anti-double merge instantané :**
  - Quand deux entités fusionnent, mettre un `break` immédiat dans la boucle interne.
  - Appliquer un `mergeCooldown = 0.16s` sur la nouvelle entité créée pour empêcher une double fusion dans la même frame.

### B. "Juiciness" (Sensations Satisfaisantes)
- **Pop élastique :** À l'apparition ou lors d'une fusion, appliquer une sur-échelle temporaire (`scale = 1.45`) qui redescend vers `1.0` avec un amorti doux.
- **Screen Shake calibré :** Légère secousse de caméra proportionnelle à la taille ou à l'importance de l'événement (max 15-20 px, déclin rapide).
- **Particules réactives :** Étincelles projetées dans la direction opposée au choc ou aspirées en vortex.
- **Climax Final de Vidéo (Supernova / Apothéose) :**
  - La fin d'une partie (ex: création du boss final ou niveau 9) doit offrir un spectacle complet : ralenti cinématique (*slow motion*), aspiration cosmique, détonation sonore et explosion visuelle pour donner aux spectateurs la satisfaction ultime avant de boucler la vidéo.

---

## 7. HUD Natif sur Canvas & Enregistrement 60 FPS
Tout texte informatif (Titre, Score, Temps, Métrique record) doit être dessiné directement sur le Canvas 2D via `src/core/canvasHUD.ts` :
- **Pourquoi ?** `canvas.captureStream(60)` enregistre uniquement les pixels du canvas. Les éléments HTML React ne sont pas dans le flux vidéo enregistré par le magnétoscope !
- **Prise en charge de la Safe Zone :** `drawCanvasHUD` applique automatiquement le décalage `topOffset` pour échapper aux bandeaux TikTok.
- **Libellés personnalisables :** Fournir des champs texte (`TEXT_TITLE`, `TEXT_METRIC_SCORE`, etc.) pour que le créateur puisse adapter la langue (Français/Anglais) ou changer l'accroche de sa vidéo.

---

## 8. Organisation des Panneaux de Contrôle
Pour garder une interface claire, le panneau de configuration est réparti entre la gauche et la droite via la prop `allowedCategories` de `DynamicControls` :

### 🎨 Panneau Gauche (`allowedCategories={['visuals', 'audio', 'texts']}`)
> *Dédié à l'habillage, à l'esthétique et au tournage vidéo.*
1. **Visuels & Conteneur (`visuals`) :**
   - Thèmes de skins (`SKIN_THEME`)
   - Formes du contenant (`CONTAINER_SHAPE`)
   - Couleurs néon (`CONTAINER_COLOR`)
   - Épaisseur des parois (`CONTAINER_STROKE_WIDTH`)
   - Safe Zones TikTok : `CONTAINER_TOP_Y`, `CONTAINER_BOTTOM_Y`, `SHOW_TOP_HUD`, `HUD_TOP_OFFSET`
   - Barres d'évolution : `SHOW_EVOLUTION_BAR`, `EVOLUTION_BAR_LAYOUT`, `EVOLUTION_BAR_Y`, `EVOLUTION_BAR_SIZE`
   - Effets de fond animés (`BACKGROUND_EFFECT`)
2. **Sons & Audio ASMR (`audio`) :**
   - Fusions : `SOUND_MERGE_ENABLED`, `SOUND_MERGE_STYLE`, `SOUND_MERGE_VOLUME`
   - Collisions : `SOUND_COLLISION_ENABLED`, `SOUND_COLLISION_STYLE`, `SOUND_COLLISION_VOLUME`
   - Lâcher : `SOUND_DROP_ENABLED`
   - Tonalité : `SOUND_PITCH`, `SOUND_COMBO_PITCH`
3. **Textes & Titres (`texts`) :**
   - `TEXT_TITLE`, `TEXT_METRIC_SCORE`, `TEXT_METRIC_MAX_TIER`, `TEXT_STATUS_VICTORY`, etc.

### ⚙️ Panneau Droit (`gameplay` & `physics`)
> *Dédié à la simulation et aux réglages fins du gameplay.*
1. **Gameplay & Règles (`gameplay`) :**
   - Modes automatiques / Rafales (`AUTO_STREAM_ACTIVE`, `AUTO_STREAM_RATE`)
   - Paliers de spawn maximum (`SPAWN_MAX_TIER`)
   - Screen shake toggle (`SCREEN_SHAKE_ENABLED`)
2. **Moteur Physique (`physics`) :**
   - Taille des billes (`BASE_BALL_RADIUS`)
   - Gravité (`GRAVITY`)
   - Rebond / Restitution (`RESTITUTION`)
   - Friction / Amortissement (`FRICTION`)

---

## 9. Checklist de Validation pour Nouveau Jeu
Avant de valider tout nouveau jeu ou refonte sur SatisfyLab :
- [ ] Le Canvas est centré au ratio 9:16 (540×960 virtuel, rendu Retina net).
- [ ] Le sol ou le bas de l'action peut être remonté au-dessus de Y = 800 px (`BOTTOM_Y`).
- [ ] Le haut de l'action ou de l'entonnoir peut être ajusté (`TOP_Y`).
- [ ] Le HUD supérieur peut être descendu (`HUD_TOP_OFFSET`) ou totalement masqué (`SHOW_TOP_HUD`).
- [ ] L'épaisseur des parois est réglable (`STROKE_WIDTH`).
- [ ] Le son fonctionne 100% via `SoundEngine` sans aucun fichier audio externe.
- [ ] Les fusions/actions et les collisions physiques ont leurs packs sonores distincts et volumes indépendants.
- [ ] Les collisions physiques sont throttlées pour éviter toute cacophonie.
- [ ] L'enregistrement vidéo produit un fichier `.webm` / `.mp4` avec son et vidéo synchronisés, net et prêt à poster sur TikTok.
- [ ] `npm run build` compile sans aucune erreur TypeScript ou Vite.

