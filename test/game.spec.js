import { describe, it, expect } from 'vitest';
import { shuffleArray, getCorrectIndex, getRandomIndex, notes } from '../src/game.js';

describe('game helpers', () => {
  it('shuffleArray returns same elements and length', () => {
    const original = [...notes];
    const shuffled = shuffleArray(original);
    expect(shuffled).toHaveLength(original.length);
    expect(shuffled.sort()).toEqual(original.sort());
  });

  it('getCorrectIndex handles forward and backward', () => {
    expect(getCorrectIndex(0, 'forward', notes.length)).toBe(1);
    expect(getCorrectIndex(6, 'forward', notes.length)).toBe(0);
    expect(getCorrectIndex(0, 'backward', notes.length)).toBe(6);
    expect(getCorrectIndex(1, 'backward', notes.length)).toBe(0);
  });

  it('getRandomIndex uses injected RNG', () => {
    const rng = () => 0.5; // deterministic
    expect(getRandomIndex(7, rng)).toBe(Math.floor(0.5 * 7));
  });
});
