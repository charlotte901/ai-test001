import {
  FRAME_QUADS,
  FACE_CORNERS,
  CUBE_CENTER,
  CUBE_WIDTH,
  CUBE_HEIGHT,
  quadMatrix,
  pointToUV,
} from "./cube-geometry.js";

/** Design-space size of the scene shared with the reference background. */
export const DESIGN_SIZE = [1514, 1006];
/** Grid resolution per cube face; shared edges stay watertight because the
 * calibration displacement is bilinear and identical on both sides. */
export const FACE_SEGMENTS = 24;

// Local face corners of the ideal box, index-aligned with FRAME_QUADS.
export const VERTICES = {
  top: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]],
  left: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]],
  right: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]],
};

export const yawAt = (progress) => (Math.PI / 4) * (1 - progress);
export const pitchAt = (progress) => 0.345 * (1 - progress);

/** Rotate a local box vertex into design-space CSS pixels (y grows downward).
 * The x/y components reproduce the previous 2D turn math exactly; z keeps the
 * depth so the WebGL rasterizer can order the faces. */
export function rotateVertex([vx, vy, vz], progress) {
  const yaw = yawAt(progress);
  const pitch = pitchAt(progress);
  const x = (vx * CUBE_WIDTH) / 2;
  const y = (vy * CUBE_HEIGHT) / 2;
  const z = (vz * CUBE_WIDTH) / 2;
  const turnedX = x * Math.cos(yaw) + z * Math.sin(yaw);
  const turnedZ = -x * Math.sin(yaw) + z * Math.cos(yaw);
  return [
    CUBE_CENTER[0] + turnedX,
    CUBE_CENTER[1] + y * Math.cos(pitch) + turnedZ * Math.sin(pitch),
    -y * Math.sin(pitch) + turnedZ * Math.cos(pitch),
  ];
}

function bilinear(corners, u, v) {
  const top = corners[0].map((value, axis) => value + (corners[1][axis] - value) * u);
  const bottom = corners[3].map((value, axis) => value + (corners[2][axis] - value) * u);
  return top.map((value, axis) => value + (bottom[axis] - value) * v);
}

/** Photographed outline minus the ideal rest projection. The correction is a
 * screen-space (x,y) warp only — depth stays that of the rigid box. Applied
 * with a (1-p)^2 falloff, the resting cube reproduces the source photo
 * pixel-for-pixel while the turn itself stays a single rigid 3D box. */
const CALIBRATION = Object.fromEntries(
  Object.entries(VERTICES).map(([key, vertices]) => [
    key,
    vertices.map((vertex, index) => {
      const rest = rotateVertex(vertex, 0);
      return [
        FRAME_QUADS[key][index][0] - rest[0],
        FRAME_QUADS[key][index][1] - rest[1],
        0,
      ];
    }),
  ]),
);

/** Screen rectangles as face-texture UV, taken from the photographed corners. */
export const SCREEN_UV = Object.fromEntries(
  Object.entries(FACE_CORNERS).map(([key, corners]) => [
    key,
    corners.map(([x, y]) => pointToUV(quadMatrix(FRAME_QUADS[key]), x, y)),
  ]),
);
const rightUV = SCREEN_UV.right;
const flatRect = {
  u0: Math.min(rightUV[0][0], rightUV[3][0]),
  u1: Math.max(rightUV[1][0], rightUV[2][0]),
  v0: Math.min(rightUV[0][1], rightUV[1][1]),
  v1: Math.max(rightUV[2][1], rightUV[3][1]),
};
const FLAT_SCREEN_UV = [
  [flatRect.u0, flatRect.v0],
  [flatRect.u1, flatRect.v0],
  [flatRect.u1, flatRect.v1],
  [flatRect.u0, flatRect.v1],
];

/** One face point (frame or screen interior) at turn progress p. */
export function facePoint(key, u, v, progress) {
  const local = bilinear(VERTICES[key], u, v);
  const rotated = rotateVertex(local, progress);
  const blend = (1 - progress) ** 2;
  if (!blend) return rotated;
  const delta = bilinear(CALIBRATION[key], u, v);
  return rotated.map((value, axis) => value + delta[axis] * blend);
}

/** Screen corners in design pixels. The right screen squares up inside its
 * face with the same p^2 morph the previous implementation used. */
export function screenCorner(key, index, progress) {
  const [u, v] = SCREEN_UV[key][index];
  const target = key === "right" ? FLAT_SCREEN_UV[index] : [u, v];
  const morph = progress * progress;
  return facePoint(key, u + (target[0] - u) * morph, v + (target[1] - v) * morph, progress);
}

/** Residual between the bilinear 3D path and the photographed screen corners;
 * blended out with (1-p)^2 so the resting screens sit on their bezels exactly. */
const SCREEN_REST = Object.fromEntries(
  Object.keys(VERTICES).map((key) => [
    key,
    [0, 1, 2, 3].map((index) =>
      FACE_CORNERS[key][index].map(
        (value, axis) => value - screenCorner(key, index, 0)[axis],
      ),
    ),
  ]),
);

/** Full screen quad for a face at turn progress p, exact on the photo at rest. */
export function screenQuad(key, progress) {
  const blend = (1 - progress) ** 2;
  return [0, 1, 2, 3].map((index) =>
    screenCorner(key, index, progress).map(
      (value, axis) => value + SCREEN_REST[key][index][axis] * blend,
    ),
  );
}

/** A face is on camera while its projected outline keeps positive area. */
export function faceVisible(key, progress) {
  const a = facePoint(key, 0, 0, progress);
  const b = facePoint(key, 1, 0, progress);
  const c = facePoint(key, 1, 1, progress);
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) > 1e-6;
}

/** Grid template shared by the WebGL meshes and the tests. */
export function faceGrid(key, segments = FACE_SEGMENTS) {
  const cells = segments + 1;
  const positions = new Float32Array(cells * cells * 3);
  const uvs = new Float32Array(cells * cells * 2);
  const indices = [];
  for (let row = 0; row < cells; row++) {
    for (let column = 0; column < cells; column++) {
      const i = row * cells + column;
      uvs[i * 2] = column / segments;
      uvs[i * 2 + 1] = 1 - row / segments;
    }
  }
  for (let row = 0; row < segments; row++) {
    for (let column = 0; column < segments; column++) {
      const a = row * cells + column;
      indices.push(a, a + cells, a + 1, a + 1, a + cells, a + cells + 1);
    }
  }
  return { key, cells, positions, uvs, indices };
}

/** Fill a grid's positions for progress p; returns the same Float32Array. */
export function writeFaceGrid(grid, progress) {
  const { key, cells, positions } = grid;
  for (let row = 0; row < cells; row++) {
    for (let column = 0; column < cells; column++) {
      const i = (row * cells + column) * 3;
      const [x, y, z] = facePoint(key, column / (cells - 1), row / (cells - 1), progress);
      positions[i] = x;
      positions[i + 1] = -y; // WebGL space grows upward.
      positions[i + 2] = z;
    }
  }
  return positions;
}
