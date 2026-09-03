// enemies.js - 敌人:栗宝宝 / 诺库龟(龟壳) / 食人花 / 火球
"use strict";

class Enemy {
  constructor(spawn) {
    this.type = spawn.type;
    this.x = spawn.x; this.y = spawn.y;
    this.vx = 0; this.vy = 0;
    this.dead = false;
    this.removeMe = false;
    this.active = false;         // 进入摄像机范围才激活
    this.frame = 0;
    this.flipTimer = 0;
    if (this.type === "goomba") {
      this.w = 14; this.h = 14; this.vx = -0.4;
    } else if (this.type === "koopa") {
      this.w = 14; this.h = 22; this.vx = -0.4;
      this.shell = false; this.shellMoving = false; this.wakeTimer = 0;
    } else if (this.type === "piranha") {
      this.w = 14; this.h = 22;
      this.pipeX = spawn.pipeX * TILE; this.pipeH = spawn.pipeH;
      this.baseY = (13 - spawn.pipeH) * TILE;   // 管口 y
      this.x = this.pipeX + 1;
      this.y = this.baseY;                       // 藏在管内
      this.state = "hide"; this.timer = 60; this.vy = 0;
      this.active = true;
    }
  }

  stomp(byPlayer) {
    if (this.type === "goomba") {
      this.dead = true; this.flat = true; this.timer = 30;
      playSFX("stomp"); addScore(100, this.x, this.y);
    } else if (this.type === "koopa") {
      if (!this.shell) {
        this.shell = true; this.shellMoving = false;
        this.h = 14; this.y += 8; this.vx = 0; this.wakeTimer = 600;
        playSFX("stomp"); addScore(100, this.x, this.y);
      } else {
        // 踢龟壳
        this.shellMoving = true;
        this.vx = (byPlayer.x + byPlayer.w / 2 < this.x + this.w / 2) ? 3.5 : -3.5;
        this.wakeTimer = 99999;
        playSFX("kick"); addScore(100, this.x, this.y);
      }
    }
  }

  hitByShellOrFire() {
    this.dead = true; this.flipped = true;
    this.vy = -5; this.vx = 1;
    playSFX("kick"); addScore(200, this.x, this.y);
  }

  update() {
    if (this.removeMe) return;
    // 激活检测
    if (!this.active) {
      if (this.x < G.camX + SCR_W + TILE * 2) this.active = true;
      else return;
    }
    this.frame++;

    if (this.dead) {
      if (this.flat) { this.timer--; if (this.timer <= 0) this.removeMe = true; return; }
      // 翻倒下落
      this.vy += GRAVITY; this.y += this.vy; this.x += this.vx;
      if (this.y > SCR_H + 48) this.removeMe = true;
      return;
    }

    if (this.type === "piranha") { this.updatePiranha(); return; }

    // 龟壳静止唤醒
    if (this.type === "koopa" && this.shell && !this.shellMoving) {
      this.wakeTimer--;
      if (this.wakeTimer <= 0) {
        this.shell = false; this.h = 22; this.y -= 8; this.vx = -0.4;
      }
    }

    this.vy += GRAVITY; if (this.vy > MAX_FALL) this.vy = MAX_FALL;

    // 水平碰撞
    this.x += this.vx;
    const lvl = G.level;
    if (this.vx > 0) {
      const tx = Math.floor((this.x + this.w) / TILE);
      for (let ty = Math.floor(this.y / TILE); ty <= Math.floor((this.y + this.h - 1) / TILE); ty++) {
        if (tileSolid(tileAt(lvl, tx, ty))) { this.x = tx * TILE - this.w - 0.01; this.vx = -Math.abs(this.vx); break; }
      }
    } else if (this.vx < 0) {
      const tx = Math.floor(this.x / TILE);
      for (let ty = Math.floor(this.y / TILE); ty <= Math.floor((this.y + this.h - 1) / TILE); ty++) {
        if (tileSolid(tileAt(lvl, tx, ty))) { this.x = (tx + 1) * TILE + 0.01; this.vx = Math.abs(this.vx); break; }
      }
    }
    // 垂直
    this.y += this.vy;
    let grounded = false;
    if (this.vy > 0) {
      const ty = Math.floor((this.y + this.h) / TILE);
      for (let tx = Math.floor(this.x / TILE); tx <= Math.floor((this.x + this.w - 1) / TILE); tx++) {
        if (tileSolid(tileAt(lvl, tx, ty))) { this.y = ty * TILE - this.h; this.vy = 0; grounded = true; break; }
      }
    } else if (this.vy < 0) {
      const ty = Math.floor(this.y / TILE);
      for (let tx = Math.floor(this.x / TILE); tx <= Math.floor((this.x + this.w - 1) / TILE); tx++) {
        if (tileSolid(tileAt(lvl, tx, ty))) { this.y = (ty + 1) * TILE + 0.01; this.vy = 0; break; }
      }
    }
    // 顶砖翻面杀死:站在被顶起的砖上
    if (grounded) {
      const ty = Math.floor((this.y + this.h) / TILE);
      for (let tx = Math.floor(this.x / TILE); tx <= Math.floor((this.x + this.w - 1) / TILE); tx++) {
        if (G.bumpTiles.some(b => b.tx === tx && b.ty === ty)) { this.hitByShellOrFire(); }
      }
    }

    // 掉出世界
    if (this.y > SCR_H + 48) this.removeMe = true;
    if (this.x < G.camX - 64) this.removeMe = true;
  }

  updatePiranha() {
    const p = G.player;
    const nearPlayer = Math.abs((p.x + p.w / 2) - (this.x + this.w / 2)) < 20;
    this.timer--;
    if (this.state === "hide") {
      this.y = this.baseY + 24 - 24; // 完全藏入
      this.y = this.baseY + 24;
      if (this.timer <= 0 && !nearPlayer) { this.state = "rise"; this.timer = 40; }
    } else if (this.state === "rise") {
      this.y -= 24 / 40;
      if (this.timer <= 0) { this.state = "show"; this.timer = 50; }
    } else if (this.state === "show") {
      if (this.timer <= 0) { this.state = "sink"; this.timer = 40; }
    } else if (this.state === "sink") {
      this.y += 24 / 40;
      if (this.timer <= 0) { this.state = "hide"; this.timer = 80; }
    }
  }

  draw(ctx) {
    if (!this.active || this.removeMe) return;
    let img;
    if (this.type === "goomba") {
      if (this.flat) img = bakeSprite(GOOMBA_FLAT, ENEMY_PAL);
      else img = bakeSprite((this.frame >> 4) % 2 ? GOOMBA_1 : GOOMBA_2, ENEMY_PAL, this.dead);
    } else if (this.type === "koopa") {
      if (this.shell) img = bakeSprite(KOOPA_SHELL, ENEMY_PAL);
      else img = bakeSprite((this.frame >> 4) % 2 ? KOOPA_1 : KOOPA_2, ENEMY_PAL, this.vx > 0);
    } else if (this.type === "piranha") {
      img = bakeSprite((this.frame >> 4) % 2 ? PIRANHA_OPEN : PIRANHA_CLOSED, ENEMY_PAL);
    }
    if (img) ctx.drawImage(img, Math.round(this.x - 1), Math.round(this.y + this.h - img.height));
  }
}

// ---------- 火球 ----------
class Fireball {
  constructor(x, y, dir) {
    this.x = x; this.y = y; this.w = 8; this.h = 8;
    this.vx = 4 * dir; this.vy = 1;
    this.removeMe = false; this.frame = 0;
  }
  update() {
    this.frame++;
    this.vy += 0.25;
    this.x += this.vx;
    const lvl = G.level;
    // 侧撞消失
    const tx = Math.floor((this.x + (this.vx > 0 ? this.w : 0)) / TILE);
    const ty = Math.floor((this.y + 4) / TILE);
    if (tileSolid(tileAt(lvl, tx, ty))) { this.explode(); return; }
    this.y += this.vy;
    const by = Math.floor((this.y + this.h) / TILE);
    for (let cx = Math.floor(this.x / TILE); cx <= Math.floor((this.x + this.w - 1) / TILE); cx++) {
      if (tileSolid(tileAt(lvl, cx, by))) {
        this.y = by * TILE - this.h; this.vy = -3.2; break;
      }
    }
    if (this.y > SCR_H + 32 || this.x < G.camX - 16 || this.x > G.camX + SCR_W + 16) this.removeMe = true;
  }
  explode() {
    this.removeMe = true;
    playSFX("bump");
    spawnParticles(this.x, this.y, PAL.flowerR, 4);
  }
  draw(ctx) {
    ctx.drawImage(bakeSprite(FIREBALL, { R: "red", Y: "star", W: "white", K: "black" }, (this.frame >> 2) % 2),
      Math.round(this.x), Math.round(this.y));
  }
}

function spawnFireball(x, y, dir) { G.fireballs.push(new Fireball(x, y, dir)); }
