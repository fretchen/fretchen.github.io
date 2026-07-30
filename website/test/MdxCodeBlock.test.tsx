/**
 * MdxPre tests.
 *
 * MDX (compiled without `providerImportSource`, as this repo's vite.config.ts does) reads
 * component overrides from a `components` *prop* passed to the compiled component, not from
 * React context/MDXProvider — verified against @mdx-js/mdx's actual compile output. Post.tsx
 * passes `components={{ pre: MdxPre }}` directly to the loaded MDX component for that reason.
 * These tests render MdxPre the same way MDX itself would call it: as the `pre` element with a
 * single `<code className="language-xxx">` child.
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MdxPre } from "../components/MdxCodeBlock";
import Lecture5 from "../quantum/amo/lecture5.mdx";

const PY = `def add(a, b):\n    return a + b`;

function renderFence(lang: string, code: string) {
  return render(
    <MdxPre>
      <code className={`language-${lang}`}>{code}</code>
    </MdxPre>,
  );
}

describe("MdxPre", () => {
  it("routes a python fence through CodeBlock with highlighting", () => {
    const { container } = renderFence("python", PY);

    expect(container.querySelectorAll("[class^='hljs-']").length).toBeGreaterThan(0);
    expect(container.querySelector("code")?.textContent).toBe(PY);
  });

  it("maps the shell alias onto the bash grammar", () => {
    const { container } = renderFence("shell", "echo hello");

    expect(container.querySelectorAll("[class^='hljs-']").length).toBeGreaterThan(0);
  });

  it("falls back to plaintext for an unregistered fence language", () => {
    const { container } = renderFence("solidity", "contract Foo {}");

    expect(container.querySelectorAll("[class^='hljs-']").length).toBe(0);
    expect(container.querySelector("code")?.textContent).toBe("contract Foo {}");
  });

  it("leaves a bare <pre> (no single string-child <code>) untouched", () => {
    const { container } = render(
      <MdxPre>
        <span>not a code fence</span>
      </MdxPre>,
    );

    expect(container.querySelector("pre")).not.toBeNull();
    expect(container.querySelector("[class^='hljs-']")).toBeNull();
  });

  it("leaves remark-math's language-math fence untouched (regression: useKaTeXRenderer depends on this class)", () => {
    const latex = "\\hat{H} = \\frac{p^2}{2m}";
    const { container } = render(
      <MdxPre>
        <code className="language-math math-display">{latex}</code>
      </MdxPre>,
    );

    const code = container.querySelector("code.language-math");
    expect(code).not.toBeNull();
    expect(code?.className).toBe("language-math math-display");
    expect(code?.textContent).toBe(latex);
    expect(container.querySelector("[class^='hljs-']")).toBeNull();
  });

  it("preserves code.language-math.math-display when a real lecture is rendered exactly as Post.tsx renders it (regression test)", () => {
    const { container } = render(<Lecture5 components={{ pre: MdxPre }} />);

    // Inline math ($...$) renders as a bare <code class="language-math math-inline"> that never
    // goes through <pre>/MdxPre at all, so it can't detect this regression. Display math ($$...$$)
    // is the one that goes through <pre> — assert on .math-display specifically, the same selector
    // useKaTeXRenderer.ts relies on to find and replace block math. Lecture5 has both kinds.
    expect(container.querySelectorAll("code.language-math.math-display").length).toBeGreaterThan(0);
  });
});
