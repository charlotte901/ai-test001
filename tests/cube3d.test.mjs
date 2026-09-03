import test from "node:test";
import assert from "node:assert/strict";
import {
  FACE_CORNERS,
  FRAME_QUADS,
  CUBE_CENTER,
  CUBE_WIDTH,
  CUBE_HEIGHT,
  getCubeGeometry,
} from "../src/cube-geometry.js";
import {
  DESIGN_SIZE,
  faceGrid,
  facePoint,
  faceVisible,
  rotateVertex,
  screenQuad,
  writeFaceGrid,
} from "../src/cube3d.js";
const near = (a, b, tolerance = 1e-7) =>
  assert.ok(Math.abs(a - b) < tolerance, `${a} ≈ ${b}`);

test("the 3D rotation reproduces the previous 2D turn math exactly", () => {
  const previous = ([vx, vy, vz], progress) => {
    const yaw = (Math.PI / 4) * (1 - progress);
    const pitch = 0.345 * (1 - progress);
    const x = (vx * CUBE_WIDTH) / 2;
    const y = (vy * CUBE_HEIGHT) / 2;
    const z = (vz * CUBE_WIDTH) / 2;
    const turnedX = x * Math.cos(yaw) + z * Math.sin(yaw);
    const turnedZ = -x * Math.sin(yaw) + z * Math.cos(yaw);
    return [
      CUBE_CENTER[0] + turnedX,
      CUBE_CENTER[1] + y * Math.cos(pitch) + turnedZ * Math.sin(pitch),
    ];
  };
  const corners = [
    [-1, -1, -1], [1, -1, -1], [1, 1, 1], [-1, 1, -1], [0, 0, 0], [0.3, -0.7, 0.5],
  ];
  for (let step = 0; step <= 20; step++) {
    const progress = step / 20;
    for (const corner of corners) {
      const [x, y] = rotateVertex(corner, progress);
      const [px, py] = previous(corner, progress);
      near(x, px, 1e-10);
      near(y, py, 1e-10);
    }
  }
});

test("the resting shell sits on the photographed outline and screens pixel-exact", () => {
  for (const key of Object.keys(FRAME_QUADS)) {
    const quad = [
      facePoint(key, 0, 0, 0),
      facePoint(key, 1, 0, 0),
      facePoint(key, 1, 1, 0),
      facePoint(key, 0, 1, 0),
    ];
    quad.forEach((point, index) =>
      point.slice(0, 2).forEach((value, axis) =>
        near(value, FRAME_QUADS[key][index][axis])));
    screenQuad(key, 0).forEach((point, index) =>
      point.slice(0, 2).forEach((value, axis) => near(value, FACE_CORNERS[key][index][axis])));
  }
});

test("the turn ends with only the front face visible and an axis-aligned screen", () => {
  assert.deepEqual(
    Object.keys(FRAME_QUADS).filter((key) => faceVisible(key, 1)),
    ["right"],
  );
  const flat = screenQuad("right", 1);
  for (const corners of [flat, [
    facePoint("right", 0, 0, 1), facePoint("right", 1, 0, 1),
    facePoint("right", 1, 1, 1), facePoint("right", 0, 1, 1),
  ]]) {
    near(corners[0][0], corners[3][0]);
    near(corners[1][0], corners[2][0]);
    near(corners[0][1], corners[1][1]);
    near(corners[2][1], corners[3][1]);
  }
  // Same flat rectangle the previous geometry produced, so login sizing holds.
  const legacy = getCubeGeometry(1).right.screen;
  flat.forEach((point, index) =>
    point.slice(0, 2).forEach((value, axis) => near(value, legacy[index][axis], 1e-6)));
});

test("shared cube edges stay watertight through the whole turn", () => {
  const pairs = [
    [(t, p) => facePoint("top", t, 1, p), (t, p) => facePoint("right", t, 0, p)],
    [(t, p) => facePoint("top", 0, t, p), (t, p) => facePoint("left", t, 0, p)],
    [(t, p) => facePoint("left", 1, t, p), (t, p) => facePoint("right", 0, t, p)],
  ];
  for (let step = 0; step <= 50; step++) {
    const progress = step / 50;
    for (const [a, b] of pairs) {
      for (let place = 0; place <= 10; place++) {
        const t = place / 10;
        const first = a(t, progress);
        const second = b(t, progress);
        first.forEach((value, axis) => near(value, second[axis], 1e-9));
      }
    }
  }
});

test("face grids fill finite positions and keep the canvas mapping upright", () => {
  const grid = faceGrid("right", 8);
  assert.equal(grid.positions.length, 9 * 9 * 3);
  assert.equal(grid.uvs.length, 9 * 9 * 2);
  assert.equal(grid.indices.length, 8 * 8 * 6);
  const positions = writeFaceGrid(grid, 0.5);
  assert.ok([...positions].every(Number.isFinite));
  // Row 0 of the texture samples the photographed top edge (v = 0).
  near(grid.uvs[1], 1);
  near(grid.uvs[(9 * 8) * 2 + 1], 0);
  for (const [width, height] of [DESIGN_SIZE]) {
    assert.equal(width, 1514);
    assert.equal(height, 1006);
  }
});
