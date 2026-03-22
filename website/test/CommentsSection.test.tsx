import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { CommentsSection } from "../components/CommentsSection";

// Mock vike-react/usePageContext
vi.mock("vike-react/usePageContext", () => ({
  usePageContext: () => ({
    urlPathname: "/quantum/amo/0",
  }),
}));

// Mock fetch API
global.fetch = vi.fn() as Mock;

describe("CommentsSection Component", () => {
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

      render(<CommentsSection />);

      expect(screen.getByText(/Loading comments/i)).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no comments exist", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comments: [] }),
      });

      render(<CommentsSection />);

      await waitFor(() => {
        expect(screen.getByText(/No comments yet/i)).toBeInTheDocument();
      });
    });
  });

  describe("Rendering Comments", () => {
    it("should render comments after loading", async () => {
      const mockComments = {
        comments: [
          {
            id: "abc-123",
            name: "Alice",
            text: "Great post!",
            timestamp: "2026-03-15T10:00:00Z",
          },
          {
            id: "def-456",
            name: "Bob",
            text: "I agree.",
            timestamp: "2026-03-16T12:00:00Z",
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockComments,
      });

      render(<CommentsSection />);

      await waitFor(() => {
        expect(screen.getByText("Great post!")).toBeInTheDocument();
        expect(screen.getByText("I agree.")).toBeInTheDocument();
      });

      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    it("should show robot emoji for suspected agent comments", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          comments: [
            {
              id: "bot-1",
              name: "SpamBot",
              text: "Buy stuff",
              timestamp: "2026-03-15T10:00:00Z",
              suspectedAgent: true,
            },
          ],
        }),
      });

      render(<CommentsSection />);

      await waitFor(() => {
        expect(screen.getByText("Buy stuff")).toBeInTheDocument();
      });

      expect(screen.getByTitle("Suspected automated comment")).toBeInTheDocument();
    });

    it("should fetch comments with correct page parameter", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comments: [] }),
      });

      render(<CommentsSection />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("page=%2Fquantum%2Famo%2F0"));
      });
    });
  });

  describe("Fetch Error Handling", () => {
    it("should handle fetch errors gracefully", async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error("Network error"));

      render(<CommentsSection />);

      await waitFor(() => {
        expect(screen.getByText(/No comments yet/i)).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    beforeEach(() => {
      // Initial fetch for comments
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comments: [] }),
      });
    });

    it("should render the comment form after clicking toggle", async () => {
      render(<CommentsSection />);

      await waitFor(() => {
        expect(screen.getByText(/No comments yet/i)).toBeInTheDocument();
      });

      // Form is hidden by default
      expect(screen.queryByLabelText("Comment")).not.toBeInTheDocument();

      // Click toggle to open form
      fireEvent.click(screen.getByRole("button", { name: /Leave a comment/i }));

      expect(screen.getByLabelText("Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Comment")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Send Comment/i })).toBeInTheDocument();
    });

    it("should submit a comment successfully", async () => {
      render(<CommentsSection />);

      await waitFor(() => {
        expect(screen.getByText(/No comments yet/i)).toBeInTheDocument();
      });

      // Open the form
      fireEvent.click(screen.getByRole("button", { name: /Leave a comment/i }));

      // Fill in the form
      fireEvent.change(screen.getByLabelText("Name"), {
        target: { value: "Test User" },
      });
      fireEvent.change(screen.getByLabelText("Comment"), {
        target: { value: "Hello world" },
      });

      // Mock the POST response
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          comment: {
            id: "new-1",
            name: "Test User",
            text: "Hello world",
            timestamp: "2026-03-22T12:00:00Z",
          },
        }),
      });

      fireEvent.click(screen.getByRole("button", { name: /Send Comment/i }));

      await waitFor(() => {
        expect(screen.getByText("Hello world")).toBeInTheDocument();
      });

      expect(screen.getByText(/Comment posted/i)).toBeInTheDocument();
    });

    it("should show error message on submission failure", async () => {
      render(<CommentsSection />);

      await waitFor(() => {
        expect(screen.getByText(/No comments yet/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Leave a comment/i }));

      fireEvent.change(screen.getByLabelText("Comment"), {
        target: { value: "A comment" },
      });

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Rate limit exceeded" }),
      });

      fireEvent.click(screen.getByRole("button", { name: /Send Comment/i }));

      await waitFor(() => {
        expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument();
      });
    });

    it("should not submit when text is empty", async () => {
      render(<CommentsSection />);

      await waitFor(() => {
        expect(screen.getByText(/No comments yet/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Leave a comment/i }));

      const submitButton = screen.getByRole("button", { name: /Send Comment/i });
      expect(submitButton).toBeDisabled();
    });

    it("should have a hidden honeypot field", async () => {
      render(<CommentsSection />);

      await waitFor(() => {
        expect(screen.getByText(/No comments yet/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Leave a comment/i }));

      const honeypot = document.querySelector("input[name='website']");
      expect(honeypot).toBeTruthy();
      expect(honeypot).toHaveAttribute("tabindex", "-1");
      expect(honeypot).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Form Title", () => {
    it("should display count-based heading", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comments: [] }),
      });

      render(<CommentsSection />);

      await waitFor(() => {
        expect(screen.getByText(/No comments yet/i)).toBeInTheDocument();
      });
    });
  });
});
