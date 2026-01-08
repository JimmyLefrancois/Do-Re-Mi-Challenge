export let notes = ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
export const intlNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export function setNotation(international = false) {
  notes = international ? intlNotes : ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
}

export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getCorrectIndex(currentIndex, mode, length = notes.length) {
  if (mode === 'forward') {
    return (currentIndex + 1) % length;
  }
  return (currentIndex - 1 + length) % length;
}

// helper to get a random integer in [0, max-1], injectable RNG for tests
export function getRandomIndex(max, rng = Math.random) {
  return Math.floor(rng() * max);
}
