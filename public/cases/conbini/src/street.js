import * as THREE from 'three';
import * as M from './materials.js';
import { makePuddleMaterial, makeReflectionMaterial } from './effects.js';

/* ------------------------------------------------------------------
   街角环境：正方形底座 / L 形街道 / 停车场 / 小巷 / 邻楼 / 街具
   底座 x,z ∈ [-9,9]；人行道面 y=0.24；车行道面 y=0.03
------------------------------------------------------------------ */

const SW = 0.24;   // 人行道高
const RD = 0.03;   // 车行道高

function flatTex(base, w, d, scale) {
  const t = base.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(w / scale, d / scale);
  t.needsUpdate = true;
  return t;
}

/* ---------------- 电线 ---------------- */
function wire(a, b, sag = 0.4, r = 0.016) {
  const A = new THREE.Vector3(a[0], a[1], a[2]);
  const B = new THREE.Vector3(b[0], b[1], b[2]);
  const mid = A.clone().add(B).multiplyScalar(0.5);
  mid.y -= sag;
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    pts.push(new THREE.Vector3()
      .addScaledVector(A, (1 - t) * (1 - t))
      .addScaledVector(mid, 2 * (1 - t) * t)
      .addScaledVector(B, t * t));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 22, r, 5, false),
    new THREE.MeshBasicMaterial({ color: 0x11161f, fog: true })
  );
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

/* ---------------- 自行车 ---------------- */
function bicycle(colorFrame = 0x2f4a6a) {
  const g = new THREE.Group();
  const dark = 0x20242c;
  [-0.52, 0.52].forEach((z) => {
    const w = M.makeMesh(new THREE.TorusGeometry(0.32, 0.032, 8, 20), dark, {
      pos: [0, 0.32, z], rot: [0, Math.PI / 2, 0], ol: 0.008,
    });
    g.add(w);
    g.add(M.makeMesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 8), 0xb8bec9, {
      pos: [0, 0.32, z], rot: [Math.PI / 2, 0, 0], noOutline: true,
    }));
  });
  // 车架
  g.add(M.box(0.05, 0.05, 1.02, colorFrame, { pos: [0, 0.60, 0.0], rot: [0.10, 0, 0], ol: 0.006 }));
  g.add(M.box(0.05, 0.46, 0.05, colorFrame, { pos: [0, 0.52, -0.30], rot: [-0.24, 0, 0], ol: 0.006 }));
  g.add(M.box(0.05, 0.52, 0.05, colorFrame, { pos: [0, 0.55, 0.44], rot: [0.22, 0, 0], ol: 0.006 }));
  g.add(M.box(0.05, 0.05, 0.62, colorFrame, { pos: [0, 0.44, -0.10], rot: [0.42, 0, 0], ol: 0.006 }));
  g.add(M.box(0.44, 0.035, 0.035, dark, { pos: [0, 0.86, 0.50], ol: 0.005 }));
  g.add(M.box(0.14, 0.05, 0.26, dark, { pos: [0, 0.90, -0.34], ol: 0.005 }));
  g.add(M.box(0.26, 0.17, 0.22, 0x9a7c56, { pos: [0, 0.80, 0.52], ol: 0.006 }));
  g.add(M.box(0.30, 0.03, 0.03, 0xb8bec9, { pos: [0.02, 0.42, 0.10], rot: [0, 0, 0.35], noOutline: true }));
  g.add(M.box(0.035, 0.30, 0.035, dark, { pos: [0.13, 0.16, 0.02], noOutline: true }));
  g.add(M.box(0.06, 0.06, 0.06, 0xd8d2c4, { pos: [0, 0.86, 0.30], noOutline: true })); // 车灯
  // 雨衣反光
  g.add(M.box(0.20, 0.10, 0.06, 0xc8d84a, { pos: [0, 0.74, 0.30], rot: [0.5, 0, 0], noOutline: true }));
  return g;
}

/* ---------------- 自动贩卖机 ---------------- */
function vending(hue, w = 0.80, h = 1.95, d = 0.72) {
  const g = new THREE.Group();
  const tex = M.vendingTex(hue);
  g.add(M.box(w, h, d, 0x2b3140, { pos: [0, h / 2, 0], ol: 0.01 }));
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(w - 0.06, h - 0.16),
    M.toonMat(0xffffff, { map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.60 })
  );
  face.position.set(0, h / 2 + 0.02, d / 2 + 0.005);
  g.add(face);
  g.add(M.box(w - 0.04, 0.10, d - 0.06, 0x1a2029, { pos: [0, h - 0.02, d / 2], ol: 0.006 }));
  g.add(M.box(w, 0.10, d, 0x2f3542, { pos: [0, 0.05, 0], ol: 0.008 }));
  return { group: g, mat: face.material, tex, w, h, d };
}

/* ---------------- 路灯 ---------------- */
function streetLamp() {
  const g = new THREE.Group();
  g.add(M.cyl(0.075, 0.095, 5.0, 10, 0x59606e, { pos: [0, 2.5, 0], ol: 0.009 }));
  g.add(M.box(0.30, 0.14, 0.30, 0x4c5464, { pos: [0, 0.07, 0], ol: 0.008 }));
  g.add(M.box(0.07, 0.07, 1.15, 0x59606e, { pos: [0, 4.94, -0.55], ol: 0.007 }));
  const head = M.box(0.52, 0.16, 0.34, 0x6b7280, { pos: [0, 4.84, -1.12], ol: 0.008 });
  g.add(head);
  const lampMat = M.toonMat(0xfff2d6, { emissive: 0xffd79a, emissiveIntensity: 1.10, side: THREE.DoubleSide });
  const lamp = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.24), lampMat);
  lamp.rotation.x = Math.PI / 2;
  lamp.position.set(0, 4.75, -1.12);
  g.add(lamp);
  return { group: g, mat: lampMat };
}

/* ==================================================================
   主构建
================================================================== */
export function buildStreet(scene) {
  const root = new THREE.Group();
  const flickers = [];
  const puddles = [];
  const reflections = [];
  const splashSpots = [];
  const addFlicker = (mat, base, amp, kind = 0) =>
    flickers.push({ mat, base, amp, kind, phase: Math.random() * 100 });

  const asphalt = M.asphaltTex();
  const tile = M.tileTex();
  const concrete = M.concreteTex();

  /* ---------- 底座 ---------- */
  const base = new THREE.Group();
  root.add(base);
  base.add(M.box(18.0, 1.40, 18.0, 0x2b3242, { pos: [0, -0.70, 0], ol: 0.014 }));
  base.add(M.box(18.30, 0.26, 18.30, 0x1a1f2b, { pos: [0, -1.53, 0], ol: 0.014 }));
  base.add(M.box(18.16, 0.14, 18.16, 0x3b4354, { pos: [0, -0.07, 0], ol: 0.012 }));
  base.add(M.box(17.90, 0.05, 17.90, 0x232936, { pos: [0, 0.001, 0], noOutline: true, cast: false }));

  /* ---------- 车行道 ---------- */
  const roadMat = (w, d) => M.toonMat(0xffffff, { map: flatTex(asphalt, w, d, 3.2) });
  root.add(M.box(18.0, 0.23, 6.20, 0xffffff, {
    pos: [0, -0.085, 5.90], material: roadMat(18, 6.2), ol: 0.012,
  }));
  root.add(M.box(3.20, 0.23, 11.80, 0xffffff, {
    pos: [-7.40, -0.085, -3.10], material: roadMat(3.2, 11.8), ol: 0.012,
  }));
  // 小巷地面
  root.add(M.box(2.30, 0.17, 5.60, 0xffffff, {
    pos: [4.65, -0.005, -5.45], material: roadMat(2.3, 5.6), ol: 0.012,
  }));

  /* ---------- 人行道 ---------- */
  const swMat = (w, d) => M.toonMat(0xffffff, { map: flatTex(tile, w, d, 1.35) });
  const addSlab = (w, d, x, z) => {
    root.add(M.box(w, SW, d, 0xffffff, { pos: [x, SW / 2, z], material: swMat(w, d), ol: 0.012 }));
  };
  addSlab(14.80, 5.50, 1.60, -0.05);    // 前区（含停车场与右前空地）
  addSlab(1.30, 6.30, -5.15, -5.85);    // 左侧步道
  addSlab(13.50, 0.70, 2.25, -8.65);    // 后巷步道

  /* ---------- 缘石/排水沟 ---------- */
  root.add(M.box(18.0, 0.09, 0.30, 0x8f96a3, { pos: [0, 0.255, 2.80], ol: 0.01 }));
  root.add(M.box(0.30, 0.09, 11.8, 0x8f96a3, { pos: [-5.80, 0.255, -3.10], ol: 0.01 }));
  root.add(M.box(18.0, 0.012, 0.34, 0x1b212c, { pos: [0, 0.036, 3.02], noOutline: true, cast: false }));
  root.add(M.box(0.34, 0.012, 11.8, 0x1b212c, { pos: [-5.97, 0.036, -3.10], noOutline: true, cast: false }));

  // 排水格栅
  const grateT = M.grateTex();
  [[-4.2, 3.02], [-1.2, 3.02], [1.8, 3.02], [4.8, 3.02], [7.4, 3.02], [-6.3, 6.5], [-6.3, -2.0]].forEach(([gx, gz]) => {
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(gx < -5 ? 0.34 : 0.55, gx < -5 ? 0.55 : 0.34),
      M.toonMat(0x2b303c, { map: grateT })
    );
    p.rotation.x = -Math.PI / 2;
    p.position.set(gx, 0.038, gz);
    root.add(p);
  });
  // 井盖
  [[0.9, 5.4, 0.52], [-7.4, -6.4, 0.44], [5.6, 6.2, 0.46]].forEach(([mx, mz, r]) => {
    const p = new THREE.Mesh(new THREE.CircleGeometry(r, 24), M.toonMat(0x39404f, { map: M.manholeTex() }));
    p.rotation.x = -Math.PI / 2;
    p.position.set(mx, 0.037, mz);
    root.add(p);
  });

  /* ---------- 路面标线 ---------- */
  const line = (w, d, x, z, color = 0xdfe4ea, ry = 0) => {
    const m = M.box(w, 0.012, d, color, {
      pos: [x, 0.041, z], rot: [0, ry, 0], noOutline: true, cast: false,
      material: M.toonMat(color, { emissive: 0x1b2430, emissiveIntensity: 0.55 }),
    });
    root.add(m); return m;
  };
  // 主路斑马线
  for (let i = 0; i < 5; i++) line(0.42, 5.60, -3.20 + i * 0.78, 6.10);
  line(3.60, 0.24, -1.60, 3.12);          // 停止线
  // 侧路斑马线
  for (let i = 0; i < 4; i++) line(2.60, 0.40, -7.50, -1.60 + i * 0.72);
  // 车道中心虚线
  for (let x = -8.6; x < 8.6; x += 2.6) line(1.35, 0.13, x, 5.90, 0xd8cfae);
  for (let z = -8.6; z < 2.4; z += 2.6) line(0.13, 1.35, -7.40, z, 0xd8cfae);
  // 边缘线
  line(18.0, 0.10, 0, 2.86, 0xcfd6de);
  line(0.10, 11.8, -5.86, -3.10, 0xcfd6de);

  /* ---------- 停车场 ---------- */
  const pk = (w, d, x, z, color = 0xe8ecf2) => {
    const m = M.box(w, 0.010, d, color, {
      pos: [x, 0.248, z], noOutline: true, cast: false,
      material: M.toonMat(color, { emissive: 0x1e2732, emissiveIntensity: 0.6 }),
    });
    root.add(m); return m;
  };
  [-5.42, -2.66, 0.10].forEach((px) => pk(0.09, 3.00, px, 0.90));
  pk(5.60, 0.09, -2.66, -0.60);
  // 车挡
  [-4.04, -1.28].forEach((px) => {
    root.add(M.box(0.95, 0.13, 0.14, 0xb8bec9, { pos: [px, 0.305, -0.38], ol: 0.007 }));
    root.add(M.cyl(0.05, 0.05, 0.22, 8, 0x8d939d, { pos: [px - 0.38, 0.35, -0.38], ol: 0.005 }));
    root.add(M.cyl(0.05, 0.05, 0.22, 8, 0x8d939d, { pos: [px + 0.38, 0.35, -0.38], ol: 0.005 }));
  });
  // 车位编号
  [['1', -4.04], ['2', -1.28]].forEach(([n, px]) => {
    const t = M.cvs(128, 128, (x, w, h) => {
      x.clearRect(0, 0, w, h);
      x.fillStyle = 'rgba(235,240,246,0.85)';
      x.font = '700 92px "Hiragino Sans",sans-serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(n, w / 2, h / 2 + 4);
    });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42),
      new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.72, depthWrite: false }));
    p.rotation.x = -Math.PI / 2;
    p.position.set(px, 0.249, 1.55);
    root.add(p);
  });
  // P 立牌
  const pTex = M.cvs(256, 256, (x, w, h) => {
    x.fillStyle = '#2f6fd0'; x.fillRect(0, 0, w, h * 0.74);
    x.fillStyle = '#f4f8ff'; x.fillRect(0, h * 0.74, w, h * 0.26);
    x.fillStyle = '#ffffff'; x.font = '700 130px sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('P', w / 2, h * 0.36);
    x.fillStyle = '#1b3a63'; x.font = '700 34px "Hiragino Sans",sans-serif';
    x.fillText('駐車場', w / 2, h * 0.87);
  });
  root.add(M.cyl(0.045, 0.045, 1.60, 8, 0x8d939d, { pos: [0.62, 1.04, -0.55], ol: 0.006 }));
  const pSign = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.56),
    M.toonMat(0xffffff, { map: pTex, emissive: 0xffffff, emissiveMap: pTex, emissiveIntensity: 0.55 }));
  pSign.position.set(0.62, 1.94, -0.53);
  root.add(pSign);
  addFlicker(pSign.material, 0.55, 0.06, 1);

  /* ---------- 邻楼（右侧） ---------- */
  const nb = new THREE.Group();
  root.add(nb);
  nb.add(M.box(3.20, 6.60, 7.60, 0xffffff, {
    pos: [7.40, 0.24 + 3.30, -5.20], material: M.toonMat(0xffffff, { map: flatTex(concrete, 3.2, 6.6) }), ol: 0.014,
  }));
  nb.add(M.box(3.34, 0.22, 7.74, 0x6d7482, { pos: [7.40, 6.94, -5.20], ol: 0.012 }));
  // 卷帘店铺
  nb.add(M.box(3.20, 2.55, 0.16, 0x39404f, { pos: [7.40, 1.52, -1.33], ol: 0.012 }));
  for (let i = 0; i < 13; i++) {
    nb.add(M.box(3.10, 0.06, 0.04, 0x4b5361, { pos: [7.40, 0.40 + i * 0.19, -1.24], noOutline: true }));
  }
  nb.add(M.box(3.30, 0.18, 0.70, 0x8d5f4a, { pos: [7.40, 2.86, -1.10], ol: 0.01 })); // 雨棚
  // 楼上窗户
  const winMat = (on) => M.toonMat(on ? 0xffe6bb : 0x1c2530, {
    emissive: on ? 0xffcc80 : 0x0b1119, emissiveIntensity: on ? 0.70 : 0.25,
  });
  [[6.35, 4.20, 0], [8.45, 4.20, 1], [6.35, 5.70, 0], [8.45, 5.70, 0]].forEach(([wx, wy, on], i) => {
    const wm = winMat(!!on);
    const w = M.box(0.90, 1.05, 0.10, 0xffffff, { pos: [wx, wy, -1.30], material: wm, ol: 0.008 });
    nb.add(w);
    nb.add(M.box(0.98, 0.06, 0.06, 0x8f96a3, { pos: [wx, wy - 0.58, -1.24], noOutline: true }));
    if (on) addFlicker(wm, 0.70, 0.05, 0);
  });
  // 竖看板（店铺）
  const vTex = M.signTexVertical();
  const vSignMat = M.toonMat(0xffffff, { map: vTex, emissive: 0xffffff, emissiveMap: vTex, emissiveIntensity: 1.40 });
  nb.add(M.box(0.44, 2.30, 0.14, 0x1a2029, { pos: [6.30, 3.05, -1.20], ol: 0.009 }));
  const vSign = new THREE.Mesh(new THREE.PlaneGeometry(0.40, 2.20), vSignMat);
  vSign.position.set(6.30, 3.05, -1.12);
  nb.add(vSign);
  addFlicker(vSignMat, 1.40, 0.09, 1);
  // 小巷侧：窗、空调、管、壁灯、海报
  [[-3.2, 0], [-5.4, 0], [-6.9, 1]].forEach(([wz, on]) => {
    const wm = winMat(!!on);
    nb.add(M.box(0.10, 0.95, 1.10, 0xffffff, { pos: [5.74, 4.30, wz], material: wm, ol: 0.008 }));
    nb.add(M.box(0.06, 0.06, 1.20, 0x8f96a3, { pos: [5.70, 3.74, wz], noOutline: true }));
    if (on) addFlicker(wm, 0.70, 0.06, 0);
  });
  nb.add(M.box(0.62, 0.55, 0.42, 0xa9b0b9, { pos: [6.05, 3.30, -2.30], ol: 0.01 }));
  nb.add(M.cyl(0.055, 0.055, 5.4, 8, 0x6b7280, { pos: [5.66, 2.90, -4.40], ol: 0.007 }));
  nb.add(M.cyl(0.040, 0.040, 5.4, 8, 0x7d848e, { pos: [5.66, 2.90, -4.62], ol: 0.006 }));
  // 壁灯
  const wlMat = M.toonMat(0xfff0d0, { emissive: 0xffca80, emissiveIntensity: 0.85, side: THREE.DoubleSide });
  nb.add(M.box(0.16, 0.14, 0.30, 0x4c5464, { pos: [5.66, 2.62, -2.30], ol: 0.006 }));
  const wl = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.14), wlMat);
  wl.position.set(5.60, 2.55, -2.30);
  wl.rotation.y = -Math.PI / 2;
  nb.add(wl);
  addFlicker(wlMat, 0.85, 0.14, 0);
  // 小巷海报
  const ap = M.posterTex(2, 3);
  const apm = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.78),
    M.toonMat(0xffffff, { map: ap, emissive: 0xffffff, emissiveMap: ap, emissiveIntensity: 0.28 }));
  apm.position.set(5.735, 1.75, -5.60);
  apm.rotation.y = -Math.PI / 2;
  nb.add(apm);
  // 屋顶水箱
  nb.add(M.cyl(0.36, 0.36, 0.80, 12, 0x9aa2ac, { pos: [6.60, 7.42, -6.20], ol: 0.01 }));
  nb.add(M.cyl(0.03, 0.03, 1.60, 6, 0x8d939d, { pos: [8.40, 7.85, -8.00], ol: 0.005 }));

  /* ---------- 后巷（店后） ---------- */
  root.add(M.box(0.55, 0.45, 0.55, 0x7a6a52, { pos: [-3.0, 0.465, -8.62], ol: 0.008 }));
  root.add(M.box(0.50, 0.40, 0.50, 0x8b7a5e, { pos: [-3.0, 0.885, -8.62], ol: 0.008 }));
  root.add(M.box(0.45, 0.35, 0.45, 0x6d5f4a, { pos: [-3.62, 0.415, -8.66], ol: 0.008 }));
  root.add(M.cyl(0.24, 0.24, 0.72, 12, 0x35543f, { pos: [-1.2, 0.60, -8.60], ol: 0.009 }));
  root.add(M.cyl(0.26, 0.26, 0.06, 12, 0x2b4634, { pos: [-1.2, 0.99, -8.60], ol: 0.007 }));
  const bwl = M.toonMat(0xfff0d0, { emissive: 0xffc178, emissiveIntensity: 0.75, side: THREE.DoubleSide });
  const bwlP = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.12), bwl);
  bwlP.position.set(0.6, 2.10, -8.34);
  root.add(bwlP);
  root.add(M.box(0.14, 0.12, 0.24, 0x4c5464, { pos: [0.6, 2.18, -8.30], ol: 0.006 }));
  addFlicker(bwl, 0.75, 0.18, 0);

  /* ---------- 小巷陈设 ---------- */
  root.add(M.box(0.55, 0.42, 0.55, 0x7a6a52, { pos: [4.25, 0.29, -6.30], ol: 0.009 }));
  root.add(M.box(0.48, 0.36, 0.48, 0x8b7a5e, { pos: [4.28, 0.68, -6.26], rot: [0, 0.3, 0], ol: 0.009 }));
  root.add(M.box(0.50, 0.40, 0.50, 0x6d5f4a, { pos: [4.85, 0.28, -6.90], rot: [0, -0.2, 0], ol: 0.009 }));
  [ -3.10, -3.85, -4.55 ].forEach((bz, i) => {
    root.add(M.cyl(0.23, 0.23, 0.72, 12, i === 1 ? 0x3f5a6d : 0x35543f, { pos: [5.30, 0.44, bz], ol: 0.009 }));
    root.add(M.cyl(0.25, 0.25, 0.06, 12, 0x2b4634, { pos: [5.30, 0.83, bz], ol: 0.007 }));
  });
  // 巷内自行车
  const bike2 = bicycle(0x6a4a3a);
  bike2.position.set(5.35, 0.08, -5.55);
  bike2.rotation.y = -Math.PI / 2 + 0.25;
  bike2.rotation.z = 0.10;
  root.add(bike2);
  // 巷内排水格栅
  const ag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.34), M.toonMat(0x2b303c, { map: grateT }));
  ag.rotation.x = -Math.PI / 2;
  ag.position.set(4.65, 0.092, -4.30);
  root.add(ag);

  /* ---------- 自动贩卖机 ---------- */
  const v1 = vending(0);
  v1.group.position.set(1.72, SW, -2.44);
  root.add(v1.group);
  addFlicker(v1.mat, 0.60, 0.07, 1);
  const v2 = vending(1);
  v2.group.position.set(2.62, SW, -2.44);
  root.add(v2.group);
  addFlicker(v2.mat, 0.60, 0.07, 1);
  const v3 = vending(2, 0.76, 1.90, 0.70);
  v3.group.position.set(3.82, 0.08, -3.42);
  v3.group.rotation.y = Math.PI / 2;
  root.add(v3.group);
  addFlicker(v3.mat, 0.60, 0.08, 1);
  // 回收箱
  root.add(M.box(0.34, 0.78, 0.34, 0x3f6b52, { pos: [3.22, SW + 0.39, -2.30], ol: 0.009 }));
  root.add(M.box(0.38, 0.06, 0.38, 0x2f5140, { pos: [3.22, SW + 0.81, -2.30], ol: 0.007 }));
  root.add(M.box(0.30, 0.16, 0.02, 0xd8d2c4, { pos: [3.22, SW + 0.62, -2.12], noOutline: true }));

  /* ---------- 自行车（店前） ---------- */
  const bike1 = bicycle(0x2f4a6a);
  bike1.position.set(-1.72, SW, -1.55);
  bike1.rotation.y = 0.30;
  bike1.rotation.z = 0.07;
  root.add(bike1);

  /* ---------- 伞架 / 垃圾桶 ---------- */
  {
    const umb = new THREE.Group();
    umb.position.set(-3.05, SW, -2.62);
    umb.rotation.y = -Math.PI / 4;
    umb.add(M.cyl(0.16, 0.18, 0.62, 10, 0x4c5464, { pos: [0, 0.31, 0], ol: 0.008 }));
    umb.add(M.cyl(0.17, 0.17, 0.05, 10, 0x6b7280, { pos: [0, 0.64, 0], ol: 0.006 }));
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1;
      umb.add(M.cyl(0.022, 0.022, 0.75, 6, [0x2f4a6a, 0x8a3f4a, 0x4a6a3f][i], {
        pos: [Math.cos(a) * 0.06, 0.68, Math.sin(a) * 0.06], rot: [Math.sin(a) * 0.14, 0, -Math.cos(a) * 0.14], ol: 0.004,
      }));
    }
    root.add(umb);
  }
  root.add(M.cyl(0.21, 0.19, 0.78, 12, 0x4a5566, { pos: [-1.05, SW + 0.39, -2.35], ol: 0.009 }));
  root.add(M.cyl(0.23, 0.23, 0.06, 12, 0x39424f, { pos: [-1.05, SW + 0.81, -2.35], ol: 0.007 }));
  root.add(M.cyl(0.10, 0.10, 0.03, 12, 0x2a303c, { pos: [-1.05, SW + 0.85, -2.35], noOutline: true }));

  /* ---------- 电线杆 ---------- */
  const pole = new THREE.Group();
  pole.position.set(6.40, 0, 1.60);
  root.add(pole);
  pole.add(M.cyl(0.115, 0.145, 7.40, 10, 0x6f6a5e, { pos: [0, 3.70, 0], ol: 0.011 }));
  pole.add(M.box(0.46, 0.30, 0.46, 0x8f96a3, { pos: [0, 0.15, 0], ol: 0.009 }));
  [[6.95, 1.70], [6.55, 1.30]].forEach(([ay, al]) => {
    pole.add(M.box(al, 0.09, 0.11, 0x7d7266, { pos: [0, ay, 0], ol: 0.007 }));
    [-al / 2 + 0.12, al / 2 - 0.12].forEach((ix) => {
      pole.add(M.cyl(0.035, 0.045, 0.14, 8, 0x9aa2ac, { pos: [ix, ay + 0.11, 0], ol: 0.005 }));
    });
  });
  pole.add(M.cyl(0.24, 0.24, 0.72, 12, 0x767d87, { pos: [0.02, 5.30, 0.30], ol: 0.01 }));
  pole.add(M.box(0.30, 0.16, 0.30, 0x59606e, { pos: [0, 1.60, 0.02], ol: 0.008 }));
  pole.add(M.box(0.22, 0.30, 0.06, 0xd8d2c4, { pos: [0, 2.30, 0.16], noOutline: true }));
  // 电线
  const wireSpecs = [
    [[-0.80, 7.02, 0], [3.40, 4.62, -3.10], 0.55],
    [[0.78, 7.02, 0], [3.40, 4.68, -4.30], 0.50],
    [[0.60, 6.62, 0.10], [2.60, 4.70, -2.95], 0.42],
    [[-0.62, 6.62, -0.10], [5.78, 5.60, -2.30], 0.30],
    [[0.66, 6.62, -0.05], [5.78, 5.20, -3.10], 0.34],
    [[3.40, 4.62, -5.60], [5.78, 4.95, -5.20], 0.26],
    [[-0.84, 6.90, 0.22], [5.80, 6.20, -1.60], 0.62],
  ];
  wireSpecs.forEach(([a, b, sag]) => {
    const A = [6.40 + a[0], a[1], 1.60 + a[2]];
    root.add(wire(A, b, sag));
  });

  /* ---------- 路灯 ---------- */
  const lamp = streetLamp();
  lamp.group.position.set(1.20, SW, 2.45);
  root.add(lamp.group);
  addFlicker(lamp.mat, 1.10, 0.05, 0);
  const lampLight = new THREE.PointLight(0xffd39a, 6.0, 9.0, 1.7);
  lampLight.position.set(1.20, 4.55, 1.35);
  root.add(lampLight);
  const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: M.glowTex('rgba(255,225,170,0.95)', 'rgba(255,190,110,0.28)'),
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.75,
  }));
  lampGlow.scale.set(1.9, 1.9, 1);
  lampGlow.position.set(1.20, 4.72, 1.33);
  root.add(lampGlow);

  /* ---------- 交通信号灯（远处） ---------- */
  const sigGroup = new THREE.Group();
  sigGroup.position.set(3.60, RD, 8.30);
  root.add(sigGroup);
  sigGroup.add(M.cyl(0.085, 0.11, 3.30, 10, 0x59606e, { pos: [0, 1.65, 0], ol: 0.009 }));
  sigGroup.add(M.box(0.26, 0.20, 0.26, 0x8f96a3, { pos: [0, 0.10, 0], ol: 0.008 }));
  sigGroup.add(M.box(0.36, 1.02, 0.30, 0x232936, { pos: [0, 3.52, 0], ol: 0.01 }));
  const lamps = [];
  [[0.34, 0x5cff9d, 0x1e5c3a], [0.00, 0xffd24a, 0x5c4a16], [-0.34, 0xff5a4a, 0x5c1e1a]].forEach(([dy, on, off], i) => {
    const mat = M.toonMat(0x1e5c3a, { emissive: 0x5cff9d, emissiveIntensity: 0.05 });
    const l = new THREE.Mesh(new THREE.CircleGeometry(0.10, 16), mat);
    l.position.set(0, 3.52 + dy, -0.16);
    l.rotation.y = Math.PI;
    sigGroup.add(l);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: M.glowTex('rgba(255,255,255,0.9)', 'rgba(255,255,255,0.25)'),
      color: on, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.0,
    }));
    glow.scale.set(0.62, 0.62, 1);
    glow.position.set(0, 3.52 + dy, -0.22);
    sigGroup.add(glow);
    l.userData = { on, off, glow };
    lamps.push(l);
  });
  const sigLight = new THREE.PointLight(0x5cff9d, 1.6, 5.0, 1.8);
  sigLight.position.set(3.60, 3.4, 8.05);
  root.add(sigLight);

  /* ---------- 街角护栏 ---------- */
  const rail = (x, z, len, ry) => {
    const g = new THREE.Group();
    g.position.set(x, SW, z);
    g.rotation.y = ry;
    const n = 3;
    for (let i = 0; i < n; i++) {
      g.add(M.box(0.06, 0.72, 0.06, 0xb8bec9, { pos: [0, 0.36, -len / 2 + i * (len / (n - 1))], ol: 0.006 }));
    }
    [0.60, 0.30].forEach((hy) => {
      g.add(M.box(0.05, 0.06, len, 0xdfe4ea, { pos: [0, hy, 0], ol: 0.005 }));
    });
    root.add(g);
  };
  rail(-5.62, 2.05, 1.30, Math.PI / 2);
  rail(-4.98, 2.72, 1.28, 0);

  /* ---------- 路口标志牌 ---------- */
  {
    const g = new THREE.Group();
    g.position.set(-5.95, SW, -1.10);
    root.add(g);
    g.add(M.cyl(0.05, 0.05, 2.20, 8, 0x8d939d, { pos: [0, 1.10, 0], ol: 0.007 }));
    // 止まれ（倒三角）
    const tri = M.cvs(200, 180, (x, w, h) => {
      x.clearRect(0, 0, w, h);
      x.fillStyle = '#d8402f';
      x.beginPath(); x.moveTo(100, 14); x.lineTo(186, 166); x.lineTo(14, 166); x.closePath(); x.fill();
      x.strokeStyle = '#f4f8ff'; x.lineWidth = 8; x.stroke();
      x.fillStyle = '#ffffff'; x.font = '700 44px "Hiragino Kaku Gothic ProN",sans-serif';
      x.textAlign = 'center'; x.fillText('止まれ', 100, 140);
    });
    const tp = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.47),
      new THREE.MeshBasicMaterial({ map: tri, transparent: true }));
    tp.position.set(0, 2.00, 0.02);
    g.add(tp);
    // 蓝底指示牌
    const gu = M.cvs(256, 128, (x, w, h) => {
      x.fillStyle = '#2f6fd0'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#ffffff'; x.fillRect(6, 6, w - 12, h - 12);
      x.fillStyle = '#2f6fd0'; x.fillRect(12, 12, w - 24, h - 24);
      x.fillStyle = '#ffffff';
      x.font = '700 34px "Hiragino Sans",sans-serif'; x.textAlign = 'center';
      x.fillText('← 駅 団地', w / 2, 58);
      x.font = '500 22px "Hiragino Sans",sans-serif';
      x.fillText('1.2km', w / 2, 92);
    });
    const gp = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.33),
      M.toonMat(0xffffff, { map: gu, emissive: 0xffffff, emissiveMap: gu, emissiveIntensity: 0.4 }));
    gp.position.set(0, 1.45, 0.02);
    g.add(gp);
  }

  /* ---------- 圆柱广告塔 ---------- */
  {
    const t = M.cvs(256, 256, (x, w, h) => {
      const cols = ['#f6d365', '#7fd1e8', '#f7a1a1', '#a8e6a1'];
      for (let i = 0; i < 4; i++) {
        x.fillStyle = cols[i]; x.fillRect(i * 64, 0, 64, 256);
        x.fillStyle = 'rgba(18,50,74,0.8)';
        x.font = '700 26px "Hiragino Kaku Gothic ProN",sans-serif';
        x.textAlign = 'center';
        const txt = ['喫茶', '深夜', '弁当', '雑誌'][i];
        for (let k = 0; k < txt.length; k++) x.fillText(txt[k], i * 64 + 32, 60 + k * 32);
        x.fillStyle = 'rgba(255,255,255,0.5)';
        x.fillRect(i * 64 + 10, 190, 44, 50);
      }
    });
    root.add(M.cyl(0.40, 0.42, 1.95, 20, 0xffffff, {
      pos: [5.15, SW + 0.98, 1.30],
      material: M.toonMat(0xffffff, { map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.28 }),
      ol: 0.011,
    }));
    root.add(M.cyl(0.44, 0.44, 0.12, 20, 0xdfe4ea, { pos: [5.15, SW + 2.01, 1.30], ol: 0.008 }));
    root.add(M.cyl(0.46, 0.46, 0.14, 20, 0x59606e, { pos: [5.15, SW + 0.07, 1.30], ol: 0.008 }));
  }

  /* ---------- 街树 ---------- */
  {
    const g = new THREE.Group();
    g.position.set(7.85, SW, 0.55);
    root.add(g);
    g.add(M.box(1.15, 0.10, 1.15, 0x4a4034, { pos: [0, 0.05, 0], ol: 0.008 }));
    g.add(M.cyl(0.10, 0.15, 2.10, 8, 0x4a3c30, { pos: [0, 1.10, 0], ol: 0.009 }));
    const fm = M.toonMat(0x2f4a3c);
    [[0, 2.55, 0, 0.62], [0.30, 2.90, 0.16, 0.48], [-0.26, 2.82, -0.18, 0.44], [0.05, 3.15, -0.05, 0.34]].forEach(([fx, fy, fz, r]) => {
      g.add(M.sphere(r, 0x2f4a3c, { pos: [fx, fy, fz], material: fm, ol: 0.014, seg: 14, seg2: 10 }));
    });
  }

  /* ---------- 积水 ---------- */
  const addPuddle = (x, z, w, d, color, y, intensity, seed) => {
    const mat = makePuddleMaterial(color, seed, intensity);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    p.rotation.x = -Math.PI / 2;
    p.rotation.z = seed * 0.7;
    p.position.set(x, y, z);
    p.renderOrder = 1;
    root.add(p);
    puddles.push(p);
    return p;
  };
  addPuddle(-2.20, 5.20, 3.60, 2.60, 0x74a6d8, 0.045, 0.55, 1);
  addPuddle(4.30, 6.60, 3.00, 2.20, 0x6f9fd0, 0.045, 0.48, 2);
  addPuddle(-7.30, 0.60, 2.20, 3.00, 0x6a94c4, 0.045, 0.45, 3);
  addPuddle(-0.60, 0.60, 5.60, 2.20, 0x86a8c8, 0.252, 0.40, 4);
  addPuddle(6.60, 0.20, 3.20, 2.00, 0x74a6d8, 0.252, 0.36, 5);
  addPuddle(4.70, -5.20, 1.70, 2.60, 0x6a94c4, 0.092, 0.50, 6);
  addPuddle(-2.00, -1.90, 2.60, 1.40, 0x9fb8d0, 0.252, 0.34, 7);

  /* ---------- 湿地面反射 ---------- */
  const addRefl = (map, x, z, w, len, tint, strength, y = 0.252, flip = false) => {
    const m = makeReflectionMaterial(map, tint, strength);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, len), m);
    p.rotation.x = -Math.PI / 2;
    if (flip) p.rotation.z = Math.PI;
    p.position.set(x, y, z);
    p.renderOrder = 1;
    root.add(p);
    reflections.push(p);
    return p;
  };
  const flipTex = (t) => { const c = t.clone(); c.flipY = !c.flipY; c.needsUpdate = true; return c; };
  const signMap = flipTex(M.signTexMain());
  addRefl(signMap, 0.65, -0.40, 5.20, 4.40, 0xfff0d8, 0.62, 0.252, true);
  const vMap = flipTex(M.vendingTex(0));
  addRefl(vMap, 1.72, -1.35, 0.72, 2.00, 0xffd8c0, 0.55, 0.252, true);
  const v2Map = flipTex(M.vendingTex(1));
  addRefl(v2Map, 2.62, -1.35, 0.72, 2.00, 0xc8e0ff, 0.55, 0.252, true);
  const vsMap = flipTex(M.signTexVertical());
  addRefl(vsMap, 6.30, -0.35, 0.46, 1.90, 0xd8f0ff, 0.45, 0.252, true);
  // 灯光池
  const pool = (x, z, w, d, color, op, y = 0.252) => {
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({
        map: M.glowTex('rgba(255,255,255,1)', 'rgba(255,255,255,0.32)'),
        color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    p.rotation.x = -Math.PI / 2;
    p.position.set(x, y, z);
    p.renderOrder = 1;
    root.add(p);
    return p;
  };
  pool(-0.50, -1.55, 8.00, 2.90, 0xffc080, 0.34);
  pool(-1.60, 0.90, 6.60, 3.20, 0xffb878, 0.17);
  pool(1.20, 1.70, 2.60, 2.20, 0xffc890, 0.30, 0.05);
  pool(2.20, -1.10, 2.60, 1.60, 0xffc890, 0.16);
  pool(5.60, -2.20, 2.00, 1.60, 0xffbb88, 0.20, 0.10);

  // 店门口光溢出（自动门打开时增强）
  const doorSpill = pool(-4.05, -2.62, 2.40, 1.90, 0xffcf96, 0.18);
  doorSpill.rotation.z = -Math.PI / 4;
  doorSpill.position.y = 0.253;

  // 信号灯地面反射
  const sigStreak = addRefl(signMap, 3.60, 6.85, 0.44, 2.90, 0x5cff9d, 0.42, 0.042, false);

  /* ---------- 溅射点 ---------- */
  for (let i = 0; i < 40; i++) {
    const r1 = Math.random(), r2 = Math.random();
    if (r1 < 0.55) splashSpots.push([-8.5 + r2 * 17, 0.045, 3.0 + Math.random() * 5.8, 0xa8d8ff]);
    else if (r1 < 0.8) splashSpots.push([-8.5 + r2 * 17, 0.253, -2.6 + Math.random() * 5.3, 0xb8dcf5]);
    else splashSpots.push([-8.6 + Math.random() * 1.6, 0.045, -8.5 + Math.random() * 11, 0x9fd0ff]);
  }

  scene.add(root);

  return {
    root,
    flickers,
    puddles,
    reflections,
    splashSpots,
    doorSpill,
    signal: { lamps, light: sigLight, streak: sigStreak },
  };
}
