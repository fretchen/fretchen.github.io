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

  /**
   * vike-react emits `og:image` and `twitter:card` only for a truthy `+image` value, and
   * `+image` is non-cumulative — so a page whose `image()` can return `undefined` wins over
   * `pages/+image.ts` and ships no social card at all, rather than falling through to the
   * default. Every post/lecture `+image.ts` reads an optional `nftMetadata?.imageUrl`.
   */
  it("gives every optional +image a default fallback", () => {
    const offenders = pageFiles
      .filter((file) => file.endsWith("+image.ts"))
      .filter((file) => {
        const source = readFileSync(file, "utf-8");
        // Matched at the use site, not on the import: a leftover `import { DEFAULT_SOCIAL_IMAGE }`
        // must not vouch for a `return blog.nftMetadata?.imageUrl` that lost its `??`.
        return /nftMetadata\?\./.test(source) && !/nftMetadata\?\.\w+\s*\?\?\s*DEFAULT_SOCIAL_IMAGE/.test(source);
      })
      .map((file) => file.slice(pagesDir.length + 1));

    expect(offenders).toEqual([]);
  });

  /**
   * The social card asset carries a Vite content hash that changes on any Vite bump or edit
   * to the image. Hand-copying the built URL 404s silently; `pages/+image.ts` imports the
   * asset instead, and everything else re-exports from there.
   */
  /**
   * A page whose JSON-LD calls itself an Article subtype must say the same in Open Graph.
   * `og:type` defaults to "website" in `+Head.tsx`, so a page that loses its `+ogType.ts`
   * — or a new article page that never gets one — silently disagrees with its own schema,
   * and nothing else notices.
   */
  it("declares og:type=article on every page whose JSON-LD is an Article", () => {
    const articleSchema = /"@type":\s*"(?:\w*Article|BlogPosting)"|buildPostStructuredData/;

    const offenders = pageFiles
      .filter((file) => file.endsWith("+structuredData.ts"))
      .filter((file) => articleSchema.test(readFileSync(file, "utf-8")))
      .filter((file) => {
        const ogType = file.replace(/\+structuredData\.ts$/, "+ogType.ts");
        return !pageFiles.includes(ogType) || !readFileSync(ogType, "utf-8").includes('"article"');
      })
      .map((file) => file.slice(pagesDir.length + 1));

    expect(offenders).toEqual([]);
  });

  it("keeps built asset URLs out of +image files", () => {
    const offenders = pageFiles
      .filter((file) => file.endsWith("+image.ts"))
      .filter((file) => readFileSync(file, "utf-8").includes("assets/static/"))
      .map((file) => file.slice(pagesDir.length + 1));

    expect(offenders).toEqual([]);
  });
});
