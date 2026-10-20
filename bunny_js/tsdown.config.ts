import { defineConfig } from "tsdown";
import { builtinModules } from "node:module";

/**
 * Bare Node builtin specifiers ("url", "crypto", "events", ...) cannot be resolved by the
 * bundler on the "neutral" platform, and — left as bare externals — cannot be imported by
 * bunny's Deno runtime either, which requires the `node:` prefix (bunny Edge Scripting
 * runs Deno 1.x, where builtin resolution only works through `node:` specifiers).
 *
 * This plugin rewrites every bare builtin (and `node:*` itself, which stays external) to its
 * `node:`-prefixed form and marks it external, so the bundle keeps exactly the builtin
 * imports Deno can resolve at runtime and nothing else.
 */
const nodeBuiltins = new Set([
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
  "node:test",
]);

/**
 * bunny deploys ONE script file; chunked output is not deployable. tsdown's passthrough
 * options do not reliably reach rolldown's output options, so this plugin sets them on the
 * rolldown-level output options directly: no code splitting, dynamic imports inlined.
 */
const singleFilePlugin = {
  name: "single-file-edge-bundle",
  outputOptions(options: Record<string, unknown>) {
    return {
      ...options,
      codeSplitting: false,
      inlineDynamicImports: true,
    };
  },
};

const nodeBuiltinPlugin = {
  name: "node-builtins-to-node-prefix",
  resolveId(id: string) {
    if (nodeBuiltins.has(id)) {
      return { id: id.startsWith("node:") ? id : `node:${id}`, external: true };
    }
    return null;
  },
};

export default defineConfig({
  entry: ["src/searchapi.ts"],
  format: "esm",
  // The bundle runs in bunny's Deno isolate, not Node: "neutral" keeps Node builtins
  // external (resolved by Deno at runtime via the plugin above) instead of letting the
  // bundler stub or polyfill them for a platform the edge is not.
  platform: "neutral",
  target: "es2022",
  outDir: "dist",
  // The three build:* scripts invoke tsdown once per entry (rolldown cannot emit multiple
  // single-file bundles in one pass), and each invocation cleans outDir by default — without
  // this, `npm run build` would end with only the LAST entry's bundle in dist/, and the
  // deploy steps for the other two would ship stale or missing files.
  clean: false,
  fixedExtension: false,
  dts: false,
  // Not deployed (the script upload is dist/index.js alone) but kept next to it so a
  // minified production stack trace can be correlated locally, as in scw_js.
  sourcemap: true,
  // Minified for isolate cold-start parse time; the 1 MB bunny limit is enforced on
  // the uploaded script, so every byte counts.
  minify: true,
  // Bundle all npm dependencies: the deployed artifact is one self-contained file that
  // must not resolve anything from a node_modules the edge does not have.
  deps: { alwaysBundle: [/.*/] },
  plugins: [nodeBuiltinPlugin as never, singleFilePlugin as never],
});
