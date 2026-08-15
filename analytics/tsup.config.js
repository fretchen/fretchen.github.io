import { defineConfig } from "tsup";
import { builtinModules } from "module";

export default defineConfig({
  entry: ["analytics.ts", "rollup.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  outDir: "dist",
  splitting: false,
  clean: true,
  minify: false,
  sourcemap: true,
  external: [
    ...builtinModules,
    ...builtinModules.map((m) => `node:${m}`),
    // Dev-only local server (npm run dev / dev:live), dynamically imported and
    // gated behind NODE_ENV==="test" in hit.ts — never reached in production.
    // tsup only auto-externalizes package.json `dependencies`, not
    // `devDependencies`, so these two need listing explicitly or esbuild
    // bundles them (and serveHandler's own fastify dependency) anyway.
    "dotenv",
    "@scaleway/serverless-functions",
  ],
  // Scaleway's deploy zip ships dist/** only (see serverless.yml) — no
  // package.json, no node_modules, so nothing left as `external` can be
  // resolved at runtime. Not a blanket [/.*/] like the other packages in this
  // repo use, because two dev-only packages below must stay external; every
  // real dependency has to be listed here instead. `viem` is transitive (only
  // @fretchen/chain-utils imports it directly) but tsup's noExternal doesn't
  // bundle a package's own dependencies unless they're named too — omitting
  // it here shipped a broken `import "viem"` straight to production.
  noExternal: ["@fretchen/s3-utils", "@fretchen/chain-utils", "viem"],
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
});
