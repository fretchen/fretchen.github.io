import React from "react";
import { render, screen } from "@testing-library/react";
import { NFTHeroCard } from "../components/NFTHeroCard";
import { describe, it, expect, vi } from "vitest";

// Mock the NFTCard component since it has complex blockchain dependencies
vi.mock("../components/NFTCard", () => ({
  NFTCard: ({ tokenId }: { tokenId: bigint }) => (
    <div data-testid="nft-card">NFT Card with tokenId: {tokenId.toString()}</div>
  ),
}));

describe("NFTHeroCard", () => {
  it("renders with tokenId, title, and description", () => {
    render(<NFTHeroCard tokenId={2} title="Test NFT" description="This is a test NFT description" />);

    expect(screen.getByText("Test NFT")).toBeInTheDocument();
    expect(screen.getByText("This is a test NFT description")).toBeInTheDocument();
    expect(screen.getByTestId("nft-card")).toBeInTheDocument();
    expect(screen.getByText("NFT Card with tokenId: 2")).toBeInTheDocument();
  });

  it("renders without title and description", () => {
    render(<NFTHeroCard tokenId={5} />);

    expect(screen.getByTestId("nft-card")).toBeInTheDocument();
    expect(screen.getByText("NFT Card with tokenId: 5")).toBeInTheDocument();
  });

  it("converts number tokenId to BigInt for NFTCard", () => {
    render(<NFTHeroCard tokenId={123} />);

    expect(screen.getByText("NFT Card with tokenId: 123")).toBeInTheDocument();
  });
});
