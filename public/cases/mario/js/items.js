// items.js - 道具:蘑菇/1UP/火焰花/星星/蹦出金币/弹字/粒子
"use strict";

class Item {
  constructor(kind, tx, ty) {
    this.kind = kind;               // mushroom | 1up | flower | star
    this.x = tx * TILE;
    this.y = ty * TILE;
    this.w = 14; this.h = 14;
    this.vx = 0; this.vy = 0;
    this.sprout = 30;               // 出土动画
    this.removeMe = false;
    this.frame = 0;
    playSFX("sprout");
  }
  update() {
    this.frame++;
    if (this.sprout > 0) { this.sprout--; this.y -= 0.55; return; }
    if (this.kind === "flower") return;   // 花静止不动
    // 蘑菇/星星移动
    if (this.vx === 0) this.vx = this.kind === "star" ? 1.2 : 0.9;
    this.vy += GRAVITY; if (this.vy > MAX_FALL) this.vy = MAX_FALL;
    const lvl = G.level;
    this.x += this.vx;
    if (this.vx > 0) {
      const tx = Math.floor((this.x + this.w) / TILE);
      for (let ty = Math.floor(this.y / TILE); ty <= Math.floor((this.y + this.h - 1) / TILE); ty++)
        if (tileSolid(tileAt(lvl, tx, ty))) { this.x = tx * TILE - this.w - 0.01; this.vx = -Math.abs(this.vx); break; }
    } else {
      const tx = Math.floor(this.x / TILE);
      for (let ty = Math.floor(this.y / TILE); ty <= Math.floor((this.y + this.h - 1) / TILE); ty++)
        if (tileSolid(tileAt(lvl, tx, ty))) { this.x = (tx + 1) * TILE + 0.01; this.vx = Math.abs(this.vx); break; }
    }
    this.y += this.vy;
    if (this.vy > 0) {
      const ty = Math.floor((this.y + this.h) / TILE);
      for (let tx = Math.floor(this.x / TILE); tx <= Math.floor((this.x + this.w - 1) / TILE); tx++)
        if (tileSolid(tileAt(lvl, tx, ty))) {
          this.y = ty * TILE - this.h; this.vy = this.kind === "star" ? -4.5 : 0; break;
        }
    } else if (this.vy < 0) {
      const ty = Math.floor(this.y / TILE);
      for (let tx = Math.floor(this.x / TILE); tx <= Math.floor((this.x + this.w - 1) / TILE); tx++)
        if (tileSolid(tileAt(lvl, tx, ty))) { this.y = (ty + 1) * TILE + 0.01; this.vy = 0; break; }
    }
    if (this.y > SCR_H + 32) this.removeMe = true;
  }
  draw(ctx) {
    let rows;
    if (this.kind === "mushroom") rows = MUSHROOM;
    else if (this.kind === "1up") rows = ONEUP;
    else if (this.kind === "flower") rows = FLOWER;
    else rows = STAR;
    ctx.drawImage(bakeSprite(rows, SPR_EXTRA_PAL), Math.round(this.x - 1), Math.round(this.y - 2));
  }
}

// 从方块蹦出的金币(直起直落)
class PopCoin {
  constructor(tx, ty) {
    this.x = tx * TILE; this.y = ty * TILE - TILE;
    this.vy = -7; this.life = 30; this.removeMe = false;
  }
  update() {
    this.life--;
    this.vy += 0.5; this.y += this.vy;
    if (this.life <= 0) this.removeMe = true;
  }
  draw(ctx) {
    ctx.drawImage(bakeSprite(COIN_F, COIN_ITEM_PAL), Math.round(this.x), Math.round(this.y));
  }
}

// 分数弹字
class Popup {
  constructor(text, x, y) {
    this.text = text; this.x = x; this.y = y;
    this.life = 45; this.removeMe = false;
  }
  update() { this.life--; this.y -= 0.6; if (this.life <= 0) this.removeMe = true; }
  draw(ctx) { drawText(ctx, this.text, Math.round(this.x), Math.round(this.y), PAL.white); }
}

// 砖块碎片
class Debris {
  constructor(x, y, vx, vy) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.removeMe = false;
  }
  update() {
    this.vy += 0.35; this.x += this.vx; this.y += this.vy;
    if (this.y > SCR_H + 32) this.removeMe = true;
  }
  draw(ctx) {
    ctx.drawImage(bakeSprite(BRICK_CHUNK, { R: "brick", L: "brickLt" }), Math.round(this.x), Math.round(this.y));
  }
}

// 通用粒子
class Particle {
  constructor(x, y, color) {
    this.x = x; this.y = y;
    this.vx = (Math.random() - 0.5) * 3;
    this.vy = -Math.random() * 3 - 1;
    this.life = 25; this.color = color; this.removeMe = false;
  }
  update() {
    this.life--; this.vy += 0.2; this.x += this.vx; this.y += this.vy;
    if (this.life <= 0) this.removeMe = true;
  }
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(Math.round(this.x), Math.round(this.y), 2, 2);
  }
}

function spawnParticles(x, y, color, n) {
  for (let i = 0; i < n; i++) G.particles.push(new Particle(x, y, color));
}
function addScore(n, x, y) {
  G.score += n;
  addPopup(String(n), x, y);
}
function addPopup(text, x, y) {
  G.popups.push(new Popup(text, x, y));
}
function addCoin(x, y) {
  G.coins++;
  G.score += 200;
  if (G.coins >= 100) { G.coins -= 100; G.lives++; playSFX("oneUp"); }
}
