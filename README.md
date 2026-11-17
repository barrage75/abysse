# Calcul

Jeu de calcul mental en français. Les parties et records sont conservés dans le stockage local du navigateur ; aucun compte ni service distant n’est nécessaire.

## Développement

```sh
source "$HOME/.nvm/nvm.sh"
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

## Vérifications

```sh
npm run build
npx tsc --noEmit
npx vitest run
```

## Organisation

- `src/game/` : génération déterministe, règles, scores, succès et stockage local.
- `src/screens/` : accueil, réglages, parties et écrans de résultats.
- `src/styles/theme.css` : variables et styles centralisés.
