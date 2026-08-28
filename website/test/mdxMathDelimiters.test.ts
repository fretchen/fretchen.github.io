import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * remark-math (vite.config.ts) renders `$$...$$` fine when both delimiters sit on
 * the same line (used throughout the quantum lectures for inline expressions), but
 * a multi-line block — an opening `$$` on its own line, content, then a closing
 * `$$` on its own line — is only recognized when that opening/closing line has a
 * blank line on the outward side. Miss that and the block is never parsed as math
 * at all: the literal `$$`/content/`$$` ships to readers as plain text, silently,
 * since there is no longer a client-side fallback pass (removed in Stufe 2 — see
 * git history of hooks/useKaTeXRenderer.ts). This test catches the mistake before
 * publish instead.
 *
 * Content inside fenced code blocks is skipped — a `$$` shown there as example text
 * is never markdown math to begin with.
 */

const ROOT = join(import.meta.dirname, "..");
const MDX_DIRS = ["blog", "quantum/amo", "quantum/basics", "quantum/hardware", "quantum/qml"];

function mdxFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => join(dir, f));
}

function countDelimiters(line: string): number {
  return (line.match(/\$\$/g) ?? []).length;
}

function findBlockDelimiterViolations(content: string, file: string): string[] {
  const lines = content.split("\n");
  const violations: string[] = [];
  let inFence = false;
  // Lines with an odd count of "$$" open or close a multi-line block; a line with
  // an even count (almost always 2) is a self-contained same-line expression and
  // needs no surrounding blank line.
  const blockMarkerLines: number[] = [];

  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    if (countDelimiters(line) % 2 === 1) blockMarkerLines.push(i);
  });

  for (let i = 0; i < blockMarkerLines.length; i += 2) {
    const openLine = blockMarkerLines[i];
    const closeLine = blockMarkerLines[i + 1];
    if (closeLine === undefined) {
      violations.push(`${file}:${openLine + 1} — unpaired "$$" (no closing delimiter found)`);
      continue;
    }
    const before = lines[openLine - 1];
    const after = lines[closeLine + 1];
    if (openLine > 0 && before !== undefined && before.trim() !== "") {
      violations.push(`${file}:${openLine + 1} — "$$" block not preceded by a blank line`);
    }
    if (after !== undefined && after.trim() !== "") {
      violations.push(`${file}:${closeLine + 1} — "$$" block not followed by a blank line`);
    }
  }

  return violations;
}

describe("MDX math block delimiters", () => {
  it("every multi-line $$ block in blog/quantum posts is surrounded by blank lines", () => {
    const files = MDX_DIRS.flatMap((dir) => mdxFiles(join(ROOT, dir)));
    const violations = files.flatMap((file) => findBlockDelimiterViolations(readFileSync(file, "utf-8"), file));

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
