/**
 * classifyBatchSettlement — which batch-settlement payloads pay out, to whom, in what,
 * and which are refused. A pure function, so this is a table with no mocks.
 *
 * These are the security rules of the batch path: the fee follows what the SDK will
 * EXECUTE (the payload's shape), never a label or `requirements.payTo`; one batch pays one
 * seller in one token; a refund's claims must belong to the channel verify() vouches for.
 * How settlePayment acts on each route (gate, settle, charge) is in x402_settle.test.ts.
 */
import { describe, it, expect } from "vitest";
import { classifyBatchSettlement, type BatchRoute } from "../x402_settle.js";
import {
  claim,
  claimCommand,
  settleCommand,
  settleCommandWithoutReceiver,
  refund,
  deposit,
  SELLER,
  OTHER_SELLER,
  BASE_SEPOLIA_USDC as USDC,
  BASE_SEPOLIA_EURC as EURC,
} from "./helpers/batchPayloads";

const MALFORMED: BatchRoute = {
  kind: "reject",
  errorReason: "invalid_batch_settlement_evm_payload_type",
};

const cases: [string, { payload: Record<string, unknown> }, BatchRoute][] = [
  // ─── claim / settle commands: charged to the payload's receiver, in its token ───
  [
    "claim → charged to the channel's receiver",
    claimCommand(),
    { kind: "command", feeRecipient: SELLER, feeToken: USDC },
  ],
  [
    "EURC claim → charged in EURC",
    claimCommand([claim(SELLER, EURC)]),
    { kind: "command", feeRecipient: SELLER, feeToken: EURC },
  ],
  [
    "one seller in mixed checksum casing → still one seller",
    claimCommand([claim(SELLER), claim(SELLER.toLowerCase())]),
    { kind: "command", feeRecipient: SELLER, feeToken: USDC },
  ],
  [
    "settle → charged to payload.receiver in payload.token",
    settleCommand({ receiver: OTHER_SELLER, token: EURC }),
    { kind: "command", feeRecipient: OTHER_SELLER, feeToken: EURC },
  ],
  [
    "claim spanning two sellers → refused",
    claimCommand([claim(SELLER), claim(OTHER_SELLER)]),
    MALFORMED,
  ],
  [
    "claim mixing tokens → refused",
    claimCommand([claim(SELLER, USDC), claim(SELLER, EURC)]),
    MALFORMED,
  ],
  ["claim whose channel names no token → refused", claimCommand([claim(SELLER, null)]), MALFORMED],
  ["claim with no claims → refused", claimCommand([]), MALFORMED],
  // The SDK's guard is shape-only ("claims" in payload), so this reaches classification.
  ["claim whose claims are not an array → refused", claimCommand({}), MALFORMED],
  ["settle without a receiver → refused", settleCommandWithoutReceiver(), MALFORMED],

  // ─── refunds: the fee follows the claims, not the "refund" label ───
  [
    "refund carrying claims → gated and charged like a claim",
    refund([claim(SELLER)]),
    { kind: "claiming-refund", feeRecipient: SELLER, feeToken: USDC },
  ],
  ["refund without claims → free", refund([]), { kind: "free" }],
  [
    "refund whose claims pay another receiver → refused",
    refund([claim(OTHER_SELLER)]),
    { kind: "reject", errorReason: "invalid_batch_settlement_evm_receiver_mismatch" },
  ],
  [
    "refund whose claims are in another token → refused",
    refund([claim(SELLER, EURC)]),
    { kind: "reject", errorReason: "invalid_batch_settlement_evm_token_mismatch" },
  ],
  ["refund whose claims are not an array → refused", refund({}), MALFORMED],
  [
    "refund whose claims span two sellers → refused",
    refund([claim(SELLER), claim(OTHER_SELLER)]),
    MALFORMED,
  ],

  // ─── everything else funds or signs a channel and pays no one ───
  ["deposit → free", deposit(), { kind: "free" }],
];

describe("classifyBatchSettlement", () => {
  it.each(cases)("%s", (_name, paymentPayload, expected) => {
    expect(classifyBatchSettlement(paymentPayload.payload)).toEqual(expected);
  });
});
