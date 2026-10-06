/**
 * ToolSelector — presentational. The persistence and the effect on what the model is offered are
 * exercised through AssistantChat.test.tsx, which owns both; this file covers the panel itself.
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToolSelector } from "../components/ToolSelector";

const OPTIONS = [
  { names: ["generate_image"], label: "Image generation", description: "Creates a picture" },
  // Two wire names under one row — the shape a grouped Bundestakt capability takes.
  { names: ["get_sitzungen", "search_claims"], label: "Bundestag", description: "What was said" },
];

function renderSelector(overrides: Partial<React.ComponentProps<typeof ToolSelector>> = {}) {
  const onToggle = vi.fn();
  render(<ToolSelector options={OPTIONS} disabled={new Set()} onToggle={onToggle} {...overrides} />);
  return { onToggle };
}

describe("ToolSelector", () => {
  it("lists every option by its label, all checked when nothing is disabled", () => {
    renderSelector();
    expect(screen.getByLabelText("Image generation")).toBeChecked();
    expect(screen.getByLabelText("Bundestag")).toBeChecked();
  });

  it("shows a description under its row, not folded into the checkbox's accessible name", () => {
    renderSelector();
    // The label stays exactly "Image generation" — a description nested inside the <label>
    // would have appended itself here and broken this exact query, which is the failure mode
    // the split into <label> + aria-describedby exists to avoid.
    expect(screen.getByLabelText("Image generation")).toBeInTheDocument();
    expect(screen.getByText("Creates a picture")).toBeInTheDocument();
  });

  // Checked means "every member is enabled", not "at least one is" — a visitor never chose to
  // half-disable "Bundestag", so a partially-disabled state can only be a stale `localStorage`
  // set left over from before the two tools were grouped. Reading it as unchecked is the safe
  // side to be wrong on: one click then re-enables both, rather than the row silently claiming
  // to be fully on while one of its two tools stays withheld from the model.
  it("shows a grouped row as unchecked while only some of its members are disabled", () => {
    renderSelector({ disabled: new Set(["get_sitzungen"]) });
    expect(screen.getByLabelText("Bundestag")).not.toBeChecked();
  });

  it("shows a grouped row as unchecked once every member is disabled", () => {
    renderSelector({ disabled: new Set(["get_sitzungen", "search_claims"]) });
    expect(screen.getByLabelText("Bundestag")).not.toBeChecked();
  });

  it("reports a switch-off with every wire name the row stands for, not by label", () => {
    const { onToggle } = renderSelector();
    fireEvent.click(screen.getByLabelText("Bundestag"));
    expect(onToggle).toHaveBeenCalledWith(["get_sitzungen", "search_claims"], false);
  });

  it("reports switching a grouped row back on", () => {
    const { onToggle } = renderSelector({ disabled: new Set(["get_sitzungen", "search_claims"]) });
    fireEvent.click(screen.getByLabelText("Bundestag"));
    expect(onToggle).toHaveBeenCalledWith(["get_sitzungen", "search_claims"], true);
  });

  it("falls back to the wire names when a label is missing", () => {
    renderSelector({ options: [{ names: ["web_search"] }] });
    expect(screen.getByLabelText("web_search")).toBeInTheDocument();
  });

  it("renders nothing under a row that has no description", () => {
    const onToggle = vi.fn();
    const { container } = render(
      <ToolSelector
        options={[{ names: ["web_search"], label: "Web search" }]}
        disabled={new Set()}
        onToggle={onToggle}
      />,
    );
    expect(screen.getByLabelText("Web search")).toBeInTheDocument();
    expect(container.querySelector("p")).not.toBeInTheDocument();
  });

  // Switching everything off is a legitimate choice, not an error — but it changes what the
  // assistant can do, so it says so rather than looking broken.
  it("explains what an empty selection means", () => {
    renderSelector({ disabled: new Set(["generate_image", "get_sitzungen", "search_claims"]) });
    expect(screen.getByText(/answer from its own knowledge/)).toBeInTheDocument();
  });

  it("says nothing at all when the visitor has no tools available", () => {
    const { container } = render(<ToolSelector options={[]} disabled={new Set()} onToggle={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
