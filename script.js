import { notes, shuffleArray, getCorrectIndex, getRandomIndex, setNotation } from './src/game.js';
import audio, { initAudio, playNoteByIndex, playNoteByName, toggleMute, isMuted } from './src/audio.js';
import { initRipples, createNoteButtons, highlightButton, setCurrentNoteText, setTimerVisibility, setTimerFillWidth, setTimerText, updateScore, showFeedback } from './src/ui.js';

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
const muteBtn = document.getElementById('muteBtn');



// Initialise le sous-système audio (attach listeners pour déverrouiller l'audio)
initAudio();

// instrument selector removed — using fixed default instrument

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
        setTimerVisibility(true);
    } else {
        setTimerVisibility(false);
        setTimerText('');
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
        setTimerFillWidth(percentage);
        setTimerText(`⏱️ ${Math.ceil(remaining / 1000)}s`);

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
    highlightButton(correctNote, 'correct');
    updateScore(correctCount, totalCount);

    setTimeout(() => {
        generateNewNote();
    }, 2000);
}

// Note: `shuffleArray` is imported from `src/game.js`.

// note buttons are created by src/ui.js:createNoteButtons(onClick)

function generateNewNote() {
    currentNoteIndex = Math.floor(Math.random() * notes.length);
    setCurrentNoteText(notes[currentNoteIndex]);
    // clear any feedback state and recreate buttons
    showFeedback('', false);
    createNoteButtons(checkAnswer);
    // Play the note when it appears
    playNoteByIndex(currentNoteIndex);
    
    // Démarrer le timer selon la difficulté
    const duration = difficultySettings[currentDifficulty].time;
    if (duration > 0) {
        setTimerFillWidth(100);
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

    // Play the selected note for feedback
    playNoteByName(selectedNote, isCorrect ? 0.5 : 0.7);

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

    updateScore(correctCount, totalCount);
    
    setTimeout(() => {
        generateNewNote();
    }, 1500);
}


function updateScore() {
    if (scoreInlineEl) scoreInlineEl.textContent = `Réponses : ${correctCount}/${totalCount}`;
}

// Mute button handling
if (muteBtn) {
    muteBtn.addEventListener('click', () => {
        const nowMuted = toggleMute();
        muteBtn.textContent = nowMuted ? '🔇' : '🔊';
        muteBtn.setAttribute('aria-pressed', String(nowMuted));
    });
}
