import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Post } from "../components/Post";
import React from "react";
import "@testing-library/jest-dom";

// Mock vike-react/usePageContext
vi.mock("vike-react/usePageContext", () => ({
  usePageContext: () => ({
    urlPathname: "/blog/1/",
  }),
}));

// Mock fetch globally
global.fetch = vi.fn();

describe("Post Component Integration Tests", () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ children: [] }),
    } as Response);
  });

  describe("Markdown Blog Rendering", () => {
    it("should render markdown blog title and metadata", () => {
      // Arrange: Use a real markdown blog from the blog directory
      const postProps = {
        title: "Hello World",
        content: "",
        type: "react" as const,
        componentPath: "../blog/hello_world.mdx",
        publishing_date: "2024-12-02",
        tokenID: 2,
      };

      // Act: Render the Post component
      render(<Post {...postProps} />);

      // Assert: Title should be rendered
      expect(screen.getByText("Hello World")).toBeInTheDocument();

      // Assert: Publishing date should be rendered (formatted as "Month Day, Year")
      expect(screen.getByText(/December 2, 2024/)).toBeInTheDocument();

      // Assert: Component loading should start
      expect(screen.getByText(/Lade interaktive Komponente/)).toBeInTheDocument();
    });

    it("should render markdown blog with multi-word title", () => {
      // Arrange: Use a blog with a multi-word title
      const postProps = {
        title: "Moving old lectures",
        content: "",
        type: "react" as const,
        componentPath: "../blog/moving_lectures.md",
        publishing_date: "2025-01-06",
      };

      // Act
      render(<Post {...postProps} />);

      // Assert: Full title should be rendered
      expect(screen.getByText("Moving old lectures")).toBeInTheDocument();

      // Assert: Date is formatted correctly
      expect(screen.getByText(/January 6, 2025/)).toBeInTheDocument();
    });

    it("should handle markdown with complex frontmatter (tokenID)", () => {
      // Arrange: Blog with tokenID
      const postProps = {
        title: "A gallery of AI images",
        content: "",
        type: "react" as const,
        componentPath: "../blog/nft_gallery.md",
        publishing_date: "2025-06-03",
        tokenID: 24,
      };

      // Act
      render(<Post {...postProps} />);

      // Assert: Title and metadata
      expect(screen.getByText("A gallery of AI images")).toBeInTheDocument();
      expect(screen.getByText(/June 3, 2025/)).toBeInTheDocument();
    });
  });

  describe("TypeScript Blog Rendering", () => {
    it("should render TypeScript interactive blog title", () => {
      // Arrange: Use a TypeScript blog component
      const postProps = {
        title: "Merkle Ai Batching",
        content: "",
        type: "react" as const,
        componentPath: "../blog/merkle_ai_batching.tsx",
      };

      // Act
      render(<Post {...postProps} />);

      // Assert: Title
      expect(screen.getByText("Merkle Ai Batching")).toBeInTheDocument();
    });
  });

  describe("Navigation Links", () => {
    it("should render previous and next post links", () => {
      // Arrange
      const postProps = {
        title: "Current Post",
        content: "",
        type: "react" as const,
        componentPath: "../blog/test.mdx",
        prevPost: { title: "Previous Post", id: 0 },
        nextPost: { title: "Next Post", id: 2 },
      };

      // Act
      render(<Post {...postProps} />);

      // Assert: Navigation should be present
      expect(screen.getByText(/Previous:/)).toBeInTheDocument();
      expect(screen.getByText("Previous Post")).toBeInTheDocument();
      expect(screen.getByText(/Next:/)).toBeInTheDocument();
      expect(screen.getByText("Next Post")).toBeInTheDocument();
    });

    it("should not render navigation when no prev/next posts provided", () => {
      // Arrange: No prev/next posts
      const postProps = {
        title: "Standalone Post",
        content: "",
        type: "react" as const,
        componentPath: "../blog/test.mdx",
      };

      // Act
      render(<Post {...postProps} />);

      // Assert: Title renders but no navigation
      expect(screen.getByText("Standalone Post")).toBeInTheDocument();
      expect(screen.queryByText(/Previous:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Next:/)).not.toBeInTheDocument();
    });
  });

  describe("Support Button", () => {
    it("should render support button", () => {
      // Arrange
      const postProps = {
        title: "Test Post",
        content: "",
        type: "react" as const,
        componentPath: "../blog/test.mdx",
        publishing_date: "2024-01-01",
      };

      // Act
      render(<Post {...postProps} />);

      // Assert: Support button should be present (new text: "Support ~50¢")
      expect(screen.getByText(/Support/)).toBeInTheDocument();
    });
  });

  describe("Webmentions URL Construction", () => {
    it("should construct correct URL without trailing slash for webmention.io compatibility", async () => {
      // Arrange
      const postProps = {
        title: "Test Post",
        content: "",
        type: "react" as const,
        componentPath: "../blog/test.mdx",
        publishing_date: "2024-01-01",
      };

      // Act
      render(<Post {...postProps} />);

      // Assert: Wait for fetch to be called
      await vi.waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Get the fetch call URL
      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const fetchUrl = fetchCall[0] as string;

      // Assert: URL should not have double slashes in the path (after domain)
      const urlObj = new URL(fetchUrl);
      const targetParam = urlObj.searchParams.get("target");
      expect(targetParam).toBeTruthy();
      // Check for triple slashes (double slash after protocol)
      expect(targetParam).not.toContain("///");
      // Should fetch both URL variants (with and without trailing slash)
      expect(fetchUrl).toMatch(
        /^https:\/\/webmention\.io\/api\/mentions\.jf2\?target=https:\/\/www\.fretchen\.eu\/blog/,
      );
    });

    it("should fetch webmentions for the correct post URL", async () => {
      // Arrange
      const postProps = {
        title: "Test Post",
        content: "",
        type: "react" as const,
        componentPath: "../blog/test.mdx",
        publishing_date: "2024-01-01",
      };

      // Act
      render(<Post {...postProps} />);

      // Assert: Webmentions API should be called
      await vi.waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("https://webmention.io/api/mentions.jf2?target="),
        );
      });
    });
  });
});
