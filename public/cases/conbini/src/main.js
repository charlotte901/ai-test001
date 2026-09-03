import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { EffectComposer } from '../vendor/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/postprocessing/OutputPass.js';
import { buildStreet } from './street.js';
import { buildStore } from './store.js';
import { initEffects } from './effects.js';

const canvas = document.getElementById('c');

/* ---------------- 渲染器 ---------------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

/* ---------------- 场景 ---------------- */
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0b1220, 0.0125);

/* 夜空背景 */
{
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(120, 32, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { uTop: { value: new THREE.Color(0x05080f) }, uBot: { value: new THREE.Color(0x18243c) }, uGlow: { value: new THREE.Color(0x2a3550) } },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 uTop; uniform vec3 uBot; uniform vec3 uGlow;
        varying vec3 vP;
        void main(){
          float h = clamp(normalize(vP).y*0.5+0.5, 0.0, 1.0);
          vec3 c = mix(uBot, uTop, pow(h, 0.72));
          float hor = exp(-pow((h-0.48)*7.0, 2.0));
          c += uGlow * hor * 0.55;
          gl_FragColor = vec4(c, 1.0);
        }
      `,
    })
  );
  sky.frustumCulled = false;
  scene.add(sky);
}

/* ---------------- 相机 ---------------- */
const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.5, 400);
camera.position.set(13.5, 9.6, 16.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(-0.4, 1.15, -2.6);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.rotateSpeed = 0.65;
controls.zoomSpeed = 0.85;
controls.panSpeed = 0.55;
controls.minDistance = 6.0;
controls.maxDistance = 46;
controls.minPolarAngle = 0.12;
controls.maxPolarAngle = 1.46;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.16;
controls.addEventListener('start', () => { controls.autoRotate = false; });
controls.update();

/* ---------------- 灯光 ---------------- */
scene.add(new THREE.AmbientLight(0x40527a, 0.42));
const hemi = new THREE.HemisphereLight(0x5a72a8, 0x141a26, 0.48);
scene.add(hemi);

const moon = new THREE.DirectionalLight(0xa8c6ff, 1.30);
moon.position.set(-11, 15, 11);
moon.target.position.set(-0.5, 0, -3.0);
moon.castShadow = true;
moon.shadow.mapSize.set(1024, 1024);
moon.shadow.camera.near = 1;
moon.shadow.camera.far = 52;
moon.shadow.camera.left = -15;
moon.shadow.camera.right = 15;
moon.shadow.camera.top = 15;
moon.shadow.camera.bottom = -15;
moon.shadow.bias = -0.0007;
moon.shadow.normalBias = 0.022;
scene.add(moon);
scene.add(moon.target);

const fill = new THREE.DirectionalLight(0x6f8fd0, 0.32);
fill.position.set(9, 5, 14);
scene.add(fill);

/* ---------------- 场景内容 ---------------- */
const street = buildStreet(scene);
const store = buildStore(scene, { street });
const fx = initEffects(scene, { store, street });

/* ---------------- 后期 ---------------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight), 0.55, 0.75, 0.82
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---------------- 循环 ---------------- */
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  controls.update();
  fx.update(dt, t);
  composer.render();
}
animate();

/* ---------------- 玻璃自动门点击开合 ---------------- */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
// 命中目标：透明热区 + 两扇玻璃门面板本身（递归命中门框/玻璃/横杆）
const doorTargets = () => [store.doorHit, ...store.doorPanels.map((p) => p.obj)].filter(Boolean);
const hitDoor = (ev) => {
  ndc.set((ev.clientX / window.innerWidth) * 2 - 1, -(ev.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.intersectObjects(doorTargets(), true).length > 0;
};
let pdown = null;
canvas.addEventListener('pointerdown', (ev) => {
  pdown = { x: ev.clientX, y: ev.clientY, t: performance.now() };
});
window.addEventListener('pointerup', (ev) => {
  if (!pdown) return;
  const dx = ev.clientX - pdown.x, dy = ev.clientY - pdown.y;
  const quick = performance.now() - pdown.t < 500;
  pdown = null;
  if (!quick || dx * dx + dy * dy > 36) return;  // 区分拖拽与点击
  if (hitDoor(ev)) fx.requestDoor();
});
// 悬停在门上时手型光标（节流）
let hoverTick = 0;
canvas.addEventListener('pointermove', (ev) => {
  const now = performance.now();
  if (now - hoverTick < 120) return;
  hoverTick = now;
  canvas.style.cursor = hitDoor(ev) ? 'pointer' : '';
});

/* ---------------- 自适应 ---------------- */
window.__dbg = { scene, camera, controls, renderer, composer, store, street, fx, clock };

window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloom.setSize(w, h);
});
