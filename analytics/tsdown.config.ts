import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["analytics.ts", "rollup.ts"],
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
  minify: false,
  deps: {
    // Dev-only local server (npm run dev / dev:live), dynamically imported and
    // gated behind NODE_ENV==="test" in hit.ts — never reached in production.
    // tsdown only auto-externalizes package.json `dependencies`, not
    // `devDependencies`, so these two need listing explicitly or rolldown
    // bundles them (and serveHandler's own fastify dependency) anyway.
    neverBundle: ["dotenv", "@scaleway/serverless-functions"],
    // Scaleway's deploy zip ships dist/** only (see serverless.yml) — no
    // package.json, no node_modules, so nothing left as external can be
    // resolved at runtime. Not a blanket [/.*/] like the other packages in this
    // repo use, because the two dev-only packages above must stay external; every
    // real dependency has to be listed here instead. `viem` is transitive (only
    // @fretchen/chain-utils imports it directly) but tsdown's alwaysBundle
    // doesn't bundle a package's own dependencies unless they're named too —
    // omitting it here shipped a broken `import "viem"` straight to production.
    alwaysBundle: ["@fretchen/s3-utils", "@fretchen/chain-utils", "viem", "isbot"],
  },
  // createRequire banner for packages that use dynamic require() (like pino).
  // The import is aliased: rolldown's own runtime chunks import `createRequire`
  // unaliased, and a bare re-import in the same file is a SyntaxError.
  banner: {
    js: `import { createRequire as __fretchenCr } from 'module'; const require = __fretchenCr(import.meta.url);`,
  },
});
