/**
 * Tests for EIP-3009 transferWithAuthorization helpers.
 *
 * The hash-vector test cross-checks buildTransferWithAuthorizationTypedData against the
 * same fixture used in x402_facilitator/test/eip712_reference.test.js, so both packages
 * are proven to agree on the exact domain/types/message shape the on-chain contracts expect.
 */

import { describe, test, expect } from "vitest";
import { hashTypedData, hexToSignature } from "viem";
import {
  buildTransferWithAuthorizationTypedData,
  splitAuthorizationSignature,
  randomAuthorizationNonce,
  TRANSFER_WITH_AUTHORIZATION_TYPES,
} from "../src/eip3009";
import type { USDCConfig } from "../src/addresses";

describe("buildTransferWithAuthorizationTypedData", () => {
  test("matches the reference EIP-712 hash vector (x402_facilitator/test/eip712_reference.test.js)", () => {
    // Same fixture as x402_facilitator's "USDC TransferWithAuthorization structure" test.
    const usdcConfig: USDCConfig = {
      name: "OP Sepolia",
      chainId: 11155420,
      address: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
      decimals: 6,
      usdcName: "USDC",
      usdcVersion: "2",
    };

    const typedData = buildTransferWithAuthorizationTypedData(usdcConfig, {
      from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      to: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
      value: 10000n,
      validAfter: 1740672089n,
      validBefore: 9999999999n,
      nonce: "0xf3746613c2d920b5fdabc0856f2aeb2d4f88ee6037b8cc5d04a71a4462f13480",
    });

    const hash = hashTypedData(typedData);
    const expectedHash = "0x2ffe322a269aef1318b6cfa83e381fe06a1657df078abb0668f71ad1f603b0c8";

    expect(hash).toBe(expectedHash);
  });

  test("produces the exact field order the on-chain contracts expect", () => {
    expect(TRANSFER_WITH_AUTHORIZATION_TYPES.TransferWithAuthorization.map((f) => f.name)).toEqual([
      "from",
      "to",
      "value",
      "validAfter",
      "validBefore",
      "nonce",
    ]);
  });
});

describe("randomAuthorizationNonce", () => {
  test("returns a 32-byte hex value", () => {
    const nonce = randomAuthorizationNonce();
    expect(nonce).toMatch(/^0x[0-9a-f]{64}$/);
  });

  test("is different on each call", () => {
    expect(randomAuthorizationNonce()).not.toBe(randomAuthorizationNonce());
  });
});

describe("splitAuthorizationSignature", () => {
  test("passes through a standard v=27/28 signature unchanged", () => {
    const sig = `0x${"11".repeat(32)}${"22".repeat(32)}1b` as const;
    const { v, r, s } = splitAuthorizationSignature(sig);
    expect(v).toBe(27);
    expect(r).toBe(hexToSignature(sig).r);
    expect(s).toBe(hexToSignature(sig).s);
  });

  test("falls back to the raw yParity byte for signatures with no v (matches @x402/evm's own `parsedSig.v ?? parsedSig.yParity`)", () => {
    // A standard 65-byte signature (what signTypedData/eth_signTypedData_v4 always returns for
    // an EOA) always carries v=27/28, so this fallback path is only reachable for signature
    // forms this call path never produces. Asserting the exact SDK-matching behavior, not a
    // renormalized 27/28, so this helper stays byte-for-byte compatible with @x402/evm.
    const sigParity0 = `0x${"11".repeat(32)}${"22".repeat(32)}00` as const;
    const sigParity1 = `0x${"11".repeat(32)}${"22".repeat(32)}01` as const;

    expect(splitAuthorizationSignature(sigParity0).v).toBe(0);
    expect(splitAuthorizationSignature(sigParity1).v).toBe(1);
  });
});
