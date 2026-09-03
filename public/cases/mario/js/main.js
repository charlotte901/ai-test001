// main.js - 启动 / 输入 / 主循环
"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const input = {
  left: false, right: false, down: false,
  jump: false, run: false,
  jumpPressed: false, runPressed: false, startPressed: false,
};

const KEYMAP = {
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
  ArrowDown: "down", KeyS: "down",
  ArrowUp: "jump", KeyW: "jump", KeyZ: "jump", Space: "jump", KeyK: "jump",
  KeyX: "run", KeyJ: "run", ShiftLeft: "run", ShiftRight: "run",
};

window.addEventListener("keydown", (e) => {
  if (e.repeat) { if (KEYMAP[e.code]) e.preventDefault(); return; }
  initAudio(); resumeAudio();
  const k = KEYMAP[e.code];
  if (k) {
    if (k === "jump" && !input.jump) input.jumpPressed = true;
    if (k === "run" && !input.run) input.runPressed = true;
    input[k] = true;
    e.preventDefault();
  }
  if (e.code === "Enter") { input.startPressed = true; e.preventDefault(); }
  if (e.code === "KeyM") toggleMute();
});
window.addEventListener("keyup", (e) => {
  const k = KEYMAP[e.code];
  if (k) input[k] = false;
});

// 触屏支持(简易): 左半屏左右, 右半屏跳/跑
let touchLeft = null, touchRight = null;
canvas.addEventListener("touchstart", handleTouch, { passive: false });
canvas.addEventListener("touchmove", handleTouch, { passive: false });
canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  input.left = input.right = input.jump = input.run = false;
}, { passive: false });
function handleTouch(e) {
  e.preventDefault();
  initAudio(); resumeAudio();
  input.left = input.right = input.jump = input.run = false;
  const r = canvas.getBoundingClientRect();
  for (const t of e.touches) {
    const x = (t.clientX - r.left) / r.width;
    if (x < 0.25) input.left = true;
    else if (x < 0.5) input.right = true;
    else if (x < 0.75) { if (!input.jump) input.jumpPressed = true; input.jump = true; }
    else { input.run = true; }
  }
  if (G && G.state === "title") input.startPressed = true;
}

// 固定步长主循环
let lastTime = 0, acc = 0;
const STEP = 1000 / 60;

function loop(ts) {
  requestAnimationFrame(loop);
  if (!lastTime) lastTime = ts;
  acc += Math.min(100, ts - lastTime);
  lastTime = ts;
  while (acc >= STEP) {
    acc -= STEP;
    // 单帧异常不允许杀死 rAF 链(否则游戏画面永久冻结)
    try { window.showcaseStep?.(); updateGame(input); } catch (e) { console.error("update:", e); }
    input.jumpPressed = false;
    input.runPressed = false;
    input.startPressed = false;
  }
  render(ctx);
}

// 启动
buildTileImages();
newGame();
// 调试/自动化测试钩子
Object.defineProperty(window, "G", { get: () => G, configurable: true });
requestAnimationFrame(loop);
