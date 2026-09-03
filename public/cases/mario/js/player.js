// player.js - 马力欧:移动/跳跃/形态/火球/受伤
"use strict";

class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 12; this.h = 14;
    this.vx = 0; this.vy = 0;
    this.face = 1;
    this.form = "small";        // small | big | fire
    this.onGround = false;
    this.ducking = false;
    this.dead = false;
    this.invincible = 0;        // 受伤无敌帧
    this.star = 0;              // 星星无敌帧
    this.growTimer = 0;         // 变身动画
    this.shrinkTimer = 0;
    this.fireCooldown = 0;
    this.skid = false;
    this.walkFrame = 0;
    this.enteringPipe = 0;      // >0 播放管道动画
    this.pipeDir = 0;
    this.flagSlide = false;
    this.autoWalk = false;      // 通关后自动行走
  }

  get big() { return this.form !== "small"; }
  get hitbox() {
    if (this.big && this.ducking) return { x: this.x, y: this.y + 16, w: this.w, h: 16 };
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  setForm(f) {
    if (f === this.form) return;
    const wasBig = this.big;
    this.form = f;
    if (this.big && !wasBig) { this.h = 30; this.y -= 16; }
    if (!this.big && wasBig) { this.h = 14; this.y += 16; }
  }

  hurt() {
    if (this.invincible > 0 || this.star > 0 || this.dead) return;
    if (this.form === "fire") {
      this.setForm("big"); this.invincible = 120; this.shrinkTimer = 30;
      playSFX("shrink");
    } else if (this.form === "big") {
      this.setForm("small"); this.invincible = 120; this.shrinkTimer = 30;
      playSFX("shrink");
    } else {
      this.die();
    }
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.vy = 0; this.vx = 0;
    this.deadTimer = 30;       // 先停顿再弹起(致敬原版)
    stopMusic();
    playSFX("die");
  }

  powerUp(kind) {
    if (kind === "mushroom") {
      if (this.form === "small") { this.setForm("big"); this.growTimer = 30; playSFX("powerup"); }
      addScore(1000, this.x, this.y - 8);
    } else if (kind === "flower") {
      if (this.form === "small") { this.setForm("big"); }
      this.form = "fire"; this.growTimer = 30; playSFX("powerup");
      addScore(1000, this.x, this.y - 8);
    } else if (kind === "star") {
      this.star = 600; playSFX("powerup");
    } else if (kind === "1up") {
      G.lives++; playSFX("oneUp");
      addPopup("1UP", this.x, this.y - 8);
    }
  }

  update(input) {
    if (this.dead) {
      if (this.deadTimer > 0) { this.deadTimer--; if (this.deadTimer === 0) this.vy = -7; }
      else { this.vy += GRAVITY; this.y += this.vy; }
      return;
    }
    if (this.enteringPipe > 0) { this.enteringPipe--; return; }
    if (this.flagSlide) {
      // 旗杆滑落
      this.y += 3;
      const gy = 13 * TILE - this.h;
      if (this.y >= gy) {
        this.y = gy; this.flagSlide = false; this.autoWalk = true; this.face = 1;
      }
      return;
    }
    if (this.autoWalk) {
      this.vx = 1.2; this.vy += GRAVITY;
      this.moveAndCollide();
      this.walkFrame += Math.abs(this.vx) * 0.1;
      return;
    }

    // 计时器
    if (this.invincible > 0) this.invincible--;
    if (this.star > 0) this.star--;
    if (this.growTimer > 0) this.growTimer--;
    if (this.shrinkTimer > 0) this.shrinkTimer--;
    if (this.fireCooldown > 0) this.fireCooldown--;

    // 下蹲
    this.ducking = this.big && input.down && this.onGround;

    // 左右移动
    const acc = input.run ? RUN_ACC : WALK_ACC;
    const maxSpd = input.run ? MAX_RUN : MAX_WALK;
    this.skid = false;
    if (!this.ducking) {
      if (input.left) {
        this.face = -1;
        if (this.vx > SKID_THRESHOLD && this.onGround) {
          // 急转身:快速抵消前进速度,避免"滑步"感
          this.skid = true;
          this.vx -= SKID_DECEL;
        } else {
          this.vx -= acc;
        }
      } else if (input.right) {
        this.face = 1;
        if (this.vx < -SKID_THRESHOLD && this.onGround) {
          this.skid = true;
          this.vx += SKID_DECEL;
        } else {
          this.vx += acc;
        }
      } else if (this.onGround) {
        // 摩擦
        if (this.vx > 0) this.vx = Math.max(0, this.vx - FRICTION);
        else this.vx = Math.min(0, this.vx + FRICTION);
      }
    }
    this.vx = clamp(this.vx, -maxSpd, maxSpd);

    // 不能越过摄像机左缘
    if (this.x < G.camX) { this.x = G.camX; if (this.vx < 0) this.vx = 0; }

    // 跳跃
    if (input.jumpPressed && this.onGround && !this.ducking) {
      const jv = Math.abs(this.vx) > 2 ? JUMP_VEL_RUN : JUMP_VEL;
      this.vy = -jv;
      this.onGround = false;
      playSFX(this.big ? "jumpBig" : "jumpSmall");
    }

    // 重力(按住跳跃键上升更慢 → 可变跳高)
    const g = (this.vy < 0 && input.jump) ? GRAVITY_JUMP : GRAVITY;
    this.vy += g;
    if (this.vy > MAX_FALL) this.vy = MAX_FALL;

    this.moveAndCollide();

    // 行走动画
    if (this.onGround && Math.abs(this.vx) > 0.1) this.walkFrame += Math.abs(this.vx) * 0.08;
    else if (this.onGround) this.walkFrame = 0;

    // 火球
    if (this.form === "fire" && input.runPressed && this.fireCooldown <= 0 && !this.ducking) {
      spawnFireball(this.x + (this.face > 0 ? this.w : -4), this.y + 10, this.face);
      this.fireCooldown = 20;
      playSFX("fireball");
    }

    // 掉入沟壑
    if (this.y > SCR_H + 32) this.die();

    // 到达旗杆
    if (!this.dead && G.level.poleX > 0 && this.x + this.w >= G.level.poleX + 4 && G.state === "play") {
      startFlagSequence();
    }
  }

  moveAndCollide() {
    const lvl = G.level;
    // 水平
    this.x += this.vx;
    let hb = this.hitbox;
    if (this.vx > 0) {
      const tx = Math.floor((hb.x + hb.w) / TILE);
      for (let ty = Math.floor(hb.y / TILE); ty <= Math.floor((hb.y + hb.h - 1) / TILE); ty++) {
        if (tileSolid(tileAt(lvl, tx, ty))) {
          // 隐形砖只有在下方顶时才存在,侧面穿过
          if (!invisibleAt(lvl, tx, ty)) {
            this.x = tx * TILE - hb.w - 0.01;
            if (this.x < hb.x) this.x = tx * TILE - this.w - 0.01;
            this.vx = 0; break;
          }
        }
      }
    } else if (this.vx < 0) {
      const tx = Math.floor(hb.x / TILE);
      for (let ty = Math.floor(hb.y / TILE); ty <= Math.floor((hb.y + hb.h - 1) / TILE); ty++) {
        if (tileSolid(tileAt(lvl, tx, ty)) && !invisibleAt(lvl, tx, ty)) {
          this.x = (tx + 1) * TILE + 0.01; this.vx = 0; break;
        }
      }
    }
    // 垂直
    this.y += this.vy;
    this.onGround = false;
    hb = this.hitbox;
    if (this.vy > 0) {
      const ty = Math.floor((hb.y + hb.h) / TILE);
      for (let tx = Math.floor(hb.x / TILE); tx <= Math.floor((hb.x + hb.w - 1) / TILE); tx++) {
        if (tileSolid(tileAt(lvl, tx, ty)) && !invisibleAt(lvl, tx, ty)) {
          // 脚底对齐图块顶(蹲下时 hitbox 底部为 y+32)
          const footOffset = this.big && this.ducking ? 32 : this.h;
          this.y = ty * TILE - footOffset;
          this.vy = 0; this.onGround = true; break;
        }
      }
    } else if (this.vy < 0) {
      const ty = Math.floor(hb.y / TILE);
      for (let tx = Math.floor(hb.x / TILE); tx <= Math.floor((hb.x + hb.w - 1) / TILE); tx++) {
        const t = tileAt(lvl, tx, ty);
        if (tileSolid(t)) {
          this.y = (ty + 1) * TILE + 0.01;
          this.vy = 0;
          hitBlock(tx, ty, t, this);
          break;
        }
      }
    }
  }

  draw(ctx) {
    // 受伤闪烁
    if (this.invincible > 0 && (G.frame >> 2) % 2 === 0) return;
    const set = SPR_MARIO[this.form === "fire" ? "fire" : (this.big ? "big" : "small")];
    let rows;
    if (this.dead) rows = SPR_MARIO.small.jump;
    else if (this.ducking && set.duck) rows = set.duck;
    else if (!this.onGround && !this.autoWalk) rows = set.jump;
    else if (Math.abs(this.vx) > 0.1) rows = set.run[Math.floor(this.walkFrame) % 3];
    else rows = set.idle;

    // 星星无敌:颜色轮转 → 直接叠加随机调色
    let palMap = MARIO_PAL;
    if (this.star > 0) {
      const hues = [["R","star"],["U","star"],["R","white"]];
      palMap = Object.assign({}, MARIO_PAL);
      const pick = (G.frame >> 2) % 3;
      if (pick === 0) { palMap.R = "star"; palMap.U = "red"; }
      else if (pick === 1) { palMap.R = "white"; palMap.U = "star"; }
    }
    const img = bakeSprite(rows, palMap, this.face < 0);
    const drawH = rows.length, drawW = rows[0].length;
    ctx.drawImage(img, Math.round(this.x - 2), Math.round(this.y + this.h - drawH), drawW, drawH);
  }
}

function tileAt(lvl, tx, ty) {
  if (tx < 0 || tx >= lvl.w) return T.GROUND; // 边界视为实心墙
  if (ty < 0 || ty >= ROWS) return T.EMPTY;
  return lvl.tiles[ty][tx];
}
function invisibleAt(lvl, tx, ty) {
  const t = tileAt(lvl, tx, ty);
  return t === T.INVIS_COIN || t === T.INVIS_1UP;
}
