import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithQuery } from "./testUtils";
import { Post } from "../components/Post";
import { primePostModule, recordPostModuleError, __resetPostModuleCacheForTests } from "../utils/postModuleCache";
import React from "react";
import "@testing-library/jest-dom";

/**
 * Tests the failure path of post loading: since post components are
 * code-split, a chunk fetch can fail at runtime (stale hashed URL after a
 * redeploy, flaky network). The error UI must offer a working reload button.
 *
 * In production this failure is caught inside primePostModule() (called from
 * pages/+onBeforeRenderHtml.ts / +onBeforeRenderClient.ts, before Post.tsx
 * ever mounts) — so here we prime explicitly before rendering, the same way
 * those page hooks would.
 */

// Mock vike-react/usePageContext
vi.mock("vike-react/usePageContext", () => ({
  usePageContext: () => ({
    urlPathname: "/blog/1/",
  }),
}));

// Mock useSupportAction (used by MetadataLine)
vi.mock("../hooks/useSupportAction", () => ({
  useSupportAction: () => ({
    supportCount: "0",
    isLoading: false,
    isSuccess: false,
    errorMessage: null,
    isConnected: false,
    handleSupport: vi.fn(),
    isReadPending: false,
    readError: null,
  }),
}));

// Mock useUmami (used by MetadataLine)
vi.mock("../hooks/useUmami", () => ({
  useUmami: () => ({
    trackEvent: vi.fn(),
    isDisabled: true,
    isDebugMode: false,
  }),
}));

// Mock useWebmentionUrls (used by Post)
vi.mock("../hooks/useWebmentionUrls", () => ({
  useWebmentionUrls: () => ({
    urlWithoutSlash: "https://www.fretchen.eu/blog/1",
    urlWithSlash: "https://www.fretchen.eu/blog/1/",
  }),
}));

// Simulate a failed chunk fetch (e.g. stale hashed URL after redeploy)
vi.mock("../utils/lazyGlobRegistry", () => ({
  loadLazyModuleFromDirectory: vi.fn().mockRejectedValue(new Error("Failed to fetch dynamically imported module")),
}));

// Mock fetch globally (webmentions)
global.fetch = vi.fn();

// Mirrors pages/+onBeforeRenderClient.ts's own try/catch — primePostModule() itself
// always rethrows now (see its doc comment), so any direct caller that wants the
// "record it for Post.tsx's error UI" behavior does what the real client hook does.
async function primeClient(componentPath: string) {
  try {
    await primePostModule(componentPath);
  } catch (err) {
    recordPostModuleError(componentPath, err);
  }
}

describe("Post chunk-load failure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetPostModuleCacheForTests();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ children: [] }),
    } as Response);
  });

  const postProps = {
    title: "Hello World",
    content: "",
    componentPath: "../blog/hello_world.mdx",
    publishing_date: "2024-12-02",
  };

  it("renders the error UI with a reload button when the chunk fails to load", async () => {
    await primeClient(postProps.componentPath);
    renderWithQuery(<Post {...postProps} />);

    expect(screen.getByText(/Fehler beim Laden der React-Komponente/)).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch dynamically imported module/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Seite neu laden/ })).toBeInTheDocument();
  });

  it("reloads the page when the reload button is clicked", async () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload: reloadSpy },
    });

    await primeClient(postProps.componentPath);
    renderWithQuery(<Post {...postProps} />);

    const button = screen.getByRole("button", { name: /Seite neu laden/ });
    fireEvent.click(button);

    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  // Item 5 of the PR-632 review follow-up: ReactPostRenderer has no async state of
  // its own (getPostModule/getPostModuleError are synchronous reads of a cache
  // primed *before* it mounts), so the old "drops pending work on unmount" hazard
  // this file's tests used to also cover no longer applies. What can still happen
  // is a caller outside the page-hook pipeline (a future preview/embed tool, a test
  // harness) rendering Post before priming it at all — this locks in that it
  // degrades to the same error UI instead of crashing or rendering nothing.
  it("shows the error UI, not a crash or blank page, when rendered before priming", () => {
    renderWithQuery(<Post {...postProps} />);

    expect(screen.getByText(/Fehler beim Laden der React-Komponente/)).toBeInTheDocument();
  });
});
