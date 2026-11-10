import { defineConfig } from "tsdown";

export default defineConfig({
  // Only the wallet-report cron: the HTTP facilitator moved to bunny_js, and the buyer-pays
  // splitter JS was retired with it. `package: dist/**` means anything built here ships in
  // the deploy archive, so the entry list must stay this short.
  entry: ["wallet_report_cron.ts"],
  format: "esm",
  platform: "node",
  target: "node22",
  outDir: "dist",
  // Emit .js, not .mjs — package.json main and the dev script reference dist/*.js.
  fixedExtension: false,
  // Nothing consumes a deployed handler's types; tsconfig's declaration: true
  // would auto-enable dts, so keep the dist shape tsup produced.
  dts: false,
  sourcemap: true,
  // Keep readable for debugging
  minify: false,
  // Bundle all npm dependencies (Node built-ins are always external).
  deps: { alwaysBundle: [/.*/] },
  // createRequire banner for packages that use dynamic require() (like pino).
  // The import is aliased: rolldown's own runtime chunks import `createRequire`
  // unaliased, and a bare re-import in the same file is a SyntaxError.
  banner: {
    js: `import { createRequire as __fretchenCr } from 'module'; const require = __fretchenCr(import.meta.url);`,
  },
});
