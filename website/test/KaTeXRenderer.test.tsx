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
