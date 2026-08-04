import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import EntryList from "../components/EntryList";
import { BlogEntry } from "../types/components";
import "@testing-library/jest-dom";

vi.mock("../components/Link", () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// The real EntryNftImage is used deliberately — u-featured is emitted by that component, so
// stubbing it out would make the assertion below test the stub. Only its wagmi client is
// mocked; with a fallbackImageUrl the effect short-circuits before ever reaching the chain.
vi.mock("../hooks/useConfiguredPublicClient", () => ({
  useConfiguredPublicClient: () => undefined,
}));

/**
 * Microformats2 contract for EntryList.
 *
 * Bridgy Fed publishes from this markup — if a class is dropped or reparented, nothing fails
 * loudly: the tests pass, the page looks right, and syndication quietly degrades. These
 * assertions are the guard. They are deliberately written against *classes and text*, not
 * against element structure, so a layout rework is free to change wrappers.
 *
 * @see https://microformats.org/wiki/h-entry
 */
describe("EntryList microformats", () => {
  const blogs: BlogEntry[] = [
    {
      title: "A Post With Everything",
      publishing_date: "2024-01-15",
      description: "Description of the first post",
      category: "blockchain",
      secondaryCategory: "others",
      nftMetadata: { imageUrl: "https://example.invalid/art.png", name: "Art" },
    },
    {
      title: "A Bare Post",
      publishing_date: "2024-02-20",
    },
  ] as BlogEntry[];

  const renderList = () => render(<EntryList blogs={blogs} basePath="/blog" showDate={true} />);

  it("marks every entry as an h-entry", () => {
    const { container } = renderList();
    expect(container.querySelectorAll(".h-entry")).toHaveLength(2);
  });

  it("emits p-name carrying the title", () => {
    const { container } = renderList();
    const names = [...container.querySelectorAll(".p-name")].map((el) => el.textContent);
    expect(names).toEqual(["A Post With Everything", "A Bare Post"]);
  });

  it("emits dt-published as a <time> with an ISO dateTime attribute", () => {
    const { container } = renderList();
    const times = [...container.querySelectorAll("time.dt-published")];
    expect(times).toHaveLength(2);
    expect(times[0]).toHaveAttribute("dateTime", "2024-01-15");
    expect(times[1]).toHaveAttribute("dateTime", "2024-02-20");
  });

  it("emits p-summary only for entries that have a description", () => {
    const { container } = renderList();
    const summaries = [...container.querySelectorAll(".p-summary")].map((el) => el.textContent);
    expect(summaries).toEqual(["Description of the first post"]);
  });

  it("emits one p-category per category, including the secondary", () => {
    const { container } = renderList();
    const categories = [...container.querySelectorAll(".p-category")].map((el) => el.textContent);
    expect(categories).toEqual(["blockchain", "others"]);
  });

  it("emits p-author h-card with rel=author on every entry", () => {
    const { container } = renderList();
    const authors = [...container.querySelectorAll('a[rel="author"].p-author.h-card')];
    expect(authors).toHaveLength(2);
    authors.forEach((a) => expect(a).toHaveAttribute("href", "https://www.fretchen.eu"));
  });

  it("emits u-url with the absolute permalink for every entry", () => {
    const { container } = renderList();
    const urls = [...container.querySelectorAll("a.u-url")].map((a) => a.getAttribute("href"));
    expect(urls).toEqual(["https://www.fretchen.eu/blog/0/", "https://www.fretchen.eu/blog/1/"]);
  });

  it("emits the Bridgy Fed discovery link on every entry", () => {
    const { container } = renderList();
    expect(container.querySelectorAll('a.u-bridgy-fed[href="https://fed.brid.gy/"]')).toHaveLength(2);
  });

  it("emits u-featured only for entries that have artwork, on the <img> itself", async () => {
    const { container } = renderList();

    // Queried by class, not by structure — but pinned to IMG, because mf2 reads `src`
    // straight off a u-* img. On a wrapper it would fall back to the only-child rule, and a
    // failed image lookup would leave an empty u-featured behind.
    await waitFor(() => {
      const featured = container.querySelectorAll(".u-featured");
      expect(featured).toHaveLength(1);
      expect(featured[0].tagName).toBe("IMG");
      expect(featured[0]).toHaveAttribute("src", "https://example.invalid/art.png");
    });
  });

  it("keeps the microformat anchors out of the accessible link list", () => {
    // The hidden p-author / u-url / u-bridgy-fed anchors must stay display:none, so exactly
    // one visible link exists per entry. Several sibling tests index links positionally.
    const { container } = renderList();
    const hidden = [...container.querySelectorAll("a.p-author, a.u-url, a.u-bridgy-fed")];
    expect(hidden).toHaveLength(6);
    hidden.forEach((a) => expect(a).toHaveStyle({ display: "none" }));
  });
});
