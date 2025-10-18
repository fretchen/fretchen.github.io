import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { Webmentions } from "../components/Webmentions";

/**
 * Tests for the Webmentions component
 * Tests fetching, rendering, copy functionality, and user interactions
 */

// Mock fetch API
global.fetch = vi.fn() as Mock;

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn() as Mock,
  },
});

describe("Webmentions Component", () => {
  const mockPostUrl = "https://fretchen.eu/quantum/amo/0";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading State", () => {
    it("should show loading state initially", () => {
      (global.fetch as Mock).mockImplementation(
        () =>
          new Promise(() => {
            /* Never resolves */
          }),
      );

      render(<Webmentions postUrl={mockPostUrl} />);

      expect(screen.getByText(/Loading reactions/i)).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no webmentions exist", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ children: [] }),
      });

      render(<Webmentions postUrl={mockPostUrl} />);

      await waitFor(() => {
        expect(screen.getByText(/No reactions yet/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Be the first to share this post!/i)).toBeInTheDocument();
    });

    it("should show CTA even when empty", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ children: [] }),
      });

      render(<Webmentions postUrl={mockPostUrl} />);

      await waitFor(() => {
        expect(screen.getByText(/Share this post on social media!/i)).toBeInTheDocument();
      });

      expect(screen.getByRole("button", { name: /Copy Link/i })).toBeInTheDocument();
    });
  });

  describe("Fetching Webmentions", () => {
    it("should fetch webmentions from correct URL", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ children: [] }),
      });

      render(<Webmentions postUrl={mockPostUrl} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(`https://webmention.io/api/mentions.jf2?target=${mockPostUrl}`);
      });
    });

    it("should handle fetch errors gracefully", async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error("Network error"));

      render(<Webmentions postUrl={mockPostUrl} />);

      await waitFor(() => {
        expect(screen.getByText(/No reactions yet/i)).toBeInTheDocument();
      });
    });
  });

  describe("Rendering Likes", () => {
    it("should render likes section when likes exist", async () => {
      const mockData = {
        children: [
          {
            "wm-id": 1,
            "wm-property": "like-of",
            author: {
              name: "Alice",
              photo: "https://example.com/alice.jpg",
              url: "https://example.com/alice",
            },
            url: "https://bsky.app/profile/alice/post/123",
          },
          {
            "wm-id": 2,
            "wm-property": "like-of",
            author: {
              name: "Bob",
              photo: "https://example.com/bob.jpg",
              url: "https://example.com/bob",
            },
            url: "https://mastodon.social/@bob/456",
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      render(<Webmentions postUrl={mockPostUrl} />);

      await waitFor(() => {
        expect(screen.getByText("2", { exact: false })).toBeInTheDocument();
        expect(screen.getByText("Likes", { exact: false })).toBeInTheDocument();
      });

      // Check that avatars are rendered
      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(2);
      expect(images[0]).toHaveAttribute("alt", "Alice");
      expect(images[1]).toHaveAttribute("alt", "Bob");
    });

    it("should render fallback avatar when photo is missing", async () => {
      const mockData = {
        children: [
          {
            "wm-id": 1,
            "wm-property": "like-of",
            author: { name: "NoPhoto User", url: "https://example.com/nophoto" },
            url: "https://example.com/nophoto/1",
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      render(<Webmentions postUrl={mockPostUrl} />);

      await waitFor(() => {
        expect(screen.getByText("❤️ 1 Like", { exact: false })).toBeInTheDocument();
      });

      // Should render fallback icon instead of img
      const fallback = screen.getByText("👤");
      expect(fallback).toBeInTheDocument();

      // Verify no img tag is rendered for this user
      const images = screen.queryAllByRole("img");
      expect(images).toHaveLength(0);
    });

    it("should not show likes section when no likes", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ children: [] }),
      });

      render(<Webmentions postUrl={mockPostUrl} />);

      await waitFor(() => {
        expect(screen.queryByText(/Likes/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Rendering Reposts", () => {
    it("should render reposts section when reposts exist", async () => {
      const mockData = {
        children: [
          {
            "wm-id": 3,
            "wm-property": "repost-of",
            author: {
              name: "Charlie",
              photo: "https://example.com/charlie.jpg",
              url: "https://example.com/charlie",
            },
            url: "https://bsky.app/profile/charlie/post/789",
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      render(<Webmentions postUrl={mockPostUrl} />);

      await waitFor(() => {
        expect(screen.getByText("🔁 1 Repost", { exact: false })).toBeInTheDocument();
      });
    });

    it("should pluralize reposts correctly", async () => {
      const mockData = {
        children: [
          {
            "wm-id": 1,
            "wm-property": "repost-of",
            author: { name: "User1", url: "https://example.com/1" },
            url: "https://example.com/1",
          },
          {
            "wm-id": 2,
            "wm-property": "repost-of",
            author: { name: "User2", url: "https://example.com/2" },
            url: "https://example.com/2",
          },
          {
            "wm-id": 3,
            "wm-property": "repost-of",
            author: { name: "User3", url: "https://example.com/3" },
            url: "https://example.com/3",
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      render(<Webmentions postUrl={mockPostUrl} />);

      await waitFor(() => {
        expect(screen.getByText(/3 Reposts/i)).toBeInTheDocument();
      });
    });
  });

  describe("Rendering Replies", () => {
    it("should render replies section with content", async () => {
      const mockData = {
        children: [
          {
            "wm-id": 4,
            "wm-property": "in-reply-to",
            author: {
              name: "David",
              photo: "https://example.com/david.jpg",
              url: "https://example.com/david",
            },
            content: {
              text: "Great article! Very insightful.",
            },
            published: "2025-01-18T10:30:00Z",
            url: "https://bsky.app/profile/david/post/999",
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      render(<Webmentions postUrl={mockPostUrl} />);

      await waitFor(() => {
        expect(screen.getByText("💬 1 Reply", { exact: false })).toBeInTheDocument();
      });

      expect(screen.getByText("David")).toBeInTheDocument();
      expect(screen.getByText("Great article! Very insightful.")).toBeInTheDocument();
      expect(screen.getByText(/View original/i)).toBeInTheDocument();
    });

    it("should handle mentions (mention-of)", async () => {
      const mockData = {
        children: [
          {
            "wm-id": 5,
            "wm-property": "mention-of",
            author: {
              name: "Eve",
              url: "https://example.com/eve",
            },
            content: {
              text: "Check out this post!",
            },
            url: "https://example.com/eve/post",
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      render(<Webmentions postUrl={mockPostUrl} />);

      await waitFor(() => {
        expect(screen.getByText("💬 1 Reply", { exact: false })).toBeInTheDocument();
      });

      expect(screen.getByText("Check out this post!")).toBeInTheDocument();
    });

    it("should format published date correctly", async () => {
      const mockData = {
        children: [
          {
            "wm-id": 6,
            "wm-property": "in-reply-to",
            author: {
              name: "Frank",
              url: "https://example.com/frank",
            },
            published: "2025-01-18T10:30:00Z",
            url: "https://example.com/frank/post",
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      render(<Webmentions postUrl={mockPostUrl} />);

      await waitFor(() => {
        expect(screen.getByText("Frank")).toBeInTheDocument();
      });

      // Date formatting depends on locale, just check it exists
      const dateElement = screen.getByText(/18/);
      expect(dateElement).toBeInTheDocument();
    });
  });

  describe("Copy Link Functionality", () => {
    it("should copy link to clipboard when button clicked", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ children: [] }),
      });

      render(<Webmentions postUrl={mockPostUrl} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Copy Link/i })).toBeInTheDocument();
      });

      const copyButton = screen.getByRole("button", { name: /Copy Link/i });
      fireEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockPostUrl);
    });

    it("should show 'Copied!' feedback after copying", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ children: [] }),
      });

      render(<Webmentions postUrl={mockPostUrl} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Copy Link/i })).toBeInTheDocument();
      });

      const copyButton = screen.getByRole("button", { name: /Copy Link/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/✓ Copied!/i)).toBeInTheDocument();
      });
    });

    it("should handle clipboard write errors gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      (navigator.clipboard.writeText as Mock).mockRejectedValueOnce(new Error("Clipboard error"));

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ children: [] }),
      });

      render(<Webmentions postUrl={mockPostUrl} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Copy Link/i })).toBeInTheDocument();
      });

      const copyButton = screen.getByRole("button", { name: /Copy Link/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to copy:", expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("CTA Links", () => {
    it("should render Bluesky and Mastodon links", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ children: [] }),
      });

      render(<Webmentions postUrl={mockPostUrl} />);

      await waitFor(() => {
        expect(screen.getByText(/Share this post on social media!/i)).toBeInTheDocument();
      });

      const blueskyLink = screen.getByRole("link", { name: /Bluesky/i });
      const mastodonLink = screen.getByRole("link", { name: /Mastodon/i });

      expect(blueskyLink).toHaveAttribute("href", "https://bsky.app");
      expect(blueskyLink).toHaveAttribute("target", "_blank");
      expect(blueskyLink).toHaveAttribute("rel", "noopener noreferrer");

      expect(mastodonLink).toHaveAttribute("href", "https://mastodon.social");
      expect(mastodonLink).toHaveAttribute("target", "_blank");
      expect(mastodonLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("should show timing expectation in CTA", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ children: [] }),
      });

      render(<Webmentions postUrl={mockPostUrl} />);

      await waitFor(() => {
        expect(screen.getByText(/appears above within 5-10 minutes/i)).toBeInTheDocument();
      });
    });
  });

  describe("Mixed Content", () => {
    it("should render all types of reactions together", async () => {
      const mockData = {
        children: [
          {
            "wm-id": 1,
            "wm-property": "like-of",
            author: { name: "Alice", url: "https://example.com/alice" },
            url: "https://example.com/alice/1",
          },
          {
            "wm-id": 2,
            "wm-property": "like-of",
            author: { name: "Bob", url: "https://example.com/bob" },
            url: "https://example.com/bob/2",
          },
          {
            "wm-id": 3,
            "wm-property": "repost-of",
            author: { name: "Charlie", url: "https://example.com/charlie" },
            url: "https://example.com/charlie/3",
          },
          {
            "wm-id": 4,
            "wm-property": "in-reply-to",
            author: { name: "David", url: "https://example.com/david" },
            content: { text: "Great post!" },
            url: "https://example.com/david/4",
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      render(<Webmentions postUrl={mockPostUrl} />);

      await waitFor(() => {
        expect(screen.getByText("Reactions from the Web")).toBeInTheDocument();
      });

      expect(screen.getByText("❤️ 2 Likes", { exact: false })).toBeInTheDocument();
      expect(screen.getByText("🔁 1 Repost", { exact: false })).toBeInTheDocument();
      expect(screen.getByText("💬 1 Reply", { exact: false })).toBeInTheDocument();
      expect(screen.getByText("Great post!")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels and attributes", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ children: [] }),
      });

      render(<Webmentions postUrl={mockPostUrl} />);

      await waitFor(() => {
        const copyButton = screen.getByRole("button", { name: /Copy Link/i });
        expect(copyButton).toHaveAttribute("title", "Copy link to clipboard");
      });
    });

    it("should have alt text for avatar images", async () => {
      const mockData = {
        children: [
          {
            "wm-id": 1,
            "wm-property": "like-of",
            author: {
              name: "Alice",
              photo: "https://example.com/alice.jpg",
              url: "https://example.com/alice",
            },
            url: "https://example.com/alice/post",
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      render(<Webmentions postUrl={mockPostUrl} />);

      await waitFor(() => {
        const avatar = screen.getByAltText("Alice");
        expect(avatar).toBeInTheDocument();
      });
    });
  });
});
