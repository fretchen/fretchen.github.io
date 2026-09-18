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
  it("replaces the manager's empty extra with receiverAuthorizer and withdrawDelay", async () => {
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
    expect(extra.withdrawDelay).toBe(86400);
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
