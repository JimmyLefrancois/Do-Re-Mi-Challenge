# Do-Re-Mi-Challenge

**Description:**
- Petit jeu d'apprentissage des notes de musique (Do, Ré, Mi, Fa, Sol, La, Si).
- Interface web simple fournie par le fichier [index.html](index.html).

**But du jeu:**
- Deviner la note suivante (mode "À l'endroit") ou précédente (mode "À l'envers") par rapport à la note affichée.

**Fonctionnalités principales:**
- Choix du mode: `forward` (à l'endroit) ou `backward` (à l'envers).
- Trois niveaux de difficulté:
  - `easy` : temps infini
  - `medium` : 3 secondes
  - `hard` : 1 seconde
- Affichage du score (bonnes réponses / total) et feedback visuel.
- Timer visuel avec barre et texte selon la difficulté.

**Fichiers importants:**
- [index.html](index.html) : page unique contenant HTML, CSS et JavaScript du jeu.

**Analyse rapide du code (`index.html`) :**
- Liste des notes: tableau `notes = ['Do','Ré','Mi','Fa','Sol','La','Si']`.
- Modes et difficultés stockés dans `currentMode` et `currentDifficulty`.
- Réglages de difficulté: objet `difficultySettings` (temps en secondes).
- Génération d'une note aléatoire: `generateNewNote()` met à jour `currentNoteIndex` et affiche la note.
- Vérification de la réponse: `checkAnswer(selectedNote)` compare avec l'indice attendu suivant/précédent.
- Gestion du timer: `startTimer(duration)`, `stopTimer()` et `handleTimeout()` pour les expirations.
- Les boutons de réponse sont créés dynamiquement par `createNoteButtons()` avec l'ordre mélangé via `shuffleArray()`.

**Comment exécuter localement :**
1. Ouvrir le fichier [index.html](index.html) dans un navigateur moderne (double-clic ou `Ctrl+O`).
2. Choisir un mode et une difficulté, puis cliquer sur "Commencer le jeu".

**Améliorations possibles :**
- Ajouter des sons pour chaque note (mieux lier l'audio à l'affichage).
- Ajouter un mode apprentissage avec affichage de la gamme complète.
- Persister les meilleurs scores dans `localStorage`.
- Rendre l'UI accessible (attributs `aria`, navigation clavier).
- Tests unitaires pour les fonctions pures (ex. `shuffleArray`, logique d'indice).

Si vous voulez, je peux :
- ajouter la persistence des scores, ou
- intégrer des sons pour chaque note, ou
- extraire le JavaScript dans un fichier séparé (`script.js`).

Développement local
-------------------

1. Installer les dépendances :

```bash
npm install
```

2. Lancer les tests :

```bash
npm test
```

3. Construire un bundle optimisé :

```bash
npm run build
```

4. Lancer une construction en surveillance pendant le développement :

```bash
npm run dev:build
```

---
_Généré automatiquement — analyse concise du code et guide d'utilisation._
# Do-Re-Mi-Challenge
_Généré automatiquement — analyse concise du code et guide d'utilisation._

**Mobile / PWA & packaging**

- Un `manifest.json` a été ajouté pour permettre l'installation en tant que PWA. Voir [manifest.json](manifest.json).
- Un `service worker` basique (`sw.js`) met en cache les ressources essentielles pour un usage hors‑ligne minimal.
- Des icônes SVG sont présentes dans `icons/` (à remplacer par des PNG optimisés pour stores si nécessaire).

Pour publier sur Android / iOS :

1. PWA : tester l'installation depuis Chrome (Android) — le manifest et le service worker permettent l'installation en mode standalone.

2. Packaging natif (recommandé pour stores) : utiliser Capacitor (Ionic) ou Cordova pour empaqueter l'app web :

```bash
npm install @capacitor/cli @capacitor/core --save-dev
npx cap init do-re-mi-challenge com.example.doremi
npx cap add android
# copier le build web (ou simplement utiliser les fichiers présents)
npx cap copy
npx cap open android
```

3. Pour iOS, `npx cap add ios` puis ouvrir le projet Xcode et configurer les icônes/permissions avant build.

4. Remplacer les icônes SVG par des PNG/ico adaptés (192x192, 512x512, icônes Android adaptive, Apple touch icons).

Conseils :
- Vérifier l'accessibilité (contraste, taille de cible, navigation clavier) avant publication.
- Tester la PWA hors‑ligne et sur appareils réels.
