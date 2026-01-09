// Module audio centralisé — gère Soundfont, Tone fallback et synth fallback
let audioCtx = null;
let masterGain = null;
let pianoInstrument = null;
let selectedInstrument = 'bright_acoustic_piano-mp3';
let synthFallback = null;
let muted = false;

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(audioCtx.destination);
  }
}

function disposeSynthFallback() {
  try {
    if (synthFallback && typeof synthFallback.dispose === 'function') synthFallback.dispose();
  } catch (e) {
    console.warn('Error disposing synthFallback', e);
  }
  synthFallback = null;
}

async function applyTonePreset(name) {
  if (typeof Tone === 'undefined') return;
  disposeSynthFallback();
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
      synthFallback = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.002, decay: 0.4, sustain: 0.2, release: 1 }
      }).toDestination();
      break;
  }
  console.log('Applied Tone preset for', name);
}

async function ensureToneFallback() {
  if (synthFallback) return synthFallback;
  if (typeof Tone === 'undefined') {
    console.warn('Tone.js not available');
    return null;
  }
  try {
    synthFallback = new Tone.PolySynth(Tone.Synth).toDestination();
    console.log('Tone fallback base synth ready');
    await applyTonePreset(selectedInstrument);
    return synthFallback;
  } catch (err) {
    console.warn('Failed to create Tone fallback', err);
    return null;
  }
}

async function ensurePiano() {
  if (pianoInstrument) return pianoInstrument;
  ensureAudio();
  if (typeof Soundfont === 'undefined') {
    console.warn('Soundfont library not available, will try Tone fallback');
    await ensureToneFallback();
    return null;
  }
  try {
    console.log('Loading instrument', selectedInstrument);
    const inst = await Soundfont.instrument(audioCtx, selectedInstrument, { soundfont: 'MusyngKite' });
    pianoInstrument = inst;
    console.log('Instrument loaded:', selectedInstrument);
    return inst;
  } catch (err) {
    console.warn('Instrument load failed', selectedInstrument, err);
    return null;
  }
}

export async function initAudio() {
  ensureAudio();
  const unlock = () => {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
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

export function setInstrument(name) {
  selectedInstrument = name;
  pianoInstrument = null;
  // attempt to load; ignore errors
  ensurePiano();
}

export function toggleMute() {
  muted = !muted;
  if (masterGain) masterGain.gain.value = muted ? 0 : 1;
  if (audioCtx && audioCtx.state === 'suspended' && !muted) audioCtx.resume();
  return muted;
}

export function isMuted() {
  return muted;
}

export async function playNoteByIndex(index, duration = 0.6) {
  if (muted) return;
  ensureAudio();
  const noteNames = ['C4','D4','E4','F4','G4','A4','B4'];
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

  if (!synthFallback && typeof Tone !== 'undefined') {
    await ensureToneFallback();
  }
  if (synthFallback) {
    try {
      const toneNotes = ['C4','D4','E4','F4','G4','A4','B4'];
      synthFallback.triggerAttackRelease(toneNotes[index], duration);
      console.log('Played note via Tone fallback', toneNotes[index]);
      return;
    } catch (err) {
      console.warn('Tone fallback failed', err);
    }
  }

  // last-resort synth
  const semitoneMap = [0, 2, 4, 5, 7, 9, 11];
  const baseFreq = 261.6255653005986;
  const freq = baseFreq * Math.pow(2, semitoneMap[index] / 12);
  const now = audioCtx.currentTime;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(8000, now);
  filter.Q.value = 0.8;
  const env = audioCtx.createGain();
  env.gain.setValueAtTime(0.0001, now);
  filter.connect(env);
  env.connect(masterGain);
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
  const noiseBuffer = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.03), audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const nb = audioCtx.createBufferSource();
  nb.buffer = noiseBuffer;
  nb.connect(filter);
  nb.start(now);
  const attack = 0.003;
  const decay = Math.max(0.05, duration * 0.9);
  env.gain.cancelScheduledValues(now);
  env.gain.setValueAtTime(0.0001, now);
  env.gain.linearRampToValueAtTime(1.0, now + attack);
  env.gain.exponentialRampToValueAtTime(0.0005, now + decay + attack);
  filter.frequency.setValueAtTime(4000, now);
  filter.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
}

export function playNoteByName(name, duration = 0.6) {
  const map = ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
  const intlMap = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const idx = map.indexOf(name) !== -1 ? map.indexOf(name) : intlMap.indexOf(name);
  if (idx >= 0) playNoteByIndex(idx, duration);
}

export default {
  initAudio,
  playNoteByIndex,
  playNoteByName,
  toggleMute,
  setInstrument,
  isMuted
};
