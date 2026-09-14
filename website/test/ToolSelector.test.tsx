/**
 * ToolSelector — presentational. The persistence and the effect on what the model is offered are
 * exercised through AssistantChat.test.tsx, which owns both; this file covers the panel itself.
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToolSelector } from "../components/ToolSelector";

const OPTIONS = [
  { name: "generate_image", label: "Image generation" },
  { name: "get_sitzungen", label: "Bundestag sessions" },
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
    expect(screen.getByLabelText("Bundestag sessions")).toBeChecked();
  });

  it("shows a disabled tool as unchecked", () => {
    renderSelector({ disabled: new Set(["get_sitzungen"]) });
    expect(screen.getByLabelText("Image generation")).toBeChecked();
    expect(screen.getByLabelText("Bundestag sessions")).not.toBeChecked();
  });

  it("reports a switch-off by wire name, not by label", () => {
    const { onToggle } = renderSelector();
    fireEvent.click(screen.getByLabelText("Bundestag sessions"));
    expect(onToggle).toHaveBeenCalledWith("get_sitzungen", false);
  });

  it("reports switching one back on", () => {
    const { onToggle } = renderSelector({ disabled: new Set(["get_sitzungen"]) });
    fireEvent.click(screen.getByLabelText("Bundestag sessions"));
    expect(onToggle).toHaveBeenCalledWith("get_sitzungen", true);
  });

  it("falls back to the wire name when a label is missing", () => {
    renderSelector({ options: [{ name: "web_search" }] });
    expect(screen.getByLabelText("web_search")).toBeInTheDocument();
  });

  // Switching everything off is a legitimate choice, not an error — but it changes what the
  // assistant can do, so it says so rather than looking broken.
  it("explains what an empty selection means", () => {
    renderSelector({ disabled: new Set(["generate_image", "get_sitzungen"]) });
    expect(screen.getByText(/answer from its own knowledge/)).toBeInTheDocument();
  });

  it("says nothing at all when the visitor has no tools available", () => {
    const { container } = render(<ToolSelector options={[]} disabled={new Set()} onToggle={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
