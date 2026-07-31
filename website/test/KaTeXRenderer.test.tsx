/**
 * LaTeX rendering tests.
 *
 * The math pipeline has two halves that can break independently: remark-math turns `$…$`
 * and `$$…$$` in .mdx into `<code class="language-math">` at build time, and
 * `useKaTeXRenderer` swaps those for KaTeX markup in the browser. A page that ships the
 * first half without the second shows raw LaTeX source to the reader, so both are asserted
 * here — against a fixture in test/blog, never against a real lecture, so that editing
 * quantum/amo content can never turn this red.
 */
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import MathPost from "./blog/post_with_math.mdx";
import { useKaTeXRenderer } from "../hooks/useKaTeXRenderer";

/** Mirrors how pages/blog/@id/+Page.tsx wires the hook: one ref, rendered once loaded. */
function MathHarness({ isReady = true }: { isReady?: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null);
  useKaTeXRenderer(ref, isReady);
  return (
    <div ref={ref} data-testid="content">
      <MathPost />
    </div>
  );
}

const WAIT = { timeout: 5000 }; // the hook waits 300ms, then dynamically imports katex

afterEach(() => vi.restoreAllMocks());

describe("MDX math authoring (remark-math)", () => {
  it("compiles $$…$$ and $…$ into math code elements rather than literal dollar signs", () => {
    // isReady=false keeps the KaTeX pass from running, so this sees the raw build output.
    const { getByTestId } = render(<MathHarness isReady={false} />);
    const content = getByTestId("content");

    expect(content.querySelectorAll("code.language-math.math-display").length).toBe(2);
    expect(content.querySelectorAll("code.language-math.math-inline").length).toBe(2);
    expect(content.textContent).not.toContain("$");
  });
});

describe("useKaTeXRenderer", () => {
  it("replaces every math element with rendered KaTeX", async () => {
    const { getByTestId } = render(<MathHarness />);
    const content = getByTestId("content");

    await waitFor(() => expect(content.querySelector(".katex")).not.toBeNull(), WAIT);
    await waitFor(() => expect(content.querySelector("code.language-math")).toBeNull(), WAIT);

    // Display and inline math must not collapse into the same mode: the block formula is
    // the only one that gets .katex-display, the two inline ones stay in the text flow.
    expect(content.querySelectorAll(".katex-display").length).toBe(1);
    expect(content.querySelectorAll(".katex").length).toBe(3);
  });

  it("keeps the surrounding prose intact", async () => {
    const { getByTestId, getByRole } = render(<MathHarness />);
    const content = getByTestId("content");

    await waitFor(() => expect(content.querySelector(".katex")).not.toBeNull(), WAIT);

    expect(getByRole("heading", { name: "Harmonic oscillator" })).toBeInTheDocument();
    expect(content.textContent).toContain("do not commute");
  });

  it("renders the valid formulas even when one formula is malformed", async () => {
    // throwOnError: false is the reason a typo in one lecture cannot blank the whole page:
    // the bad formula degrades to a .katex-error span, its neighbours still render.
    const { getByTestId } = render(<MathHarness />);
    const content = getByTestId("content");

    await waitFor(() => expect(content.querySelectorAll(".katex-display").length).toBe(1), WAIT);
    expect(content.querySelectorAll(".katex-error").length).toBe(1);
    expect(content.querySelector("code.language-math")).toBeNull(); // nothing left unprocessed
  });

  it("does nothing until isReady flips true", async () => {
    const { getByTestId, rerender } = render(<MathHarness isReady={false} />);
    const content = getByTestId("content");

    await new Promise((resolve) => setTimeout(resolve, 400)); // past the hook's own delay
    expect(content.querySelector(".katex")).toBeNull();
    expect(content.querySelectorAll("code.language-math").length).toBe(4);

    rerender(<MathHarness isReady={true} />);
    await waitFor(() => expect(content.querySelector(".katex")).not.toBeNull(), WAIT);
  });

  it("drops its pending work when the reader navigates away before it fires", async () => {
    // Without the cleanup, the timeout would fire against a detached container and React
    // would log an update-on-unmounted-component error.
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container, unmount } = render(<MathHarness />);
    const content = container.querySelector("[data-testid='content']")!;

    unmount(); // well inside the hook's 300ms delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(content.querySelector(".katex")).toBeNull();
    expect(error).not.toHaveBeenCalled();
  });
});
