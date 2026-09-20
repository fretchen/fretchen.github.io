import { describe, it, expect, vi } from "vitest";
import { useEnhancedRefundRequirements } from "../x402_server.js";

const AUTHORIZER = "0xF9B70303375f9762516669591D75049692Ab2c93";
const USDC = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85";
const PAY_TO = "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C";

/**
 * Stands in for BatchSettlementEvmScheme.enhancePaymentRequirements, which stamps on the two
 * fields the facilitator checks and nothing else (verified against the SDK source).
 */
function makeScheme(withdrawDelay = 86400) {
  return {
    enhancePaymentRequirements: vi.fn(
      async (requirements: Record<string, unknown>) =>
        ({
          ...requirements,
          extra: {
            ...(requirements.extra as object),
            receiverAuthorizer: AUTHORIZER,
            withdrawDelay,
          },
        }) as unknown,
    ),
  };
}

/** The manager's own builder, which is what ships the empty `extra` the facilitator rejects. */
function makeManager() {
  return {
    buildPaymentRequirements: () => ({
      scheme: "batch-settlement",
      network: "eip155:10",
      asset: USDC,
      amount: "0",
      payTo: PAY_TO,
      maxTimeoutSeconds: 0,
      extra: {},
    }),
  };
}

describe("useEnhancedRefundRequirements", () => {
  /**
   * The production failure: every cooperative refund came back
   * `invalid_batch_settlement_evm_receiver_authorizer_mismatch`. Not because the addresses
   * disagreed, but because the SDK's manager builds `extra: {}` and the facilitator's
   * validateChannelConfig fails closed on a MISSING receiverAuthorizer:
   *
   *   if (!requiredReceiverAuthorizer || …) return ErrReceiverAuthorizerMismatch;
   *
   * Present in @x402/evm 2.25 and 2.26 alike, so this guard stays until the SDK enhances its
   * own refund requirements.
   */
  it("replaces the manager's empty extra with the receiverAuthorizer", async () => {
    const scheme = makeScheme();
    const manager = makeManager();
    expect(manager.buildPaymentRequirements().extra).toEqual({});

    await useEnhancedRefundRequirements(scheme as never, manager, {
      network: "eip155:10",
      asset: USDC,
      payTo: PAY_TO,
    });

    const extra = (manager.buildPaymentRequirements() as { extra: Record<string, unknown> }).extra;
    expect(extra.receiverAuthorizer).toBe(AUTHORIZER);
  });

  /**
   * This one asserts an ABSENCE, and an earlier version of this file asserted the opposite
   * (`expect(extra.withdrawDelay).toBe(86400)`) — so read the reason before restoring it.
   *
   * `withdrawDelay` is one of the seven fields hashed into `computeChannelId`, so it is fixed
   * per channel at creation. The enhancer stamps the CURRENT server config instead, and the
   * facilitator compares the two:
   *
   *   if (extra?.withdrawDelay !== undefined && config.withdrawDelay !== Number(extra.withdrawDelay))
   *     return ErrWithdrawDelayMismatch;
   *
   * When LLM_WITHDRAW_DELAY_SECONDS went 900 -> 86400, every channel opened under the old value
   * became permanently unrefundable — `withdraw_delay_mismatch` on every 12h sweep, escrow
   * stranded with no route back, because the stored 900 is correct and cannot be migrated.
   *
   * Omitting the field skips that equality branch. The channel is still bound by the
   * `computeChannelId(config) === channelId` check that runs first, so this drops a policy
   * assertion, not a security one.
   */
  it("omits withdrawDelay, so a channel opened under an older config can still be refunded", async () => {
    const scheme = makeScheme();
    const manager = makeManager();

    await useEnhancedRefundRequirements(scheme as never, manager, {
      network: "eip155:10",
      asset: USDC,
      payTo: PAY_TO,
    });

    const extra = (manager.buildPaymentRequirements() as { extra: Record<string, unknown> }).extra;
    expect(extra).not.toHaveProperty("withdrawDelay");
  });

  /**
   * The bug this fixes, stated as the caller sees it: the server's current delay disagreeing
   * with a stored channel's own delay must never be what blocks a refund. Pinned against the
   * class rather than the numbers, so it keeps meaning if the default changes again.
   */
  it("produces the same refund requirements whatever the server's current withdrawDelay is", async () => {
    const extras = await Promise.all(
      [900, 86400, 2592000].map(async (delay) => {
        const manager = makeManager();
        await useEnhancedRefundRequirements(makeScheme(delay) as never, manager, {
          network: "eip155:10",
          asset: USDC,
          payTo: PAY_TO,
        });
        return (manager.buildPaymentRequirements() as { extra: Record<string, unknown> }).extra;
      }),
    );

    expect(extras[0]).toEqual(extras[1]);
    expect(extras[1]).toEqual(extras[2]);
  });

  it("keeps the network, asset and payTo the facilitator cross-checks against", async () => {
    // validateChannelConfig also rejects on payTo != config.receiver and asset != config.token,
    // so the workaround must not disturb those while fixing extra.
    const scheme = makeScheme();
    const manager = makeManager();

    await useEnhancedRefundRequirements(scheme as never, manager, {
      network: "eip155:10",
      asset: USDC,
      payTo: PAY_TO,
    });

    const req = manager.buildPaymentRequirements() as Record<string, unknown>;
    expect(req.network).toBe("eip155:10");
    expect(req.asset).toBe(USDC);
    expect(req.payTo).toBe(PAY_TO);
    expect(req.scheme).toBe("batch-settlement");
  });
});
