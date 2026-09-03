// music.js - 原创芯片风 BGM(不复制原曲旋律,仅致敬 8-bit 风格)
"use strict";

let BGM = { playing: false, timer: null, step: 0, track: "overworld", muted: false };

// 原创旋律 [midi, 拍](0=休止) — 明快进行曲风
const MELODY_OW = [
  [72,.25],[76,.25],[79,.25],[76,.25],[81,.5],[79,.5],[76,.5],
  [72,.25],[76,.25],[79,.25],[76,.25],[84,.5],[81,.5],[79,.5],
  [77,.25],[81,.25],[84,.25],[81,.25],[86,.5],[84,.5],[81,.5],
  [77,.25],[81,.25],[84,.25],[81,.25],[79,.75],[76,.25],[72,.75],
];
const BASS_OW = [
  [48,.5],[55,.5],[48,.5],[55,.5],[45,.5],[52,.5],[48,.5],[55,.5],
  [48,.5],[55,.5],[48,.5],[55,.5],[45,.5],[52,.5],[43,.5],[48,.5],
];
const MELODY_UG = [
  [60,.25],[63,.25],[67,.25],[63,.25],[60,.25],[63,.25],[67,.5],
  [58,.25],[62,.25],[65,.25],[62,.25],[58,.25],[62,.25],[65,.5],
];
const BASS_UG = [
  [36,.5],[43,.5],[36,.5],[43,.5],[34,.5],[41,.5],[34,.5],[41,.5],
];

function bgmNote(freq, t, dur, vol, type) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t);
  g.gain.setValueAtTime(vol, t + dur * 0.75);
  g.gain.linearRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(AC.destination);
  o.start(t); o.stop(t + dur + 0.02);
}
const m2f = m => 440 * Math.pow(2, (m - 69) / 12);

function bgmTick() {
  if (!BGM.playing || BGM.muted) return;
  const beat = BGM.track === "overworld" ? 0.22 : 0.24;
  const mel = BGM.track === "overworld" ? MELODY_OW : MELODY_UG;
  const bas = BGM.track === "overworld" ? BASS_OW : BASS_UG;
  const melLen = mel.length, basLen = bas.length;
  // 按"步进"播放:每步取旋律与贝斯当前音符
  let mi = BGM.step % melLen, bi = BGM.step % basLen;
  const t = AC.currentTime + 0.02;
  const [mm, md] = mel[mi];
  if (mm > 0) bgmNote(m2f(mm), t, md * beat * 2.2, 0.05, "square");
  const [bm, bd] = bas[bi];
  if (bm > 0) bgmNote(m2f(bm), t, bd * beat * 2.2, 0.06, "triangle");
  BGM.step++;
  BGM.timer = setTimeout(bgmTick, beat * 1000);
}

function playMusic(track) {
  stopMusic();
  if (!audioReady || !AC) return;
  BGM.track = track; BGM.step = 0; BGM.playing = true;
  bgmTick();
}
function stopMusic() {
  BGM.playing = false;
  if (BGM.timer) { clearTimeout(BGM.timer); BGM.timer = null; }
}
function toggleMute() {
  BGM.muted = !BGM.muted;
}
