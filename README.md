# Calcul

Jeu de calcul mental en français. Les parties et records sont conservés dans le stockage local du navigateur ; aucun compte ni service distant n’est nécessaire.

## Développement

```sh
source "$HOME/.nvm/nvm.sh"
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

## Modes de jeu

- **Solo Niveaux** : choisissez un niveau de départ, puis répondez avant la fin du temps imparti. Une mauvaise réponse ou un délai dépassé coûte une vie.
- **Défi du jour** : une série fixe de 20 questions, identique pour tout le monde à la même date, avec 3 vies. Les questions suivent une progression de niveaux et les réponses rapides rapportent plus de points. Une seule partie terminée est enregistrée par jour ; quitter avant la fin permet de réessayer.
- **Chrono libre** : choisissez les opérations et la durée. Le chrono et le score restent visibles ; les réponses se valident automatiquement. Le bouton **Passer** (ou la barre d’espace) affiche une nouvelle question sans changer le score ni la précision.

Le Chrono libre ne propose plus d’options pour masquer le chrono ou le score.

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
