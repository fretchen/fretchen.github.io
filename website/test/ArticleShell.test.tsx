import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { ArticleShell } from "../components/ArticleShell";

/**
 * Tests for ArticleShell — the reading-page grid shared by Post and agent-onboarding.
 *
 * Structural only. The grid itself is CSS and nothing here can see it; these guard the
 * contract the two callers rely on (slots render, and absent slots leave no empty
 * <header>/<aside> behind).
 */
describe("ArticleShell", () => {
  it("renders its children", () => {
    render(
      <ArticleShell>
        <p>body text</p>
      </ArticleShell>,
    );

    expect(screen.getByText("body text")).toBeTruthy();
  });

  it("renders the header slot inside a <header>", () => {
    const { container } = render(
      <ArticleShell header={<h1>A title</h1>}>
        <p>body text</p>
      </ArticleShell>,
    );

    const header = container.querySelector("header");
    expect(header).not.toBeNull();
    expect(header?.querySelector("h1")?.textContent).toBe("A title");
  });

  it("renders the toc slot inside an <aside>", () => {
    const { container } = render(
      <ArticleShell toc={<nav aria-label="Table of contents" />}>
        <p>body text</p>
      </ArticleShell>,
    );

    const aside = container.querySelector("aside");
    expect(aside).not.toBeNull();
    expect(aside?.querySelector("nav")).not.toBeNull();
  });

  it("omits both elements when the slots are not given", () => {
    const { container } = render(
      <ArticleShell>
        <p>body text</p>
      </ArticleShell>,
    );

    expect(container.querySelector("header")).toBeNull();
    expect(container.querySelector("aside")).toBeNull();
  });
});
