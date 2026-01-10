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

it('le bouton mute appelle toggleMute et met à jour aria-pressed', async () => {
  vi.mock('../src/audio.js', () => ({
    initAudio: () => {},
    playNoteByIndex: () => {},
    playNoteByName: () => {},
    toggleMute: vi.fn(() => true)
  }));

  await import('../script.js');

  const btn = document.getElementById('muteBtn');
  expect(btn).toBeTruthy();
  fireEvent.click(btn);
  const mockedAudio = await import('../src/audio.js');
  expect(mockedAudio.toggleMute).toHaveBeenCalled();
  expect(btn.getAttribute('aria-pressed')).toBe('true');
});
