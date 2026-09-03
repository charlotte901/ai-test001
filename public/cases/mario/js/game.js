// game.js - 游戏状态机 / 顶砖逻辑 / 摄像机 / 流程控制
"use strict";

// 最高分读写:file:// 或隐私模式下 localStorage 可能抛异常,不能让存档失败影响游戏
function loadHi() {
  try { return Number(localStorage.getItem("smb_hi") || 0) || 0; }
  catch (e) { return 0; }
}
function saveHi() {
  try {
    const hi = Math.max(G.score, loadHi());
    localStorage.setItem("smb_hi", String(hi));
  } catch (e) { /* 存不了就跳过 */ }
}

function newGame() {
  G = {
    state: "title",        // title | lives | play | dying | gameover | flagpole | win | pipeTrans
    frame: 0,
    score: 0, coins: 0, lives: 3,
    world: "1-1",
    time: 400, timeTick: 0,
    camX: 0,
    level: null,
    player: null,
    enemies: [], items: [], fireballs: [], popups: [], particles: [], popCoins: [],
    bumpTiles: [],          // 被顶起的砖 {tx,ty,timer}
    spawnedIdx: 0,
    transTimer: 0,
    returnFromUG: false,
    hurry: false,
  };
}

function startLevel(areaName, keepPlayer) {
  const lvl = areaName === "underground" ? buildUnderground() : buildWorld11();
  G.level = lvl;
  G.enemies = []; G.items = []; G.fireballs = []; G.popups = [];
  G.particles = []; G.popCoins = []; G.bumpTiles = [];
  G.spawnedIdx = 0;
  G.camX = 0;
  const form = keepPlayer ? G.player.form : "small";
  G.player = new Player(lvl.playerStart.x, lvl.playerStart.y);
  if (keepPlayer && form !== "small") {
    G.player.setForm(form === "fire" ? "big" : "big");
    if (form === "fire") G.player.form = "fire";
  }
  if (areaName === "overworld") G.time = 400;
  playMusic(lvl.area === "underground" ? "underground" : "overworld");
}

function enterPipe() {
  stopMusic();
  playSFX("pipe");
  G.state = "pipeTrans";
  G.transTimer = 50;
  G.player.enteringPipe = 50;
  G.pipeTarget = "underground";
}

function exitUnderground() {
  stopMusic();
  playSFX("pipe");
  G.state = "pipeTrans";
  G.transTimer = 50;
  G.pipeTarget = "overworld";
}

function finishPipeTrans() {
  if (G.pipeTarget === "underground") {
    startLevel("underground", true);
  } else {
    // 回到地上:从出口水管附近出现
    startLevel("overworld", true);
    G.player.x = 62 * TILE; G.player.y = 11 * TILE;
    G.camX = clamp(G.player.x - 80, 0, G.level.w * TILE - SCR_W);
  }
  G.state = "play";
}

function startFlagSequence() {
  G.state = "flagpole";
  G.player.flagSlide = true;
  G.player.vx = 0; G.player.vy = 0;
  G.player.x = G.level.poleX - G.player.w - 2;
  stopMusic();
  playSFX("flagpole");
  // 旗杆得分:按高度
  const h = clamp(13 * TILE - G.player.y, 0, 10 * TILE);
  const bonus = Math.floor(h / TILE) * 100;
  G.score += bonus;
}

function updateFlagSequence() {
  const p = G.player;
  if (p.flagSlide) {
    p.update(null);
    // 相机静止
  } else if (p.autoWalk) {
    p.update(null);
    if (p.x >= G.level.castleX + 16) {
      // 进入城堡 → 结算
      G.state = "win";
      G.transTimer = 0;
      playSFX("win");
    }
  }
  // 相机不跟随,保持原位
}

function playerDie() {
  stopMusic();
  G.state = "dying";
  G.transTimer = 180;
}

// ---------- 顶砖 ----------
function hitBlock(tx, ty, t, player) {
  const lvl = G.level;
  if (tileIsQuestion(t) || t === T.INVIS_COIN || t === T.INVIS_1UP) {
    // 出奖励
    if (t === T.Q_COIN || t === T.INVIS_COIN) {
      G.popCoins.push(new PopCoin(tx, ty));
      addCoin(); playSFX("coin");
      addScore(200, tx * TILE, ty * TILE - 8);
    } else if (t === T.Q_MUSH) {
      G.items.push(new Item(player.form === "small" ? "mushroom" : "flower", tx, ty));
    } else if (t === T.Q_STAR) {
      G.items.push(new Item("star", tx, ty));
    } else if (t === T.Q_1UP || t === T.INVIS_1UP) {
      G.items.push(new Item("1up", tx, ty));
    }
    lvl.tiles[ty][tx] = T.USED;
    G.bumpTiles.push({ tx, ty, timer: 10 });
  } else if (t === T.BRICK) {
    if (player.big) {
      lvl.tiles[ty][tx] = T.EMPTY;
      playSFX("brickBreak");
      G.score += 50;
      G.particles.push(new Debris(tx * TILE, ty * TILE, -1.5, -5));
      G.particles.push(new Debris(tx * TILE + 8, ty * TILE, 1.5, -5));
      G.particles.push(new Debris(tx * TILE, ty * TILE + 8, -1, -3));
      G.particles.push(new Debris(tx * TILE + 8, ty * TILE + 8, 1, -3));
    } else {
      playSFX("bump");
      G.bumpTiles.push({ tx, ty, timer: 10 });
    }
  }
}

// ---------- 主更新 ----------
function updatePlay(input) {
  const p = G.player;

  // 计时器
  G.timeTick++;
  if (G.timeTick >= 24) {
    G.timeTick = 0;
    G.time--;
    if (G.time === 100) { playSFX("warning"); G.hurry = true; }
    if (G.time <= 0) { p.die(); }
  }

  // 生成敌人
  const spawns = G.level.spawns;
  while (G.spawnedIdx < spawns.length && spawns[G.spawnedIdx].x < G.camX + SCR_W + TILE * 3) {
    G.enemies.push(new Enemy(spawns[G.spawnedIdx]));
    G.spawnedIdx++;
  }

  // 进水管检测(地上:站在可进入水管上按下)
  if (input.down && p.onGround) {
    for (const pipe of G.level.pipes) {
      if (pipe.enterable &&
          p.x + p.w > pipe.x * TILE + 2 && p.x < pipe.x * TILE + TILE * 2 - 2 &&
          Math.abs(p.y + p.h - pipe.y * TILE) < 3) {
        enterPipe(); return;
      }
    }
  }
  // 地下:进入右侧出口水管(站上去按右或自动检测→用右方向键)
  if (G.level.area === "underground" && G.level.exitPipe && p.onGround) {
    const ep = G.level.exitPipe;
    if (input.right && p.x + p.w > ep.x * TILE && p.x < ep.x * TILE + TILE * 2 &&
        Math.abs(p.y + p.h - ep.y * TILE) < 3) {
      exitUnderground(); return;
    }
  }

  p.update(input);
  if (p.dead) { playerDie(); return; }

  // 敌人
  for (const e of G.enemies) e.update();
  // 道具
  for (const it of G.items) it.update();
  // 火球
  for (const f of G.fireballs) f.update();
  // 弹字/粒子/金币
  for (const q of G.popups) q.update();
  for (const q of G.particles) q.update();
  for (const q of G.popCoins) q.update();
  // 顶砖计时
  for (const b of G.bumpTiles) b.timer--;
  G.bumpTiles = G.bumpTiles.filter(b => b.timer > 0);

  // ---- 玩家与敌人交互 ----
  if (!p.dead) {
    for (const e of G.enemies) {
      if (e.dead || e.removeMe || !e.active) continue;
      if (e.type === "koopa" && e.shell && !e.shellMoving && e.wakeTimer > 0) {
        // 静止龟壳:碰撞即踢
        if (overlap(p.hitbox, e)) {
          if (p.star > 0) { e.hitByShellOrFire(); continue; }
          e.stomp(p);
          continue;
        }
      }
      if (!overlap(p.hitbox, e)) continue;
      if (p.star > 0) { e.hitByShellOrFire(); continue; }
      if (e.type === "piranha") { p.hurt(); continue; }
      // 下落踩踏判定
      if (p.vy > 0 && p.y + p.h - e.y < 12) {
        e.stomp(p);
        p.vy = input.jump ? -6 : -4;
        p.onGround = false;
      } else {
        p.hurt();
      }
    }
    // 移动龟壳杀死其他敌人
    for (const e of G.enemies) {
      if (e.type === "koopa" && e.shell && e.shellMoving && !e.dead) {
        for (const o of G.enemies) {
          if (o === e || o.dead || o.removeMe || !o.active || o.type === "piranha") continue;
          if (overlap(e, o)) o.hitByShellOrFire();
        }
      }
    }
    // 道具拾取
    for (const it of G.items) {
      if (it.removeMe || it.sprout > 0) continue;
      if (overlap(p.hitbox, it)) {
        it.removeMe = true;
        p.powerUp(it.kind);
      }
    }
    // 火球与敌人
    for (const f of G.fireballs) {
      if (f.removeMe) continue;
      for (const e of G.enemies) {
        if (e.dead || e.removeMe || !e.active) continue;
        if (overlap(f, e)) { e.hitByShellOrFire(); f.explode(); break; }
      }
    }
    // 金币图块拾取
    const hb = p.hitbox;
    for (let ty = Math.floor(hb.y / TILE); ty <= Math.floor((hb.y + hb.h - 1) / TILE); ty++) {
      for (let tx = Math.floor(hb.x / TILE); tx <= Math.floor((hb.x + hb.w - 1) / TILE); tx++) {
        if (tileAt(G.level, tx, ty) === T.COIN) {
          G.level.tiles[ty][tx] = T.EMPTY;
          addCoin(); playSFX("coin");
          spawnParticles(tx * TILE + 8, ty * TILE + 8, PAL.coin, 4);
        }
      }
    }
  }

  // 清理
  G.enemies = G.enemies.filter(e => !e.removeMe);
  G.items = G.items.filter(i => !i.removeMe);
  G.fireballs = G.fireballs.filter(f => !f.removeMe);
  G.popups = G.popups.filter(q => !q.removeMe);
  G.particles = G.particles.filter(q => !q.removeMe);
  G.popCoins = G.popCoins.filter(q => !q.removeMe);

  // 摄像机:跟随玩家中心,只向右推进
  const target = p.x + p.w / 2 - SCR_W / 2 + 16;
  if (target > G.camX) G.camX = target;
  G.camX = clamp(G.camX, 0, G.level.w * TILE - SCR_W);
}

// ---------- 状态机入口 ----------
function updateGame(input) {
  G.frame++;
  switch (G.state) {
    case "title":
      if (input.startPressed) {
        initAudio(); resumeAudio();
        G.state = "lives"; G.transTimer = 90;
      }
      break;
    case "lives":
      if (--G.transTimer <= 0) { startLevel("overworld", false); G.state = "play"; }
      break;
    case "play":
      updatePlay(input);
      break;
    case "dying":
      G.player.update(null);
      if (--G.transTimer <= 0) {
        G.lives--;
        if (G.lives < 0) { G.state = "gameover"; G.transTimer = 240; playSFX("gameOver"); }
        else { G.state = "lives"; G.transTimer = 90; }
      }
      break;
    case "gameover":
      if (--G.transTimer <= 0) { saveHi(); newGame(); }
      break;
    case "pipeTrans":
      if (--G.transTimer <= 0) finishPipeTrans();
      break;
    case "flagpole":
      updateFlagSequence();
      break;
    case "win":
      G.transTimer++;
      // 剩余时间转换为分数
      if (G.transTimer > 60 && G.time > 0) {
        G.time--; G.score += 50;
        if (G.frame % 3 === 0) playSFX("score");
      }
      if (G.transTimer > 400) {
        G.state = "thankyou"; G.transTimer = 0;
      }
      break;
    case "thankyou":
      G.transTimer++;
      if (input.startPressed && G.transTimer > 60) { saveHi(); newGame(); }
      break;
  }
}
