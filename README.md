# ABYSSE — Arcade Pop

<p align="center">
  <img src="docs/media/home.webp" alt="Accueil ABYSSE et choix des thèmes" width="900">
</p>

Un jeu de calcul mental au style Arcade Pop, à jouer seul en français ou en anglais. Choisissez parmi six thèmes de couleur ; vos parties, records et préférences restent dans votre navigateur.

## Aperçu

<p align="center">
  <strong>Une partie en mode Niveaux</strong> — calculs, points et historique détaillé des réponses<br>
  <img src="docs/media/levels.webp" alt="Partie complète en mode Niveaux" width="720">
</p>

<p align="center">
  <strong>Chrono libre (30 s, les quatre opérations)</strong><br>
  <img src="docs/media/time-attack.webp" alt="Partie complète en mode Chrono libre" width="720">
</p>

<p align="center"><a href="docs/media/demo.mp4">▶ Voir la vidéo de démo complète (1 min 20)</a></p>

<table>
  <tr>
    <td align="center"><strong>Accueil et thèmes</strong><br><img src="docs/media/home.webp" alt="Accueil avec changement de thème" width="420"></td>
    <td align="center"><strong>Défi du jour</strong><br><img src="docs/media/daily.webp" alt="Partie mobile du défi du jour et historique" width="420"></td>
  </tr>
</table>

<p align="center">
  <strong>Sur mobile — interface en anglais</strong><br>
  <img src="docs/media/mobile-en.webp" alt="ABYSSE en anglais avec le détail d’une partie" width="300">
</p>

## Modes de jeu

### Niveaux

- Choisissez l’un des six niveaux : de **Facile** (12 secondes par question) à **Cauchemar** (5 secondes).
- Vous avez **3 vies** ; une erreur ou un délai dépassé en coûte une. Le niveau augmente toutes les 10 bonnes réponses, jusqu’au niveau 6.
- Une bonne réponse rapporte **150 points** en moins de 3 secondes, **100** en moins de 6 secondes, sinon **50**. Le score final est multiplié selon le niveau de départ.

### Chrono libre

- Choisissez les opérations (**+**, **−**, **×**, **÷**) et une durée de **30, 60, 120 ou 180 secondes** ; le chrono et le score restent toujours visibles.
- Une réponse juste passe immédiatement à la question suivante. **Passer** — ou la barre d’espace — coûte **3 secondes** ; la question reviendra après quelques questions, sans réduire le score.
- Les records sont conservés par durée et combinaison d’opérations ; les résultats indiquent aussi la précision, les questions passées et la meilleure série.

### Défi du jour

- Répondez à **20 questions identiques pour tout le monde le même jour**, avec 3 vies. La série progresse par quatre questions aux niveaux 2, 3, 4, 5 puis 6.
- Les points dépendent de la vitesse, comme en mode Niveaux. Une erreur ou un délai dépassé fait avancer la série et coûte une vie.
- Seule une partie **terminée** est comptée pour la journée : quitter en cours de route permet de réessayer. Le résultat peut être partagé.

## Fonctionnalités

- Interface en français et en anglais, avec langue mémorisée dans le navigateur.
- Nouveau design Arcade Pop : couleurs franches, cartes à contours épais et mascotte poulpe en SVG.
- Six thèmes — Lagon, Corail, Nuit, Algue, Bonbon et Soleil — enregistrés sur cet appareil.
- Sons synthétisés activables ou non, compte à rebours avant chaque partie et badges de combo.
- Succès, records et historique conservés localement ; partage du résultat quotidien.
- Pensé pour jouer sans compte ni service distant : aucune API de jeu, progression stockée dans le navigateur.
- Interface responsive et pavé numérique tactile avec bouton **Valider** ; animations activées par défaut, désactivables avec le bouton dédié.
- Les points gagnés s’affichent à chaque bonne réponse et la barre de temps passe au rouge quand il reste peu de temps.
- La fenêtre « Quitter ? » met la partie en pause : le chrono s’arrête et la question est masquée.
- Chaque partie conserve un historique chronologique des bonnes réponses, erreurs et calculs sans réponse, consultable dans les résultats et les records.

## Lancer le jeu

Installez [Node.js 20 ou une version ultérieure](https://nodejs.org/), puis depuis la racine du projet :

```sh
npm install
npm run dev
npm run build
npm test
```

## Structure du projet

```text
src/
├── App.tsx       # navigation, état des parties et compte à rebours
├── components/   # contrôles, mascotte SVG et composants réutilisables
├── game/         # règles, génération, scores, succès et stockage local
├── i18n/         # dictionnaires français/anglais et contexte de langue
├── screens/      # accueil, réglages, parties et résultats
└── styles/       # thèmes, mise en page et animations
```

## Technologies

React · TypeScript · Vite · Vitest · Web Audio API · Baloo 2

## English

**ABYSSE — Arcade Pop** is a solo mental-math game with local records and no remote game service. Its bold colors, thick card outlines, and SVG octopus can be customized with six saved themes.

- **Levels:** six levels, three lives, and speed-based scoring.
- **Time Attack:** choose operations and a 30–180 second timer; skipping costs 3 seconds and the question returns a few questions later.
- **Daily Challenge:** the same 20-question sequence for everyone each day; one completed run counts.
- Animations are on by default and can be turned off with the motion button.
- Choose Lagon, Corail, Nuit, Algue, Bonbon, or Soleil; the selected theme is saved on this device.
- Each game keeps a chronological history of correct, wrong, and unanswered questions, available in results and Records.
- Points pop up after each correct answer, and the quit dialog pauses the game.

Run locally with `npm install` and `npm run dev`; build with `npm run build` and test with `npm test`.
