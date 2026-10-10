/**
 * The acquisition routes behind `GetFundsModal`. EURe is the only currency with two routes:
 * Monerium's bank-transfer signup as the primary (the euro-native route), and Uniswap's EURe
 * token page as a secondary for anyone the KYC/SEPA flow would spook. The other currencies
 * keep their single link unchanged.
 *
 * setup.ts mocks `useLocale` to return the raw label, so links are asserted by label key.
 */
import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { GetFundsModal } from "../components/GetFundsModal";

const onClose = () => {};

describe("GetFundsModal", () => {
  it("offers EURe two ways: Monerium signup primary, Uniswap token page secondary", () => {
    render(<GetFundsModal currency="EURe" onClose={onClose} />);

    const bank = screen.getByRole("link", { name: "assistent.fundsRouteBank" });
    expect(bank).toHaveAttribute("href", "https://monerium.app/signup");

    const swap = screen.getByRole("link", { name: "assistent.fundsRouteSwap" });
    expect(swap).toHaveAttribute(
      "href",
      "https://app.uniswap.org/explore/tokens/base/0xbf6e2966A9C3D99C9E4D069E04f7Bdb9C8aa762C",
    );

    // The honest caveat for the KYC-free route: swapping needs ETH for gas.
    expect(screen.getByText("assistent.fundsSwapNote")).toBeDefined();
  });

  it("keeps a single route for EURC and USDC, with no swap note", () => {
    const { unmount } = render(<GetFundsModal currency="EURC" onClose={onClose} />);
    expect(screen.getByRole("link", { name: "assistent.fundsButton" })).toHaveAttribute(
      "href",
      "https://www.coinbase.com/de/how-to-buy/euro-coin-2",
    );
    expect(screen.queryByText("assistent.fundsSwapNote")).toBeNull();
    unmount();

    render(<GetFundsModal currency="USDC" onClose={onClose} />);
    expect(screen.getByRole("link", { name: "assistent.fundsButton" })).toHaveAttribute(
      "href",
      "https://app.optimism.io/bridge",
    );
    expect(screen.queryByText("assistent.fundsSwapNote")).toBeNull();
  });
});
