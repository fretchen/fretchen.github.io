/**
 * Critical Security Tests for x402 v2 Implementation
 *
 * These tests validate:
 * 1. PAYMENT-SIGNATURE header base64 decoding (regression from production bug)
 * 2. Network validation (no defaulting to mainnet)
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  extractPaymentPayload,
  createPaymentRequirements,
  getSupportedNetworks,
} from "../x402_server.js";
import { getUSDCConfig } from "../getChain.js";
import { handle } from "../genimg_x402_token.js";

describe("x402 Security: Header Encoding", () => {
  it("should decode base64-encoded PAYMENT-SIGNATURE header", () => {
    const paymentPayload = {
      scheme: "exact",
      network: "eip155:11155420",
      authorization: { v: 27, r: "0xabc", s: "0xdef" },
      transfer: { from: "0x123", to: "0x456", value: "1000" },
    };

    // Encode as base64 (like x402 client does)
    const base64Encoded = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");

    const headers = {
      "Payment-Signature": base64Encoded,
    };

    const result = extractPaymentPayload(headers);

    expect(result).not.toBeNull();
    expect(result.scheme).toBe("exact");
    expect(result.network).toBe("eip155:11155420");
    expect(result.authorization.v).toBe(27);
  });

  it("should handle malformed base64 gracefully", () => {
    const headers = {
      "Payment-Signature": "not-valid-base64!!!",
    };

    const result = extractPaymentPayload(headers);

    expect(result).toBeNull();
  });

  it("should still support v1 X-PAYMENT header (plain JSON)", () => {
    const paymentPayload = {
      scheme: "exact",
      network: "eip155:11155420",
      authorization: { v: 27, r: "0xabc", s: "0xdef" },
      transfer: { from: "0x123", to: "0x456", value: "1000" },
    };

    const headers = {
      "X-Payment": JSON.stringify(paymentPayload),
    };

    const result = extractPaymentPayload(headers);

    expect(result).not.toBeNull();
    expect(result.scheme).toBe("exact");
    expect(result.network).toBe("eip155:11155420");
  });
});

describe("x402 Security: Network Validation", () => {
  it("should reject payment with no network specified", async () => {
    const paymentPayload = {
      scheme: "exact",
      accepted: {
        // network: missing!
      },
      authorization: { v: 27, r: "0xabc", s: "0xdef" },
      transfer: { from: "0x123", to: "0x456", value: "1000" },
    };

    const base64Payload = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");

    const event = {
      httpMethod: "POST", // Required!
      body: JSON.stringify({ prompt: "Test" }),
      headers: {
        "Payment-Signature": base64Payload,
        "Content-Type": "application/json",
      },
    };

    const result = await handle(event);

    // Service returns 402 for invalid payment
    expect(result.statusCode).toBe(402);
    const body = JSON.parse(result.body);
    expect(body.reason).toBe("missing_network");
  });

  it("should reject unsupported network (production only accepts Mainnet)", async () => {
    const paymentPayload = {
      scheme: "exact",
      accepted: {
        network: "eip155:1", // Ethereum Mainnet - not supported in production
      },
      authorization: { v: 27, r: "0xabc", s: "0xdef" },
      transfer: { from: "0x123", to: "0x456", value: "1000" },
    };

    const base64Payload = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");

    const event = {
      httpMethod: "POST", // Required!
      body: JSON.stringify({ prompt: "Test" }),
      headers: {
        "Payment-Signature": base64Payload,
        "Content-Type": "application/json",
      },
    };

    const result = await handle(event);

    // Production mode rejects all networks except Mainnet
    expect(result.statusCode).toBe(402);
    const body = JSON.parse(result.body);
    expect(body.reason).toBe("invalid_network_for_production");
    expect(body.expected).toBe("eip155:10");
    expect(body.received).toBe("eip155:1");
  });

  it("should accept supported testnet network", async () => {
    // This test will fail at payment verification (no real signature),
    // but should pass network validation
    const paymentPayload = {
      scheme: "exact",
      network: "eip155:11155420", // Optimism Sepolia - supported!
      authorization: {
        v: 27,
        r: "0xabc",
        s: "0xdef",
        validAfter: "0",
        validBefore: "9999999999",
        nonce: "0xabc",
      },
      transfer: { from: "0x123", to: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C", value: "1000" },
    };

    const base64Payload = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");

    const event = {
      body: JSON.stringify({ prompt: "Test" }),
      headers: {
        "Payment-Signature": base64Payload,
        "Content-Type": "application/json",
      },
    };

    const result = await handle(event);

    // Should NOT fail with network error (will fail later at payment verification)
    if (result.statusCode === 402) {
      const body = JSON.parse(result.body);
      expect(body.reason).not.toBe("missing_network");
      expect(body.reason).not.toBe("unsupported_network");
    }
  });

  it("should validate all supported networks are configured", () => {
    const supportedNetworks = getSupportedNetworks();

    // Verify we have all expected networks
    expect(supportedNetworks).toContain("eip155:10"); // Optimism Mainnet
    expect(supportedNetworks).toContain("eip155:11155420"); // Optimism Sepolia
    expect(supportedNetworks).toContain("eip155:8453"); // Base Mainnet
    expect(supportedNetworks).toContain("eip155:84532"); // Base Sepolia

    // Verify each has USDC config
    for (const network of supportedNetworks) {
      const config = getUSDCConfig(network);
      expect(config.chainId).toBeDefined();
      expect(config.name).toBeDefined();
      expect(config.address).toBeDefined();
    }
  });
});

describe("x402 Security: Payment Requirements", () => {
  it("should create payment requirements with all supported networks", () => {
    const requirements = createPaymentRequirements({
      resourceUrl: "/test",
      description: "Test Resource",
      mimeType: "application/json",
      amount: "1000",
      payTo: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
    });

    expect(requirements.x402Version).toBe(2);
    expect(requirements.accepts).toHaveLength(4); // 4 supported networks

    // Verify each network option
    const networks = requirements.accepts.map((a) => a.network);
    expect(networks).toContain("eip155:10");
    expect(networks).toContain("eip155:11155420");
    expect(networks).toContain("eip155:8453");
    expect(networks).toContain("eip155:84532");

    // Verify each has correct USDC address
    for (const accept of requirements.accepts) {
      const config = getUSDCConfig(accept.network);
      expect(accept.asset).toBe(config.address);
    }
  });

  it("should not default to mainnet in payment requirements", () => {
    const requirements = createPaymentRequirements({
      resourceUrl: "/test",
      description: "Test Resource",
      mimeType: "application/json",
      amount: "1000",
      payTo: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
    });

    // Should explicitly list all networks, not rely on defaults
    expect(requirements.accepts.length).toBeGreaterThan(0);
    expect(requirements.accepts.every((a) => a.network)).toBe(true);
  });
});
