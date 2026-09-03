import test from "node:test";
import assert from "node:assert/strict";
import { FACE_CORNERS, FRAME_QUADS, getCubeGeometry, getFlatLayout,
  quadMatrix, pointOnQuad, pointToUV, CUBE_CENTER, CUBE_WIDTH, CUBE_HEIGHT, CUBE_TURN_DURATION } from "../src/cube-geometry.js";
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} ≈ ${b}`);

test("the normal turn finishes within one second", () => assert.equal(CUBE_TURN_DURATION,900));

test("rotation begins at the original photograph and screen coordinates", () => {
  const geometry = getCubeGeometry(0);
  for (const key of Object.keys(geometry)) {
    assert.deepEqual(geometry[key].frame, FRAME_QUADS[key]);
    geometry[key].screen.forEach((point,i) => point.forEach((value,j) => near(value,FACE_CORNERS[key][i][j])));
  }
});
test("rotation ends with exactly one visible face and an axis-aligned 2D screen", () => {
  const geometry = getCubeGeometry(1);
  assert.deepEqual(Object.keys(geometry).filter(key => geometry[key].visible), ["right"]);
  for (const corners of [geometry.right.frame, geometry.right.screen]) {
    near(corners[0][0],corners[3][0]); near(corners[1][0],corners[2][0]);
    near(corners[0][1],corners[1][1]); near(corners[2][1],corners[3][1]);
  }
});
test("all intermediate faces share their original cube edges without tearing", () => {
  for (let i=0;i<=100;i++) {
    const g=getCubeGeometry(i/100);
    for (const [a,b] of [[g.top.frame[3],g.left.frame[1]], [g.top.frame[3],g.right.frame[0]],
      [g.top.frame[0],g.left.frame[0]], [g.top.frame[2],g.right.frame[1]],
      [g.left.frame[2],g.right.frame[3]]]) a.forEach((value,j)=>near(value,b[j]));
    Object.values(g).forEach(face => face.frame.flat().forEach(value => assert.ok(Number.isFinite(value))));
  }
});
test("source material mapping round-trips without stretching the initial shell", () => {
  for (const corners of Object.values(FRAME_QUADS)) {
    const matrix=quadMatrix(corners);
    for (const uv of [[0,0],[1,1],[.25,.75],[.4,.6]]) {
      const point=pointOnQuad(matrix,...uv);
      pointToUV(matrix,...point).forEach((value,j)=>near(value,uv[j]));
    }
  }
});
test("flat panel stays centered and in bounds at desktop and phone sizes", () => {
  for (const [w,h] of [[320,568],[390,844],[768,1024],[1536,1024],[1920,1080],[844,390]]) {
    const layout=getFlatLayout(w,h);
    const centerX=layout.x+CUBE_CENTER[0]*layout.scale;
    const centerY=layout.y+CUBE_CENTER[1]*layout.scale;
    near(centerX,w/2);
    near(layout.panelWidth,CUBE_WIDTH*layout.scale);
    near(layout.panelHeight,CUBE_HEIGHT*layout.scale);
    assert.ok(centerY-layout.panelHeight/2>=99.99);
    assert.ok(centerY+layout.panelHeight/2<h-25);
    assert.ok(layout.panelWidth<=w-54);
  }
});
