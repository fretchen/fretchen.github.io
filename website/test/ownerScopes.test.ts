/**
 * The owner list is split by capability because the capabilities are not interchangeable: reading
 * traffic figures is harmless, approving a growth draft queues a post to Mastodon and Bluesky.
 * These tests pin that separation, which is otherwise only visible as two array literals.
 */
import { describe, it, expect } from "vitest";
import { ADMIN_WALLET, OWNER_SCOPES, SUPPORT_RECIPIENT_ADDRESS, isOwnerAddress } from "../utils/getChain";

describe("owner scopes", () => {
  it("gives the admin wallet every scope", () => {
    expect(isOwnerAddress(ADMIN_WALLET, "analytics")).toBe(true);
    expect(isOwnerAddress(ADMIN_WALLET, "growth")).toBe(true);
  });

  // The finding this split fixes: the support wallet was added so the assistant's paying wallet
  // could call get_analytics, and thereby also became a growth admin. It is the SEPOLIA_PRIVATE_KEY
  // script-signing wallet, so publishing rights are well beyond what it needs.
  it("gives the support wallet analytics but not growth", () => {
    expect(isOwnerAddress(SUPPORT_RECIPIENT_ADDRESS, "analytics")).toBe(true);
    expect(isOwnerAddress(SUPPORT_RECIPIENT_ADDRESS, "growth")).toBe(false);
  });

  it("keeps the growth scope narrower than the analytics scope", () => {
    for (const wallet of OWNER_SCOPES.growth) {
      expect(OWNER_SCOPES.analytics).toContain(wallet);
    }
    expect(OWNER_SCOPES.growth.length).toBeLessThan(OWNER_SCOPES.analytics.length);
  });

  it("matches case-insensitively and refuses an unknown or missing address", () => {
    expect(isOwnerAddress(ADMIN_WALLET.toLowerCase(), "growth")).toBe(true);
    expect(isOwnerAddress("0x1111111111111111111111111111111111111111", "analytics")).toBe(false);
    expect(isOwnerAddress(undefined, "analytics")).toBe(false);
  });
});
