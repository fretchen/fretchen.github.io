/**
 * Tests for facilitator_instance onAfterVerify hook (fee model)
 *
 * The hook implements the fee access control logic:
 * - Recipients with sufficient USDC allowance pass (fee collected at settle)
 * - Recipients without sufficient allowance are rejected
 * - When fees are disabled (fee=0), all recipients pass
 *
 * We test the hook by capturing the callback registered via facilitator.onAfterVerify()
 * and calling it directly with different input combinations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ═══════════════════════════════════════════════════════════════
// Capture the onAfterVerify callback from the facilitator instance
// ═══════════════════════════════════════════════════════════════

type HookArgs = {
  paymentPayload: {
    accepted?: { network?: string };
    payload?: { authorization?: { to?: string } };
  };
  result: Record<string, unknown>;
};

// Use vi.hoisted() to ensure the holder is available before mocks run
const { hookHolder } = vi.hoisted(() => ({
  hookHolder: {
    current: null as ((args: HookArgs) => Promise<void>) | null,
  },
}));

// Mock x402 libraries — we only need to capture the onAfterVerify callback
vi.mock("@x402/core/facilitator", () => ({
  // Use a regular function (not arrow) so it works as a constructor with `new`
  x402Facilitator: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this.register = vi.fn();
    this.onAfterVerify = vi.fn((cb: (args: HookArgs) => Promise<void>) => {
      hookHolder.current = cb;
    });
  }),
}));

vi.mock("@x402/evm", () => ({
  toFacilitatorEvmSigner: vi.fn(() => ({})),
}));

vi.mock("@x402/evm/exact/facilitator", () => ({
  ExactEvmScheme: vi.fn(),
}));

vi.mock("viem", async () => {
  const actual = await vi.importActual("viem");
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({})),
    createWalletClient: vi.fn(() => ({})),
  };
});

vi.mock("viem/accounts", () => ({
  privateKeyToAccount: vi.fn(() => ({
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  })),
}));

// Mock fee module — the hook's dependency
vi.mock("../x402_fee.js", () => ({
  checkMerchantAllowance: vi.fn(),
  getFeeAmount: vi.fn(),
  getFacilitatorAddress: vi.fn(),
}));

import { createFacilitator, resetFacilitator } from "../facilitator_instance.js";
import {
  checkMerchantAllowance,
  getFeeAmount,
  getFacilitatorAddress,
} from "../x402_fee.js";

// ═══════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════

describe("facilitator_instance onAfterVerify hook (fee model)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.FACILITATOR_WALLET_PRIVATE_KEY =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    vi.clearAllMocks();
    hookHolder.current = null;
    resetFacilitator();

    // Default fee configuration
    vi.mocked(getFeeAmount).mockReturnValue(10000n);
    vi.mocked(getFacilitatorAddress).mockReturnValue(
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    );

    // Create facilitator — this registers the onAfterVerify hook
    createFacilitator();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  /** Helper: create mock hook arguments simulating a valid payment */
  function hookArgs(recipient: string, network: string): HookArgs {
    return {
      paymentPayload: {
        accepted: { network },
        payload: { authorization: { to: recipient } },
      },
      result: {
        isValid: true,
        payer: "0xSomePayer000000000000000000000000000000",
      },
    };
  }

  it("registers onAfterVerify hook during facilitator creation", () => {
    expect(hookHolder.current).not.toBeNull();
    expect(typeof hookHolder.current).toBe("function");
  });

  it("skips processing when verification already failed", async () => {
    const args = hookArgs(
      "0x1111111111111111111111111111111111111111",
      "eip155:11155420",
    );
    args.result.isValid = false;
    args.result.invalidReason = "invalid_signature";

    await hookHolder.current!(args);

    expect(args.result.isValid).toBe(false);
    expect(args.result.invalidReason).toBe("invalid_signature");
    expect(checkMerchantAllowance).not.toHaveBeenCalled();
  });

  // ───────────────────────────────────────────────────────────
  // Path 1: Fees disabled
  // ───────────────────────────────────────────────────────────

  it("allows all recipients when fee is 0 (fees disabled)", async () => {
    vi.mocked(getFeeAmount).mockReturnValue(0n);

    const args = hookArgs(
      "0x1111111111111111111111111111111111111111",
      "eip155:11155420",
    );
    await hookHolder.current!(args);

    expect(args.result.isValid).toBe(true);
    expect(args.result.feeRequired).toBe(false);
    expect(checkMerchantAllowance).not.toHaveBeenCalled();
  });

  // ───────────────────────────────────────────────────────────
  // Path 2: Sufficient fee allowance
  // ───────────────────────────────────────────────────────────

  it("allows recipient with sufficient fee allowance", async () => {
    vi.mocked(checkMerchantAllowance).mockResolvedValue({
      allowance: 100000n,
      remainingSettlements: 10,
      sufficient: true,
    });

    const args = hookArgs(
      "0x1111111111111111111111111111111111111111",
      "eip155:11155420",
    );
    await hookHolder.current!(args);

    expect(args.result.isValid).toBe(true);
    expect(args.result.feeRequired).toBe(true);
    expect(args.result.recipient).toBe("0x1111111111111111111111111111111111111111");
    expect(checkMerchantAllowance).toHaveBeenCalledWith(
      "0x1111111111111111111111111111111111111111",
      "eip155:11155420",
    );
  });

  // ───────────────────────────────────────────────────────────
  // Path 3: Insufficient fee allowance
  // ───────────────────────────────────────────────────────────

  it("rejects recipient without sufficient fee allowance", async () => {
    vi.mocked(checkMerchantAllowance).mockResolvedValue({
      allowance: 5000n,
      remainingSettlements: 0,
      sufficient: false,
    });

    const args = hookArgs(
      "0x1111111111111111111111111111111111111111",
      "eip155:11155420",
    );
    await hookHolder.current!(args);

    expect(args.result.isValid).toBe(false);
    expect(args.result.invalidReason).toBe("insufficient_fee_allowance");
    expect(args.result.requiredAllowance).toBe("10000");
    expect(args.result.currentAllowance).toBe("5000");
    expect(args.result.facilitatorAddress).toBe(
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    );
  });

  it("rejects recipient with zero allowance", async () => {
    vi.mocked(checkMerchantAllowance).mockResolvedValue({
      allowance: 0n,
      remainingSettlements: 0,
      sufficient: false,
    });

    const args = hookArgs(
      "0x2222222222222222222222222222222222222222",
      "eip155:10",
    );
    await hookHolder.current!(args);

    expect(args.result.isValid).toBe(false);
    expect(args.result.invalidReason).toBe("insufficient_fee_allowance");
    expect(args.result.currentAllowance).toBe("0");
  });

  // ───────────────────────────────────────────────────────────
  // Edge cases
  // ───────────────────────────────────────────────────────────

  it("rejects when facilitator address is not configured", async () => {
    vi.mocked(getFacilitatorAddress).mockReturnValue(null);

    const args = hookArgs(
      "0x1111111111111111111111111111111111111111",
      "eip155:11155420",
    );
    await hookHolder.current!(args);

    expect(args.result.isValid).toBe(false);
    expect(args.result.invalidReason).toBe("facilitator_not_configured");
  });

  it("rejects when network is missing from payload", async () => {
    const args: HookArgs = {
      paymentPayload: {
        accepted: {},
        payload: {
          authorization: { to: "0x1111111111111111111111111111111111111111" },
        },
      },
      result: { isValid: true },
    };

    await hookHolder.current!(args);

    expect(args.result.isValid).toBe(false);
    expect(args.result.invalidReason).toBe("invalid_payload");
  });

  it("rejects when recipient is missing from payload", async () => {
    const args: HookArgs = {
      paymentPayload: {
        accepted: { network: "eip155:11155420" },
        payload: { authorization: {} },
      },
      result: { isValid: true },
    };

    await hookHolder.current!(args);

    expect(args.result.isValid).toBe(false);
    expect(args.result.invalidReason).toBe("invalid_payload");
  });
});
