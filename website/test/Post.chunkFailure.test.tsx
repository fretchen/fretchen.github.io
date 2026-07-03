import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithQuery } from "./testUtils";
import { Post } from "../components/Post";
import React from "react";
import "@testing-library/jest-dom";

/**
 * Tests the failure path of lazy post loading: since post components are
 * code-split, a chunk fetch can fail at runtime (stale hashed URL after a
 * redeploy, flaky network). The error UI must offer a working reload button.
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

describe("Post chunk-load failure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ children: [] }),
    } as Response);
  });

  const postProps = {
    title: "Hello World",
    content: "",
    type: "react" as const,
    componentPath: "../blog/hello_world.mdx",
    publishing_date: "2024-12-02",
  };

  it("renders the error UI with a reload button when the chunk fails to load", async () => {
    renderWithQuery(<Post {...postProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Fehler beim Laden der React-Komponente/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Failed to fetch dynamically imported module/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Seite neu laden/ })).toBeInTheDocument();
  });

  it("reloads the page when the reload button is clicked", async () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload: reloadSpy },
    });

    renderWithQuery(<Post {...postProps} />);

    const button = await screen.findByRole("button", { name: /Seite neu laden/ });
    fireEvent.click(button);

    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });
});
