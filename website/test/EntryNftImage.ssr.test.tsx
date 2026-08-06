import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { render, screen, fireEvent } from "@testing-library/react";
import { EntryNftImage } from "../components/EntryNftImage";
import "@testing-library/jest-dom";

// The on-chain lookup is irrelevant here: every case below is about what the component can
// render *without* it. Returning undefined leaves the tokenId branch unable to proceed,
// which is exactly the state SSR is in.
vi.mock("../hooks/useConfiguredPublicClient", () => ({
  useConfiguredPublicClient: () => undefined,
}));

const ART = "https://my-imagestore.s3.nl-ams.scw.cloud/images/art.png";

/**
 * Server-rendering contract for EntryNftImage.
 *
 * Effects do not run during SSR, so anything resolved only inside useEffect is absent from
 * the prerendered HTML — which is the HTML that Bridgy Fed and every other microformats
 * consumer fetches. When the image URL is already known at build time it must be in the
 * first render, not applied on hydration.
 *
 * Uses renderToString under jsdom, following test/Head.test.tsx.
 */
describe("EntryNftImage server rendering", () => {
  it("renders the image in the server markup when the URL is known at build time", () => {
    const html = renderToString(<EntryNftImage fallbackImageUrl={ART} nftName="Art" />);

    expect(html).toContain("u-featured");
    expect(html).toContain(`src="${ART}"`);
    expect(html).not.toContain("Loading NFT artwork");
  });

  it("falls back to the placeholder when only a tokenId is known", () => {
    // Deliberate boundary, not an oversight. Every post with a tokenID currently gets
    // build-time metadata, so this path is a fallback — but it stays reachable, because the
    // build-time loader queries one chain while the component covers all mainnets. When the
    // server genuinely does not know the URL it must render a placeholder rather than claim
    // an image it does not have.
    const html = renderToString(<EntryNftImage tokenId={7} />);

    expect(html).toContain("Loading NFT artwork");
    expect(html).not.toContain("u-featured");
  });

  it("carries the alt text into the server markup", () => {
    const html = renderToString(<EntryNftImage fallbackImageUrl={ART} nftName="Art" />);

    expect(html).toContain('alt="Art"');
  });
});

describe("EntryNftImage in the browser", () => {
  // Note: this block cannot prove anything about *first paint* — testing-library flushes
  // effects inside act(), so these pass whether the URL is resolved during render or in the
  // effect. The server-rendering block above is what guards that. These cover the DOM
  // contract: right src, right class, and the failure path.
  it("renders the artwork with the u-featured class", () => {
    render(<EntryNftImage fallbackImageUrl={ART} nftName="Art" />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", ART);
    expect(img).toHaveClass("u-featured");
  });

  it("removes the image when it fails to load", () => {
    render(<EntryNftImage fallbackImageUrl={ART} nftName="Art" />);

    fireEvent.error(screen.getByRole("img"));

    // imageUrl cleared while isLoading is already false -> the component renders nothing,
    // rather than leaving a broken image or an empty u-featured behind.
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByTitle("Loading NFT artwork...")).toBeNull();
  });
});
