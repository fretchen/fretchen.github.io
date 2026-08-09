import { defineConfig } from "tsup";
import { builtinModules } from "module";

export default defineConfig({
  entry: ["hit.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  outDir: "dist",
  splitting: false,
  clean: true,
  minify: false,
  sourcemap: true,
  external: [...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
  noExternal: [/.*/],
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
});
