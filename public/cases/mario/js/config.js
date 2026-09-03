// config.js - 全局常量与调色板
"use strict";

const SCR_W = 256;          // 屏幕宽(像素,FC 分辨率)
const SCR_H = 240;          // 屏幕高
const TILE = 16;            // 图块尺寸
const ROWS = 15;            // 屏幕纵向图块数
const FPS = 60;

// 物理参数(近似 FC 原版手感)
const GRAVITY = 0.5;            // 下落重力
const GRAVITY_JUMP = 0.32;      // 按住跳跃键上升时的重力(可变跳高)
const MAX_FALL = 5.0;
const WALK_ACC = 0.09;
const RUN_ACC = 0.13;
const FRICTION = 0.12;          // 松开方向键的滑动摩擦
const SKID_DECEL = 0.22;        // 急转身(反方向输入)时的减速
const MAX_WALK = 1.6;
const MAX_RUN = 2.9;
const JUMP_VEL = 7.4;           // 跳跃初速度
const JUMP_VEL_RUN = 8.2;       // 跑动跳跃
const SKID_THRESHOLD = 1.2;

// NES 风格调色板
const PAL = {
  sky:      "#5c94fc",
  black:    "#000000",
  white:    "#fcfcfc",
  // 马力欧
  red:      "#d82800",
  skin:     "#ffb8a0",
  brown:    "#7c4000",
  hair:     "#503000",
  blue:     "#2038ec",
  fireW:    "#fcfcfc",
  // 敌人
  goomba:   "#a84810",
  goombaDk: "#481c00",
  koopa:    "#00a800",
  koopaDk:  "#005000",
  koopaSk:  "#f8d878",
  // 图块
  brick:    "#c84c0c",
  brickDk:  "#000000",
  brickLt:  "#fca044",
  ground:   "#c84c0c",
  groundLt: "#fca044",
  qblock:   "#f8b800",
  qblockDk: "#a05800",
  pipe:     "#00a800",
  pipeLt:   "#80d010",
  pipeDk:   "#005000",
  stone:    "#c84c0c",
  stoneLt:  "#fca044",
  metal:    "#9c9c9c",
  metalDk:  "#404040",
  metalLt:  "#fcfcfc",
  // 道具
  mushR:    "#d82800",
  mushS:    "#fcfcfc",
  mushF:    "#ffb8a0",
  flowerG:  "#00a800",
  flowerR:  "#d82800",
  flowerY:  "#f8b800",
  star:     "#f8b800",
  coin:     "#f8b800",
  coinDk:   "#a05800",
  oneUp:    "#00a800",
  // 背景
  hill:     "#00a800",
  hillDk:   "#005000",
  cloud:    "#fcfcfc",
  bush:     "#00a800",
  bushDk:   "#005000",
  // 地下
  ugSky:    "#000000",
  ugBrick:  "#3050c8",
  ugBrickLt:"#7c9cfc",
  flag:     "#00a800",
  flagDk:   "#005000",
};

// 游戏全局状态对象(在 game.js 中初始化)
let G = null;

// 通用工具
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
