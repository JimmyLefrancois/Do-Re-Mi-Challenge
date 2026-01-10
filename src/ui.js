import { notes, shuffleArray } from './game.js';

function createRipple(el, ev) {
  const rect = el.getBoundingClientRect();
  const circle = document.createElement('span');
  circle.className = 'ripple';
  const size = Math.max(rect.width, rect.height) * 2;
  circle.style.width = circle.style.height = size + 'px';
  const x = ev && ev.clientX ? ev.clientX - rect.left - size / 2 : (rect.width / 2 - size / 2);
  const y = ev && ev.clientY ? ev.clientY - rect.top - size / 2 : (rect.height / 2 - size / 2);
  circle.style.left = x + 'px';
  circle.style.top = y + 'px';
  el.appendChild(circle);
  circle.addEventListener('animationend', () => circle.remove());
}

export function initRipples() {
  const selectors = ['.mode-btn', '.difficulty-btn', '.start-game-btn', '.note-btn', '.restart-btn', '.icon-btn', '.tooltip-btn'];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(btn => {
      if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.addEventListener('pointerdown', (e) => createRipple(btn, e));
    });
  });
}

export function createNoteButtons(onClick) {
  const notesGrid = document.getElementById('notesGrid');
  if (!notesGrid) return;
  notesGrid.innerHTML = '';
  const shuffledNotes = shuffleArray(notes);
  shuffledNotes.forEach(note => {
    const btn = document.createElement('button');
    btn.className = 'note-btn';
    btn.textContent = note;
    btn.dataset.note = note;
    btn.addEventListener('click', (e) => onClick(note, e.currentTarget));
    btn.addEventListener('pointerdown', (e) => createRipple(btn, e));
    notesGrid.appendChild(btn);
  });
}

export function highlightButton(note, className) {
  const btns = Array.from(document.querySelectorAll('.note-btn'));
  const target = btns.find(b => b.textContent === note || b.dataset.note === note);
  if (target) target.classList.add(className);
}

export function setCurrentNoteText(text) {
  const el = document.getElementById('currentNote');
  if (el) el.textContent = text;
}

export function setTimerVisibility(show) {
  const bar = document.getElementById('timerBar');
  if (bar) bar.style.display = show ? 'block' : 'none';
}

export function setTimerFillWidth(percent) {
  const fill = document.getElementById('timerFill');
  if (fill) fill.style.width = percent + '%';
}

export function setTimerText(text) {
  const t = document.getElementById('timerText');
  if (t) t.textContent = text;
}

export function updateScore(correct, total) {
  const el = document.getElementById('scoreInline');
  if (el) el.textContent = `Réponses : ${correct}/${total}`;
}

export function showFeedback(message, isCorrect) {
  const feedbackEl = document.getElementById('feedback');
  if (!feedbackEl) return;
  feedbackEl.textContent = message || '';
  if (!message) {
    // hide feedback when there's no message
    feedbackEl.className = 'feedback';
    return;
  }
  feedbackEl.className = 'feedback show ' + (isCorrect ? 'correct' : 'incorrect');
}

export default {
  initRipples,
  createNoteButtons,
  highlightButton,
  setCurrentNoteText,
  setTimerVisibility,
  setTimerFillWidth,
  setTimerText,
  updateScore,
  showFeedback
};
