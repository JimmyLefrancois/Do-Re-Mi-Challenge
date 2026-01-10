/* @vitest-environment jsdom */
import { beforeEach, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/dom';
import fs from 'fs';
import path from 'path';

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

beforeEach(() => {
  document.body.innerHTML = html;
  vi.resetModules();
});

it("incrémente le score lors d'une réponse correcte", async () => {
  // mock audio module to avoid real AudioContext/Tone
  vi.mock('../src/audio.js', () => ({
    initAudio: () => {},
    playNoteByIndex: () => {},
    playNoteByName: () => {},
    toggleMute: () => false
  }));

  // load app script after DOM and mocks
  await import('../script.js');

  // select a mode and difficulty and start
  const modeBtn = document.querySelector('.mode-btn[data-mode="forward"]');
  const diffBtn = document.querySelector('.difficulty-btn[data-difficulty="easy"]');
  fireEvent.click(modeBtn);
  fireEvent.click(diffBtn);
  fireEvent.click(document.getElementById('startGameBtn'));

  // current displayed note
  const current = document.getElementById('currentNote').textContent;
  // import notes and helper to compute correct index
  const { notes, getCorrectIndex } = await import('../src/game.js');
  const curIdx = notes.indexOf(current);
  const correctIdx = getCorrectIndex(curIdx, 'forward', notes.length);
  const correctNote = notes[correctIdx];

  // find and click the correct note button
  const noteBtn = Array.from(document.querySelectorAll('.note-btn')).find(b => b.textContent === correctNote);
  expect(noteBtn).toBeTruthy();
  fireEvent.click(noteBtn);

  // score should update immediately
  const score = document.getElementById('scoreInline');
  expect(score.textContent).toContain('1/1');
});
