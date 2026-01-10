/* @vitest-environment jsdom */
import { beforeEach, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import fs from 'fs';
import path from 'path';

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

beforeEach(() => {
  document.body.innerHTML = html;
  vi.resetModules();
});

it('appelle playNoteByIndex quand une note est générée', async () => {
  vi.mock('../src/audio.js', () => ({
    initAudio: () => {},
    playNoteByIndex: vi.fn(),
    playNoteByName: () => {},
    toggleMute: () => false
  }));

  await import('../script.js');

  // prepare and start
  fireEvent.click(document.querySelector('.mode-btn[data-mode="forward"]'));
  fireEvent.click(document.querySelector('.difficulty-btn[data-difficulty="easy"]'));
  fireEvent.click(document.getElementById('startGameBtn'));

  // playNoteByIndex should have been called at least once when generating the note
  const mockedAudio = await import('../src/audio.js');
  expect(mockedAudio.playNoteByIndex).toHaveBeenCalled();
});
