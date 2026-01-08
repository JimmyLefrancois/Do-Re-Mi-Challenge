import { notes, shuffleArray, getCorrectIndex, getRandomIndex, setNotation } from './src/game.js';

let currentMode = null;
let currentDifficulty = null;
let currentNoteIndex = 0;
let correctCount = 0;
let totalCount = 0;
let timerInterval = null;
let timeLeft = 0;

const difficultySettings = {
    easy: { time: 0, label: '∞' },
    medium: { time: 3, label: '3s' },
    hard: { time: 1, label: '1s' }
};

const modeSelection = document.getElementById('modeSelection');
const gameArea = document.getElementById('gameArea');
const currentNoteEl = document.getElementById('currentNote');
const notesGrid = document.getElementById('notesGrid');
const feedbackEl = document.getElementById('feedback');
const scoreInlineEl = document.getElementById('scoreInline');
const restartBtn = document.getElementById('restartBtn');
const instructionEl = document.getElementById('instruction');
const startGameBtn = document.getElementById('startGameBtn');
const timerBar = document.getElementById('timerBar');
const timerFill = document.getElementById('timerFill');
const timerText = document.getElementById('timerText');
const installBtn = document.getElementById('installBtn');
const intlCheckbox = document.getElementById('intlNotationCheckbox');

// --- Ripple helper & init ---
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

function initRipples() {
    const selectors = ['.mode-btn', '.difficulty-btn', '.start-game-btn', '.note-btn', '.restart-btn', '.icon-btn', '.tooltip-btn'];
    selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(btn => {
            // ensure positioning for ripple
            if (getComputedStyle(btn).position === 'static') {
                btn.style.position = 'relative';
            }
            btn.style.overflow = 'hidden';
            btn.addEventListener('pointerdown', (e) => createRipple(btn, e));
        });
    });
}

// Initialiser la préférence de notation (stockée en localStorage)
if (intlCheckbox) {
    const pref = localStorage.getItem('useIntlNotation') === 'true';
    intlCheckbox.checked = pref;
    setNotation(pref);
    intlCheckbox.addEventListener('change', (e) => {
        const v = e.target.checked;
        localStorage.setItem('useIntlNotation', v);
        setNotation(v);
        // Mettre à jour l'affichage si une partie est en cours
        if (gameArea.classList.contains('active')) {
            currentNoteEl.textContent = notes[currentNoteIndex];
            createNoteButtons();
        }
    });
}

// Sélection du mode
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentMode = e.target.dataset.mode;
        checkStartButton();
    });
});

// Sélection de la difficulté
document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
        e.target.closest('.difficulty-btn').classList.add('active');
        currentDifficulty = e.target.closest('.difficulty-btn').dataset.difficulty;
        checkStartButton();
    });
});

// Bouton commencer
startGameBtn.addEventListener('click', () => {
    if (currentMode && currentDifficulty) {
        startGame();
    }
});

function checkStartButton() {
    if (currentMode && currentDifficulty) {
        startGameBtn.disabled = false;
    }
}

// Redémarrage
restartBtn.addEventListener('click', () => {
    stopTimer();
    modeSelection.style.display = 'block';
    gameArea.classList.remove('active');
    correctCount = 0;
    totalCount = 0;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
    startGameBtn.disabled = true;
    currentMode = null;
    currentDifficulty = null;
});

// PWA install prompt handling
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.style.display = 'inline-block';
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        deferredPrompt = null;
        installBtn.style.display = 'none';
    });
}

function startGame() {
    modeSelection.style.display = 'none';
    gameArea.classList.add('active');
    
    if (currentMode === 'forward') {
        instructionEl.textContent = '➡️ Quelle est la note suivante ?';
    } else {
        instructionEl.textContent = '⬅️ Quelle est la note précédente ?';
    }

    // Afficher ou masquer la barre de timer
    if (difficultySettings[currentDifficulty].time > 0) {
        timerBar.style.display = 'block';
    } else {
        timerBar.style.display = 'none';
        timerText.textContent = '';
    }
    
    createNoteButtons();
    generateNewNote();
}

function startTimer(duration) {
    stopTimer();
    if (duration === 0) return;

    timeLeft = duration;
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);

    timerInterval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);
        const percentage = (remaining / (duration * 1000)) * 100;
        
        timerFill.style.width = percentage + '%';
        timerText.textContent = `⏱️ ${Math.ceil(remaining / 1000)}s`;

        if (remaining <= 0) {
            stopTimer();
            handleTimeout();
        }
    }, 50);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function handleTimeout() {
    totalCount++;
    let correctNoteIndex;

    correctNoteIndex = getCorrectIndex(currentNoteIndex, currentMode, notes.length);

    showFeedback(`⏱️ Temps écoulé ! C'était ${notes[correctNoteIndex]}`, false);
    // Highlight the correct button so the user sees the answer
    const correctNote = notes[correctNoteIndex];
    const btns = Array.from(document.querySelectorAll('.note-btn'));
    const target = btns.find(b => b.textContent === correctNote || b.dataset.note === correctNote);
    if (target) target.classList.add('correct');
    updateScore();

    setTimeout(() => {
        generateNewNote();
    }, 2000);
}

// Note: `shuffleArray` is imported from `src/game.js`.

function createNoteButtons() {
    notesGrid.innerHTML = '';
    const shuffledNotes = shuffleArray(notes);
    shuffledNotes.forEach(note => {
        const btn = document.createElement('button');
        btn.className = 'note-btn';
        btn.textContent = note;
        btn.dataset.note = note;
        btn.addEventListener('click', (e) => checkAnswer(note, e.currentTarget));
        // create ripple on touch/click
        btn.addEventListener('pointerdown', (e) => createRipple(btn, e));
        notesGrid.appendChild(btn);
    });
}

function generateNewNote() {
    currentNoteIndex = Math.floor(Math.random() * notes.length);
    currentNoteEl.textContent = notes[currentNoteIndex];
    feedbackEl.classList.remove('show');
    createNoteButtons();
    
    // Démarrer le timer selon la difficulté
    const duration = difficultySettings[currentDifficulty].time;
    if (duration > 0) {
        timerFill.style.width = '100%';
        startTimer(duration);
    }

// initialize ripples on existing buttons
initRipples();
}

function checkAnswer(selectedNote, btnElement) {
    stopTimer();
    totalCount++;
    let correctNoteIndex;

    correctNoteIndex = getCorrectIndex(currentNoteIndex, currentMode, notes.length);

    const isCorrect = selectedNote === notes[correctNoteIndex];

    if (isCorrect) {
        correctCount++;
        showFeedback('Correct ! 🎉', true);
    } else {
        showFeedback(`Non, c'était ${notes[correctNoteIndex]} 😔`, false);
    }

    // Mark the clicked button visually
    if (btnElement) {
        btnElement.classList.add(isCorrect ? 'correct' : 'incorrect');
    }

    updateScore();
    
    setTimeout(() => {
        generateNewNote();
    }, 1500);
}

function showFeedback(message, isCorrect) {
    feedbackEl.textContent = message;
    feedbackEl.className = 'feedback show ' + (isCorrect ? 'correct' : 'incorrect');
}

function updateScore() {
    if (scoreInlineEl) scoreInlineEl.textContent = `Réponses : ${correctCount}/${totalCount}`;
}
