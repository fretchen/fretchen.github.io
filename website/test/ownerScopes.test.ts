/**
 * The owner list is split by capability because the capabilities are not interchangeable: reading
 * traffic figures is harmless, approving a growth draft queues a post to Mastodon and Bluesky.
 * These tests pin that separation, which is otherwise only visible as two array literals.
 */
import { describe, it, expect } from "vitest";
import { ADMIN_WALLET, OWNER_SCOPES, SUPPORT_RECIPIENT_ADDRESS, isOwnerAddress } from "../utils/getChain";

describe("owner scopes", () => {
  it("gives the admin wallet every scope", () => {
    for (const scope of Object.keys(OWNER_SCOPES) as (keyof typeof OWNER_SCOPES)[]) {
      expect(isOwnerAddress(ADMIN_WALLET, scope)).toBe(true);
    }
  });

  // The finding this split fixes: the support wallet was added so the assistant's paying wallet
  // could call get_analytics, and thereby also became a growth admin. It is the SEPOLIA_PRIVATE_KEY
  // script-signing wallet, so publishing rights are well beyond what it needs.
  //
  // Search sits with analytics rather than with growth: both are tools the assistant offers during
  // a chat turn, so the wallet that pays for the turn has to be able to use them. Reading is the
  // shared property — neither publishes anything.
  it("gives the support wallet the assistant's read tools but not growth", () => {
    expect(isOwnerAddress(SUPPORT_RECIPIENT_ADDRESS, "analytics")).toBe(true);
    expect(isOwnerAddress(SUPPORT_RECIPIENT_ADDRESS, "search")).toBe(true);
    expect(isOwnerAddress(SUPPORT_RECIPIENT_ADDRESS, "growth")).toBe(false);
  });

  it("keeps the growth scope the narrowest of all", () => {
    for (const [scope, wallets] of Object.entries(OWNER_SCOPES)) {
      if (scope === "growth") continue;
      for (const wallet of OWNER_SCOPES.growth) {
        expect(wallets).toContain(wallet);
      }
      expect(OWNER_SCOPES.growth.length).toBeLessThan(wallets.length);
    }
  });

  it("matches case-insensitively and refuses an unknown or missing address", () => {
    expect(isOwnerAddress(ADMIN_WALLET.toLowerCase(), "growth")).toBe(true);
    expect(isOwnerAddress("0x1111111111111111111111111111111111111111", "analytics")).toBe(false);
    expect(isOwnerAddress(undefined, "analytics")).toBe(false);
  });
});
