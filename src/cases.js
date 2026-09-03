// Add cases here; the three screens and carousel controls share this manifest.
export const CASE_INTERVAL = 15000;
export const CASES = [
  {
    id: "wing-it",
    name: "Wing It",
    detail: "动画剪辑 · 中文解说",
    kind: "video",
    src: "/cases/wing-it.mp4",
  },
  {
    id: "mario",
    name: "超级马里奥",
    detail: "像素游戏 · 自动演示",
    kind: "scene",
    src: "/cases/mario/index.html?showcase=1",
  },
  {
    id: "conbini",
    name: "日式便利店",
    detail: "雨夜街角 · 实时 3D",
    kind: "scene",
    src: "/cases/conbini/index.html?showcase=1",
  },
  {
    id: "pirate",
    name: "暴风雨海盗船",
    detail: "海上远航 · 实时 3D",
    kind: "scene",
    src: "/cases/pirate/index.html?showcase=1",
  },
  {
    id: "pirate-pixel",
    name: "海盗船 · 像素版",
    detail: "像素风格 · 实时 3D",
    kind: "scene",
    src: "/cases/pirate/pixel.html?showcase=1",
  },
];
export function normalizeCaseIndex(index) {
  return ((index % CASES.length) + CASES.length) % CASES.length;
}
export function getCaseFaces(index) {
  return Object.fromEntries(
    ["top", "left", "right"].map((face, offset) => [
      face,
      { type: "case", ...CASES[normalizeCaseIndex(index + offset)] },
    ]),
  );
}
