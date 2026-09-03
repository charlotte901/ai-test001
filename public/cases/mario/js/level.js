// level.js - 世界 1-1 关卡数据(代码构建,结构致敬原版)
"use strict";

// 区域结构: { w(图块宽), tiles[行][列], spawns[], pipes[], bg[], endX, area }
// 行 0..14, 地面在 13,14 两行; y 坐标以图块计

function makeGrid(w) {
  const g = [];
  for (let y = 0; y < ROWS; y++) g.push(new Array(w).fill(T.EMPTY));
  return g;
}
function fillGround(g, x0, x1) {
  for (let x = x0; x <= x1; x++) { g[13][x] = T.GROUND; g[14][x] = T.GROUND; }
}
function putPipe(g, x, h, enterable) {
  const top = 13 - h;
  g[top][x] = T.PIPE_TL; g[top][x + 1] = T.PIPE_TR;
  for (let y = top + 1; y < 13; y++) { g[y][x] = T.PIPE_L; g[y][x + 1] = T.PIPE_R; }
  return { x: x, y: top, enterable: !!enterable };
}
function putStairs(g, x, h, dir) {
  for (let i = 0; i < h; i++) {
    const cx = dir > 0 ? x + i : x + h - 1 - i;
    for (let y = 12; y > 12 - (i + 1); y--) g[y][cx] = T.STONE;
  }
}

// ============ 世界 1-1 地上部分 (宽 212) ============
function buildWorld11() {
  const W = 212;
  const g = makeGrid(W);
  // 地面段(含 3 处沟壑: 69-70, 86-88, 153-154)
  fillGround(g, 0, 68); fillGround(g, 71, 85); fillGround(g, 89, 152); fillGround(g, 155, 211);
  const spawns = [];   // {type, x, y}
  const deco = [];     // 背景装饰 {type, x, y}

  // 首个问号砖 (x16,y9)
  g[9][16] = T.Q_COIN;
  // 六块三角阵: 砖 ? 砖 ? 砖 (y9, x20-24), 上方中央 ? (y5, x22)
  g[9][20] = T.BRICK; g[9][21] = T.Q_COIN; g[9][22] = T.BRICK; g[9][23] = T.Q_MUSH; g[9][24] = T.BRICK;
  g[5][22] = T.Q_COIN;

  // 水管 x28(h2) x36(h3) x44(h4) x56(h4,可进入地下)
  const pipes = [
    putPipe(g, 28, 2, false),
    putPipe(g, 36, 3, false),
    putPipe(g, 44, 4, false),
    putPipe(g, 56, 4, true),
  ];
  // 隐藏 1UP 砖 (x30, y9) — 在一号与二号水管之间
  g[9][30] = T.INVIS_1UP;

  // 沟壑前高砖阵: y5 x77-81 砖砖?砖砖, y9 x80,81 砖
  g[5][77] = T.BRICK; g[5][78] = T.BRICK; g[5][79] = T.Q_COIN; g[5][80] = T.BRICK; g[5][81] = T.BRICK;
  g[9][80] = T.BRICK; g[9][81] = T.BRICK;

  // 第二沟壑后: ? (x89,y9), 砖(x94,y9) ?(x95,y9,星星) 砖(x96,y9), 上方 y5 两砖
  g[9][89] = T.Q_COIN;
  g[9][94] = T.BRICK; g[9][95] = T.Q_STAR; g[9][96] = T.BRICK;
  g[5][94] = T.BRICK; g[5][95] = T.BRICK;

  // 中空双砖: x100,y5 砖, x106,y9 ?蘑菇, x109-112,y9 砖?砖砖
  g[5][100] = T.BRICK;
  g[9][106] = T.Q_MUSH;
  g[9][109] = T.BRICK; g[9][110] = T.Q_COIN; g[9][111] = T.BRICK; g[9][112] = T.BRICK;
  // 高空砖 x112-115,y5
  g[5][112] = T.BRICK; g[5][113] = T.BRICK; g[5][114] = T.BRICK; g[5][115] = T.BRICK;

  // 楼梯群: 上4 x134, 下4 x140; 再上4 x142+? 调整:第二组避开沟壑(153-154)
  putStairs(g, 134, 4, 1);
  putStairs(g, 140, 4, -1);
  putStairs(g, 144, 4, 1);
  putStairs(g, 148, 4, -1);

  // 沟壑后浮砖 x155-157,y9: 砖 ? 砖 ; 高空 y5 x157-160 砖
  g[9][155] = T.BRICK; g[9][156] = T.Q_COIN; g[9][157] = T.BRICK;
  g[5][157] = T.BRICK; g[5][158] = T.BRICK; g[5][159] = T.BRICK; g[5][160] = T.BRICK;

  // 终点大楼梯 x174-181 (8级), 旗杆 x192
  putStairs(g, 174, 8, 1);
  for (let y = 4; y < 13; y++) g[y][192] = T.POLE;
  g[3][192] = T.POLE_TOP;
  g[4][191] = T.FLAG;

  // 敌人出生点
  const goomba = (x) => spawns.push({ type: "goomba", x: x * TILE, y: 11 * TILE });
  goomba(22); goomba(40); goomba(41); goomba(51); goomba(52);
  goomba(78); goomba(97); goomba(98); goomba(107); goomba(109);
  goomba(124); goomba(125); goomba(127); goomba(128);
  spawns.push({ type: "koopa", x: 103 * TILE, y: 10 * TILE });
  // 食人花(在二号/三号水管)
  spawns.push({ type: "piranha", x: 36 * TILE, y: 10 * TILE, pipeX: 36, pipeH: 3 });
  spawns.push({ type: "piranha", x: 44 * TILE, y: 9 * TILE, pipeX: 44, pipeH: 4 });

  // 背景装饰(云/灌木/山丘)
  const B = (type, x, y) => deco.push({ type, x, y });
  B("cloud1", 8, 3); B("cloud2", 19, 2); B("cloud1", 27, 3); B("cloud3", 36, 2);
  B("cloud2", 48, 3); B("cloud1", 56, 2); B("cloud3", 67, 3); B("cloud2", 75, 2);
  B("cloud1", 87, 3); B("cloud2", 103, 2); B("cloud1", 115, 3); B("cloud3", 128, 2);
  B("cloud2", 140, 3); B("cloud1", 152, 2); B("cloud3", 167, 3); B("cloud2", 181, 2);
  B("hill1", 0, 11); B("hill2", 16, 10); B("hill1", 48, 11); B("hill2", 64, 10);
  B("hill1", 96, 11); B("hill2", 112, 10); B("hill1", 144, 11); B("hill2", 160, 10);
  B("bush1", 11, 12); B("bush2", 23, 12); B("bush3", 41, 12); B("bush1", 59, 12);
  B("bush2", 71, 12); B("bush3", 89, 12); B("bush1", 107, 12); B("bush2", 119, 12);
  B("bush3", 137, 12); B("bush1", 155, 12); B("bush2", 167, 12); B("bush3", 183, 12);

  return {
    area: "overworld", w: W, tiles: g, spawns, deco, pipes,
    playerStart: { x: 3 * TILE, y: 11 * TILE },
    poleX: 192 * TILE, castleX: 198 * TILE, endX: 210 * TILE,
  };
}

// ============ 地下金币房 (宽 32) ============
function buildUnderground() {
  const W = 32;
  const g = makeGrid(W);
  fillGround(g, 0, W - 1);
  // 顶部封顶
  for (let x = 0; x < W; x++) { g[0][x] = T.GROUND; g[1][x] = T.GROUND; }
  // 左墙与入口立管区域
  for (let y = 2; y < 13; y++) { g[y][0] = T.GROUND; g[y][1] = T.GROUND; }
  // 金币阵
  for (let x = 8; x < 16; x++) g[7][x] = T.COIN;
  for (let x = 9; x < 15; x++) g[5][x] = T.COIN;
  // 奖励砖
  g[9][18] = T.Q_COIN; g[9][19] = T.BRICK; g[9][20] = T.Q_COIN;
  // 右侧出口立管(通往地上)
  for (let y = 2; y < 13; y++) { g[y][30] = T.GROUND; g[y][31] = T.GROUND; }
  const pipes = [{ x: 27, y: 10, exit: true }];
  g[10][27] = T.PIPE_TL; g[10][28] = T.PIPE_TR;
  for (let y = 11; y < 13; y++) { g[y][27] = T.PIPE_L; g[y][28] = T.PIPE_R; }
  return {
    area: "underground", w: W, tiles: g, spawns: [], deco: [], pipes,
    playerStart: { x: 3 * TILE, y: 11 * TILE },
    poleX: -1, castleX: -1, endX: -1,
    exitPipe: { x: 27, y: 10 },
  };
}
