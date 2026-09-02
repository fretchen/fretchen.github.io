import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Guards the one rule that keeps head tags from multiplying on nested pages.
 *
 * Vike's `+Head` setting is *cumulative*: it accumulates down the directory tree and
 * cannot be overridden. A section-level `pages/x402/+Head.tsx` therefore also rendered on
 * `/x402/sellers`, which shipped three conflicting `rel="canonical"` tags, three
 * descriptions (the *parent's* winning, since vike-react injects the `+description` one
 * after `+Head` output), two BreadcrumbLists, and a CollectionPage belonging to `/x402`.
 *
 * The fix was to keep per-page metadata in the non-cumulative settings that already exist
 * — `+title`, `+description`, `+image`, and the custom `structuredData` — leaving `+Head`
 * for site-wide tags only. Neither half of that is visible to `tsc` or to a rendering
 * test: a second `+Head.tsx` renders perfectly well, it just duplicates. Hence these.
 */

const pagesDir = join(__dirname, "..", "pages");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const pageFiles = walk(pagesDir);

describe("head tag conventions", () => {
  it("has exactly one +Head, at the root of pages/", () => {
    const heads = pageFiles.filter((file) => /\+Head\.(tsx|jsx|ts|js)$/.test(file));

    expect(heads.map((file) => file.slice(pagesDir.length + 1))).toEqual(["+Head.tsx"]);
  });

  it("keeps metadata out of +structuredData files", () => {
    const offenders = pageFiles
      .filter((file) => file.endsWith("+structuredData.ts"))
      .filter((file) => /og:|<meta|rel="canonical"/.test(readFileSync(file, "utf-8")))
      .map((file) => file.slice(pagesDir.length + 1));

    // Metadata here would be unreachable — +Head renders these as JSON-LD, nothing else.
    expect(offenders).toEqual([]);
  });
});
