/**
 * INTEGRATION test for EURe via Permit2 (Base Sepolia, live RPC).
 *
 * Signs a real Permit2 + EIP-2612 EURe payment with the SDK's buyer client, from a fresh unfunded
 * key, and runs it through the facilitator's verify path in-process. The SDK simulates the
 * proxy's settleWithPermit against the live chain, so reaching `permit2_insufficient_balance`
 * proves the wiring the hermetic tests can only model: the EURe sandbox token is a contract, the
 * x402 Permit2 proxy is deployed there, and the Permit2 witness signature is accepted. Only the
 * empty balance stops it. No funds move: verify is read-only.
 *
 * The proxy swallows a failing permit(), so the verify result cannot tell a wrong EURe domain
 * from a right one. The second test closes that gap by simulating the buyer's permit() directly
 * against the live token: it succeeds only if "Monerium EURe" / "1" is the token's real domain.
 *
 * Network-dependent, so it lives in the integration suite: `npm run test:integration`.
 */
import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { createPublicClient, http, parseSignature, type Address, type Hex } from "viem";
import { baseSepolia } from "viem/chains";
import { PERMIT2_ADDRESS } from "@x402/evm";
import { verifyPayment } from "../../x402_verify.js";
import { resetFacilitator } from "../../facilitator_instance.js";
import { getRpcUrl } from "../../chain_utils.js";
import { signPermit2Payment } from "../helpers/signPayment";

const NETWORK = "eip155:84532";

const PERMIT_ABI = [
  {
    type: "function",
    name: "permit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;

describe("x402 exact — EURe via Permit2 (integration, live RPC)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetFacilitator();
    process.env.FACILITATOR_WALLET_PRIVATE_KEY =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("verify reaches the balance check for a fresh EURe payer on Base Sepolia", async () => {
    const { payload, requirements, payer } = await signPermit2Payment({ network: NETWORK });

    const result = await verifyPayment(payload, requirements);

    expect(result).toMatchObject({
      isValid: false,
      invalidReason: "permit2_insufficient_balance",
      payer,
    });
  });

  test("the buyer's EIP-2612 permit is valid against the live EURe domain", async () => {
    const { payload, token } = await signPermit2Payment({ network: NETWORK });
    const { info } = payload.extensions?.eip2612GasSponsoring as {
      info: { from: Address; amount: string; deadline: string; signature: Hex };
    };
    const { r, s, v } = parseSignature(info.signature);

    const client = createPublicClient({ chain: baseSepolia, transport: http(getRpcUrl(NETWORK)) });
    // Reverts ("invalid signature") unless name, version, chain and nonce match the token's own.
    await expect(
      client.simulateContract({
        address: token,
        abi: PERMIT_ABI,
        functionName: "permit",
        args: [
          info.from,
          PERMIT2_ADDRESS,
          BigInt(info.amount),
          BigInt(info.deadline),
          Number(v),
          r,
          s,
        ],
        account: info.from,
      }),
    ).resolves.toBeDefined();
  });
});
