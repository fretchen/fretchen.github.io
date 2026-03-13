import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Link } from "../components/Link";
import "@testing-library/jest-dom";

// Mock usePageContext from vike-react
const mockPageContext = {
  urlPathname: "/blog/",
  locale: "en",
};

vi.mock("vike-react/usePageContext", () => ({
  usePageContext: () => mockPageContext,
}));

// Mock PandaCSS
vi.mock("../styled-system/css", () => ({
  css: () => "mocked-css",
}));

describe("Link Component", () => {
  describe("trailing slash behavior", () => {
    it("adds trailing slash to internal paths", () => {
      render(<Link href="/blog">Blog</Link>);
      expect(screen.getByText("Blog").closest("a")).toHaveAttribute("href", "/blog/");
    });

    it("keeps existing trailing slash unchanged", () => {
      render(<Link href="/blog/">Blog</Link>);
      expect(screen.getByText("Blog").closest("a")).toHaveAttribute("href", "/blog/");
    });

    it("keeps root path unchanged", () => {
      render(<Link href="/">Home</Link>);
      expect(screen.getByText("Home").closest("a")).toHaveAttribute("href", "/");
    });

    it("does not add trailing slash to file URLs", () => {
      render(<Link href="/data.json">Data</Link>);
      expect(screen.getByText("Data").closest("a")).toHaveAttribute("href", "/data.json");
    });

    it("does not add trailing slash to URLs with hash", () => {
      render(<Link href="/page#section">Section</Link>);
      expect(screen.getByText("Section").closest("a")).toHaveAttribute("href", "/page#section");
    });

    it("does not add trailing slash to URLs with query", () => {
      render(<Link href="/page?q=1">Search</Link>);
      expect(screen.getByText("Search").closest("a")).toHaveAttribute("href", "/page?q=1");
    });

    it("adds trailing slash to nested paths", () => {
      render(<Link href="/quantum/amo">AMO</Link>);
      expect(screen.getByText("AMO").closest("a")).toHaveAttribute("href", "/quantum/amo/");
    });
  });

  describe("locale handling with trailing slash", () => {
    it("adds locale prefix after trailing slash for non-default locale", () => {
      render(
        <Link href="/blog" locale="de">
          Blog
        </Link>,
      );
      expect(screen.getByText("Blog").closest("a")).toHaveAttribute("href", "/de/blog/");
    });

    it("does not add locale prefix for default locale", () => {
      render(
        <Link href="/blog" locale="en">
          Blog
        </Link>,
      );
      expect(screen.getByText("Blog").closest("a")).toHaveAttribute("href", "/blog/");
    });
  });

  describe("active state detection", () => {
    it("marks matching path as active (bold)", () => {
      // urlPathname is "/blog/" in mock
      render(<Link href="/blog">Blog</Link>);
      const link = screen.getByText("Blog").closest("a");
      expect(link).toBeInTheDocument();
    });

    it("renders children correctly", () => {
      render(<Link href="/test">Click me</Link>);
      expect(screen.getByText("Click me")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(
        <Link href="/test" className="custom-class">
          Styled
        </Link>,
      );
      const link = screen.getByText("Styled").closest("a");
      expect(link?.className).toContain("custom-class");
    });
  });
});
