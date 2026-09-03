import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import {
  CHOICES,
  CHOOSE_ART,
  CHOOSE_WORDMARK,
  getChooseLayout,
} from "../src/choose-layout.js";
import { getCardFlight } from "../src/card-transition.js";

test("three choose cards keep source-bounded crops and unchanged copy", async () => {
  assert.deepEqual(
    CHOICES.map((card) => card.title),
    ["测试闯关", "报告查询", "个人中心"],
  );
  assert.equal(CHOICES[0].id, "test");
  for (const {
    crop: [x, y, width, height],
  } of CHOICES) {
    assert.ok(x >= 0 && y >= 0 && x + width <= 1822 && y + height <= 863);
    assert.equal(height, 503);
  }
  const [wx, wy, ww, wh] = CHOOSE_WORDMARK;
  assert.ok(wx >= 0 && wy >= 0 && wx + ww <= 1822 && wy + wh <= 863);
  await access(new URL(`../public${CHOOSE_ART}`, import.meta.url));
});

test("choose scales uniformly and uses two-column mode on phones", () => {
  assert.equal(getChooseLayout(1822, 863).variables["--choose-unit"], 1);
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [768, 1024],
    [1440, 900],
    [1920, 1080],
  ]) {
    const layout = getChooseLayout(width, height);
    assert.ok(layout.variables["--choose-unit"] > 0);
    assert.ok(layout.variables["--choose-unit"] <= width / 1822);
    assert.equal(layout.compact, width < 760);
  }
});

test("card flight keeps whole cards intact and travels beyond the viewport", () => {
  const viewport = { width: 1536, height: 1024 };
  const rect = { top: 300, bottom: 800 };
  for (const kind of ["out", "in"]) {
    const flight = getCardFlight(kind, 0, 3, rect, viewport);
    assert.ok(flight.keyframes.length === 2);
    assert.ok(flight.options.duration >= 500);
    const moving = flight.keyframes.find((frame) => frame.transform !== "translate3d(0, 0, 0) rotate(0deg) scale(1)");
    assert.match(moving.transform, /translate3d\(/);
    assert.ok(!moving.transform.includes("scale(1)"));
  }
  const reverse = getCardFlight("out", 0, 3, rect, viewport, true);
  assert.notEqual(
    reverse.keyframes[1].transform,
    getCardFlight("out", 0, 3, rect, viewport, false).keyframes[1].transform,
  );
});
