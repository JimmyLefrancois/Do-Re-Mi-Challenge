const notes = ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
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
const correctScoreEl = document.getElementById('correctScore');
const totalScoreEl = document.getElementById('totalScore');
const restartBtn = document.getElementById('restartBtn');
const instructionEl = document.getElementById('instruction');
const startGameBtn = document.getElementById('startGameBtn');
const timerBar = document.getElementById('timerBar');
const timerFill = document.getElementById('timerFill');
const timerText = document.getElementById('timerText');

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

    if (currentMode === 'forward') {
        correctNoteIndex = (currentNoteIndex + 1) % notes.length;
    } else {
        correctNoteIndex = (currentNoteIndex - 1 + notes.length) % notes.length;
    }

    showFeedback(`⏱️ Temps écoulé ! C'était ${notes[correctNoteIndex]}`, false);
    updateScore();
    
    setTimeout(() => {
        generateNewNote();
    }, 2000);
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function createNoteButtons() {
    notesGrid.innerHTML = '';
    const shuffledNotes = shuffleArray(notes);
    shuffledNotes.forEach(note => {
        const btn = document.createElement('button');
        btn.className = 'note-btn';
        btn.textContent = note;
        btn.addEventListener('click', () => checkAnswer(note));
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
}

function checkAnswer(selectedNote) {
    stopTimer();
    totalCount++;
    let correctNoteIndex;

    if (currentMode === 'forward') {
        correctNoteIndex = (currentNoteIndex + 1) % notes.length;
    } else {
        correctNoteIndex = (currentNoteIndex - 1 + notes.length) % notes.length;
    }

    const isCorrect = selectedNote === notes[correctNoteIndex];

    if (isCorrect) {
        correctCount++;
        showFeedback('Correct ! 🎉', true);
    } else {
        showFeedback(`Non, c'était ${notes[correctNoteIndex]} 😔`, false);
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
    correctScoreEl.textContent = correctCount;
    totalScoreEl.textContent = totalCount;
}
