import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "../components/Modal";
import React from "react";
import "@testing-library/jest-dom";

describe("Modal (shared shell)", () => {
  let onClose: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    onClose = vi.fn();
  });

  it("renders its children and the title", () => {
    render(
      <Modal onClose={onClose} title="My Dialog">
        <p>Body content</p>
      </Modal>,
    );

    expect(screen.getByText("Body content")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "My Dialog" })).toBeInTheDocument();
  });

  it("exposes a labelled dialog for accessibility", () => {
    render(
      <Modal onClose={onClose} title="My Dialog">
        <p>Body</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-label", "My Dialog");
  });

  it("calls onClose when the ✕ button is clicked", () => {
    render(
      <Modal onClose={onClose} title="X" closeLabel="Close dialog">
        <p>Body</p>
      </Modal>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the overlay (outside the card) is clicked", () => {
    const { container } = render(
      <Modal onClose={onClose} title="X">
        <p>Body</p>
      </Modal>,
    );

    // The overlay is the outermost element rendered by Modal
    const overlay = container.firstElementChild as HTMLElement;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onClose when clicking inside the card", () => {
    render(
      <Modal onClose={onClose} title="X">
        <p>Body content</p>
      </Modal>,
    );

    fireEvent.click(screen.getByText("Body content"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when Escape is pressed", () => {
    render(
      <Modal onClose={onClose} title="X">
        <p>Body</p>
      </Modal>,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose for other keys", () => {
    render(
      <Modal onClose={onClose} title="X">
        <p>Body</p>
      </Modal>,
    );

    fireEvent.keyDown(document, { key: "Enter" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("removes the Escape listener on unmount (no leak / no post-unmount calls)", () => {
    const { unmount } = render(
      <Modal onClose={onClose} title="X">
        <p>Body</p>
      </Modal>,
    );

    unmount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders children without the padded body wrapper when padded={false}", () => {
    render(
      <Modal onClose={onClose} padded={false}>
        <img alt="full bleed" src="x" />
      </Modal>,
    );

    // The image is a direct child of the card, and no title heading is rendered
    expect(screen.getByAltText("full bleed")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});
