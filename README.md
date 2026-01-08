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

---
_Généré automatiquement — analyse concise du code et guide d'utilisation._
# Do-Re-Mi-Challenge