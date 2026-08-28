import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderWithQuery, createTestQueryClient } from "./testUtils";
import { Post } from "../components/Post";
import React from "react";
import "@testing-library/jest-dom";

vi.mock("vike-react/usePageContext", () => ({
  usePageContext: () => ({ urlPathname: "/blog/1/" }),
}));

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

vi.mock("../hooks/useUmami", () => ({
  useUmami: () => ({ trackEvent: vi.fn(), isDisabled: true, isDebugMode: false }),
}));

vi.mock("../hooks/useWebmentionUrls", () => ({
  useWebmentionUrls: () => ({
    urlWithoutSlash: "https://www.fretchen.eu/blog/1",
    urlWithSlash: "https://www.fretchen.eu/blog/1/",
  }),
}));

global.fetch = vi.fn();

const postProps = {
  title: "Hello World",
  content: "",
  componentPath: "../blog/hello_world.mdx",
  publishing_date: "2024-12-02",
};

/**
 * `e-content` must describe the article, not the box that stands in for it.
 *
 * Post bodies load through a dynamic import in an effect, so the prerendered HTML — the HTML
 * Bridgy Fed reads from a permalink — contains a loading placeholder. While `e-content` sat
 * on an always-present wrapper, that placeholder *was* the syndicated body of every post:
 * mf2 parsed `content` as "🔄 Lade interaktive Komponente...Pfad: ../blog/…".
 *
 * An h-entry with no `content` is valid, and `summary` is correct on every post, so consumers
 * fall back to it. These tests pin the class to the loaded article.
 */
describe("Post microformats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ children: [] }),
    } as Response);
  });

  const ssr = (props: React.ComponentProps<typeof Post>) =>
    renderToString(
      <QueryClientProvider client={createTestQueryClient()}>
        <Post {...props} />
      </QueryClientProvider>,
    );

  it("emits no e-content in the server markup, where the body is still a placeholder", () => {
    const html = ssr(postProps);

    expect(html).toContain("Lade interaktive Komponente");
    expect(html).not.toContain("e-content");
  });

  it("keeps the rest of the h-entry intact in the server markup", () => {
    // Only `content` is being withheld — everything a consumer needs to render a reference
    // to the post must still be there.
    const html = ssr(postProps);

    expect(html).toContain("h-entry");
    expect(html).toContain("p-name");
    expect(html).toContain("dt-published");
    expect(html).toContain("u-url");
  });

  it("emits e-content once the article has actually rendered", async () => {
    const { container } = renderWithQuery(<Post {...postProps} />);

    await waitFor(() => {
      expect(container.querySelector(".e-content")).not.toBeNull();
    });
  });

  it("emits no e-content when the article fails to load", async () => {
    const { container } = renderWithQuery(<Post {...postProps} componentPath="../blog/does_not_exist.mdx" />);

    await waitFor(() => {
      expect(container.textContent).toContain("Fehler beim Laden");
    });
    expect(container.querySelector(".e-content")).toBeNull();
  });
});
