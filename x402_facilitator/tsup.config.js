import { defineConfig } from "tsup";
import { builtinModules } from "module";

export default defineConfig({
  entry: ["x402_facilitator.js", "x402_splitter_facilitator.js"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  outDir: "dist",
  splitting: false,
  clean: true,
  // Keep readable for debugging
  minify: false,
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
