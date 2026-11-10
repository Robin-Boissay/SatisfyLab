# 🪄 Guide Ultime : Création Automatique de Thèmes & Images (Merge Drop)

Ce guide vous donne les **modèles de prompts IA** prêts à l'emploi et le fonctionnement du **Studio de Découpe automatique** pour produire des thèmes complets en quelques secondes.

---

## 🎯 1. Le Modèle de Prompt Universel (À copier-coller dans votre IA)

Dans Midjourney, ChatGPT (DALL-E 3), Flux ou Gemini, copiez ce prompt en remplaçant simplement la partie **`[VOTRE THÈME]`** :

### 📋 Modèle de Prompt Standard (Grille 5x2 - 10 icônes rondes) :

```text
A neat 5x2 sprite sheet grid showing exactly 10 circular game icons on a solid flat pure black background, progression from tier 1 to tier 10 of [THEME EN ANGLAIS, ex: kawaii baby animals / fantasy gemstones / delicious pastries].
Top row contains 5 circular icons: 1. [tier 0], 2. [tier 1], 3. [tier 2], 4. [tier 3], 5. [tier 4].
Bottom row contains 5 circular icons: 6. [tier 5], 7. [tier 6], 8. [tier 7], 9. [tier 8], 10. [tier 9 (legendary final boss / ultimate tier)].
Style: 3D glossy app icons, perfectly spherical, glossy vinyl toy texture, vibrant neon rim light, Octane 3D render, Pixar style, cleanly separated, evenly spaced, centered, isolated, no text, no frame, --ar 5:2 --v 6.1
```

> 💡 **Pourquoi le format 5:2 (`--ar 5:2`) ?**  
> Ce ratio génère naturellement 2 rangées horizontales de 5 icônes parfaitement espacées, ce qui correspond exactement aux 10 paliers du jeu de fusion (de 0 à 9).

---

## 🌟 2. Exemples Prêts à Générer

### A. 🥕 Thème Légumes Kawaii
```text
A neat 5x2 sprite sheet grid showing exactly 10 circular game icons on a solid flat pure black background, progression from tiny garden veggie to king pumpkin.
Top row (5 circular icons): 1. tiny green pea, 2. cherry tomato, 3. cute button mushroom, 4. golden onion, 5. crunchy carrot with eyes.
Bottom row (5 circular icons): 6. golden corn cob, 7. red bell pepper, 8. glossy purple eggplant, 9. giant broccoli tree, 10. giant royal glowing pumpkin with crown.
Style: Cute 3D glossy game badges, spherical round shapes, vibrant colors, Octane 3D render, studio lighting, evenly spaced, isolated on black, no text --ar 5:2
```

### B. 🐾 Thème Animaux Mignons (Chibi)
```text
A neat 5x2 sprite sheet grid showing exactly 10 circular game icons on a solid flat pure black background, progression of kawaii round baby animals.
Top row (5 circular icons): 1. round yellow chick, 2. green baby frog, 3. grey mouse, 4. fluffy white bunny, 5. cute orange kitten.
Bottom row (5 circular icons): 6. chubby fox cub, 7. round panda bear, 8. playful monkey, 9. brave baby lion, 10. majestic glowing cosmic whale.
Style: Cute 3D squishmallow sphere characters, perfectly spherical, soft glossy vinyl texture, pastel lighting, Octane render, isolated on black, no text --ar 5:2
```

### C. 💎 Thème Minerais & Gemmes Précieuses
```text
A neat 5x2 sprite sheet grid showing exactly 10 circular game icons on a solid flat pure black background, progression of fantasy magic gemstones.
Top row (5 circular icons): 1. rough dark coal with slight spark, 2. polished copper nugget, 3. glowing iron orb, 4. celestial lapis lazuli, 5. radiant pure gold nugget.
Bottom row (5 circular icons): 6. purple amethyst crystal orb, 7. sparkling emerald sphere, 8. blazing red ruby, 9. deep blue sapphire, 10. legendary iridescent cosmic diamond with rainbow stars.
Style: 3D crystal spheres, sharp reflections, inner magical glow, Octane 3D render, isolated on black, no text --ar 5:2
```

### D. 🍬 Thème Bonbons & Desserts
```text
A neat 5x2 sprite sheet grid showing exactly 10 circular game icons on a solid flat pure black background, progression of delicious sweets.
Top row (5 circular icons): 1. jelly bean, 2. pastel marshmallow ball, 3. vanilla macaron, 4. chocolate truffle, 5. rainbow swirl lollipop.
Bottom row (5 circular icons): 6. strawberry glazed donut, 7. blueberry frosted cupcake, 8. raspberry ice cream scoop, 9. glazed fruit tart, 10. giant 3-tier celebration birthday cake with sparklers.
Style: 3D glossy dessert spheres, colorful candy shine, studio lighting, Octane render, isolated on black, no text --ar 5:2
```

---

## ✂️ 3. Découpage Automatique avec le Studio Intégré

Nous avons inclus un outil interactif dans votre projet : **`theme-studio.html`** !

1. **Lancez le projet** (`npm run dev`) ou ouvrez directement dans votre navigateur :  
   👉 `http://localhost:5173/theme-studio.html` (ou double-cliquez sur `public/theme-studio.html`).
2. **Glissez-déposez** l'image générée par votre IA (ou faites `Ctrl+V` pour coller).
3. **Indiquez le nom du thème** (ex: `fruits`, `sweets`, `monsters`).
4. Le studio détecte et aligne automatiquement les 10 cercles. Vous pouvez ajuster en temps réel le rayon ou la marge si l'IA a légèrement décalé l'image.
5. **Cliquez sur "Télécharger le ZIP (10 images)"** :
   - Le ZIP contient directement `tier_0.png` jusqu'à `tier_9.png` détourés en **256×256 px transparents** !
6. **Décompressez le dossier dans :**
   ```
   public/themes/<nom_du_theme>/
   ```
7. **Copiez le code TypeScript** généré automatiquement en bas de page et collez-le dans `src/games/merge-drop/themeRegistry.ts`.

Le thème est instantanément jouable dans Merge Drop et disponible dans le sélecteur de skins !

