# ⚡ SatisfyLab

> **Laboratoire de mini-jeux physiques satisfaisants en 60 FPS avec export vidéo natif 9:16 (TikTok / Shorts / Reels) et audio procédural Web Audio.**

SatisfyLab est une plateforme web moderne conçue pour concevoir, tester et exporter des simulations physiques 2D hautement addictives et "oddly satisfying". Chaque simulation est calibrée au format vertical 9:16 et intègre un enregistreur vidéo natif direct sans passer par OBS.

---

## 🎮 Les 4 Mini-Jeux Inclus

| Mini-Jeu | Description | Points Clés |
| :--- | :--- | :--- |
| **1. Ball Escape 30s** | Défi chrono dans une arène circulaire en rotation avec briques destructibles. | Accélération exponentielle, brèche d'évasion, sons harmoniques en gamme pentatonique, bullet time climax. |
| **2. Neon & Solar Merge Drop** | Fusion physique de sphères (style Suika) dans une jarre en verre néon. | Deux thèmes visuels (Néon Minimaliste & Planètes du Système Solaire), mode rafale continue d'astéroïdes, fusion jusqu'au grand Soleil. |
| **3. Ball Duel (Gauche vs Droite)** | Duel compétitif en colonnes parallèles avec barres blindées horizontales. | Brise-briques avec points de vie, multiplicateurs de balles, améliorations de dégâts (+1, x2, x3, Fibonacci), ligne d'arrivée dorée. |
| **4. Territory War (Cyan vs Rose)** | Bataille de conquête de grille 2D autonome inspirée de *Day vs Night*. | Conquête par rebonds et ondes de choc, mode Overdrive avec balles de renfort à 55% et 75%, élimination K.O. final magnétique pour une victoire garantie à 100.0%. |

---

## ✨ Fonctionnalités Majeures

- **🎥 Enregistrement Vidéo 9:16 Natif Sans OBS**
  - Capture en direct du canvas à 60 FPS via `canvas.captureStream(60)` à résolution verticale native (**720 × 1280**).
  - Mixage direct de l'audio procédural dans le flux vidéo (128 kbps).
  - Incrustation automatique du titre, des scores, des pourcentages et des alertes directement sur la vidéo.
  - Déclenchement via bouton REC dédié ou raccourci clavier universel **`V`**.
  - Téléchargement automatique en `.webm` / `.mp4` prêt pour TikTok, YouTube Shorts et Instagram Reels.

- **🔊 Audio 100% Procédural (Web Audio API)**
  - Zéro fichier audio lourd externe : tous les sons (rebonds musicaux harmoniques, fusions, lasers, explosions, victoires) sont générés par synthèse en temps réel.

- **🎛️ Contrôle Total en Direct (60 FPS)**
  - Panneau de réglages latéraux avec onglets dédiés : **Tous**, **Jeu**, **Physique**, **Visuels**, **Textes**.
  - Modification en temps réel de la gravité, de la vitesse, des rebonds, des frictions et de tous les textes affichés à l'écran.

- **🌐 Multi-langue Intégral (FR / EN)**
  - Bouton de switch toujours présent en haut à droite (`FR` / `EN`).
  - Traduction à 100% de l'interface, des paramètres et des textes sur le Canvas.
  - Mémorisation du choix dans le `localStorage`.

---

## ⌨️ Raccourcis Clavier

| Touche | Action |
| :---: | :--- |
| **`V`** | Démarrer / Arrêter l'enregistrement vidéo 9:16 et télécharger le clip |
| **`R`** | Recommencer la simulation en cours |
| **`M`** | Couper / Activer le son (Muet) |
| **`Espace`** | Lancer la partie / démarrer la bille |
| **`A`** | Déclencher l'action spéciale (ex. Rafale continue, Multi-balles) |

---

## 🛠️ Installation & Démarrage

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée)
- `npm` ou `pnpm`

### Installation
```bash
# Cloner le dépôt
git clone https://github.com/Robin-Boissay/SatisfyLab.git
cd SatisfyLab

# Installer les dépendances
npm install
```

### Développement local
```bash
npm run dev
```
Ouvrez ensuite votre navigateur à l'adresse indiquée (généralement `http://localhost:5173`).

### Build de production
```bash
npm run build
npm run preview
```

---

## 🏗️ Stack Technique

- **Framework :** React 18 + TypeScript
- **Bundler :** Vite 6
- **Styling :** Tailwind CSS
- **Icônes :** Lucide React
- **Moteur Graphique :** HTML5 Canvas 2D (60 FPS DPR-aware)
- **Moteur Audio :** Web Audio API (synthèse procédurale)
- **Capture Vidéo :** HTML5 Canvas CaptureStream + MediaRecorder API (VP9/VP8/Opus)

---

## 📄 Licence

Projet personnel sous licence MIT.
