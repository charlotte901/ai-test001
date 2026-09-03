// render.js - 世界渲染 / HUD / 各界面绘制
"use strict";

// ---------- 背景装饰(程序化绘制) ----------
function drawDeco(ctx, d, camX) {
  const x = Math.round(d.x * TILE - camX), y = d.y * TILE;
  if (x < -96 || x > SCR_W + 16) return;
  if (d.type.startsWith("cloud")) {
    ctx.fillStyle = PAL.cloud;
    const s = d.type === "cloud1" ? 1 : d.type === "cloud2" ? 1.5 : 2;
    ctx.fillRect(x, y + 4, 24 * s, 8);
    ctx.fillRect(x + 4 * s, y, 16 * s, 8);
    ctx.fillRect(x + 8 * s, y - 4, 8 * s, 8);
  } else if (d.type.startsWith("bush")) {
    ctx.fillStyle = PAL.bush;
    const s = d.type === "bush1" ? 1 : d.type === "bush2" ? 1.5 : 2;
    ctx.fillRect(x, y + 5, 24 * s, 11);
    ctx.fillRect(x + 4 * s, y + 1, 16 * s, 6);
    ctx.fillRect(x + 8 * s, y - 2, 8 * s, 6);
    ctx.fillStyle = PAL.bushDk;
    ctx.fillRect(x + 4 * s, y + 8, 2, 2); ctx.fillRect(x + 12 * s, y + 6, 2, 2);
  } else if (d.type.startsWith("hill")) {
    ctx.fillStyle = PAL.hill;
    const big = d.type === "hill2";
    const w = big ? 80 : 48, h = big ? 32 : 16;
    // 像素三角
    for (let i = 0; i < h; i += 2) {
      const ww = (w * (h - i)) / h;
      ctx.fillRect(x + (w - ww) / 2, y + TILE - h + i, ww, 2);
    }
    ctx.fillStyle = PAL.hillDk;
    ctx.fillRect(x + w / 2 - 6, y + TILE - h + 4, 3, 3);
    ctx.fillRect(x + w / 2 + 4, y + TILE - h + 8, 3, 3);
  }
}

// ---------- 城堡(终点) ----------
function drawCastle(ctx, baseX, baseY) {
  const x = Math.round(baseX), y = baseY;
  const B = PAL.brick, D = PAL.black, L = PAL.brickLt, W = PAL.white, K = PAL.black;
  ctx.fillStyle = B;
  // 主楼 5 宽 x 5 高 (80x80 中下部)
  ctx.fillRect(x, y - 48, 80, 48);
  // 上层 3 宽
  ctx.fillRect(x + 16, y - 80, 48, 32);
  // 城垛
  ctx.fillStyle = B;
  for (let i = 0; i < 5; i++) ctx.fillRect(x + i * 16, y - 56, 8, 8);
  for (let i = 0; i < 3; i++) ctx.fillRect(x + 16 + i * 16, y - 88, 8, 8);
  // 旗杆与小旗
  ctx.fillStyle = D; ctx.fillRect(x + 38, y - 104, 2, 16);
  ctx.fillStyle = PAL.flag; ctx.beginPath();
  ctx.moveTo(x + 40, y - 104); ctx.lineTo(x + 52, y - 100); ctx.lineTo(x + 40, y - 96); ctx.fill();
  // 门
  ctx.fillStyle = D; ctx.fillRect(x + 32, y - 24, 16, 24);
  // 窗
  ctx.fillRect(x + 12, y - 40, 8, 8); ctx.fillRect(x + 60, y - 40, 8, 8);
  ctx.fillRect(x + 36, y - 72, 8, 8);
  // 砖缝
  ctx.fillStyle = L;
  for (let yy = y - 44; yy < y - 4; yy += 8) ctx.fillRect(x + 2, yy, 76, 1);
  for (let yy = y - 76; yy < y - 52; yy += 8) ctx.fillRect(x + 18, yy, 44, 1);
}

// ---------- 主渲染 ----------
function render(ctx) {
  const lvl = G.level;
  // 天空
  ctx.fillStyle = lvl && lvl.area === "underground" ? PAL.ugSky : PAL.sky;
  ctx.fillRect(0, 0, SCR_W, SCR_H);

  if (G.state === "title") { drawTitle(ctx); return; }
  if (G.state === "lives") { drawLivesScreen(ctx); return; }
  if (G.state === "gameover") { drawCenterText(ctx, "GAME OVER", 112); return; }
  if (G.state === "thankyou") { drawThankyou(ctx); return; }

  const camX = Math.round(G.camX);
  ctx.save();
  ctx.translate(-camX, 0);

  // 背景装饰
  for (const d of lvl.deco) drawDeco(ctx, d, 0);
  // 终点城堡
  if (lvl.castleX > 0) drawCastle(ctx, lvl.castleX, 13 * TILE);
  // 食人花先画(被水管图块遮住下半段)
  for (const e of G.enemies) if (e.type === "piranha") e.draw(ctx);

  // 图块
  const x0 = Math.max(0, Math.floor(camX / TILE) - 1);
  const x1 = Math.min(lvl.w - 1, Math.ceil((camX + SCR_W) / TILE) + 1);
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const t = lvl.tiles[ty][tx];
      if (t === T.EMPTY || t === T.INVIS_COIN || t === T.INVIS_1UP) continue;
      const imgs = TILE_IMGS[t];
      if (!imgs) continue;
      let img = imgs[0];
      if (tileIsQuestion(t)) img = imgs[qFrame()];
      else if (t === T.COIN) img = imgs[coinFrame()];
      // 顶砖位移
      let dy = 0;
      const b = G.bumpTiles.find(b => b.tx === tx && b.ty === ty);
      if (b) dy = -Math.sin((b.timer / 10) * Math.PI) * 6;
      ctx.drawImage(img, tx * TILE, ty * TILE + dy);
    }
  }

  // 道具
  for (const it of G.items) it.draw(ctx);
  // 金币蹦出
  for (const c of G.popCoins) c.draw(ctx);
  // 敌人(食人花已在图块前绘制)
  for (const e of G.enemies) if (e.type !== "piranha") e.draw(ctx);
  // 火球
  for (const f of G.fireballs) f.draw(ctx);
  // 玩家
  G.player.draw(ctx);
  // 粒子/碎片
  for (const q of G.particles) q.draw(ctx);
  // 分数弹字
  for (const q of G.popups) q.draw(ctx);

  ctx.restore();

  drawHUD(ctx);
}

// ---------- HUD ----------
function pad(n, len) { return String(n).padStart(len, "0"); }
function drawHUD(ctx) {
  drawText(ctx, "MARIO", 24, 8);
  drawText(ctx, pad(G.score, 6), 24, 16);
  // 金币图标
  ctx.drawImage(TILE_IMGS[T.COIN][coinFrame()], 88, 14, 12, 12);
  drawText(ctx, "x" + pad(G.coins, 2), 100, 16);
  drawText(ctx, "WORLD", 148, 8);
  drawText(ctx, G.world, 156, 16);
  drawText(ctx, "TIME", 208, 8);
  drawText(ctx, pad(Math.max(0, G.time), 3), 212, 16);
}

// ---------- 标题界面 ----------
function drawTitle(ctx) {
  // 地面
  for (let x = 0; x < 16; x++) {
    ctx.drawImage(TILE_IMGS[T.GROUND][0], x * TILE, 13 * TILE);
    ctx.drawImage(TILE_IMGS[T.GROUND][0], x * TILE, 14 * TILE);
  }
  // 装饰
  drawDeco(ctx, { type: "hill1", x: 2, y: 11 }, 0);
  drawDeco(ctx, { type: "bush2", x: 10, y: 12 }, 0);
  drawDeco(ctx, { type: "cloud2", x: 4, y: 3 }, 0);
  drawDeco(ctx, { type: "cloud1", x: 12, y: 2 }, 0);
  // Logo(像素字,FC 风格)
  drawLogoText(ctx, "SUPER", 40, 48, PAL.white, PAL.black);
  drawLogoText(ctx, "MARIO BROS.", 24, 72, PAL.white, PAL.black);
  // 副标题横幅
  ctx.fillStyle = PAL.qblock; ctx.fillRect(44, 100, 168, 12);
  ctx.fillStyle = PAL.black; ctx.fillRect(44, 100, 168, 1); ctx.fillRect(44, 111, 168, 1);
  ctx.fillRect(44, 100, 1, 12); ctx.fillRect(211, 100, 1, 12);
  drawText(ctx, "PIXEL HOMAGE EDITION", 48, 102, PAL.black);
  // 菜单
  drawText(ctx, "1 PLAYER GAME", 72, 136);
  drawText(ctx, "2 PLAYER GAME", 72, 152);
  // 蘑菇光标
  ctx.drawImage(bakeSprite(MUSHROOM, SPR_EXTRA_PAL), 56, 134);
  drawText(ctx, "TOP- " + pad(loadHi(), 6), 88, 184);
  if ((G.frame >> 5) % 2 === 0)
    drawText(ctx, "PRESS ENTER TO START", 56, 196, PAL.white);
}

function drawLogoText(ctx, text, x, y, fg, shadow) {
  // 2 倍像素大字
  for (let i = 0; i < text.length; i++) {
    const g = getGlyph(text[i], shadow);
    const g2 = getGlyph(text[i], fg);
    ctx.drawImage(g, x + i * 16 + 2, y + 2, 16, 16);
    ctx.drawImage(g2, x + i * 16, y, 16, 16);
  }
}

// ---------- 生命数界面 ----------
function drawLivesScreen(ctx) {
  ctx.fillStyle = PAL.black; ctx.fillRect(0, 0, SCR_W, SCR_H);
  drawText(ctx, "WORLD " + G.world, 104, 88);
  ctx.drawImage(bakeSprite(SPR_MARIO.small.idle, MARIO_PAL), 88, 112);
  drawText(ctx, "x  " + G.lives, 112, 116);
}

// ---------- 通用居中文字 ----------
function drawCenterText(ctx, text, y) {
  ctx.fillStyle = PAL.black; ctx.fillRect(0, 0, SCR_W, SCR_H);
  drawText(ctx, text, (SCR_W - textWidth(text)) / 2, y);
}

function drawThankyou(ctx) {
  ctx.fillStyle = PAL.black; ctx.fillRect(0, 0, SCR_W, SCR_H);
  drawText(ctx, "THANK YOU MARIO!", 64, 88);
  drawText(ctx, "YOUR QUEST IS OVER.", 48, 112);
  drawText(ctx, "SCORE " + pad(G.score, 6), 72, 144);
  if (G.transTimer > 60 && (G.frame >> 5) % 2 === 0)
    drawText(ctx, "PRESS ENTER", 88, 176);
}
