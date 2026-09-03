import { build } from "esbuild";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
await build({
  absWorkingDir: root,
  entryPoints: ["public/cases/conbini/src/main.js"],
  bundle: true,
  format: "iife",
  minify: true,
  outfile: "public/cases/conbini/scene.js",
  alias: { three: "./public/cases/conbini/vendor/three.module.js" },
});
