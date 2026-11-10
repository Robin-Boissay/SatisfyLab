# 🎨 Thèmes et Skins Personnalisés - Merge Drop

Ce dossier permet de remplacer ou enrichir visuellement n'importe quel thème du jeu avec des images personnalisées (PNG avec transparence ou WebP).

## 📁 Structure des dossiers

```
public/themes/
├── vegetables/
│   ├── tier_0.png   (Petit Pois)
│   ├── tier_1.png   (Tomate Cerise)
│   ├── ...
│   └── tier_9.png   (Citrouille Royale)
├── minerals/
│   ├── tier_0.png   (Charbon Brut)
│   ├── ...
│   └── tier_9.png   (Diamant Cosmique)
└── animals/
    ├── tier_0.png   (Poussin Chibi)
    ├── ...
    └── tier_9.png   (Baleine Magique)
```

## ⚙️ Spécifications recommandées pour les images
- **Format :** PNG transparent ou WebP
- **Dimensions :** 256x256 px ou 512x512 px (carré)
- **Contenu :** Objet centré, de forme ronde ou contenu dans un cercle imaginaire
- **Poids :** Moins de 100 Ko par image pour un chargement instantané

## 💡 Fallback automatique
Si aucune image n'est présente dans le dossier, le moteur du jeu génère automatiquement un rendu sphérique 3D ultra soigné avec l'émoji et les reflets du thème !
Dès que vous placez un fichier `tier_X.png`, le jeu charge automatiquement le visuel au démarrage ou au changement de thème.

## ➕ Ajouter un tout nouveau thème
Pour ajouter un nouveau thème (ex: "bonbons", "voitures", "crypto") :
1. Ouvrez `src/games/merge-drop/themeRegistry.ts`.
2. Définissez les 10 tiers dans le tableau `MERGE_THEMES`.
3. C'est tout ! Il apparaîtra directement dans le menu déroulant du jeu avec son titre, ses compteurs et ses textes personnalisés.

