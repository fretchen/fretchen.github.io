/**
 * Postbuild guard against bundle-size regressions.
 *
 * Fails the build if any client JS chunk exceeds MAX_CHUNK_SIZE_GZIP, unless
 * its content matches a known-large allowlisted signature. This keeps the
 * "one 1.6 MB chunk bundles every blog post" class of regression from
 * reappearing silently (Vite only warns; this errors).
 *
 * Measured in gzip size, not raw bytes — what a browser actually transfers.
 * Raw size stopped being a good proxy for that once rehype-katex (Stufe 2,
 * website/MDX_MIGRATION.md §2.4) started baking KaTeX's rendered markup
 * directly into math-heavy posts' compiled component trees: that markup is
 * deeply repetitive (the same span/class patterns per glyph, over and over),
 * so it inflates raw byte count — 300-750KB raw across a dozen quantum
 * lectures — far more than it inflates what's actually sent over the wire
 * (23-30KB gzip for every one of them, measured). A raw-byte threshold high
 * enough to tolerate that would also tolerate a genuine regression up to the
 * same ceiling; gzip doesn't have that blind spot, because both cases compare
 * on the metric that actually matters to a reader loading the page.
 *
 * Runs after cleanVike.ts, which moves build/client/* to build/.
 */
import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";

const CHUNKS_DIR = "./build/assets/chunks";
// 150 kB gzip. Comfortably above every legitimate chunk observed when this was set: KaTeX
// output (23-30 kB gzip), chart.js (~25 kB), @openzeppelin/merkle-tree (~42 kB), even
// mermaid's chevrotain parser un-allowlisted (~142 kB) — while still far below what a real
// "whole site in one chunk" regression produces even after compression (that historical bug
// was 1.6 MB raw; genuine diverse JS doesn't compress anywhere near KaTeX's repetition rate).
const MAX_CHUNK_SIZE_GZIP = 150 * 1024;

// Signatures of third-party libraries that are inherently large but already
// lazy-loaded on demand (not part of any page's initial bundle).
const ALLOWLIST_SIGNATURES = ["chevrotain"]; // mermaid's parser

const chunkFiles = fs.readdirSync(CHUNKS_DIR).filter((file) => file.endsWith(".js"));

const violations: string[] = [];

for (const file of chunkFiles) {
  const filePath = path.join(CHUNKS_DIR, file);
  const buffer = fs.readFileSync(filePath);
  const gzipSize = zlib.gzipSync(buffer).length;

  if (gzipSize <= MAX_CHUNK_SIZE_GZIP) continue;

  const content = buffer.toString("utf-8");
  const allowlisted = ALLOWLIST_SIGNATURES.find((signature) => content.includes(signature));

  if (allowlisted) {
    console.log(`[ChunkSizes] ${file} is ${(gzipSize / 1024).toFixed(0)} kB gzip — allowlisted (${allowlisted})`);
    continue;
  }

  violations.push(
    `${file}: ${(gzipSize / 1024).toFixed(0)} kB gzip (limit ${(MAX_CHUNK_SIZE_GZIP / 1024).toFixed(0)} kB)`,
  );
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

console.log(`[ChunkSizes] OK — ${chunkFiles.length} chunks checked, none oversized (gzip).`);
