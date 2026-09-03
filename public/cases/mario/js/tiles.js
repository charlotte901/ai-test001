// tiles.js - 像素图烘焙 + 图块绘制系统
"use strict";

// 把字符串像素图烘焙为 canvas
function bakeSprite(rows, palMap, flip) {
  const h = rows.length;
  const w = rows[0].length;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === "." || ch === " ") continue;
      const key = palMap[ch];
      if (!key) continue;
      g.fillStyle = PAL[key] || key;
      g.fillRect(flip ? (w - 1 - x) : x, y, 1, 1);
    }
  }
  return c;
}

// ---------- 图块 ID ----------
const T = {
  EMPTY: 0, GROUND: 1, BRICK: 2, Q_COIN: 3, Q_MUSH: 4, Q_STAR: 5,
  USED: 6, PIPE_TL: 7, PIPE_TR: 8, PIPE_L: 9, PIPE_R: 10,
  STONE: 11, COIN: 12, INVIS_COIN: 13, INVIS_1UP: 14,
  POLE: 15, POLE_TOP: 16, FLAG: 17, Q_1UP: 18,
};
// 实心判定
function tileSolid(t) {
  return t === T.GROUND || t === T.BRICK || t === T.USED ||
         t === T.PIPE_TL || t === T.PIPE_TR || t === T.PIPE_L || t === T.PIPE_R ||
         t === T.STONE || t === T.Q_COIN || t === T.Q_MUSH || t === T.Q_STAR ||
         t === T.Q_1UP || t === T.INVIS_COIN || t === T.INVIS_1UP;
}
function tileIsQuestion(t) {
  return t === T.Q_COIN || t === T.Q_MUSH || t === T.Q_STAR || t === T.Q_1UP;
}

// ---------- 程序化绘制 16x16 图块 ----------
function makeTile(fn) {
  const c = document.createElement("canvas");
  c.width = 16; c.height = 16;
  fn(c.getContext("2d"));
  return c;
}

function drawGroundTile(g, dark) {
  const base = dark ? PAL.ugBrick : PAL.ground;
  const lt = dark ? PAL.ugBrickLt : PAL.groundLt;
  g.fillStyle = base; g.fillRect(0, 0, 16, 16);
  g.fillStyle = lt;
  g.fillRect(0, 0, 16, 2); g.fillRect(0, 0, 2, 16);
  g.fillRect(8, 3, 6, 1); g.fillRect(2, 7, 6, 1); g.fillRect(9, 11, 6, 1);
  g.fillStyle = PAL.black;
  g.fillRect(0, 15, 16, 1); g.fillRect(15, 0, 1, 16);
  g.fillRect(7, 4, 1, 2); g.fillRect(13, 8, 1, 2); g.fillRect(4, 12, 1, 2);
}

function drawBrickTile(g, dark) {
  const base = dark ? PAL.ugBrick : PAL.brick;
  const lt = dark ? PAL.ugBrickLt : PAL.brickLt;
  g.fillStyle = base; g.fillRect(0, 0, 16, 16);
  g.fillStyle = lt;
  g.fillRect(0, 0, 16, 1); g.fillRect(0, 4, 16, 1); g.fillRect(0, 8, 16, 1); g.fillRect(0, 12, 16, 1);
  g.fillStyle = PAL.black;
  g.fillRect(0, 3, 16, 1); g.fillRect(0, 7, 16, 1); g.fillRect(0, 11, 16, 1); g.fillRect(0, 15, 16, 1);
  g.fillRect(4, 0, 1, 3); g.fillRect(12, 0, 1, 3);
  g.fillRect(0, 4, 1, 3); g.fillRect(8, 4, 1, 3);
  g.fillRect(4, 8, 1, 3); g.fillRect(12, 8, 1, 3);
  g.fillRect(0, 12, 1, 3); g.fillRect(8, 12, 1, 3);
}

function drawQuestionTile(g, frame) {
  // frame: 0 亮, 1 中, 2 暗 (闪烁动画)
  const cols = [PAL.qblock, "#d89000", PAL.qblockDk];
  const main = cols[frame];
  g.fillStyle = main; g.fillRect(0, 0, 16, 16);
  g.fillStyle = PAL.black;
  g.fillRect(0, 0, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16);
  g.fillRect(2, 2, 1, 1); g.fillRect(13, 2, 1, 1); g.fillRect(2, 13, 1, 1); g.fillRect(13, 13, 1, 1);
  // 问号
  const q = frame === 0 ? PAL.white : (frame === 1 ? "#e0c060" : "#a08030");
  g.fillStyle = q;
  const px = [ // 8x8 问号像素
    "01111000","11001100","11001100","00011000","00110000","00110000","00000000","00110000"
  ];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++)
    if (px[y][x] === "1") g.fillRect(4 + x, 4 + y, 1, 1);
}

function drawUsedTile(g) {
  g.fillStyle = PAL.qblockDk; g.fillRect(0, 0, 16, 16);
  g.fillStyle = PAL.black;
  g.fillRect(0, 0, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16);
  g.fillRect(2, 2, 1, 1); g.fillRect(13, 2, 1, 1); g.fillRect(2, 13, 1, 1); g.fillRect(13, 13, 1, 1);
}

function drawPipeTile(g, part) {
  g.fillStyle = PAL.pipe; g.fillRect(0, 0, 16, 16);
  if (part === "tl") {
    g.fillStyle = PAL.pipeLt; g.fillRect(2, 0, 4, 16);
    g.fillStyle = PAL.pipeDk; g.fillRect(12, 0, 3, 16);
    g.fillStyle = PAL.black; g.fillRect(15, 0, 1, 16);
  } else if (part === "tr") {
    g.fillStyle = PAL.pipeLt; g.fillRect(1, 0, 3, 16);
    g.fillStyle = PAL.pipeDk; g.fillRect(11, 0, 4, 16);
    g.fillStyle = PAL.black; g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16);
  } else if (part === "l") {
    g.fillStyle = PAL.pipeLt; g.fillRect(0, 0, 4, 16);
    g.fillStyle = PAL.pipeDk; g.fillRect(10, 0, 3, 16);
    g.fillStyle = PAL.black; g.fillRect(15, 0, 1, 16); g.fillRect(13, 0, 1, 16);
  } else {
    g.fillStyle = PAL.pipeDk; g.fillRect(9, 0, 4, 16);
    g.fillStyle = PAL.black; g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16);
  }
}

function drawStoneTile(g) {
  g.fillStyle = PAL.stone; g.fillRect(0, 0, 16, 16);
  g.fillStyle = PAL.stoneLt; g.fillRect(0, 0, 16, 2); g.fillRect(0, 0, 2, 16);
  g.fillStyle = PAL.black; g.fillRect(0, 14, 16, 2); g.fillRect(14, 0, 2, 16);
}

function drawCoinTile(g, frame) {
  // 旋转金币 4 帧宽度变化
  const widths = [6, 4, 2, 4];
  const w = widths[frame];
  g.fillStyle = PAL.coin;
  g.fillRect(8 - w, 3, w * 2, 10);
  g.fillStyle = PAL.coinDk;
  g.fillRect(8 - w, 3, 1, 10);
  if (w >= 4) { g.fillStyle = PAL.white; g.fillRect(8 - w + 2, 5, 1, 6); }
}

function drawPoleTile(g, top) {
  g.fillStyle = PAL.flag;
  g.fillRect(7, 0, 2, 16);
  if (top) {
    g.fillStyle = PAL.flagDk;
    g.fillRect(5, 0, 6, 6);
    g.fillStyle = PAL.flag;
    g.fillRect(6, 1, 4, 4);
  }
}

function drawFlagTile(g) {
  g.fillStyle = PAL.white;
  g.fillRect(0, 2, 7, 6);
  g.fillStyle = PAL.flag;
  g.fillRect(2, 4, 3, 2);
}

// 图块画布缓存 {id: [frames]}
let TILE_IMGS = null;
function buildTileImages() {
  TILE_IMGS = {};
  TILE_IMGS[T.GROUND] = [makeTile(g => drawGroundTile(g, false))];
  TILE_IMGS[T.BRICK] = [makeTile(g => drawBrickTile(g, false))];
  TILE_IMGS[T.Q_COIN] = [0,1,2].map(f => makeTile(g => drawQuestionTile(g, f)));
  TILE_IMGS[T.Q_MUSH] = TILE_IMGS[T.Q_COIN];
  TILE_IMGS[T.Q_STAR] = TILE_IMGS[T.Q_COIN];
  TILE_IMGS[T.Q_1UP] = TILE_IMGS[T.Q_COIN];
  TILE_IMGS[T.USED] = [makeTile(drawUsedTile)];
  TILE_IMGS[T.PIPE_TL] = [makeTile(g => drawPipeTile(g, "tl"))];
  TILE_IMGS[T.PIPE_TR] = [makeTile(g => drawPipeTile(g, "tr"))];
  TILE_IMGS[T.PIPE_L] = [makeTile(g => drawPipeTile(g, "l"))];
  TILE_IMGS[T.PIPE_R] = [makeTile(g => drawPipeTile(g, "r"))];
  TILE_IMGS[T.STONE] = [makeTile(drawStoneTile)];
  TILE_IMGS[T.COIN] = [0,1,2,3].map(f => makeTile(g => drawCoinTile(g, f)));
  TILE_IMGS[T.POLE] = [makeTile(g => drawPoleTile(g, false))];
  TILE_IMGS[T.POLE_TOP] = [makeTile(g => drawPoleTile(g, true))];
  TILE_IMGS[T.FLAG] = [makeTile(drawFlagTile)];
  // 不可见方块不渲染
}

// 问号砖动画帧(全局时基)
function qFrame() { return [0, 1, 2, 1][(G.frame >> 4) % 4]; }
function coinFrame() { return (G.frame >> 3) % 4; }
