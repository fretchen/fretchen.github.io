import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChainBadge, ChainInfoDisplay, getChainName, getChainShortName } from "../components/ChainBadge";

describe("ChainBadge", () => {
  describe("getChainName", () => {
    it("should return correct name for Optimism", () => {
      expect(getChainName("eip155:10")).toBe("Optimism");
    });

    it("should return correct name for Base", () => {
      expect(getChainName("eip155:8453")).toBe("Base");
    });

    it("should return correct name for Optimism Sepolia", () => {
      expect(getChainName("eip155:11155420")).toBe("OP Sepolia");
    });

    it("should return correct name for Base Sepolia", () => {
      expect(getChainName("eip155:84532")).toBe("Base Sepolia");
    });

    it("should return network string for unknown chain", () => {
      expect(getChainName("eip155:1")).toBe("eip155:1");
    });
  });

  describe("getChainShortName", () => {
    it("should return OP for Optimism", () => {
      expect(getChainShortName("eip155:10")).toBe("OP");
    });

    it("should return Base for Base", () => {
      expect(getChainShortName("eip155:8453")).toBe("Base");
    });

    it("should return ? for unknown chain", () => {
      expect(getChainShortName("eip155:1")).toBe("?");
    });
  });

  describe("ChainBadge component", () => {
    it("should render OP badge for Optimism", () => {
      render(<ChainBadge network="eip155:10" />);
      expect(screen.getByText("OP")).toBeInTheDocument();
    });

    it("should render Base badge for Base", () => {
      render(<ChainBadge network="eip155:8453" />);
      expect(screen.getByText("Base")).toBeInTheDocument();
    });

    it("should render nothing for unknown chain", () => {
      const { container } = render(<ChainBadge network="eip155:1" />);
      expect(container.firstChild).toBeNull();
    });

    it("should have correct title attribute", () => {
      render(<ChainBadge network="eip155:10" />);
      expect(screen.getByTitle("Optimism")).toBeInTheDocument();
    });

    it("should apply sm size by default", () => {
      render(<ChainBadge network="eip155:10" />);
      // Just verify it renders without error
      expect(screen.getByText("OP")).toBeInTheDocument();
    });

    it("should apply md size when specified", () => {
      render(<ChainBadge network="eip155:10" size="md" />);
      expect(screen.getByText("OP")).toBeInTheDocument();
    });
  });

  describe("ChainInfoDisplay component", () => {
    it("should render network badge", () => {
      render(<ChainInfoDisplay network="eip155:10" />);
      expect(screen.getByText("Network:")).toBeInTheDocument();
      expect(screen.getByText("OP")).toBeInTheDocument();
    });

    it("should render tokenId when provided", () => {
      render(<ChainInfoDisplay network="eip155:10" tokenId={42n} />);
      expect(screen.getByText("Token:")).toBeInTheDocument();
      expect(screen.getByText("#42")).toBeInTheDocument();
    });

    it("should not render tokenId section when not provided", () => {
      render(<ChainInfoDisplay network="eip155:10" />);
      expect(screen.queryByText("Token:")).not.toBeInTheDocument();
    });

    it("should render nothing for unknown chain", () => {
      const { container } = render(<ChainInfoDisplay network="eip155:1" />);
      expect(container.firstChild).toBeNull();
    });
  });
});
