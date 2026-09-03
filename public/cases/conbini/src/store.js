import * as THREE from 'three';
import * as M from './materials.js';

/* ------------------------------------------------------------------
   日式便利店（切角入口）+ 完整室内陈设
   外墙范围 x[-4.4,3.4] z[-8.2,-2.8]
   墙中心线：左 x=-4.3 / 右 x=3.3 / 前 z=-2.9 / 后 z=-8.1
------------------------------------------------------------------ */

const C = {
  wall: 0xe9e4d9,
  wallShade: 0xd3cdc0,
  frame: 0x4c5464,
  frameDark: 0x2f3542,
  glass: 0x16242f,
  green: 0x2ec48a,
  blue: 0x2f9fe0,
  step: 0x8d8f95,
  floorIn: 0xdad5c8,
  ceil: 0xf3f5f8,
  shelf: 0xe4e0d6,
  shelfEdge: 0xd9694a,
  counter: 0xc9b79a,
  metal: 0xb9c0cb,
  darkMetal: 0x59606e,
};

const PROD_COLORS = [
  0xf6f2e8, 0xf2b8c6, 0xf7d154, 0x8fd6f5, 0x9fe0b4, 0xe88b6a,
  0xc7a6e8, 0xf5a3b8, 0xa8d8f0, 0xe4dcc0, 0x76c8a8, 0xf0a05a,
];

function instanced(list) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = M.toonMat(0xffffff);
  const im = new THREE.InstancedMesh(geo, mat, list.length);
  const mtx = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  const col = new THREE.Color();
  list.forEach((it, i) => {
    p.set(it.p[0], it.p[1], it.p[2]);
    s.set(it.s[0], it.s[1], it.s[2]);
    q.setFromEuler(new THREE.Euler(0, it.r || 0, 0));
    mtx.compose(p, q, s);
    im.setMatrixAt(i, mtx);
    col.setHex(it.c);
    im.setColorAt(i, col);
  });
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.castShadow = false;
  im.receiveShadow = false;
  im.frustumCulled = false;
  return im;
}

/* ---------------- 室内地面贴图 ---------------- */
function floorTex() {
  return M.cvs(512, 384, (x, w, h) => {
    x.fillStyle = '#ded9cc'; x.fillRect(0, 0, w, h);
    const rnd = M.makeRng(5);
    for (let i = 0; i < 2200; i++) {
      const g = 200 + rnd() * 40;
      x.fillStyle = `rgba(${g},${g - 3},${g - 12},0.5)`;
      x.fillRect(rnd() * w, rnd() * h, 2, 2);
    }
    x.strokeStyle = 'rgba(150,146,136,0.5)'; x.lineWidth = 2;
    for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(0, i * h / 6); x.lineTo(w, i * h / 6); x.stroke(); }
    for (let i = 1; i < 8; i++) { x.beginPath(); x.moveTo(i * w / 8, 0); x.lineTo(i * w / 8, h); x.stroke(); }
    // 地面导视箭头（指向收银台）
    x.fillStyle = 'rgba(60,150,210,0.75)';
    for (let k = 0; k < 3; k++) {
      const cx = 120 + k * 96, cy = 210 + k * 26;
      x.beginPath();
      x.moveTo(cx - 34, cy - 22); x.lineTo(cx + 6, cy); x.lineTo(cx - 34, cy + 22);
      x.lineTo(cx - 22, cy + 22); x.lineTo(cx + 18, cy); x.lineTo(cx - 22, cy - 22);
      x.closePath(); x.fill();
    }
    // 黄线
    x.fillStyle = 'rgba(226,178,54,0.7)';
    x.fillRect(330, 40, 10, 300);
    x.fillStyle = 'rgba(40,60,90,0.55)';
    x.font = '700 26px "Hiragino Sans",sans-serif';
    x.fillText('レジ', 352, 300);
  });
}

/* ---------------- 货架（贡多拉） ---------------- */
function gondola(len, depth, h) {
  const g = new THREE.Group();
  const prods = [];
  // 端板
  g.add(M.box(0.07, h, depth, C.shelf, { pos: [-len / 2 + 0.035, 0.34 + h / 2, 0], ol: 0.008 }));
  g.add(M.box(0.07, h, depth, C.shelf, { pos: [len / 2 - 0.035, 0.34 + h / 2, 0], ol: 0.008 }));
  // 底座
  g.add(M.box(len, 0.16, depth, C.wallShade, { pos: [0, 0.34 + 0.08, 0], ol: 0.008 }));
  // 层板 + 价签条
  const levels = [0.50, 0.86, 1.22];
  levels.forEach((ly, i) => {
    g.add(M.box(len, 0.045, depth, C.shelf, { pos: [0, 0.34 + ly, 0], ol: 0.006 }));
    g.add(M.box(len - 0.1, 0.035, 0.02, C.shelfEdge, {
      pos: [0, 0.34 + ly + 0.03, depth / 2 - 0.005], noOutline: true,
    }));
    g.add(M.box(len - 0.1, 0.035, 0.02, C.shelfEdge, {
      pos: [0, 0.34 + ly + 0.03, -depth / 2 + 0.005], noOutline: true,
    }));
    // 商品（双面，摆满整层）
    for (let side = -1; side <= 1; side += 2) {
      const zc = side * (depth / 2 - 0.13);
      const n = Math.floor(len / 0.145);
      for (let k = 0; k < n; k++) {
        const px = -len / 2 + 0.1 + k * 0.145;
        const rnd = ((i * 31 + k * 17 + (side + 2) * 7) % 97) / 97;
        const pw = 0.10 + rnd * 0.04;
        const ph = 0.15 + ((i * 7 + k * 5) % 5) * 0.016;
        prods.push({
          p: [px, 0.34 + ly + 0.024 + ph / 2, zc],
          s: [pw, ph, 0.095 + rnd * 0.03],
          c: PROD_COLORS[(i * 5 + k * 3 + (side > 0 ? 2 : 0)) % PROD_COLORS.length],
        });
      }
    }
  });
  // 顶部层板
  g.add(M.box(len, 0.05, depth, C.shelf, { pos: [0, 0.34 + h, 0], ol: 0.006 }));
  // 中隔板
  g.add(M.box(len, h - 0.5, 0.035, C.shelf, { pos: [0, 0.34 + 0.5 + (h - 0.5) / 2, 0], ol: 0.006 }));
  // 顶板上的箱装商品
  {
    const n = Math.floor(len / 0.30);
    for (let k = 0; k < n; k++) {
      const rnd = ((k * 37 + 11) % 83) / 83;
      const ph = 0.15 + rnd * 0.06;
      prods.push({
        p: [-len / 2 + 0.18 + k * 0.30, 0.34 + h + 0.025 + ph / 2, (rnd - 0.5) * (depth - 0.36)],
        s: [0.20 + rnd * 0.07, ph, 0.17 + rnd * 0.05],
        c: PROD_COLORS[(k * 5 + 3) % PROD_COLORS.length],
      });
    }
  }
  // 端架促销列（两端板朝外，面向走道）
  for (let s = -1; s <= 1; s += 2) {
    for (let li = 0; li < 3; li++) {
      for (let k = 0; k < 3; k++) {
        const rnd = ((li * 17 + k * 23 + (s + 2) * 5) % 79) / 79;
        const ph = 0.16 + rnd * 0.04;
        prods.push({
          p: [s * (len / 2 + 0.045), 0.34 + levels[li] + 0.024 + ph / 2, -depth / 2 + 0.13 + k * (depth - 0.26) / 2],
          s: [0.07, ph, 0.11 + rnd * 0.03],
          c: PROD_COLORS[(li * 4 + k * 3 + (s > 0 ? 1 : 0)) % PROD_COLORS.length],
        });
      }
    }
  }
  // 商品实例（局部坐标，随货架组一起摆放）
  g.add(instanced(prods));
  return g;
}

/* ---------------- 饮料冷柜 ---------------- */
function cooler(w, h, d, seed) {
  const g = new THREE.Group();
  const prods = [];
  // 柜体
  g.add(M.box(w, h, d, 0xbfc6d0, { pos: [0, 0.34 + h / 2, 0], ol: 0.009 }));
  // 内部发光背板
  const back = M.box(w - 0.12, h - 0.2, 0.03, 0xdff2ff, {
    pos: [0, 0.34 + h / 2, -d / 2 + 0.06],
    material: M.toonMat(0xdff2ff, { emissive: 0x9fd8ff, emissiveIntensity: 0.42 }),
    noOutline: true, cast: false,
  });
  g.add(back);
  // 层板 + 饮料
  const shelves = 5;
  for (let i = 0; i < shelves; i++) {
    const ly = 0.42 + i * ((h - 0.55) / (shelves - 1));
    g.add(M.box(w - 0.12, 0.02, d - 0.1, 0xe8eef4, { pos: [0, 0.34 + ly - 0.07, 0], noOutline: true, cast: false }));
    const n = Math.floor((w - 0.2) / 0.13);
    for (let k = 0; k < n; k++) {
      const rnd = ((i * 13 + k * 29 + seed * 7) % 89) / 89;
      prods.push({
        p: [-w / 2 + 0.13 + k * 0.13, 0.34 + ly - 0.07 + 0.10, 0],
        s: [0.085, 0.17 + rnd * 0.03, 0.085],
        c: PROD_COLORS[(i * 4 + k * 3 + seed) % PROD_COLORS.length],
      });
    }
  }
  // 饮料实例（局部坐标）
  g.add(instanced(prods));
  // 玻璃门
  const glassMat = M.toonMat(0x9fd0e8, { transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
  const door = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.1, h - 0.14), glassMat);
  door.position.set(0, 0.34 + h / 2, d / 2 - 0.02);
  door.castShadow = false;
  g.add(door);
  // 门框 + 竖档 + 把手
  g.add(M.box(w, 0.07, 0.05, C.metal, { pos: [0, 0.34 + h - 0.05, d / 2], ol: 0.006 }));
  g.add(M.box(w, 0.07, 0.05, C.metal, { pos: [0, 0.34 + 0.05, d / 2], ol: 0.006 }));
  g.add(M.box(0.05, h - 0.14, 0.05, C.metal, { pos: [-w / 2 + 0.03, 0.34 + h / 2, d / 2], ol: 0.006 }));
  g.add(M.box(0.05, h - 0.14, 0.05, C.metal, { pos: [w / 2 - 0.03, 0.34 + h / 2, d / 2], ol: 0.006 }));
  g.add(M.box(0.035, 0.5, 0.05, 0xdfe6ef, { pos: [w / 2 - 0.11, 0.34 + h / 2, d / 2 + 0.03], noOutline: true }));
  // 顶部灯箱
  g.add(M.box(w - 0.08, 0.16, 0.06, 0xffffff, {
    pos: [0, 0.34 + h + 0.06, d / 2 - 0.01],
    material: M.toonMat(0xffffff, { emissive: 0x7fd4ff, emissiveIntensity: 0.55 }),
    ol: 0.006,
  }));
  return g;
}

/* ==================================================================
   主构建
================================================================== */
export function buildStore(scene, ctx) {
  const root = new THREE.Group();
  const flickers = [];   // {mat, base, amp, kind}
  const glassPanes = []; // 需要雨水滑落的玻璃
  const emissives = [];

  const addFlicker = (mat, base, amp, kind = 0) => {
    flickers.push({ mat, base, amp, kind, phase: Math.random() * 100 });
    return mat;
  };

  /* ---------- 底座台阶 ---------- */
  root.add(M.box(8.0, 0.12, 5.6, 0x9a9ca4, { pos: [-0.5, 0.18, -5.5], ol: 0.01 }));

  /* ---------- 室内地面 / 天花 ---------- */
  const fTex = floorTex();
  root.add(M.box(7.4, 0.14, 5.0, C.floorIn, {
    pos: [-0.5, 0.27, -5.5],
    material: M.toonMat(0xffffff, { map: fTex }),
    ol: 0.01, recv: true,
  }));
  root.add(M.box(7.4, 0.16, 5.0, C.ceil, { pos: [-0.5, 3.07, -5.5], ol: 0.01, cast: false }));

  /* ---------- 外墙 ---------- */
  const wallMat = (c) => M.toonMat(c);
  // 前墙（z=-2.9）：x[-2.1,3.4]，正门居中 x=-0.4，门洞 x[-1.105,0.305]
  root.add(M.box(0.95, 0.21, 0.2, C.wall, { pos: [-1.625, 0.345, -2.9], ol: 0.01 }));        // 左墙裙
  root.add(M.box(3.05, 0.21, 0.2, C.wall, { pos: [1.875, 0.345, -2.9], ol: 0.01 }));         // 右墙裙
  root.add(M.box(5.5, 0.60, 0.2, C.wall, { pos: [0.65, 2.85, -2.9], ol: 0.01 }));            // 窗上横带
  root.add(M.box(0.20, 2.10, 0.2, C.wall, { pos: [-2.0, 1.50, -2.9], ol: 0.01 }));           // 左窗框柱
  root.add(M.box(0.20, 2.10, 0.2, C.wall, { pos: [1.20, 1.50, -2.9], ol: 0.01 }));           // 右窗框柱
  root.add(M.box(2.10, 2.91, 0.2, C.wall, { pos: [2.35, 1.695, -2.9], ol: 0.01 }));          // 右侧实墙
  root.add(M.box(0.14, 2.10, 0.24, C.frame, { pos: [-1.175, 1.50, -2.90], ol: 0.008 }));     // 门框柱 L
  root.add(M.box(0.14, 2.10, 0.24, C.frame, { pos: [0.375, 1.50, -2.90], ol: 0.008 }));      // 门框柱 R
  root.add(M.box(1.41, 0.30, 0.24, C.wall, { pos: [-0.4, 2.50, -2.90], ol: 0.008 }));        // 门楣
  // 左墙 x=-4.3：z[-8.2,-5.1]
  root.add(M.box(0.2, 2.91, 3.1, C.wall, { pos: [-4.3, 1.695, -6.65], ol: 0.01 }));
  // 右墙 x=3.3：z[-8.2,-2.8]
  root.add(M.box(0.2, 2.91, 5.4, C.wall, { pos: [3.3, 1.695, -5.5], ol: 0.01 }));
  // 后墙 z=-8.1
  root.add(M.box(7.8, 2.91, 0.2, C.wall, { pos: [-0.5, 1.695, -8.1], ol: 0.01 }));
  // 上部墙（招牌背后）y 3.15~4.25
  root.add(M.box(5.5, 1.10, 0.2, C.wall, { pos: [0.65, 3.70, -2.9], ol: 0.012 }));
  root.add(M.box(0.2, 1.10, 3.1, C.wall, { pos: [-4.3, 3.70, -6.65], ol: 0.012 }));
  root.add(M.box(0.2, 1.10, 5.4, C.wall, { pos: [3.3, 3.70, -5.5], ol: 0.012 }));
  root.add(M.box(7.8, 1.10, 0.2, C.wall, { pos: [-0.5, 3.70, -8.1], ol: 0.012 }));

  /* ---------- 品牌色带 ---------- */
  const stripe = (w, h, d, pos, rotY, color) =>
    M.box(w, h, d, color, { pos, rot: [0, rotY || 0, 0], ol: 0.007 });
  root.add(stripe(5.5, 0.18, 0.05, [0.65, 2.71, -2.775], 0, C.green));
  root.add(stripe(5.5, 0.13, 0.05, [0.65, 2.96, -2.775], 0, C.blue));
  root.add(stripe(0.05, 0.18, 3.1, [-4.425, 2.71, -6.65], 0, C.green));
  root.add(stripe(0.05, 0.13, 3.1, [-4.425, 2.96, -6.65], 0, C.blue));
  root.add(stripe(0.05, 0.18, 5.4, [3.425, 2.71, -5.5], 0, C.green));
  root.add(stripe(0.05, 0.13, 5.4, [3.425, 2.96, -5.5], 0, C.blue));

  /* ---------- 前窗玻璃 ---------- */
  const glassMat = () => M.toonMat(C.glass, {
    transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false,
    emissive: 0x0a1620, emissiveIntensity: 0.4,
  });
  [[-1.575, 0.65], [0.775, 0.65]].forEach(([cx, cw]) => {
    const gm = new THREE.Mesh(new THREE.PlaneGeometry(cw - 0.04, 2.02), glassMat());
    gm.position.set(cx, 1.5, -2.87);
    gm.castShadow = false; gm.receiveShadow = false;
    gm.renderOrder = 3;
    root.add(gm);
    glassPanes.push({ mesh: gm, w: cw - 0.04, h: 2.02 });
    // 玻璃反光斜条
    const sheen = new THREE.Mesh(
      new THREE.PlaneGeometry(cw - 0.1, 0.5),
      new THREE.MeshBasicMaterial({
        map: M.glowTex('rgba(200,230,255,0.55)', 'rgba(200,230,255,0.12)'),
        transparent: true, opacity: 0.10, blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    sheen.position.set(cx - 0.08, 2.1, -2.84);
    sheen.rotation.z = -0.22;
    root.add(sheen);
  });

  /* ---------- 窗贴海报 ---------- */
  [[-1.575, 2.0, 0], [0.775, 2.0, 1], [-1.575, 0.8, 2], [0.775, 0.8, 3]].forEach(([px, py, k], i) => {
    const t = M.posterTex(k, i);
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(0.52, 0.72),
      M.toonMat(0xffffff, { map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.42, transparent: true })
    );
    p.position.set(px, py, -2.83);
    p.castShadow = false;
    root.add(p);
  });

  /* ---------- 切角（玻璃橱窗角，无门） ---------- */
  const chamfer = new THREE.Group();
  chamfer.position.set(-3.2, 0, -4.0);
  chamfer.rotation.y = -Math.PI / 4;
  root.add(chamfer);

  const chamWallMat = wallMat(C.wall);
  chamfer.add(M.box(0.16, 2.91, 0.2, C.wall, { pos: [-1.52, 1.695, 0], ol: 0.01 }));
  chamfer.add(M.box(0.16, 2.91, 0.2, C.wall, { pos: [1.52, 1.695, 0], ol: 0.01 }));
  chamfer.add(M.box(1.41, 0.60, 0.2, C.wall, { pos: [0, 2.85, 0], ol: 0.01 }));   // 窗上横带
  chamfer.add(M.box(3.2, 0.21, 0.2, C.wall, { pos: [0, 0.345, 0], ol: 0.01 }));   // 墙裙
  chamfer.add(stripe(1.41, 0.18, 0.05, [0, 2.71, 0.115], 0, C.green));
  chamfer.add(stripe(1.41, 0.13, 0.05, [0, 2.96, 0.115], 0, C.blue));
  // 固定玻璃窗（中段 + 两侧）
  [[0, 1.37], [-1.1, 0.70], [1.1, 0.70]].forEach(([lx, w]) => {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.10), glassMat());
    g.position.set(lx, 1.45, -0.06);
    g.castShadow = false; g.renderOrder = 3;
    chamfer.add(g);
    glassPanes.push({ mesh: g, w, h: 2.10 });
  });
  // 窗间竖档
  [-1.46, -0.72, 0.72, 1.46].forEach((lx) => {
    chamfer.add(M.box(0.05, 2.20, 0.05, C.frame, { pos: [lx, 1.45, -0.04], noOutline: true }));
  });

  /* ---------- 正门自动门（两扇滑动，面朝街道） ---------- */
  const doorPanels = [];
  [-0.7525, -0.0475].forEach((lx) => {
    const panel = new THREE.Group();
    const frame = M.box(0.705, 2.20, 0.045, C.frame, { pos: [0, 0, 0], ol: 0.007 });
    panel.add(frame);
    const gp = new THREE.Mesh(new THREE.PlaneGeometry(0.60, 1.95), glassMat());
    gp.position.set(0, 0, 0.028);
    gp.castShadow = false;
    panel.add(gp);
    panel.add(M.box(0.62, 0.05, 0.06, 0xd8dee8, { pos: [0, 1.02, 0.035], noOutline: true }));  // 上框
    panel.add(M.box(0.62, 0.06, 0.06, 0xd8dee8, { pos: [0, -0.98, 0.035], noOutline: true })); // 下框
    panel.add(M.box(0.5, 0.045, 0.05, 0xdfe6ef, { pos: [0, 0.05, 0.04], noOutline: true }));   // 推拉横杆
    panel.position.set(lx, 1.45, -2.90);
    root.add(panel);
    doorPanels.push({ obj: panel, closed: lx, open: lx + Math.sign(lx + 0.4) * 0.705 });
  });
  // 门机罩 + 门槛
  root.add(M.box(1.41, 0.14, 0.16, C.frameDark, { pos: [-0.4, 2.62, -2.88], ol: 0.007 }));
  root.add(M.box(1.41, 0.13, 0.34, C.step, { pos: [-0.4, 0.30, -2.85], ol: 0.008 }));

  // 门点击热区（全透明大面，仅供 raycast 命中，不渲染任何颜色）
  const doorHit = new THREE.Mesh(
    new THREE.PlaneGeometry(1.75, 2.55),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
  );
  doorHit.position.set(-0.4, 1.45, -2.80);
  doorHit.renderOrder = -10;
  root.add(doorHit);

  // 门头小灯箱
  const smallSignTex = M.signTexSmall('OPEN', '24時間営業');
  const smallSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.24, 0.42),
    M.toonMat(0xffffff, { map: smallSignTex, emissive: 0xffffff, emissiveMap: smallSignTex, emissiveIntensity: 1.35 })
  );
  smallSign.position.set(0, 2.84, 0.115);
  chamfer.add(smallSign);
  addFlicker(smallSign.material, 1.35, 0.10, 1);

  // 地垫（切角局部坐标）
  const doorMat = new THREE.Mesh(
    new THREE.PlaneGeometry(1.25, 0.62),
    M.toonMat(0x474d5c, { emissive: 0x0b0f16, emissiveIntensity: 0.5 })
  );
  doorMat.rotation.x = -Math.PI / 2;
  doorMat.position.set(0, 0.252, 0.46);
  doorMat.receiveShadow = true;
  chamfer.add(doorMat);

  // 切角雨棚（独立一块，覆盖入口）
  chamfer.add(M.box(3.25, 0.17, 1.45, 0xdad5c9, { pos: [0, 3.20, 0.68], ol: 0.012 }));
  chamfer.add(M.box(3.25, 0.40, 0.09, 0xc9c3b5, { pos: [0, 3.19, 1.36], ol: 0.01 }));
  chamfer.add(M.box(3.25, 0.09, 0.09, C.green, { pos: [0, 3.41, 1.36], ol: 0.007 }));
  [-0.75, 0.75].forEach((lx) => {
    const cp = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 0.18),
      M.toonMat(0xfff3dd, { emissive: 0xffd79a, emissiveIntensity: 0.90, side: THREE.DoubleSide })
    );
    cp.rotation.x = Math.PI / 2;
    cp.position.set(lx, 3.10, 0.72);
    chamfer.add(cp);
    addFlicker(cp.material, 0.90, 0.06, 0);
  });

  /* ---------- 雨棚 ---------- */
  const canopy = new THREE.Group();
  canopy.position.set(-0.45, 0, 0);
  root.add(canopy);
  canopy.add(M.box(8.3, 0.17, 2.05, 0xdad5c9, { pos: [0, 3.235, -1.92], ol: 0.012 }));
  canopy.add(M.box(8.3, 0.45, 0.09, 0xc9c3b5, { pos: [0, 3.22, -0.9], ol: 0.01 }));      // 檐口板
  canopy.add(M.box(8.3, 0.10, 0.09, C.green, { pos: [0, 3.44, -0.9], ol: 0.007 }));      // 檐口色带
  // 雨棚下的暖光灯带
  for (let i = 0; i < 4; i++) {
    const lx = -4.0 + i * 2.15;
    const lp = new THREE.Mesh(
      new THREE.PlaneGeometry(1.30, 0.20),
      M.toonMat(0xfff3dd, { emissive: 0xffd79a, emissiveIntensity: 0.90, side: THREE.DoubleSide })
    );
    lp.rotation.x = Math.PI / 2;
    lp.position.set(lx, 3.13, -1.9);
    canopy.add(lp);
    addFlicker(lp.material, 0.90, 0.06, 0);
  }
  // 排水管（左前角）
  root.add(M.cyl(0.055, 0.055, 3.0, 8, C.darkMetal, { pos: [-4.52, 1.75, -2.95], ol: 0.008 }));
  root.add(M.box(0.14, 0.14, 0.14, C.darkMetal, { pos: [-4.52, 3.22, -2.95], ol: 0.008 }));

  /* ---------- 主招牌灯箱 ---------- */
  const signTex = M.signTexMain();
  root.add(M.box(5.5, 0.66, 0.30, C.frameDark, { pos: [0.65, 3.775, -2.65], ol: 0.012 }));
  const signMat = M.toonMat(0xffffff, {
    map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 2.60,
  });
  const signFace = new THREE.Mesh(new THREE.PlaneGeometry(5.44, 0.60), signMat);
  signFace.position.set(0.65, 3.775, -2.501);
  root.add(signFace);
  addFlicker(signMat, 2.60, 0.09, 1);
  // 招牌侧边泛光条
  [3.44, 4.11].forEach((sy) => {
    root.add(M.box(5.5, 0.05, 0.32, 0xffffff, {
      pos: [0.65, sy, -2.65],
      material: M.toonMat(0xffffff, { emissive: 0x9fe8d8, emissiveIntensity: 1.8 }),
      ol: 0.006,
    }));
  });

  /* ---------- 屋顶与屋顶设备 ---------- */
  root.add(M.box(8.1, 0.20, 5.7, 0xb9bcc4, { pos: [-0.5, 4.35, -5.5], ol: 0.014 }));
  root.add(M.box(8.2, 0.09, 5.8, 0x8d919b, { pos: [-0.5, 4.29, -5.5], ol: 0.012 })); // 檐口
  // 空调外机 ×2
  [[0.9, -4.6], [-2.7, -6.6]].forEach(([ax, az]) => {
    root.add(M.box(1.30, 0.72, 0.85, 0xa9b0b9, { pos: [ax, 4.81, az], ol: 0.012 }));
    root.add(M.box(1.10, 0.06, 0.70, 0x6f7681, { pos: [ax, 5.18, az], ol: 0.008 }));
    root.add(M.cyl(0.30, 0.30, 0.05, 14, 0x50565f, { pos: [ax, 5.22, az], ol: 0.006 }));
  });
  // 水箱 / 管道 / 天线
  root.add(M.cyl(0.42, 0.42, 0.95, 14, 0x9aa2ac, { pos: [2.55, 4.93, -3.5], ol: 0.012 }));
  root.add(M.box(0.5, 0.7, 0.5, 0x7d848e, { pos: [-3.4, 4.80, -3.4], ol: 0.01 }));
  root.add(M.cyl(0.09, 0.09, 1.0, 8, 0x6f7681, { pos: [-3.4, 5.65, -3.4], ol: 0.008 }));
  root.add(M.cyl(0.035, 0.035, 1.7, 6, 0x8d939d, { pos: [-3.75, 5.30, -7.2], ol: 0.006 }));
  root.add(M.box(1.2, 0.05, 0.05, 0x8d939d, { pos: [-3.55, 6.05, -7.2], ol: 0.005 }));
  // 屋顶通风管
  for (let i = 0; i < 3; i++) {
    root.add(M.cyl(0.10, 0.10, 0.35 + i * 0.1, 8, 0x7d848e, { pos: [0.2 + i * 0.5, 4.62, -7.4], ol: 0.006 }));
  }

  /* ================= 室内 ================= */
  const inside = new THREE.Group();
  root.add(inside);

  // 天花灯箱
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      const lp = new THREE.Mesh(
        new THREE.PlaneGeometry(1.55, 0.30),
        M.toonMat(0xfffaf0, { emissive: 0xffeccd, emissiveIntensity: 0.70, side: THREE.DoubleSide })
      );
      lp.rotation.x = Math.PI / 2;
      lp.position.set(-3.0 + i * 2.4, 2.96, -4.3 - j * 2.3);
      inside.add(lp);
      addFlicker(lp.material, 0.70, 0.05, 0);
    }
  }

  // 货架 ×3
  const gondolas = [[-0.725, -4.55], [-0.725, -5.80], [-0.725, -7.05]];
  gondolas.forEach(([gx, gz]) => {
    const g = gondola(4.85, 0.62, 1.50);
    g.position.set(gx, 0, gz);
    inside.add(g);
  });

  // 后墙饮料冷柜 ×3
  const coolers = [[-3.15, 0], [-1.40, 1], [0.35, 2]];
  coolers.forEach(([cx, s]) => {
    const c = cooler(1.70, 2.05, 0.42, s);
    c.position.set(cx, 0, -7.78);
    inside.add(c);
  });

  // 杂志架（左墙）
  const magTex = M.magazineTex();
  const magBody = M.box(0.62, 1.55, 1.70, 0x39404f, { pos: [-3.86, 1.12, -5.25], ol: 0.01 });
  inside.add(magBody);
  [-0.45, 0.45].forEach((dy) => {
    const mp = new THREE.Mesh(
      new THREE.PlaneGeometry(1.55, 0.62),
      M.toonMat(0xffffff, { map: magTex, side: THREE.DoubleSide })
    );
    mp.position.set(-3.54, 1.12 + dy, -5.25);
    mp.rotation.y = Math.PI / 2;
    mp.rotateX(-0.30);
    inside.add(mp);
  });

  // 冰淇淋卧柜（左墙后段）
  inside.add(M.box(0.72, 0.85, 1.45, 0xdfe6ef, { pos: [-3.78, 0.76, -6.95], ol: 0.01 }));
  inside.add(M.box(0.60, 0.10, 1.30, 0x8fd6f5, {
    pos: [-3.78, 1.22, -6.95],
    material: M.toonMat(0xbfe8ff, { emissive: 0x6fc8f0, emissiveIntensity: 0.30, transparent: true, opacity: 0.55 }),
    ol: 0.006,
  }));
  inside.add(M.box(0.74, 0.06, 1.47, 0x5fb8dc, { pos: [-3.78, 1.02, -6.95], ol: 0.006 }));

  // 热食柜（橱窗内侧）
  const hotTex = M.hotCaseTex();
  const hotCase = M.box(1.30, 0.95, 0.52, 0xb8bec9, { pos: [-2.75, 0.82, -3.60], ol: 0.01 });
  inside.add(hotCase);
  const hotFace = new THREE.Mesh(
    new THREE.PlaneGeometry(1.24, 0.34),
    M.toonMat(0xffffff, { map: hotTex, emissive: 0xffffff, emissiveMap: hotTex, emissiveIntensity: 0.55 })
  );
  hotFace.position.set(-2.75, 1.06, -3.33);
  inside.add(hotFace);
  inside.add(M.box(1.20, 0.05, 0.46, 0xdfe6ef, {
    pos: [-2.75, 1.32, -3.60],
    material: M.toonMat(0xdfe6ef, { emissive: 0xffd9a0, emissiveIntensity: 0.38 }),
    ol: 0.006,
  }));
  // 收银台（右墙）
  inside.add(M.box(0.80, 0.95, 2.80, C.counter, { pos: [2.75, 0.815, -5.10], ol: 0.011 }));
  inside.add(M.box(0.90, 0.06, 2.90, 0xb0a08a, { pos: [2.75, 1.31, -5.10], ol: 0.008 }));
  // 收银机
  inside.add(M.box(0.44, 0.26, 0.36, 0x50565f, { pos: [2.72, 1.47, -4.15], ol: 0.008 }));
  const regScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.20),
    M.toonMat(0xbfe8ff, { emissive: 0x5fc8f0, emissiveIntensity: 0.55 })
  );
  regScreen.position.set(2.72, 1.58, -4.32);
  regScreen.rotation.y = Math.PI;
  inside.add(regScreen);
  addFlicker(regScreen.material, 0.55, 0.12, 2);
  // 咖啡机
  inside.add(M.box(0.42, 0.62, 0.46, 0x3d434d, { pos: [2.70, 1.65, -5.05], ol: 0.009 }));
  const coffeeTex = M.signTexSmall('COFFEE', '100円', '#5a3a24');
  const coffeePanel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.36, 0.16),
    M.toonMat(0xffffff, { map: coffeeTex, emissive: 0xffffff, emissiveMap: coffeeTex, emissiveIntensity: 0.55 })
  );
  coffeePanel.position.set(2.70, 1.82, -4.82);
  coffeePanel.rotation.y = Math.PI;
  inside.add(coffeePanel);
  addFlicker(coffeePanel.material, 0.55, 0.08, 1);
  // 关东煮柜台
  inside.add(M.box(0.46, 0.30, 0.56, 0xa9b0b9, { pos: [2.72, 1.49, -5.95], ol: 0.008 }));
  inside.add(M.box(0.36, 0.06, 0.44, 0xd9a441, {
    pos: [2.72, 1.66, -5.95],
    material: M.toonMat(0xe8c07a, { emissive: 0xffb84d, emissiveIntensity: 0.38 }),
    ol: 0.005,
  }));
  // 香烟柜（收银台后方墙上）
  const cigTex = M.cigaretteTex();
  inside.add(M.box(0.10, 1.15, 1.60, 0x2b313b, { pos: [3.16, 1.75, -5.10], ol: 0.008 }));
  const cigFace = new THREE.Mesh(
    new THREE.PlaneGeometry(1.55, 1.10),
    M.toonMat(0xffffff, { map: cigTex, emissive: 0xffffff, emissiveMap: cigTex, emissiveIntensity: 0.35 })
  );
  cigFace.position.set(3.10, 1.75, -5.10);
  cigFace.rotation.y = -Math.PI / 2;
  inside.add(cigFace);

  // 收银台上方菜单灯箱
  const menuTex = M.signTexSmall('ホットスナック', 'HOT SNACK 100円');
  const menu = new THREE.Mesh(
    new THREE.PlaneGeometry(1.75, 0.55),
    M.toonMat(0xffffff, { map: menuTex, emissive: 0xffffff, emissiveMap: menuTex, emissiveIntensity: 0.65 })
  );
  menu.position.set(3.08, 2.35, -5.10);
  menu.rotation.y = -Math.PI / 2;
  inside.add(menu);
  addFlicker(menu.material, 0.65, 0.07, 1);

  // ATM
  const atmT = M.atmTex();
  inside.add(M.box(0.72, 1.70, 0.55, 0x39404f, { pos: [2.72, 1.19, -6.85], ol: 0.01 }));
  const atmFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.60, 0.66),
    M.toonMat(0xffffff, { map: atmT, emissive: 0xffffff, emissiveMap: atmT, emissiveIntensity: 0.55 })
  );
  atmFace.position.set(2.72, 1.45, -6.55);
  inside.add(atmFace);
  addFlicker(atmFace.material, 0.55, 0.10, 2);

  // 储物柜 / 后场门
  inside.add(M.box(0.66, 1.80, 1.05, 0x98a0ab, { pos: [2.80, 1.24, -7.48], ol: 0.01 }));
  inside.add(M.box(0.80, 2.05, 0.08, 0x8a929c, { pos: [1.85, 1.36, -7.94], ol: 0.009 }));
  const exitTex = M.signTexSmall('関係者以外', '立入禁止', '#1d3b2a');
  const exitSign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.22),
    M.toonMat(0xffffff, { map: exitTex, emissive: 0xffffff, emissiveMap: exitTex, emissiveIntensity: 0.5 })
  );
  exitSign.position.set(1.85, 2.20, -7.89);
  exitSign.rotation.y = Math.PI;
  inside.add(exitSign);
  // 后场门灯
  inside.add(M.box(0.34, 0.10, 0.06, 0x9ff5c0, {
    pos: [1.85, 2.45, -7.90],
    material: M.toonMat(0xd8ffe8, { emissive: 0x6ff0a8, emissiveIntensity: 0.75 }),
    ol: 0.005,
  }));

  // 购物篮
  for (let i = 0; i < 3; i++) {
    inside.add(M.box(0.36, 0.20, 0.26, i % 2 ? 0xe0533f : 0x3f7fe0, {
      pos: [-1.55, 0.46 + i * 0.10, -3.58], ol: 0.007,
    }));
  }

  // 吊旗
  [0, 1, 2].forEach((i) => {
    const bt = M.bannerTex(i);
    const bp = new THREE.Mesh(
      new THREE.PlaneGeometry(1.35, 0.42),
      M.toonMat(0xffffff, { map: bt, emissive: 0xffffff, emissiveMap: bt, emissiveIntensity: 0.5, side: THREE.DoubleSide })
    );
    const bx = [-2.6, -0.4, 1.4][i], bz = [-3.5, -5.3, -7.3][i];
    bp.position.set(bx, 2.42, bz);
    inside.add(bp);
    inside.add(M.cyl(0.02, 0.02, 0.5, 6, 0x8d939d, { pos: [bx, 2.75, bz], noOutline: true }));
    if (i === 1) bp.rotation.y = Math.PI / 2;
  });

  /* ---------- 室内暖光 ---------- */
  const lights = [];
  [[-1.6, -4.4], [-1.6, -6.6], [1.4, -5.6]].forEach(([lx, lz]) => {
    const pl = new THREE.PointLight(0xffdfae, 3.0, 8.0, 1.7);
    pl.position.set(lx, 2.75, lz);
    root.add(pl);
    lights.push(pl);
  });
  // 门口溢出光
  const doorLight = new THREE.PointLight(0xffd9a0, 1.6, 5.8, 1.8);
  doorLight.position.set(-3.6, 2.4, -3.3);
  root.add(doorLight);
  lights.push(doorLight);

  /* ---------- 右侧墙外挂空调 / 公告栏 ---------- */
  root.add(M.box(0.75, 0.62, 0.55, 0xa9b0b9, { pos: [3.72, 2.55, -4.2], ol: 0.011 }));
  root.add(M.box(0.10, 0.10, 0.60, C.darkMetal, { pos: [3.40, 2.55, -4.2], ol: 0.006 }));
  root.add(M.box(0.10, 0.10, 0.60, C.darkMetal, { pos: [3.55, 2.20, -4.2], ol: 0.006 }));

  scene.add(root);

  return {
    root,
    flickers,
    glassPanes,
    doorPanels,
    doorHit,
    chamfer,
    lights,
    doorLight,
    signMat,
    interceptors: [],
  };
}
