import * as THREE from 'three';
import * as M from './materials.js';

/* ==================================================================
   雨夜动效：降雨 / 屋檐滴水 / 水波 / 玻璃流雨 / 霓虹闪烁 /
            自动门 / 交通信号灯 / 地面积水反射
================================================================== */

/* ---------------- 积水着色器 ---------------- */
export function makePuddleMaterial(color = 0x6fa8d8, seed = 1, intensity = 0.55) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uSeed: { value: seed },
      uIntensity: { value: intensity },
      uMap: { value: M.puddleTex(seed) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: `
      uniform float uTime; uniform vec3 uColor; uniform float uSeed; uniform float uIntensity;
      uniform sampler2D uMap;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      void main(){
        vec2 p = vUv*2.0-1.0;
        float r = length(p);
        float mask = texture2D(uMap, vUv).a;
        if(mask < 0.01) discard;
        // 同心波纹
        float w = sin(r*26.0 - uTime*2.6 + uSeed*6.28)*0.5+0.5;
        w = pow(w, 2.6);
        float w2 = sin(r*13.0 + uTime*1.4 + uSeed*3.1)*0.5+0.5;
        w = mix(w, w2, 0.4);
        // 雨点敲击的细碎高光
        float sp = hash(floor(vUv*22.0)+floor(uTime*3.0));
        float hit = step(0.986, sp) * (1.0-fract(uTime*3.0));
        float a = mask * (0.14 + 0.62*w + 0.5*hit) * uIntensity;
        gl_FragColor = vec4(uColor*(0.55+0.9*w+0.6*hit), a);
      }
    `,
  });
}

/* ---------------- 湿地反射（镜像拉长） ---------------- */
export function makeReflectionMaterial(map, tint = 0xffffff, strength = 0.5) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMap: { value: map },
      uTint: { value: new THREE.Color(tint) },
      uStrength: { value: strength },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: `
      uniform float uTime; uniform sampler2D uMap; uniform vec3 uTint; uniform float uStrength;
      varying vec2 vUv;
      void main(){
        vec2 uv = vUv;
        float wob = sin(uv.y*26.0 + uTime*1.9)*0.010 + sin(uv.x*15.0 - uTime*1.25)*0.012;
        uv.x += wob;
        uv.y += sin(uv.y*9.0 - uTime*1.1)*0.006;
        vec4 c = texture2D(uMap, clamp(uv,0.001,0.999));
        float fade = smoothstep(0.0,0.30,vUv.y) * smoothstep(1.0,0.42,vUv.y);
        float side = smoothstep(0.0,0.16,vUv.x)*smoothstep(1.0,0.84,vUv.x);
        float ripple = 0.68 + 0.32*sin(vUv.y*34.0 - uTime*2.2);
        gl_FragColor = vec4(c.rgb*uTint*ripple, c.a*uStrength*fade*side);
      }
    `,
  });
}

/* ---------------- 玻璃流雨 ---------------- */
function glassRainMaterial(seed) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSeed: { value: seed } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: `
      uniform float uTime; uniform float uSeed;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      void main(){
        float cols = 26.0;
        float cx = floor(vUv.x*cols);
        float r1 = hash(vec2(cx, 3.7+uSeed));
        float r2 = hash(vec2(cx, 9.1+uSeed));
        float r3 = hash(vec2(cx, 17.3+uSeed));
        float speed = 0.055 + 0.13*r1;
        float y = fract(vUv.y*1.15 + uTime*speed + r2*4.0);
        float head = smoothstep(0.0,0.075,y)*smoothstep(0.42,0.10,y);
        float trail = smoothstep(0.02,1.0,y)*0.16;
        float wdt = smoothstep(0.5,0.04, abs(fract(vUv.x*cols)-0.5));
        float a = (head*0.85 + trail) * wdt * (0.30+0.70*r3);
        // 慢速下滑的细小水珠
        float bx = floor(vUv.x*42.0);
        float br = hash(vec2(bx, 5.5+uSeed));
        float by = fract(vUv.y*2.0 + uTime*0.045*br + br*3.0);
        float bd = smoothstep(0.5,0.0, abs(fract(vUv.x*42.0)-0.5)) * smoothstep(0.10,0.0, abs(by-0.5));
        a += bd*0.22;
        // 雾气
        a += 0.035;
        gl_FragColor = vec4(vec3(0.68,0.84,1.0), a*0.85);
      }
    `,
  });
}

/* ---------------- 雨幕 ---------------- */
function makeRain(scene, rnd) {
  const N = 2400;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 2 * 3);
  const aSeed = new Float32Array(N * 2);
  const aLen = new Float32Array(N * 2);
  const aEnd = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    const x = rnd() * 26 - 13;
    const z = rnd() * 26 - 13;
    const y = rnd() * 13;
    const L = 0.30 + rnd() * 0.60;
    const s = rnd();
    pos[i * 6 + 0] = x; pos[i * 6 + 1] = y; pos[i * 6 + 2] = z;
    pos[i * 6 + 3] = x + 0.13; pos[i * 6 + 4] = y; pos[i * 6 + 5] = z + 0.05;
    aSeed[i * 2] = s; aSeed[i * 2 + 1] = s;
    aLen[i * 2] = L; aLen[i * 2 + 1] = L;
    aEnd[i * 2] = 0; aEnd[i * 2 + 1] = 1;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
  geo.setAttribute('aLen', new THREE.BufferAttribute(aLen, 1));
  geo.setAttribute('aEnd', new THREE.BufferAttribute(aEnd, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.42 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aSeed; attribute float aLen; attribute float aEnd;
      uniform float uTime;
      varying float vA;
      void main(){
        float sp = 8.0 + 7.0*aSeed;
        float y = mod(position.y - uTime*sp, 13.0);
        vec3 p = vec3(position.x + aEnd*0.16, y - aEnd*aLen, position.z + aEnd*0.05);
        vA = (0.10 + 0.90*aEnd) * (0.55 + 0.45*aSeed);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying float vA;
      void main(){ gl_FragColor = vec4(vec3(0.72,0.85,1.0), vA*uOpacity); }
    `,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  scene.add(lines);
  return mat.uniforms;
}

/* ---------------- 雨点溅射波纹 ---------------- */
function makeRipples(scene, count = 90) {
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: M.ringTex(),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.85,
  });
  const im = new THREE.InstancedMesh(geo, mat, count);
  im.frustumCulled = false;
  im.renderOrder = 2;
  const state = [];
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  for (let i = 0; i < count; i++) {
    state.push({ alive: false, t: 0, life: 1, x: 0, y: 0, z: 0, s: 1, c: new THREE.Color() });
    dummy.position.set(0, -99, 0);
    dummy.scale.set(0.01, 0.01, 0.01);
    dummy.updateMatrix();
    im.setMatrixAt(i, dummy.matrix);
    im.setColorAt(i, col.setHex(0x000000));
  }
  im.instanceMatrix.needsUpdate = true;
  scene.add(im);
  let cursor = 0;
  return {
    obj: im,
    spawn(x, y, z, scale = 0.55, color = 0x9fd0ff, life = 1.3) {
      for (let k = 0; k < count; k++) {
        const i = (cursor + k) % count;
        if (!state[i].alive) {
          cursor = (i + 1) % count;
          const s = state[i];
          s.alive = true; s.t = 0; s.life = life;
          s.x = x; s.y = y; s.z = z; s.s = scale;
          s.c.setHex(color);
          return;
        }
      }
    },
    update(dt) {
      let dirtyM = false, dirtyC = false;
      for (let i = 0; i < count; i++) {
        const s = state[i];
        if (!s.alive) continue;
        s.t += dt;
        const k = s.t / s.life;
        if (k >= 1) {
          s.alive = false;
          dummy.position.set(0, -99, 0);
          dummy.scale.set(0.001, 0.001, 0.001);
          dummy.updateMatrix();
          im.setMatrixAt(i, dummy.matrix);
          im.setColorAt(i, col.setHex(0x000000));
          dirtyM = dirtyC = true;
          continue;
        }
        const e = 1 - Math.pow(1 - k, 2.2);
        const sc = s.s * (0.18 + e * 1.0);
        dummy.position.set(s.x, s.y, s.z);
        dummy.scale.set(sc, 1, sc);
        dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);
        const f = (1 - k) * (1 - k);
        col.copy(s.c).multiplyScalar(f);
        im.setColorAt(i, col);
        dirtyM = dirtyC = true;
      }
      if (dirtyM) im.instanceMatrix.needsUpdate = true;
      if (dirtyC && im.instanceColor) im.instanceColor.needsUpdate = true;
    },
  };
}

/* ==================================================================
   主入口
================================================================== */
export function initEffects(scene, ctx) {
  const { store, street } = ctx;
  const rnd = M.makeRng(20260830);
  const shaderTime = [];

  /* ---- 雨 ---- */
  const rainU = makeRain(scene, rnd);
  shaderTime.push(rainU.uTime);

  /* ---- 波纹 ---- */
  const ripples = makeRipples(scene, 100);
  let rippleAcc = 0;

  /* ---- 积水着色器时间 ---- */
  (street.puddles || []).forEach(p => shaderTime.push(p.material.uniforms.uTime));
  (street.reflections || []).forEach(r => shaderTime.push(r.material.uniforms.uTime));

  /* ---- 玻璃流雨 ---- */
  let gi = 0;
  (store.glassPanes || []).forEach((pane) => {
    const m = glassRainMaterial(gi++ * 1.7);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(pane.w, pane.h), m);
    pl.position.copy(pane.mesh.position);
    pl.rotation.copy(pane.mesh.rotation);
    pl.translateZ(0.02);
    pl.renderOrder = 4;
    pane.mesh.parent.add(pl);
    shaderTime.push(m.uniforms.uTime);
  });

  /* ---- 屋檐滴水 ---- */
  const dripGeo = new THREE.SphereGeometry(0.045, 8, 6);
  dripGeo.scale(1, 1.7, 1);
  const dripMat = M.toonMat(0xcfe9ff, {
    transparent: true, opacity: 0.85, emissive: 0x3a6a92, emissiveIntensity: 0.6,
  });
  const drips = [];
  const addDrip = (x, y0, y1, z) => {
    const m = new THREE.Mesh(dripGeo, dripMat);
    m.castShadow = false;
    const pending = new THREE.Mesh(dripGeo, dripMat);
    pending.castShadow = false;
    pending.position.set(x, y0, z);
    pending.scale.set(0.01, 0.01, 0.01);
    scene.add(m); scene.add(pending);
    drips.push({ m, pending, x, y0, y1, z, wait: rnd() * 2.5, fall: 0, v: 0, state: 0 });
  };
  // 主雨棚前沿
  for (let i = 0; i < 9; i++) addDrip(-4.35 + i * 0.98, 3.06, 0.26, -0.88);
  // 切角雨棚（局部坐标 -> 世界）
  {
    const cg = store.chamfer;
    for (let i = 0; i < 5; i++) {
      const lx = -1.35 + i * 0.68;
      const p = new THREE.Vector3(lx, 3.05, 1.34);
      cg.localToWorld(p);
      addDrip(p.x, p.y, 0.26, p.z);
    }
  }
  // 屋顶后沿 / 雨棚侧边
  addDrip(3.62, 3.06, 0.26, -0.88);
  addDrip(-4.3, 4.26, 0.26, -2.6);

  /* ---- 蒸汽（关东煮） ---- */
  const steamMat = new THREE.MeshBasicMaterial({
    map: M.glowTex('rgba(255,255,255,0.75)', 'rgba(255,255,255,0.22)'),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.0,
  });
  const steams = [];
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.30), steamMat.clone());
    s.position.set(2.72 + (rnd() - 0.5) * 0.16, 1.7, -5.95 + (rnd() - 0.5) * 0.2);
    s.userData = { t: rnd(), sp: 0.28 + rnd() * 0.2, sx: (rnd() - 0.5) * 0.05 };
    scene.add(s);
    steams.push(s);
  }

  /* ---- 自动门 ---- */
  // state: 0 关 → 1 开 → 2 停留 → 3 关 → 0；hold 为手动开门后的停留时长
  const door = { state: 0, timer: 3.0, k: 0, hold: 0, pulse: 0 };
  const spill = street.doorSpill;

  // 手动请求开门：关着则立即开，开着则延长停留
  function requestDoor() {
    if (door.state === 0 || door.state === 3) {
      door.state = 1;
      door.timer = 1.1;
      door.hold = 6.0;
    } else if (door.state === 2) {
      door.timer = Math.max(door.timer, 6.0);
    }
    door.pulse = 1.0;
  }

  /* ---- 交通信号灯 ---- */
  const sig = street.signal;
  const sigState = { t: 0, idx: 0 };

  /* ---- 闪烁 ---- */
  const flickers = (store.flickers || []).concat(street.flickers || []);

  /* ---- 雨点溅射（统计式） ---- */
  const groundSpots = street.splashSpots || [];

  function update(dt, t) {
    for (let i = 0; i < shaderTime.length; i++) shaderTime[i].value = t;

    // 溅射
    rippleAcc += dt;
    const rate = 0.055;
    while (rippleAcc > rate) {
      rippleAcc -= rate;
      const g = groundSpots[(Math.random() * groundSpots.length) | 0];
      if (g) ripples.spawn(g[0] + (Math.random() - 0.5) * 0.6, g[1], g[2] + (Math.random() - 0.5) * 0.6,
        0.30 + Math.random() * 0.42, g[3], 1.0 + Math.random() * 0.7);
    }
    ripples.update(dt);

    // 滴水
    drips.forEach((d) => {
      if (d.state === 0) {
        d.wait -= dt;
        const g = Math.max(0, 1 - d.wait / 0.9);
        d.pending.scale.set(0.25 + g * 0.75, 0.25 + g * 0.75, 0.25 + g * 0.75);
        if (d.wait <= 0) { d.state = 1; d.fall = 0; d.v = 0; d.pending.scale.set(0.01, 0.01, 0.01); }
      } else if (d.state === 1) {
        d.v += 22 * dt;
        d.fall += d.v * dt;
        const y = d.y0 - d.fall;
        d.m.position.set(d.x, y, d.z);
        const st = Math.min(1, d.v / 5.5);
        d.m.scale.set(1 - st * 0.35, 1 + st * 1.5, 1 - st * 0.35);
        d.m.visible = true;
        if (y <= d.y1) {
          d.m.visible = false;
          d.state = 0;
          d.wait = 0.5 + Math.random() * 3.2;
          ripples.spawn(d.x, d.y1 + 0.012, d.z, 0.30, 0xa8d8ff, 1.1);
        }
      } else {
        d.m.visible = false;
      }
    });

    // 蒸汽
    steams.forEach((s) => {
      const u = s.userData;
      u.t += dt * u.sp;
      if (u.t > 1) { u.t -= 1; s.position.set(2.72 + (Math.random() - 0.5) * 0.16, 1.7, -5.95 + (Math.random() - 0.5) * 0.2); }
      s.position.y = 1.7 + u.t * 0.75;
      s.position.x += u.sx * dt;
      const sc = 0.5 + u.t * 1.5;
      s.scale.set(sc, sc, sc);
      s.material.opacity = Math.sin(u.t * Math.PI) * 0.16;
      s.lookAtCamera = true;
    });

    // 闪烁
    for (let i = 0; i < flickers.length; i++) {
      const f = flickers[i];
      let v = f.base;
      const n = Math.sin(t * 11.3 + f.phase) * Math.sin(t * 3.7 + f.phase * 1.7);
      if (f.kind === 0) {
        v = f.base * (1 + f.amp * (Math.sin(t * 1.35 + f.phase) * 0.6 + n * 0.25));
      } else if (f.kind === 1) {
        const blip = Math.pow(Math.max(0, Math.sin(t * 0.9 + f.phase)), 42);
        v = f.base * (1 + f.amp * Math.sin(t * 2.1 + f.phase) * 0.5 - blip * f.amp * 6.0 + n * f.amp * 0.35);
      } else {
        v = f.base * (1 + f.amp * (n * 0.5 + Math.sin(t * 23.0 + f.phase) * 0.18));
      }
      f.mat.emissiveIntensity = Math.max(0.05, v);
    }

    // 自动门
    door.timer -= dt;
    if (door.state === 0 && door.timer <= 0) { door.state = 1; door.timer = 1.1; }
    else if (door.state === 1 && door.timer <= 0) {
      door.state = 2;
      door.timer = door.hold > 0 ? door.hold : 2.6 + Math.random() * 2.0;
      door.hold = 0;
    }
    else if (door.state === 2 && door.timer <= 0) { door.state = 3; door.timer = 1.1; }
    else if (door.state === 3 && door.timer <= 0) { door.state = 0; door.timer = 6.0 + Math.random() * 9.0; }
    const target = (door.state === 1) ? 1 : (door.state === 3) ? 0 : (door.state === 2 ? 1 : 0);
    door.k += (target - door.k) * Math.min(1, dt * 3.0);
    const e = door.k * door.k * (3 - 2 * door.k);
    store.doorPanels.forEach((p) => {
      p.obj.position.x = p.closed + (p.open - p.closed) * e;
    });
    door.pulse = Math.max(0, door.pulse - dt * 1.6);
    if (store.doorLight) store.doorLight.intensity = 1.6 + e * 1.8 + door.pulse * 1.4;
    if (spill) {
      spill.material.opacity = 0.18 + e * 0.30;
      spill.scale.set(1, 1, 1 + e * 0.35);
    }

    // 交通信号灯
    if (sig) {
      sigState.t += dt;
      const cycle = [6.5, 1.6, 7.0];
      if (sigState.t > cycle[sigState.idx]) { sigState.t = 0; sigState.idx = (sigState.idx + 1) % 3; }
      const flick = 0.88 + 0.12 * Math.sin(t * 3.1);
      sig.lamps.forEach((l, i) => {
        const on = i === sigState.idx;
        l.material.emissiveIntensity = on ? 1.5 * flick : 0.045;
        l.material.color.setHex(on ? l.userData.on : l.userData.off);
        if (l.userData.glow) l.userData.glow.material.opacity = on ? 0.55 : 0.0;
      });
      if (sig.light) sig.light.color.setHex([0x5cff9d, 0xffd24a, 0xff5a4a][sigState.idx]);
      if (sig.light) sig.light.intensity = 1.6;
      if (sig.streak) sig.streak.material.uniforms.uTint.value.setHex([0x5cff9d, 0xffd24a, 0xff5a4a][sigState.idx]);
    }
  }

  return {
    update,
    ripples,
    requestDoor,
    doorState: () => ({ state: door.state, k: +door.k.toFixed(3), timer: +door.timer.toFixed(2) }),
  };
}
