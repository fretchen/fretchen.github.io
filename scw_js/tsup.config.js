import { defineConfig } from "tsup";
import { builtinModules } from "module";

export default defineConfig({
  entry: ["genimg_x402_token.ts", "sc_llm.ts", "leaf_history.ts", "growth_api.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  outDir: "dist",
  splitting: false,
  clean: true,
  // Minified for cold-start parse time; correlate production stack traces
  // locally against the sourcemap of the same build (sourcemap: true below).
  minify: true,
  sourcemap: true,
  // Node.js built-ins must be external (async_hooks, fs, path, etc.)
  external: [...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
  // Bundle all npm dependencies
  noExternal: [/.*/],
  // Add createRequire banner for packages that use dynamic require() (like pino)
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
});
