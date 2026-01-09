import { notes, shuffleArray, getCorrectIndex, getRandomIndex, setNotation } from './src/game.js';

let currentMode = null;
let currentDifficulty = null;
let currentNoteIndex = 0;
let correctCount = 0;
let totalCount = 0;
let timerInterval = null;
let timeLeft = 0;
let audioCtx = null;
let masterGain = null;
let isMuted = false;
let pianoInstrument = null;
let selectedInstrument = 'bright_acoustic_piano-mp3';
let synthFallback = null;

function disposeSynthFallback() {
    try {
        if (synthFallback && typeof synthFallback.dispose === 'function') synthFallback.dispose();
    } catch (e) {
        console.warn('Error disposing synthFallback', e);
    }
    synthFallback = null;
}

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

// Audio setup using WebAudio: create context and master gain
function ensureAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 1;
        masterGain.connect(audioCtx.destination);
    }
}

// Load a piano instrument via soundfont-player (CDN injected in index.html)
function ensurePiano() {
    if (pianoInstrument) return Promise.resolve(pianoInstrument);
    ensureAudio();
    if (typeof Soundfont === 'undefined') {
        console.warn('Soundfont library not available, will try Tone fallback');
        // try to initialise Tone fallback synth
        return ensureToneFallback().then(() => null);
    }
    console.log('Loading instrument', selectedInstrument);
    return Soundfont.instrument(audioCtx, selectedInstrument, { soundfont: 'MusyngKite' })
        .then(inst => { pianoInstrument = inst; console.log('Instrument loaded:', selectedInstrument); return inst; })
        .catch((err) => { console.warn('Instrument load failed', selectedInstrument, err); return null; });
}

// Initialise Tone.js fallback synth if Soundfont not available or load fails
async function ensureToneFallback() {
    if (synthFallback) return Promise.resolve(synthFallback);
    if (typeof Tone === 'undefined') {
        console.warn('Tone.js not available');
        return Promise.resolve(null);
    }
    try {
        // create a basic default PolySynth; specific instrument presets will replace it
        synthFallback = new Tone.PolySynth(Tone.Synth).toDestination();
        console.log('Tone fallback base synth ready');
        // apply current selected instrument preset
        await applyTonePreset(selectedInstrument);
        return Promise.resolve(synthFallback);
    } catch (err) {
        console.warn('Failed to create Tone fallback', err);
        return Promise.resolve(null);
    }
}

async function applyTonePreset(name) {
    if (typeof Tone === 'undefined') return;
    disposeSynthFallback();
    // choose synth/preset per instrument name
    switch (name) {
        case 'acoustic_guitar_steel':
            synthFallback = new Tone.PluckSynth().toDestination();
            break;
        case 'electric_piano_1':
            synthFallback = new Tone.PolySynth(Tone.FMSynth, {
                harmonicity: 3,
                modulationIndex: 10,
                oscillator: { type: 'sine' },
                envelope: { attack: 0.001, decay: 0.5, sustain: 0.3, release: 1 }
            }).toDestination();
            break;
        case 'violin':
            synthFallback = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.02, decay: 0.6, sustain: 0.7, release: 1.2 }
            }).toDestination();
            break;
        case 'trumpet':
            synthFallback = new Tone.PolySynth(Tone.AMSynth, {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.6 }
            }).toDestination();
            break;
        case 'flute':
            synthFallback = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 0.8 }
            }).toDestination();
            break;
        default:
            // default piano-like synth
            synthFallback = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.002, decay: 0.4, sustain: 0.2, release: 1 }
            }).toDestination();
            break;
    }
    console.log('Applied Tone preset for', name);
}

async function playNoteByIndex(index, duration = 0.6) {
    if (isMuted) return;
    ensureAudio();
    const noteNames = ['C4','D4','E4','F4','G4','A4','B4'];
    // try to ensure/load instrument and play sample if available
    let inst = null;
    try {
        inst = await ensurePiano();
    } catch (err) {
        console.warn('ensurePiano error', err);
    }
    if (inst) {
        try {
            inst.play(noteNames[index], undefined, { duration });
            console.log('Played sample note', noteNames[index], 'with', selectedInstrument);
            return;
        } catch (e) {
            console.warn('Sample play failed, falling back to synth', e);
        }
    } else {
        console.log('No sample instrument available, using synth fallback (', selectedInstrument, ')');
    }

    // If Soundfont not available, try Tone fallback
    if (!synthFallback && typeof Tone !== 'undefined') {
        await ensureToneFallback();
    }
    if (synthFallback) {
        try {
            // map C4..B4 to Tone notation
            const toneNotes = ['C4','D4','E4','F4','G4','A4','B4'];
            synthFallback.triggerAttackRelease(toneNotes[index], duration);
            console.log('Played note via Tone fallback', toneNotes[index]);
            return;
        } catch (err) {
            console.warn('Tone fallback failed', err);
        }
    }

    // Fallback synth (kept for offline / no-soundfont situations): additive + noise
    const semitoneMap = [0, 2, 4, 5, 7, 9, 11]; // Do..Si in C major
    const baseFreq = 261.6255653005986; // Middle C (C4)
    const freq = baseFreq * Math.pow(2, semitoneMap[index] / 12);

    // Piano-like synth: multiple partials + short noise attack + lowpass body
    const now = audioCtx.currentTime;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(8000, now);
    filter.Q.value = 0.8;

    const env = audioCtx.createGain();
    env.gain.setValueAtTime(0.0001, now);

    // Connect chain: partials -> filter -> env -> masterGain
    filter.connect(env);
    env.connect(masterGain);

    // Additive partials (fundamental + harmonics)
    const partials = [1, 0.6, 0.28, 0.12];
    const detunes = [0, 0.2, -0.15, 0.3];
    partials.forEach((amp, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = i === 0 ? 'sine' : 'triangle';
        o.frequency.value = freq * (i + 1);
        o.detune.value = detunes[i] || 0;
        g.gain.value = amp;
        o.connect(g);
        g.connect(filter);
        o.start(now);
        o.stop(now + duration + 0.5);
    });

    // Short percussive noise for hammer attack
    const noiseBuffer = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.03), audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const nb = audioCtx.createBufferSource();
    nb.buffer = noiseBuffer;
    nb.connect(filter);
    nb.start(now);

    // Envelope (fast attack, exponential decay)
    const attack = 0.003;
    const decay = Math.max(0.05, duration * 0.9);
    env.gain.cancelScheduledValues(now);
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(1.0, now + attack);
    env.gain.exponentialRampToValueAtTime(0.0005, now + decay + attack);

    // Slight filter movement
    filter.frequency.setValueAtTime(4000, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
}

function playNoteByName(name, duration = 0.6) {
    const map = ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
    const intlMap = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const idx = map.indexOf(name) !== -1 ? map.indexOf(name) : intlMap.indexOf(name);
    if (idx >= 0) playNoteByIndex(idx, duration);
}

// Ensure piano loads on first user gesture (resume audio + load SoundFont)
function attachAudioUnlockers() {
    const unlock = () => {
        ensureAudio();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        // load piano and log result
        ensurePiano().then(inst => {
            if (inst) console.log('Piano ready after user gesture');
            else console.log('Piano not ready after user gesture');
        });
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
}

attachAudioUnlockers();

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
    // Play the note when it appears
    playNoteByIndex(currentNoteIndex);
    
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

// Mute button handling
if (muteBtn) {
    muteBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
        muteBtn.setAttribute('aria-pressed', String(isMuted));
        if (masterGain) masterGain.gain.value = isMuted ? 0 : 1;
        if (audioCtx && audioCtx.state === 'suspended' && !isMuted) audioCtx.resume();
    });
}
