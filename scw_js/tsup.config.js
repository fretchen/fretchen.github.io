import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "genimg_bfl.js",
    "genimg_x402_token.js",
    "sc_llm.js",
    "readhandler_v2.js",
    "leaf_history.js",
  ],
  format: ["esm"],
  platform: "node",
  target: "node22",
  outDir: "dist",
  splitting: false,
  clean: true,
  // Keep readable for debugging
  minify: false,
  sourcemap: true,
  // Bundle all dependencies except these (they're provided by Scaleway runtime)
  external: [],
  // Ensure all imports are bundled
  noExternal: [/.*/],
});
