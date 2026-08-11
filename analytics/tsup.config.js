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
  // Only inline the local file: dependency Scaleway's deploy zip can't `npm
  // install` on its own — not a blanket [/.*/]. noExternal wins over
  // `external` when both would match a package, so this has to be a narrow
  // allowlist, not "everything except the two entries above".
  noExternal: ["@fretchen/s3-utils", "@fretchen/chain-utils"],
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
});
