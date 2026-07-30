/**
 * CodeBlock tests.
 *
 * Two properties matter here. First, highlighting must be synchronous so it also runs during
 * SSR — these tests assert the .hljs-* markup exists on first render, with no waiting, which
 * is what rules out a flash of unhighlighted code. Second, the copy button has to hand over
 * the *exact* source text: a docs page whose copy button silently mangles a snippet is worse
 * than one with no button at all.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { CodeBlock } from "../components/CodeBlock";

const TS = `const answer = 42; // the meaning`;

function stubClipboard(writeText = vi.fn(() => Promise.resolve())) {
  Object.defineProperty(globalThis.navigator, "clipboard", {
    value: { writeText },
    configurable: true,
    writable: true,
  });
  return writeText;
}

describe("CodeBlock", () => {
  beforeEach(() => stubClipboard());
  afterEach(() => vi.useRealTimers());

  it("highlights on the first render (so the same markup can come from SSR)", () => {
    const { container } = render(<CodeBlock lang="typescript">{TS}</CodeBlock>);

    // No await: highlighting is synchronous by design.
    expect(container.querySelectorAll("[class^='hljs-']").length).toBeGreaterThan(0);
    expect(container.querySelector("code")?.textContent).toBe(TS);
  });

  it("leaves plaintext untouched", () => {
    const transcript = "HTTP/2 402\npayment-required: eyJ4NDAy...   <- base64";
    const { container } = render(<CodeBlock lang="plaintext">{transcript}</CodeBlock>);

    expect(container.querySelectorAll("[class^='hljs-']").length).toBe(0);
    expect(container.querySelector("code")?.textContent).toBe(transcript);
  });

  it("copies the exact source text, not the highlighted markup", async () => {
    const writeText = stubClipboard();
    render(<CodeBlock lang="typescript">{TS}</CodeBlock>);

    fireEvent.click(await screen.findByRole("button", { name: /copy code/i }));

    expect(writeText).toHaveBeenCalledWith(TS);
  });

  it("confirms the copy, then reverts", async () => {
    // Fake timers must be installed before the click, or the revert timeout is scheduled on
    // the real clock and advancing the fake one does nothing.
    vi.useFakeTimers();
    render(<CodeBlock lang="typescript">{TS}</CodeBlock>);
    await act(async () => {});
    const button = screen.getByRole("button", { name: /copy code/i });
    expect(button.textContent).toBe("Copy");

    fireEvent.click(button);
    await act(async () => {}); // let the writeText promise settle
    expect(button.textContent).toBe("Copied!");

    act(() => void vi.advanceTimersByTime(2000));
    expect(button.textContent).toBe("Copy");
  });

  it("hides the button where the clipboard API is unavailable (non-secure contexts)", async () => {
    Object.defineProperty(globalThis.navigator, "clipboard", { value: undefined, configurable: true });
    render(<CodeBlock lang="typescript">{TS}</CodeBlock>);

    await waitFor(() => expect(screen.queryByRole("button", { name: /copy code/i })).toBeNull());
  });
});
