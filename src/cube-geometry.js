export const FRAME_QUADS = {
  top: [[493, 393], [807, 282], [1132, 393], [811, 508]],
  left: [[493, 393], [811, 508], [811, 850], [501, 746]],
  right: [[811, 508], [1132, 393], [1123, 746], [811, 850]],
};
export const FACE_CORNERS = {
  top: [[559, 385], [807, 298], [1067, 385], [811, 483]],
  left: [[515, 435], [778, 530], [778, 816], [522, 722]],
  right: [[845, 532], [1108, 435], [1102, 720], [844, 814]],
};
export const CUBE_CENTER = [813, 575];
export const CUBE_WIDTH = 450;
export const CUBE_HEIGHT = 380;
export const CUBE_TURN_DURATION = 900;

export function quadMatrix(corners) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = corners;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const denominator = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(denominator) < 1e-8) return null;
  const g = (dx3 * dy2 - dx2 * dy3) / denominator;
  const h = (dx1 * dy3 - dx3 * dy1) / denominator;
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0,
    y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h];
}

export function pointOnQuad(matrix, u, v) {
  const [a, b, c, d, e, f, g, h] = matrix;
  const divisor = g * u + h * v + 1;
  return [(a * u + b * v + c) / divisor, (d * u + e * v + f) / divisor];
}

export function pointToUV(matrix, x, y) {
  const [a, b, c, d, e, f, g, h] = matrix;
  const A = a - x * g, B = b - x * h;
  const C = d - y * g, D = e - y * h;
  const determinant = A * D - B * C;
  return [((x - c) * D - B * (y - f)) / determinant,
    (A * (y - f) - C * (x - c)) / determinant];
}

export function projectPlane(corners, width = 500, height = 520) {
  const matrix = quadMatrix(corners);
  if (!matrix) return "none";
  const [a, b, c, d, e, f, g, h] = matrix;
  return `matrix3d(${a / width},${d / width},0,${g / width},${b / height},${e / height},0,${h / height},0,0,1,0,${c},${f},0,1)`;
}

const VERTICES = {
  top: [[-1,-1,-1], [1,-1,-1], [1,-1,1], [-1,-1,1]],
  left: [[-1,-1,-1], [-1,-1,1], [-1,1,1], [-1,1,-1]],
  right: [[-1,-1,1], [1,-1,1], [1,1,1], [-1,1,1]],
};
function rotatePoint(vertex, progress) {
  const [vx, vy, vz] = vertex;
  const yaw = Math.PI / 4 * (1 - progress);
  const pitch = 0.345 * (1 - progress);
  const x = vx * CUBE_WIDTH / 2, y = vy * CUBE_HEIGHT / 2, z = vz * CUBE_WIDTH / 2;
  const turnedX = x * Math.cos(yaw) + z * Math.sin(yaw);
  const turnedZ = -x * Math.sin(yaw) + z * Math.cos(yaw);
  return [CUBE_CENTER[0] + turnedX,
    CUBE_CENTER[1] + y * Math.cos(pitch) + turnedZ * Math.sin(pitch)];
}
const SCREEN_UV = Object.fromEntries(Object.entries(FACE_CORNERS).map(([key, corners]) =>
  [key, corners.map(([x, y]) => pointToUV(quadMatrix(FRAME_QUADS[key]), x, y))],
));
const rightUV = SCREEN_UV.right;
const leftEdge = Math.min(rightUV[0][0], rightUV[3][0]);
const rightEdge = Math.max(rightUV[1][0], rightUV[2][0]);
const topEdge = Math.min(rightUV[0][1], rightUV[1][1]);
const bottomEdge = Math.max(rightUV[2][1], rightUV[3][1]);
const FLAT_SCREEN_UV = [[leftEdge, topEdge], [rightEdge, topEdge],
  [rightEdge, bottomEdge], [leftEdge, bottomEdge]];

/** Real yaw/pitch rotation with a diminishing calibration to the photographed
 * shell. At zero every face is at the exact original source coordinates;
 * at one only the right face has area and it is perfectly front-on. */
export function getCubeGeometry(progress) {
  const p = Math.max(0, Math.min(1, progress));
  return Object.fromEntries(Object.entries(VERTICES).map(([key, vertices]) => {
    const frame = vertices.map((vertex, index) => {
      const rotated = rotatePoint(vertex, p);
      const start = rotatePoint(vertex, 0);
      return rotated.map((value, axis) => value +
        (FRAME_QUADS[key][index][axis] - start[axis]) * (1 - p) ** 2);
    });
    const matrix = quadMatrix(frame);
    return [key, { frame, visible: Boolean(matrix),
      screen: matrix ? SCREEN_UV[key].map(([u,v], index) => {
        const target = key === "right" ? FLAT_SCREEN_UV[index] : [u,v];
        return pointOnQuad(matrix, u + (target[0]-u) * p * p, v + (target[1]-v) * p * p);
      }) : null }];
  }));
}

export function getFlatLayout(width, height) {
  const panelWidth = Math.min(560, width - 54, Math.max(170, height - 190) * CUBE_WIDTH / CUBE_HEIGHT);
  const scale = panelWidth / CUBE_WIDTH;
  const panelHeight = CUBE_HEIGHT * scale;
  const centerY = Math.max(100 + panelHeight / 2, height * 0.53);
  return { scale, panelWidth, panelHeight,
    x: width / 2 - CUBE_CENTER[0] * scale,
    y: centerY - CUBE_CENTER[1] * scale };
}

/** Native-size form coordinates inside the projected front screen. Its inverse
 * scale cancels the canvas projection, so inputs retain readable CSS sizes. */
export function getLoginScreenSize(width, height) {
  const layout = getFlatLayout(width, height);
  const corners = getCubeGeometry(1).right.screen;
  return {
    width: (corners[1][0] - corners[0][0]) * layout.scale,
    height: (corners[3][1] - corners[0][1]) * layout.scale,
  };
}
