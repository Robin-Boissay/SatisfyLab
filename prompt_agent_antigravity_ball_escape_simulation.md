# MISSION : Développement d'un simulateur web 2D satisfaisant (Ball Escape)

Tu es un développeur expert en physique 2D, animations Canvas et Web Audio API.
Développe une application web interactive complète contenue dans un **fichier unique (`index.html`)**, optimisée pour l'enregistrement d'écrans au format vertical Shorts/TikTok/Reels (ratio 9:16).

---

## 1. Choix technologiques imposés
- **Structure & Langage :** HTML5, CSS3 standard, Vanilla JavaScript (zéro dépendance, pas de bundler, pas de framework lourd).
- **Moteur de rendu :** Canvas 2D natif avec support Retina (`devicePixelRatio`) à 60 FPS constants.
- **Audio :** `Web Audio API` (oscillateurs synthétisés procéduraux pour les sons d'impact et de destruction, sans aucun fichier audio externe).

---

## 2. Spécifications visuelles & Interface
- **Format d'affichage :** Conteneur vertical centré au ratio exact **9:16** (résolution interne de référence : 1080x1920 ou dynamique `width: 450px; height: 800px;` centrée sur écran sombre).
- **Ambiance graphique :**
  - Fond sombre / dark-mode néon (`#0d0f17` ou noir profond).
  - Cercle arène lumineux (effet de glow via `ctx.shadowBlur`).
  - Traînée de particules néon derrière la bille (trail effect).
- **Interface minimale superposée (HUD) :**
  - Compteur de rebonds centré en haut en gros caractères lisibles (`Bounces: X`).
  - Vitesse actuelle de la bille (`Speed: X km/h` ou multiplicateur `x1.2`).
  - Boutons discrets de contrôle en bas d'écran : *Démarrer / Recommencer*, *Plein écran*, *Activer/Couper le son*.

---

## 3. Mécaniques de jeu & Physique

### A. L'Arène (Cercle extérieur)
1. Un grand cercle de rayon $R$ placé au centre du Canvas.
2. La paroi du cercle est découpée en **segments (briques d'arc)** ou possède une **brèche / porte de sortie** protégée par des couches de briques.
3. Chaque brique possède un nombre de points de vie (HP) ou est détruite à l'impact :
   - À chaque fois que la bille percute un segment de la paroi, celui-ci change de couleur, s'amincit ou disparaît.
   - Dès qu'un segment est totalement détruit, une brèche s'ouvre vers l'extérieur.

### B. La Bille (Ball)
1. Commence au centre avec une vitesse initiale modérée et un angle aléatoire non nul.
2. Soumise à :
   - Vitesse constante avec vecteur de direction $\vec{v} = (v_x, v_y)$.
   - Légère gravité verticale orientée vers le bas pour rendre les trajectoires paraboliques plus naturelles et imprévisibles.
3. **Accélération exponentielle :** À chaque collision contre la paroi :
   - Sa vitesse scalaire augmente d'un facteur constant (ex: $+3\%$ ou $+5\%$).
   - Sa taille (rayon $r$) peut légèrement grossir ou changer de teinte (du bleu cyan vers le jaune puis le rouge écarlate au fil de la vitesse).
   - Déclenchement d'un flash lumineux sur le point de contact et émission de 8 à 15 micro-particules d'éclats.

### C. Condition de Victoire / Évasion (Climax & Loop)
1. La bille finit par heurter la brèche ouverte et s'échappe en dehors du cercle.
2. Dès que la bille sort du périmètre de l'arène :
   - Ralenti cinématique court (*bullet time* / timescale divisé par 4).
   - Explosion de confettis/particules sur tout l'écran.
   - Son d'accord final synthétisé gratifiant.
   - Décompte de 2 secondes avant réinitialisation automatique en boucle (*Perfect Loop* pour la rétention vidéo).

---

## 4. Système Audio Procédural (Web Audio API)
- Initialiser un `AudioContext` au premier clic de l'utilisateur.
- **Son d'impact régulier :**
  - Bip percutant (onde sinusoïdale ou triangle rapide avec enveloppe de déclin ADSR très courte, durée ~0.08s).
  - La fréquence de base du son doit monter d'un demi-ton ou de quelques Hertz à chaque rebond pour créer un effet de tension musicale croissante.
- **Son d'évasion :** Accord synthétisé ascendant riche (arpège rapide ou glissando majeur).

---

## 5. Exigences d'implémentation du code
- **Précision des collisions :** Utiliser la projection géométrique vecteur normal/tangente pour éviter que la bille ne passe à travers le cercle lors des hautes vitesses (*tunneling prevention* : sous-échantillonnage de collision par sous-pas `sub-stepping` si nécessaire).
- **Code documenté :** Placer des constantes modifiables en tête de script pour calibrer facilement :
  ```javascript
  const CONFIG = {
    GRAVITY: 0.15,
    BOUNCE_SPEED_MULTIPLIER: 1.04,
    INITIAL_SPEED: 7,
    MAX_SPEED: 35,
    BALL_RADIUS: 14,
    CIRCLE_RADIUS: 220,
    TOTAL_WALL_SEGMENTS: 36
  };
  ```
- Fournis le code directement dans un bloc HTML prêt à être exécuté dans n'importe quel navigateur moderne.