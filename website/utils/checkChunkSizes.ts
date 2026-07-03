/**
 * Postbuild guard against bundle-size regressions.
 *
 * Fails the build if any client JS chunk exceeds MAX_CHUNK_SIZE, unless its
 * content matches a known-large allowlisted signature. This keeps the
 * "one 1.6 MB chunk bundles every blog post" class of regression from
 * reappearing silently (Vite only warns; this errors).
 *
 * Runs after cleanVike.ts, which moves build/client/* to build/.
 */
import * as fs from "fs";
import * as path from "path";

const CHUNKS_DIR = "./build/assets/chunks";
const MAX_CHUNK_SIZE = 700 * 1024; // 700 kB minified

// Signatures of third-party libraries that are inherently large but already
// lazy-loaded on demand (not part of any page's initial bundle).
const ALLOWLIST_SIGNATURES = ["chevrotain"]; // mermaid's parser

const chunkFiles = fs.readdirSync(CHUNKS_DIR).filter((file) => file.endsWith(".js"));

const violations: string[] = [];

for (const file of chunkFiles) {
  const filePath = path.join(CHUNKS_DIR, file);
  const buffer = fs.readFileSync(filePath);
  const size = buffer.length;

  if (size <= MAX_CHUNK_SIZE) continue;

  const content = buffer.toString("utf-8");
  const allowlisted = ALLOWLIST_SIGNATURES.find((signature) => content.includes(signature));

  if (allowlisted) {
    console.log(`[ChunkSizes] ${file} is ${(size / 1024).toFixed(0)} kB — allowlisted (${allowlisted})`);
    continue;
  }

  violations.push(`${file}: ${(size / 1024).toFixed(0)} kB (limit ${(MAX_CHUNK_SIZE / 1024).toFixed(0)} kB)`);
}

if (violations.length > 0) {
  console.error("[ChunkSizes] Oversized client chunks detected — likely a code-splitting regression:");
  for (const violation of violations) {
    console.error(`  - ${violation}`);
  }
  console.error(
    "[ChunkSizes] Check for eager import.meta.glob usage or a static import pulling lazy modules into the client graph.",
  );
  process.exit(1);
}

console.log(`[ChunkSizes] OK — ${chunkFiles.length} chunks checked, none oversized.`);
