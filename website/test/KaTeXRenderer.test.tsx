/**
 * LaTeX rendering tests.
 *
 * remark-math + rehype-katex (vite.config.ts) turn `$…$` and `$$…$$` in .mdx into real KaTeX
 * markup at build time — there is no client-side rendering pass anymore. Asserted here
 * against a fixture in test/blog, never against a real lecture, so that editing quantum/amo
 * content can never turn this red.
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import MathPost from "./blog/post_with_math.mdx";
import MultiLineMathPost from "./blog/post_with_math_newline.mdx";
// The very stylesheet components/Post.tsx ships, read as text — see the last describe block.
import katexCss from "katex/dist/katex.min.css?raw";

describe("MDX math rendering (remark-math + rehype-katex)", () => {
  it("renders every math element as KaTeX markup, never raw LaTeX source or leftover language-math code", () => {
    const { container } = render(<MathPost />);

    expect(container.querySelector("code.language-math")).toBeNull();
    expect(container.textContent).not.toContain("$");

    // Display and inline math must not collapse into the same mode: the valid block formula
    // is the only one that gets .katex-display, the two inline ones stay in the text flow.
    expect(container.querySelectorAll(".katex-display").length).toBe(1);
    expect(container.querySelectorAll(".katex").length).toBeGreaterThanOrEqual(3);
  });

  it("keeps the surrounding prose intact", () => {
    const { container, getByRole } = render(<MathPost />);

    expect(getByRole("heading", { name: "Harmonic oscillator" })).toBeInTheDocument();
    expect(container.textContent).toContain("do not commute");
  });

  it("renders the valid formulas even when one formula is malformed", () => {
    // throwOnError: false (vite.config.ts) is why a typo in one lecture cannot blank the
    // whole page: the bad formula degrades to a .katex-error span, its neighbours still render.
    const { container } = render(<MathPost />);

    expect(container.querySelectorAll(".katex-display").length).toBe(1);
    expect(container.querySelectorAll(".katex-error").length).toBe(1);
  });
});

/**
 * The markup and the stylesheet come from two different places — rehype-katex renders with the
 * `katex` it resolves (vite.config.ts), components/Post.tsx imports `katex/dist/katex.min.css`.
 * Nothing makes those the same copy except the `overrides` block in package.json.
 *
 * They were once not the same copy: rehype-katex@7.0.1 declares `katex ^0.16.0` and installed a
 * nested 0.16 while the site shipped 0.18's CSS. KaTeX 0.17 had prefixed its internal layout
 * classes with `katex-` (`.newline` → `.katex-newline`, and the same for base/strut/vbox/rule/…),
 * so every one of those spans rendered unstyled — most visibly `\\` in display math, which stopped
 * breaking the line. Nothing failed: the markup was there, the classes were there, only no rule
 * matched them.
 *
 * So the invariant asserted here is not "the class is called `katex-newline`" — that name changes
 * again at the next major. It is: *the classes KaTeX emits are classes our stylesheet styles.*
 */
describe("KaTeX markup and KaTeX stylesheet come from the same version", () => {
  /** The class token KaTeX emitted for a given layout role, whatever prefix this version uses. */
  function emittedClassFor(container: HTMLElement, role: string): string | undefined {
    const classes = new Set<string>();
    container.querySelectorAll("[class]").forEach((el) => el.classList.forEach((c) => classes.add(c)));
    return [...classes].find((c) => c === role || c.endsWith(`-${role}`));
  }

  it("breaks a display formula containing `\\\\` into two lines", () => {
    const { container } = render(<MultiLineMathPost />);

    const newline = emittedClassFor(container, "newline");
    expect(newline).toBeDefined();
    // The break is purely a CSS affordance: the span is inline until a rule makes it a block.
    expect(katexCss).toContain(`.${newline}{display:block}`);
  });

  it("styles every layout class the rendered formulas rely on", () => {
    const { container } = render(<MultiLineMathPost />);

    // The horizontal run, the baseline, the stacked boxes of a fraction or radical, and its
    // bar — the second fixture formula exercises all four. `base` and `strut` are the two that
    // were renamed in 0.17; `vlist` and `frac-line` never were, and are here so the check also
    // covers a class going unstyled for any other reason. Deliberately not a blanket "every
    // emitted class is styled": the atom classes (mord, mopen, mclose, mrel) carry no CSS by
    // design, they exist for spacing logic and for downstream selectors.
    for (const role of ["base", "strut", "vlist", "frac-line"]) {
      const emitted = emittedClassFor(container, role);
      expect(emitted, `KaTeX emitted no class for "${role}"`).toBeDefined();
      expect(katexCss, `"${emitted}" is emitted but unstyled`).toContain(`.${emitted}`);
    }
  });
});
