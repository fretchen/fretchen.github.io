import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "genimg_x402_token.ts",
    "sc_llm_x402.ts",
    "llm_x402_cron.ts",
    "growth_api.ts",
    "search_api.ts",
    "mcp_server.ts",
  ],
  format: "esm",
  platform: "node",
  target: "node22",
  outDir: "dist",
  // Emit .js, not .mjs — serverless.yml handlers reference dist/*.js.
  fixedExtension: false,
  // Nothing consumes a deployed handler's types; tsconfig's declaration: true
  // would auto-enable dts, so keep the dist shape tsup produced.
  dts: false,
  sourcemap: true,
  // Minified for cold-start parse time; correlate production stack traces
  // locally against the sourcemap of the same build (sourcemap: true above).
  minify: true,
  // Bundle all npm dependencies (Node built-ins are always external).
  deps: { alwaysBundle: [/.*/] },
  // createRequire banner for packages that use dynamic require() (like pino).
  // The import is aliased: rolldown's own runtime chunks import `createRequire`
  // unaliased, and a bare re-import in the same file is a SyntaxError.
  banner: {
    js: `import { createRequire as __fretchenCr } from 'module'; const require = __fretchenCr(import.meta.url);`,
  },
});
