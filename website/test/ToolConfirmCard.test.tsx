/**
 * ToolConfirmCard — presentational only. The behavioural contract (never auto-executing, what
 * happens on Cancel, disabling while generating) is exercised through AssistantChat.test.tsx,
 * which owns the loop this card pauses. This file covers the card in isolation: it starts from
 * the given prompt/size, lets both be edited, and reports the *current* edited values on
 * confirm rather than the original ones.
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToolConfirmCard } from "../components/ToolConfirmCard";

function renderCard(overrides: Partial<React.ComponentProps<typeof ToolConfirmCard>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ToolConfirmCard
      prompt="a red bicycle"
      size="1024x1024"
      phase="confirm"
      network="eip155:10"
      title="Generate an image?"
      promptLabel="Prompt"
      sizeLabel="Size"
      mintNotice="This will mint an NFT to your wallet."
      generateLabel="Generate ($0.07)"
      processingLabel="Processing..."
      cancelLabel="Cancel"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  );
  return { onConfirm, onCancel };
}

describe("ToolConfirmCard", () => {
  it("pre-fills the prompt and size from props", () => {
    renderCard({ prompt: "a blue kite", size: "1792x1024" });
    expect(screen.getByDisplayValue("a blue kite")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1792x1024" })).toHaveAttribute("aria-pressed", "true");
  });

  it("confirms with the edited prompt and size, not the original ones", () => {
    const { onConfirm } = renderCard({ prompt: "original", size: "1024x1024" });

    fireEvent.change(screen.getByDisplayValue("original"), { target: { value: "edited" } });
    fireEvent.click(screen.getByRole("button", { name: "1792x1024" }));
    fireEvent.click(screen.getByRole("button", { name: /Generate/ }));

    expect(onConfirm).toHaveBeenCalledWith("edited", "1792x1024");
  });

  it("trims the edited prompt before confirming", () => {
    const { onConfirm } = renderCard({ prompt: "x" });
    fireEvent.change(screen.getByDisplayValue("x"), { target: { value: "  padded  " } });
    fireEvent.click(screen.getByRole("button", { name: /Generate/ }));
    expect(onConfirm).toHaveBeenCalledWith("padded", "1024x1024");
  });

  it("disables the generate button when the prompt is emptied", () => {
    renderCard({ prompt: "x" });
    fireEvent.change(screen.getByDisplayValue("x"), { target: { value: "   " } });
    expect(screen.getByRole("button", { name: /Generate/ })).toBeDisabled();
  });

  it("calls onCancel", () => {
    const { onCancel } = renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("disables every control and shows the processing label while generating", () => {
    renderCard({ phase: "generating" });
    expect(screen.getByDisplayValue("a red bicycle")).toBeDisabled();
    expect(screen.getByRole("button", { name: "1024x1024" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "1792x1024" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Processing..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("shows the network badge", () => {
    renderCard({ network: "eip155:8453" });
    expect(screen.getByText("Base")).toBeInTheDocument();
  });
});
