import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { getCaseLayers } from "../src/case-buffer.js";
import {
  CASES,
  CASE_INTERVAL,
  getCaseFaces,
  normalizeCaseIndex,
} from "../src/cases.js";

test("all five existing cases have real local entry points", async () => {
  assert.equal(CASES.length, 5);
  assert.equal(new Set(CASES.map((item) => item.id)).size, CASES.length);
  for (const item of CASES)
    await access(
      new URL(`../public${item.src.split("?")[0]}`, import.meta.url),
    );
});
test("every screen visits every case exactly once per rotation", () => {
  for (const face of ["top", "left", "right"]) {
    const ids = CASES.map((_, index) => getCaseFaces(index)[face].id);
    assert.equal(new Set(ids).size, CASES.length);
  }
  for (let index = 0; index < CASES.length; index++) {
    assert.equal(
      new Set(Object.values(getCaseFaces(index)).map((item) => item.id)).size,
      3,
    );
  }
  assert.deepEqual(getCaseFaces(CASES.length), getCaseFaces(0));
  assert.equal(normalizeCaseIndex(-1), CASES.length - 1);
  assert.equal(CASE_INTERVAL, 15000);
});
test("requested marketing statistics are removed from page markup", async () => {
  const app = await readFile(
    new URL("../src/App.jsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(
    app,
    /50k\+|120\+|98%|10k\+|className="stats"|className="social-proof"/,
  );
});

test("case buffers keep the current frame while loading and never exceed two layers", () => {
  const [a,b,c,d] = CASES;
  assert.deepEqual(getCaseLayers(null,a,a,b),[a,b]);
  assert.deepEqual(getCaseLayers(null,a,c,b),[a,c]);
  assert.deepEqual(getCaseLayers(a,b,b,c),[a,b]);
  assert.deepEqual(getCaseLayers(a,b,d,c),[b,d]);
  assert.deepEqual(getCaseLayers(null,a,a,a),[a]);
});

test("the removed content editor has no remaining entry point", async () => {
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(app,/function Studio|setModal\("studio"\)|<Studio|上传自己的内容|屏幕快捷编辑/);
});
