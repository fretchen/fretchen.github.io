import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SupportChainModal } from "../components/SupportChainModal";
import React from "react";
import "@testing-library/jest-dom";

// useLocale is globally mocked (test/setup.ts) to echo the raw label key.

describe("SupportChainModal — two states", () => {
  let onClose: ReturnType<typeof vi.fn>;
  let onSwitchNetwork: ReturnType<typeof vi.fn>;
  let onRetry: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    onSwitchNetwork = vi.fn();
    onRetry = vi.fn();
  });

  describe("State A — wallet on the wrong network", () => {
    beforeEach(() => {
      render(
        <SupportChainModal
          onClose={onClose}
          onSwitchNetwork={onSwitchNetwork}
          onRetry={onRetry}
          isBusy={false}
          showGetUsdc={false}
        />,
      );
    });

    it("shows the switch copy and a switch-&-donate primary button", () => {
      expect(screen.getByText("metadataLine.modalBody")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "metadataLine.modalSwitchButton" })).toBeInTheDocument();
    });

    it("does not show the on-chain (needs-USDC) copy or a Get-USDC action", () => {
      expect(screen.queryByText("metadataLine.modalOnChainBody")).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "metadataLine.modalGetUsdcButton" })).not.toBeInTheDocument();
    });

    it("switch button calls onSwitchNetwork", () => {
      fireEvent.click(screen.getByRole("button", { name: "metadataLine.modalSwitchButton" }));
      expect(onSwitchNetwork).toHaveBeenCalledTimes(1);
    });
  });

  describe("State B — on a supported chain, needs USDC", () => {
    beforeEach(() => {
      render(
        <SupportChainModal
          onClose={onClose}
          onSwitchNetwork={onSwitchNetwork}
          onRetry={onRetry}
          isBusy={false}
          showGetUsdc={true}
          errorMessage="metadataLine.errorDonationFailed"
        />,
      );
    });

    it("shows the on-chain copy, NOT the (now-false) wrong-network copy", () => {
      expect(screen.getByText("metadataLine.modalOnChainBody")).toBeInTheDocument();
      expect(screen.queryByText("metadataLine.modalBody")).not.toBeInTheDocument();
    });

    it("makes Get USDC the primary action and offers Try again — no switch button", () => {
      const getUsdc = screen.getByRole("link", { name: "metadataLine.modalGetUsdcButton" });
      expect(getUsdc).toHaveAttribute("href", "https://app.optimism.io/bridge");
      expect(screen.getByRole("button", { name: "metadataLine.modalRetry" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "metadataLine.modalSwitchButton" })).not.toBeInTheDocument();
    });

    it("shows the friendly error message", () => {
      expect(screen.getByText("metadataLine.errorDonationFailed")).toBeInTheDocument();
    });

    it("Try again calls onRetry", () => {
      fireEvent.click(screen.getByRole("button", { name: "metadataLine.modalRetry" }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
