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

  // A `language-math` fence (remark-math's block-math output) used to need a dedicated
  // untouched-passthrough case here, because the old client-side KaTeX renderer found and
  // replaced it by that exact selector after MdxPre ran. That renderer is gone — rehype-katex
  // (vite.config.ts) now turns math into real `.katex` markup at build time, before MdxPre
  // ever sees the tree, so `language-math` never reaches this component at all. See
  // test/KaTeXRenderer.test.tsx for the math-rendering assertions.
});
