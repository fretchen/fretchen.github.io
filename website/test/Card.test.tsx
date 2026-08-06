import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { Card } from "../components/Card";
import { CardList } from "../components/CardList";
import "@testing-library/jest-dom";

vi.mock("../components/Link", () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

/**
 * Component tests for Card and its CardList container.
 *
 * Card renders an <li>, so every test mounts it inside CardList — that pairing is the
 * component's contract, not an incidental detail of the call sites.
 */
describe("Card", () => {
  const renderCard = (props: { title: string; description?: string; link: string }) =>
    render(
      <CardList>
        <Card {...props} />
      </CardList>,
    );

  it("renders the title and description", () => {
    renderCard({ title: "Quantum", description: "Tutorials and notes.", link: "/quantum" });

    expect(screen.getByText("Quantum")).toBeInTheDocument();
    expect(screen.getByText("Tutorials and notes.")).toBeInTheDocument();
  });

  it("links to the given destination", () => {
    renderCard({ title: "Lab", description: "Experiments.", link: "/lab" });

    expect(screen.getByRole("link")).toHaveAttribute("href", "/lab");
  });

  it("omits the description element when none is given", () => {
    const { container } = renderCard({ title: "Blog", link: "/blog" });

    expect(screen.getByText("Blog")).toBeInTheDocument();
    // Title is the only span inside the link.
    expect(container.querySelectorAll("a > span")).toHaveLength(1);
  });
});

describe("CardList", () => {
  it("renders one list item per card", () => {
    const { container } = render(
      <CardList>
        <Card title="Blog" description="Writing." link="/blog" />
        <Card title="Quantum" description="Notes." link="/quantum" />
        <Card title="Lab" description="Experiments." link="/lab" />
      </CardList>,
    );

    expect(container.querySelectorAll("ul > li")).toHaveLength(3);
    expect(screen.getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(["/blog", "/quantum", "/lab"]);
  });

  it("exposes the cards as a single list to assistive technology", () => {
    render(
      <CardList>
        <Card title="Blog" link="/blog" />
        <Card title="Lab" link="/lab" />
      </CardList>,
    );

    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
