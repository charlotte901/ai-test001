// audio.js - WebAudio 合成音效(原创近似,FC 芯片风)
"use strict";

let AC = null;
let audioReady = false;

function initAudio() {
  if (AC) return;
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    audioReady = true;
  } catch (e) { audioReady = false; }
}
function resumeAudio() { if (AC && AC.state === "suspended") AC.resume(); }

// 基础方波
function sq(freq, t0, dur, vol, type) {
  const o = AC.createOscillator();
  const g = AC.createGain();
  o.type = type || "square";
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(AC.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
  return o;
}
// 噪声
function noise(t0, dur, vol, lp) {
  const len = Math.max(1, (dur * AC.sampleRate) | 0);
  const buf = AC.createBuffer(1, len, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = AC.createBufferSource(); src.buffer = buf;
  const g = AC.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  let node = src;
  if (lp) {
    const f = AC.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lp;
    src.connect(f); node = f;
  }
  node.connect(g); g.connect(AC.destination);
  src.start(t0); src.stop(t0 + dur);
}
// 扫频
function sweep(f0, f1, t0, dur, vol, type) {
  const o = AC.createOscillator();
  const g = AC.createGain();
  o.type = type || "square";
  o.frequency.setValueAtTime(f0, t0);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(AC.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
// 音符序列 [(midi, dur)],三角/方波
function seq(notes, type, vol) {
  let t = AC.currentTime + 0.01;
  for (const [m, d] of notes) {
    if (m > 0) sq(440 * Math.pow(2, (m - 69) / 12), t, d, vol, type);
    t += d;
  }
}

const SFX = {
  jumpSmall() { sweep(220, 900, AC.currentTime, 0.18, 0.12); },
  jumpBig()   { sweep(160, 640, AC.currentTime, 0.2, 0.14); },
  coin() {
    const t = AC.currentTime;
    sq(988, t, 0.09, 0.12); sq(1319, t + 0.09, 0.35, 0.12);
  },
  stomp()   { noise(AC.currentTime, 0.12, 0.18, 3000); sweep(500, 120, AC.currentTime, 0.12, 0.1); },
  bump()    { sq(110, AC.currentTime, 0.12, 0.16, "triangle"); noise(AC.currentTime, 0.06, 0.08, 800); },
  brickBreak() { noise(AC.currentTime, 0.25, 0.2, 2500); },
  kick()    { sweep(700, 200, AC.currentTime, 0.1, 0.14); },
  sprout()  { sweep(120, 1400, AC.currentTime, 0.5, 0.1, "triangle"); },
  powerup() {
    seq([[60,.07],[67,.07],[72,.07],[76,.07],[79,.07],[84,.12]], "square", 0.1);
  },
  shrink() {
    seq([[84,.07],[79,.07],[76,.07],[72,.07],[67,.07],[60,.12]], "square", 0.1);
  },
  fireball() { sweep(1200, 300, AC.currentTime, 0.12, 0.12); },
  pipe()    { sweep(600, 90, AC.currentTime, 0.35, 0.12); },
  oneUp() {
    seq([[76,.09],[81,.09],[88,.09],[84,.09],[86,.09],[89,.18]], "square", 0.1);
  },
  die() {
    seq([[71,.12],[70,.12],[69,.18],[0,.1],[64,.14],[69,.14],[67,.3]], "square", 0.11);
  },
  flagpole() {
    seq([[55,.09],[60,.09],[64,.09],[67,.09],[72,.09],[76,.09],[79,.22]], "square", 0.11);
  },
  win() {
    seq([[72,.1],[76,.1],[79,.1],[84,.1],[79,.1],[84,.3]], "square", 0.11);
  },
  gameOver() {
    seq([[67,.14],[64,.14],[60,.28],[62,.14],[59,.14],[55,.4]], "triangle", 0.12);
  },
  warning() {
    seq([[88,.1],[88,.1],[88,.1]], "square", 0.12);
  },
  score() { sq(1568, AC.currentTime, 0.1, 0.08); },
};

function playSFX(name) {
  if (!audioReady || !AC) return;
  resumeAudio();
  try { SFX[name] && SFX[name](); } catch (e) {}
}
