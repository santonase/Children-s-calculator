// ===== Звук, вібрація, озвучення =====
// Звукові ефекти синтезуються через Web Audio API (без аудіофайлів).
// Озвучення завдань — через Web Speech API (вбудований голос системи).

const SOUND_KEY = 'kidsCalc.soundOn';

function isSoundOn() {
  return KVStore.getRaw(SOUND_KEY) !== 'off';
}

function setSoundOn(on) {
  KVStore.setRaw(SOUND_KEY, on ? 'on' : 'off');
}

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// Простий тон: частота, тривалість, гучність, форма хвилі
function playTone(freq, durationMs, volume, type, delayMs) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + (delayMs || 0) / 1000;
  const t1 = t0 + durationMs / 1000;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume || 0.15, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t1);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t1 + 0.05);
}

function soundCorrect() {
  if (!isSoundOn()) return;
  playTone(660, 90, 0.12, 'sine', 0);
  playTone(880, 140, 0.12, 'sine', 90);
}

function soundWrong() {
  if (!isSoundOn()) return;
  playTone(220, 200, 0.10, 'triangle', 0);
}

function soundTrackDone() {
  if (!isSoundOn()) return;
  playTone(523, 120, 0.13, 'sine', 0);
  playTone(659, 120, 0.13, 'sine', 120);
  playTone(784, 120, 0.13, 'sine', 240);
  playTone(1047, 260, 0.14, 'sine', 360);
}

function soundPurchase() {
  if (!isSoundOn()) return;
  playTone(988, 80, 0.12, 'square', 0);
  playTone(1319, 160, 0.10, 'square', 80);
}

// ----- Вібрація -----
function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function vibrateWrong() { vibrate(120); }
function vibrateCorrect() { vibrate(35); }
function vibrateTrackDone() { vibrate([60, 60, 60, 60, 140]); }

// ----- Озвучення завдань (Web Speech API) -----
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  const lang = (typeof getLang === 'function') ? getLang() : 'uk';
  utter.lang = lang === 'en' ? 'en-US' : 'uk-UA';
  utter.rate = 0.9;
  // Шукаємо голос потрібної мови, якщо він встановлений у системі
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(lang));
  if (voice) utter.voice = voice;
  window.speechSynthesis.speak(utter);
}

// Побудова тексту озвучення для рівняння з урахуванням пропущеного місця
function equationToSpeech(op, a, b, answer, missingSlot) {
  const w = (T.speechOps && T.speechOps[op]) || '';
  const howMuch = (T.speechHowMuch) || '?';
  const equals = (T.speechEquals) || '=';
  const A = missingSlot === 'a' ? howMuch : a;
  const B = missingSlot === 'b' ? howMuch : b;
  const R = missingSlot === 'answer' ? howMuch : answer;
  return `${A} ${w} ${B} ${equals} ${R}?`;
}
