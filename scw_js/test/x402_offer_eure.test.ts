/**
 * The EURe 402 wire contract, both schemes in one place.
 *
 * EURe differs from USDC/EURC in three ways that must each show up on the wire, or a buyer
 * cannot pay at all: it settles through Permit2 (so its entry carries
 * `extra.assetTransferMethod: "permit2"` — the SDK client routes on
 * `extra?.assetTransferMethod ?? "eip3009"`, and EURe has no EIP-3009), a fresh wallet needs
 * the EIP-2612 permit (so the challenge advertises `eip2612GasSponsoring`), and its price is
 * in 18 decimals. The last test proves the offer end to end: a real @x402/evm buyer scheme
 * turns this exact entry into the permit2 payload the facilitator verifies.
 *
 * The batch-settlement scheme here is a fake whose `enhancePaymentRequirements` mirrors the
 * real @x402/evm 2.28 one (`{ ...base, extra: { ...base.extra, receiverAuthorizer,
 * withdrawDelay, minDeposit } }` — verified against the installed SDK's source): the real
 * scheme needs S3 channel storage and a receiver-authorizer key, and what it contributes to
 * this contract is precisely that spread — every `base.extra` key survives enhancement.
 */
import { describe, expect, it } from "vitest";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { EURE_ADDRESSES } from "@fretchen/chain-utils";
import {
  createBatchSettlementPaymentRequirements,
  createPaymentRequirements,
} from "../x402_server.js";

const BASE = "eip155:8453" as const;
const PAY_TO = "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C" as `0x${string}`;
// The same nominal price per token, each in its own atomic units — EURe's is 18 decimals.
const PRICE = { USDC: "1001", EURC: "850", EURe: "850000000000000" };
const EURE = EURE_ADDRESSES[BASE];

/** A scheme shaped like @x402/evm's BatchSettlementEvmScheme for the enhance call only. */
const fakeBatchScheme = {
  enhancePaymentRequirements: async (base: Record<string, unknown>) => ({
    ...base,
    extra: {
      ...(base.extra as Record<string, unknown>),
      receiverAuthorizer: "0x073f26bd42d8ac19a3b4f95e2d2b1f4e576b8a12",
      withdrawDelay: 86400,
      minDeposit: "0",
    },
  }),
} as unknown as Parameters<typeof createBatchSettlementPaymentRequirements>[0]["scheme"];

describe("EURe offers — the wire contract both schemes must meet", () => {
  describe("exact scheme", () => {
    it("lists EURe first on Base with its own price, address and Permit2 method", () => {
      const { accepts, extensions } = createPaymentRequirements({
        resourceUrl: "/test",
        description: "Test",
        mimeType: "application/json",
        price: PRICE,
        payTo: PAY_TO,
        networks: [BASE],
      });

      expect(accepts).toHaveLength(3);
      expect(accepts[0]).toMatchObject({
        asset: EURE,
        amount: "850000000000000",
        extra: { name: "Monerium EURe", version: "1", assetTransferMethod: "permit2" },
      });
      expect(extensions).toEqual({ eip2612GasSponsoring: {} });
    });

    it("offers plain USDC on Optimism, with no Permit2 entry and no extension", () => {
      const { accepts, extensions } = createPaymentRequirements({
        resourceUrl: "/test",
        description: "Test",
        mimeType: "application/json",
        price: PRICE,
        payTo: PAY_TO,
        networks: ["eip155:10"],
      });

      expect(accepts).toHaveLength(1);
      expect(accepts[0].extra).toEqual({ name: "USD Coin", version: "2" });
      expect(extensions).toBeUndefined();
    });
  });

  describe("batch-settlement scheme", () => {
    it("keeps assetTransferMethod through enhancePaymentRequirements", async () => {
      const { accepts, extensions } = await createBatchSettlementPaymentRequirements({
        resourceUrl: "/test",
        description: "Test",
        mimeType: "application/json",
        price: PRICE,
        payTo: PAY_TO,
        scheme: fakeBatchScheme,
        networks: [BASE],
      });

      expect(accepts).toHaveLength(3);
      const eure = accepts.find((a) => (a as { asset?: string }).asset === EURE) as {
        extra: Record<string, unknown>;
      };
      // The enhanced entry carries the scheme's own keys AND the buyer's Permit2 routing.
      expect(eure.extra).toMatchObject({
        name: "Monerium EURe",
        version: "1",
        assetTransferMethod: "permit2",
        receiverAuthorizer: "0x073f26bd42d8ac19a3b4f95e2d2b1f4e576b8a12",
        withdrawDelay: 86400,
      });
      expect(extensions).toEqual({ eip2612GasSponsoring: {} });
    });
  });

  describe("a real SDK buyer can pay the EURe offer", () => {
    it("turns the exact-scheme EURe entry into a permit2 payload with an EIP-2612 permit", async () => {
      const { accepts, extensions } = createPaymentRequirements({
        resourceUrl: "/test",
        description: "Test",
        mimeType: "application/json",
        price: PRICE,
        payTo: PAY_TO,
        networks: [BASE],
      });
      const eureRequirement = accepts.find((a) => a.asset === EURE) as unknown as Parameters<
        InstanceType<typeof import("@x402/evm/exact/client").ExactEvmScheme>["createPaymentPayload"]
      >[1];

      // A fresh wallet: no Permit2 allowance, permit nonce 0 — so the scheme must sign the
      // EIP-2612 permit for Permit2 (the extension the challenge advertises).
      const account = privateKeyToAccount(generatePrivateKey());
      const signer = {
        address: account.address,
        signTypedData: (msg: Parameters<typeof account.signTypedData>[0]) =>
          account.signTypedData(msg),
        readContract: async ({ functionName }: { functionName: string }) => {
          if (functionName === "allowance" || functionName === "nonces") {
            return 0n;
          }
          throw new Error(`offer test: unexpected client read ${functionName}`);
        },
      };
      const { ExactEvmScheme } = await import("@x402/evm/exact/client");
      const scheme = new ExactEvmScheme(signer as never);

      const payload = (await scheme.createPaymentPayload(2, eureRequirement, {
        extensions: extensions as Record<string, never>,
      })) as unknown as {
        payload: { permit2Authorization: Record<string, unknown> };
        extensions?: Record<string, { info?: Record<string, unknown> }>;
      };

      // The payload is Permit2-shaped and pays exactly what the offer asked, to the seller.
      const auth = payload.payload.permit2Authorization as {
        from: string;
        permitted: { token: string; amount: string };
        witness: { to: string };
      };
      expect(auth.from).toBe(account.address);
      expect(auth.permitted.token.toLowerCase()).toBe(EURE.toLowerCase());
      expect(auth.permitted.amount).toBe("850000000000000");
      expect(auth.witness.to.toLowerCase()).toBe(PAY_TO.toLowerCase());
      // Gas sponsoring: the buyer signed the EIP-2612 permit, so it needs no approve() tx.
      expect(payload.extensions?.eip2612GasSponsoring?.info).toMatchObject({
        from: account.address,
        asset: EURE,
      });
    });
  });
});
