import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "../components/PageHeader";
import "@testing-library/jest-dom";

/**
 * The preamble every page opens with: title, territory rule, optional lead paragraph.
 *
 * The intro being optional is the part worth pinning — guides pass no children because their
 * lead belongs to the prose surface, and an empty <p> there would add stray space under the
 * rule.
 */
describe("PageHeader", () => {
  it("renders the title as the page's h1", () => {
    render(<PageHeader title="Quantum" />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Quantum");
  });

  it("renders the lead paragraph when one is given", () => {
    const { container } = render(<PageHeader title="Blog">Game theory and quantum physics.</PageHeader>);

    expect(screen.getByText("Game theory and quantum physics.")).toBeInTheDocument();
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });

  it("emits no paragraph when no intro is given", () => {
    const { container } = render(<PageHeader title="x402 Facilitator" territory="explore" />);

    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("always renders the territory rule, hidden from assistive technology", () => {
    const { container } = render(<PageHeader title="Lab" territory="explore" />);

    const rule = container.querySelector("span[aria-hidden='true']");
    expect(rule).not.toBeNull();
  });

  it("applies a different class per territory", () => {
    const { container: voice } = render(<PageHeader title="Blog" territory="voice" />);
    const { container: explore } = render(<PageHeader title="Lab" territory="explore" />);

    const cls = (c: HTMLElement) => c.querySelector("span[aria-hidden='true']")?.className;
    expect(cls(voice)).not.toEqual(cls(explore));
  });
});
