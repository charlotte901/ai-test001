import * as THREE from 'three';

/* ------------------------------------------------------------------
   三渲二基础：分级 toon 渐变 + 反向外扩描边 + 常用几何工厂
------------------------------------------------------------------ */

export const OUTLINE = 0x141a26;

let _ramp = null;
export function toonRamp() {
  if (_ramp) return _ramp;
  // 4 阶硬边渐变，形成赛璐璐明暗块面
  const data = new Uint8Array([46, 116, 196, 255]);
  const t = new THREE.DataTexture(data, 4, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  _ramp = t;
  return t;
}

export function toonMat(color, o = {}) {
  const m = new THREE.MeshToonMaterial({
    color,
    gradientMap: toonRamp(),
    emissive: o.emissive !== undefined ? o.emissive : 0x000000,
    emissiveIntensity: o.emissiveIntensity !== undefined ? o.emissiveIntensity : 1,
  });
  if (o.map) m.map = o.map;
  if (o.emissiveMap) m.emissiveMap = o.emissiveMap;
  if (o.transparent !== undefined) { m.transparent = o.transparent; }
  if (o.opacity !== undefined) m.opacity = o.opacity;
  if (o.side !== undefined) m.side = o.side;
  if (o.depthWrite !== undefined) m.depthWrite = o.depthWrite;
  if (o.alphaTest !== undefined) m.alphaTest = o.alphaTest;
  return m;
}

const _outlineMats = new Map();
export function outlineMat(color = OUTLINE) {
  if (!_outlineMats.has(color)) {
    _outlineMats.set(color, new THREE.MeshBasicMaterial({ color, side: THREE.BackSide, fog: true }));
  }
  return _outlineMats.get(color);
}

const _size = new THREE.Vector3();
export function addOutline(mesh, t = 0.014, color = OUTLINE) {
  const g = mesh.geometry;
  if (!g.boundingBox) g.computeBoundingBox();
  g.boundingBox.getSize(_size);
  const sx = Math.max(_size.x, 1e-3), sy = Math.max(_size.y, 1e-3), sz = Math.max(_size.z, 1e-3);
  const o = new THREE.Mesh(g, outlineMat(color));
  o.scale.set((sx + 2 * t) / sx, (sy + 2 * t) / sy, (sz + 2 * t) / sz);
  o.castShadow = false;
  o.receiveShadow = false;
  o.renderOrder = -2;
  mesh.add(o);
  return mesh;
}

/** 通用网格工厂：统一处理阴影、描边、位置 */
export function makeMesh(geo, color, o = {}) {
  const m = new THREE.Mesh(geo, o.material || toonMat(color, o));
  m.castShadow = o.cast !== undefined ? o.cast : true;
  m.receiveShadow = o.recv !== undefined ? o.recv : true;
  if (o.pos) m.position.set(o.pos[0], o.pos[1], o.pos[2]);
  if (o.rot) m.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
  if (!o.noOutline) addOutline(m, o.ol !== undefined ? o.ol : 0.013, o.olc);
  if (o.renderOrder !== undefined) m.renderOrder = o.renderOrder;
  return m;
}

export const box = (w, h, d, color, o = {}) => makeMesh(new THREE.BoxGeometry(w, h, d), color, o);
export const cyl = (rt, rb, h, seg, color, o = {}) => makeMesh(new THREE.CylinderGeometry(rt, rb, h, seg), color, o);
export const plane = (w, h, color, o = {}) => makeMesh(new THREE.PlaneGeometry(w, h), color, o);
export const sphere = (r, color, o = {}) => makeMesh(new THREE.SphereGeometry(r, o.seg || 16, o.seg2 || 12), color, o);

/** 把对象塞进容器 */
export function into(parent, ...objs) { objs.forEach(o => o && parent.add(o)); return parent; }

/** 确定性随机 */
export function makeRng(seed) {
  let s = (seed | 0) || 1;
  return function () {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 8) & 0xffffff) / 0xffffff;
  };
}

/* ------------------------------------------------------------------
   程序化贴图
------------------------------------------------------------------ */

export function cvs(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  draw(x, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

const JP = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic","PingFang SC","Noto Sans JP",sans-serif';
const JPB = '"Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic","PingFang SC","Noto Sans JP",sans-serif';

function roundRect(x, l, t, w, h, r) {
  x.beginPath();
  x.moveTo(l + r, t);
  x.arcTo(l + w, t, l + w, t + h, r);
  x.arcTo(l + w, t + h, l, t + h, r);
  x.arcTo(l, t + h, l, t, r);
  x.arcTo(l, t, l + w, t, r);
  x.closePath();
}

function star(x, cx, cy, r, n) {
  x.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const rr = i % 2 ? r * 0.44 : r;
    const a = (Math.PI / n) * i - Math.PI / 2;
    const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
    i ? x.lineTo(px, py) : x.moveTo(px, py);
  }
  x.closePath();
}

/** 便利店主招牌灯箱 */
export function signTexMain() {
  return cvs(1024, 168, (x, w, h) => {
    x.fillStyle = '#f7fbff'; x.fillRect(0, 0, w, h);
    // 顶部品牌色条
    const grd = x.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, '#28c98a'); grd.addColorStop(0.45, '#2aa7e8'); grd.addColorStop(1, '#28c98a');
    x.fillStyle = grd; x.fillRect(0, 0, w, 16);
    x.fillStyle = grd; x.fillRect(0, h - 16, w, 16);
    // 星星标志
    x.fillStyle = '#f2994a'; star(x, 92, h / 2, 44, 5); x.fill();
    x.fillStyle = '#ffffff'; star(x, 92, h / 2, 26, 5); x.fill();
    // 主文字
    x.fillStyle = '#12324a';
    x.font = `700 74px ${JP}`;
    x.textBaseline = 'middle';
    x.fillText('HOSHI MART', 158, h / 2 - 12);
    x.fillStyle = '#3d7fa8';
    x.font = `500 30px ${JP}`;
    x.fillText('ほしマート', 168, h / 2 + 40);
    // 24h 圆标
    x.fillStyle = '#e8462f';
    x.beginPath(); x.arc(w - 92, h / 2, 50, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#fff'; x.font = `700 34px ${JP}`; x.textAlign = 'center';
    x.fillText('24h', w - 92, h / 2 + 2);
    x.textAlign = 'left';
  });
}

/** 竖式招牌（多格） */
export function signTexVertical() {
  return cvs(256, 768, (x, w, h) => {
    x.fillStyle = '#0e2233'; x.fillRect(0, 0, w, h);
    const panels = [
      { c: '#28c98a', t1: 'コンビニ', t2: '', s: 52 },
      { c: '#f7fbff', t1: 'HOSHI', t2: 'MART', s: 46 },
      { c: '#2aa7e8', t1: '24h', t2: 'OPEN', s: 54 },
      { c: '#f7fbff', t1: 'アイス', t2: 'ドリンク', s: 44 },
    ];
    const ph = h / panels.length;
    panels.forEach((p, i) => {
      const y = i * ph;
      x.fillStyle = p.c; x.fillRect(10, y + 8, w - 20, ph - 16);
      x.fillStyle = i === 1 || i === 3 ? '#12324a' : '#ffffff';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      if (p.t2) {
        x.font = `700 ${p.s}px ${JPB}`;
        x.fillText(p.t1, w / 2, y + ph / 2 - 26);
        x.fillText(p.t2, w / 2, y + ph / 2 + 26);
      } else {
        x.font = `700 ${p.s}px ${JPB}`;
        x.fillText(p.t1, w / 2, y + ph / 2);
      }
    });
    x.textAlign = 'left';
  });
}

/** 门头小型灯箱（营业时间等） */
export function signTexSmall(title, sub, bg = '#12324a') {
  return cvs(512, 128, (x, w, h) => {
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,0.14)';
    x.fillRect(0, 0, w, 10);
    x.fillStyle = '#eaf6ff';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `700 46px ${JPB}`;
    x.fillText(title, w / 2, sub ? h / 2 - 16 : h / 2);
    if (sub) {
      x.font = `500 26px ${JP}`;
      x.fillStyle = 'rgba(234,246,255,0.75)';
      x.fillText(sub, w / 2, h / 2 + 26);
    }
    x.textAlign = 'left';
  });
}

/** 自动贩卖机正面 */
export function vendingTex(hue = 0) {
  return cvs(256, 420, (x, w, h) => {
    const body = hue === 0 ? '#c8322c' : hue === 1 ? '#1d5fae' : '#2c8f5a';
    x.fillStyle = body; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,0.1)'; x.fillRect(0, 0, w, 26);
    // 展示窗
    x.fillStyle = '#0d1a22'; x.fillRect(16, 40, w - 32, 250);
    const cols = 4, rows = 3;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cw = (w - 52) / cols, ch = 236 / rows;
        const px = 24 + c * cw, py = 48 + r * ch;
        x.fillStyle = ['#e8534b', '#f2c14e', '#4aa3e0', '#63c58a', '#e07ab0', '#ffffff'][(r * cols + c + hue) % 6];
        roundRect(x, px + 3, py + 5, cw - 8, ch - 20, 5); x.fill();
        x.fillStyle = 'rgba(255,255,255,0.55)';
        x.fillRect(px + 6, py + ch - 18, cw - 14, 4);
        x.fillStyle = 'rgba(10,20,30,0.55)';
        x.fillRect(px + 6, py + ch - 12, cw - 14, 3);
      }
    }
    x.fillStyle = 'rgba(190,235,255,0.22)';
    x.fillRect(16, 40, w - 32, 120);
    // 顶部灯箱
    x.fillStyle = '#f4fbff'; x.fillRect(16, 6, w - 32, 26);
    x.fillStyle = '#12324a'; x.font = `700 18px ${JPB}`; x.textAlign = 'center';
    x.fillText(hue === 0 ? 'ドリンク' : hue === 1 ? 'COFFEE' : 'ICE', w / 2, 25);
    // 按钮与取货口
    x.fillStyle = '#10161f'; x.fillRect(16, 300, w - 32, 46);
    for (let i = 0; i < 5; i++) {
      x.fillStyle = ['#f2c14e', '#e8534b', '#4aa3e0', '#63c58a', '#f4fbff'][i];
      x.beginPath(); x.arc(34 + i * 44, 323, 12, 0, Math.PI * 2); x.fill();
    }
    x.fillStyle = '#0a1119'; x.fillRect(40, 360, w - 80, 44);
    x.fillStyle = 'rgba(255,255,255,0.16)'; x.fillRect(40, 360, w - 80, 8);
    x.textAlign = 'left';
  });
}

/** 海报 / 宣传单 */
export function posterTex(kind = 0, seed = 0) {
  return cvs(256, 360, (x, w, h) => {
    const sets = [
      { bg: '#fdf3d8', a: '#e8534b', b: '#12324a', t1: '新発売', t2: 'お弁当', t3: '期間限定' },
      { bg: '#dff0ff', a: '#2aa7e8', b: '#12324a', t1: 'ホット', t2: 'コーヒー', t3: '100円' },
      { bg: '#ffe9e2', a: '#f2994a', b: '#7a3b1e', t1: 'おにぎり', t2: '全品', t3: 'セール中' },
      { bg: '#e9f7e6', a: '#3fae6a', b: '#12324a', t1: '週刊', t2: 'マンガ', t3: '発売中' },
    ];
    const s = sets[(kind + seed) % sets.length];
    x.fillStyle = s.bg; x.fillRect(0, 0, w, h);
    x.fillStyle = s.a; x.fillRect(0, 0, w, 74);
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `700 40px ${JPB}`; x.fillText(s.t1, w / 2, 40);
    // 主视觉区块
    x.fillStyle = s.a; roundRect(x, 34, 96, w - 68, 130, 12); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(w / 2, 160, 40, 0, Math.PI * 2); x.fill();
    x.fillStyle = s.a; x.font = `700 26px ${JPB}`; x.fillText(s.t2, w / 2, 160);
    x.fillStyle = s.b; x.font = `700 34px ${JPB}`; x.fillText(s.t3, w / 2, 268);
    for (let i = 0; i < 3; i++) {
      x.fillStyle = 'rgba(18,50,74,0.25)';
      x.fillRect(40 + (i % 2) * 10, 296 + i * 16, w - 80 - (i % 2) * 20, 7);
    }
    x.textAlign = 'left';
  });
}

/** 杂志架：彩色书脊 */
export function magazineTex() {
  return cvs(256, 256, (x, w, h) => {
    x.fillStyle = '#20283a'; x.fillRect(0, 0, w, h);
    const cols = 9, rows = 5;
    const pal = ['#e8534b', '#f2c14e', '#4aa3e0', '#63c58a', '#f4fbff', '#e07ab0', '#8b6ce0', '#f2994a'];
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const cw = w / cols, ch = h / rows;
        x.fillStyle = pal[(c * 3 + r * 5) % pal.length];
        x.fillRect(c * cw + 2, r * ch + 2, cw - 4, ch - 4);
        x.fillStyle = 'rgba(20,26,38,0.55)';
        x.fillRect(c * cw + 4, r * ch + 5, cw - 8, 3);
        x.fillRect(c * cw + 4, r * ch + ch - 10, cw - 8, 3);
      }
    }
  });
}

/** 路面沥青 */
export function asphaltTex() {
  return cvs(512, 512, (x, w, h) => {
    x.fillStyle = '#242a38'; x.fillRect(0, 0, w, h);
    const rnd = makeRng(7);
    for (let i = 0; i < 9000; i++) {
      const g = 34 + rnd() * 34;
      x.fillStyle = `rgba(${g},${g + 4},${g + 12},${0.25 + rnd() * 0.4})`;
      x.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2);
    }
    // 湿痕
    for (let i = 0; i < 40; i++) {
      x.fillStyle = `rgba(70,100,140,${0.03 + rnd() * 0.05})`;
      x.beginPath();
      x.ellipse(rnd() * w, rnd() * h, 20 + rnd() * 70, 12 + rnd() * 40, rnd() * 3, 0, Math.PI * 2);
      x.fill();
    }
  }, [6, 6]);
}

/** 人行道方砖 */
export function tileTex() {
  return cvs(256, 256, (x, w, h) => {
    x.fillStyle = '#6d7482'; x.fillRect(0, 0, w, h);
    const rnd = makeRng(21);
    for (let i = 0; i < 2600; i++) {
      const g = 90 + rnd() * 40;
      x.fillStyle = `rgba(${g},${g + 3},${g + 8},0.35)`;
      x.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2);
    }
    x.strokeStyle = 'rgba(40,46,60,0.55)';
    x.lineWidth = 3;
    for (let i = 0; i <= 4; i++) {
      x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, h); x.stroke();
      x.beginPath(); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke();
    }
  }, [4, 4]);
}

/** 混凝土 / 邻楼立面 */
export function concreteTex() {
  return cvs(256, 256, (x, w, h) => {
    x.fillStyle = '#4a4f5c'; x.fillRect(0, 0, w, h);
    const rnd = makeRng(33);
    for (let i = 0; i < 3000; i++) {
      const g = 60 + rnd() * 30;
      x.fillStyle = `rgba(${g},${g + 2},${g + 6},0.3)`;
      x.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2);
    }
    // 雨渍竖纹
    for (let i = 0; i < 26; i++) {
      x.fillStyle = `rgba(28,34,46,${0.06 + rnd() * 0.12})`;
      x.fillRect(rnd() * w, 0, 2 + rnd() * 6, h * (0.3 + rnd() * 0.7));
    }
  }, [3, 3]);
}

/** 排水沟盖板 / 井盖 */
export function grateTex() {
  return cvs(128, 128, (x, w, h) => {
    x.fillStyle = '#2b303c'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#171b25';
    for (let i = 0; i < 9; i++) x.fillRect(10, 10 + i * 12, w - 20, 6);
  });
}

export function manholeTex() {
  return cvs(256, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.fillStyle = '#39404f';
    x.beginPath(); x.arc(128, 128, 122, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#252b38'; x.lineWidth = 6;
    for (let i = 1; i <= 4; i++) {
      x.beginPath(); x.arc(128, 128, 122 - i * 22, 0, Math.PI * 2); x.stroke();
    }
    x.fillStyle = '#2b3140';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      x.save(); x.translate(128, 128); x.rotate(a);
      x.fillRect(64, -7, 40, 14);
      x.restore();
    }
  });
}

/** 圆形柔光贴图（用于灯光溢出/光晕） */
export function glowTex(inner = 'rgba(255,255,255,1)', mid = 'rgba(255,255,255,0.35)') {
  return cvs(256, 256, (x, w, h) => {
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, inner);
    g.addColorStop(0.35, mid);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  });
}

/** 水波纹环 */
export function ringTex() {
  return cvs(256, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) {
      const r = 100 - i * 26;
      const g = x.createRadialGradient(128, 128, r * 0.45, 128, 128, r);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.65, `rgba(255,255,255,${0.5 - i * 0.12})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g;
      x.beginPath(); x.arc(128, 128, r, 0, Math.PI * 2); x.fill();
    }
  });
}

/** 不规则的积水形状 */
export function puddleTex(seed = 1) {
  return cvs(256, 256, (x, w, h) => {
    const rnd = makeRng(seed);
    x.clearRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,0.85)';
    x.beginPath();
    const pts = 14;
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const r = 84 + Math.sin(a * 3 + seed) * 16 + Math.cos(a * 5 - seed) * 12 + (rnd() - 0.5) * 18;
      const px = 128 + Math.cos(a) * r * 1.18, py = 128 + Math.sin(a) * r * 0.82;
      i ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    x.closePath();
    x.filter = 'blur(6px)';
    x.fill();
    x.filter = 'none';
  });
}

/** 便利店顶部导视 / 店内挂旗 */
export function bannerTex(kind = 0) {
  return cvs(256, 96, (x, w, h) => {
    const bgs = ['#f6d365', '#7fd1e8', '#f7a1a1', '#a8e6a1'];
    x.fillStyle = bgs[kind % bgs.length]; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(18,50,74,0.85)';
    const txt = ['新商品', 'ポイント', 'セール', 'ホット'][kind % 4];
    x.font = `700 40px ${JPB}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(txt, w / 2, h / 2);
    x.textAlign = 'left';
  });
}

/** ATM 屏幕 */
export function atmTex() {
  return cvs(256, 320, (x, w, h) => {
    x.fillStyle = '#1c2735'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#2f4a63'; x.fillRect(14, 14, w - 28, 90);
    x.fillStyle = '#bfe8ff'; x.font = `700 26px ${JPB}`; x.textAlign = 'center';
    x.fillText('HOSHI BANK', w / 2, 62);
    x.fillStyle = '#8fd0f5'; x.font = `500 18px ${JP}`;
    x.fillText('お引出し・お預入れ', w / 2, 86);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
      x.fillStyle = r === 3 && c === 1 ? '#3f7fb0' : '#37506a';
      roundRect(x, 22 + c * 72, 120 + r * 34, 62, 26, 6); x.fill();
    }
    x.textAlign = 'left';
  });
}

/** 香烟柜 */
export function cigaretteTex() {
  return cvs(256, 128, (x, w, h) => {
    x.fillStyle = '#0f1620'; x.fillRect(0, 0, w, h);
    const pal = ['#d8d2c4', '#c0503f', '#3f6ea8', '#e0b34a', '#5c8f6a', '#8e5fa8', '#d97fa8'];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 16; c++) {
      x.fillStyle = pal[(r * 7 + c * 3) % pal.length];
      x.fillRect(8 + c * 15.4, 8 + r * 29, 13, 24);
      x.fillStyle = 'rgba(255,255,255,0.35)';
      x.fillRect(8 + c * 15.4, 8 + r * 29, 13, 4);
    }
  });
}

/** 关东煮 / 热食柜 */
export function hotCaseTex() {
  return cvs(256, 128, (x, w, h) => {
    x.fillStyle = '#3a2418'; x.fillRect(0, 0, w, h);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) {
      x.fillStyle = ['#e8b45c', '#d97a3f', '#f0d9a8', '#c96a45'][(r + c) % 4];
      roundRect(x, 10 + c * 40, 14 + r * 62, 32, 26, 8); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.28)';
      roundRect(x, 14 + c * 40, 18 + r * 62, 24, 14, 6); x.fill();
    }
  });
}
