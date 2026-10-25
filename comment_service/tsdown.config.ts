import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["comments.ts"],
  format: "esm",
  platform: "node",
  target: "node22",
  outDir: "dist",
  // Emit .js, not .mjs — serverless.yml and package.json reference dist/comments.js.
  fixedExtension: false,
  // tsconfig has declaration: true, which auto-enables dts; nothing consumes
  // the types of a deployed handler, so keep the dist shape tsup produced.
  dts: false,
  sourcemap: true,
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
