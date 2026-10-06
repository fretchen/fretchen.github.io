/**
 * Builds a REAL, correctly signed x402 v2 exact (EIP-3009) payment for tests.
 *
 * Overrides are applied to the authorization BEFORE it is signed, so an expired or
 * wrong-amount payment still carries a valid signature and reaches the check it is meant to
 * exercise. (Mutating a pre-signed fixture instead breaks the signature first, and every
 * test then asserts `invalid_exact_evm_signature` whatever it claims to test.)
 *
 * The payer is a fresh random key per call — never the well-known Hardhat key, which has a
 * stray EIP-7702 delegation on public testnets and would take the ERC-1271 path.
 */

import { randomBytes } from "node:crypto";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { getChainConfig } from "../../chain_utils";

type Address = `0x${string}`;

export const SELLER: Address = "0x209693Bc6afc0C5328bA36FaF03C514EF312287C";

const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

export interface AuthorizationOverrides {
  to?: Address;
  value?: bigint;
  validAfter?: bigint;
  validBefore?: bigint;
  nonce?: `0x${string}`;
}

export interface SignOptions {
  network?: string;
  amount?: bigint;
  payTo?: Address;
  /** Fields to sign that differ from what the requirements ask for. */
  authorization?: AuthorizationOverrides;
}

export async function signExactPayment({
  network = "eip155:11155420",
  amount = 100_000n,
  payTo = SELLER,
  authorization = {},
}: SignOptions = {}) {
  const cfg = getChainConfig(network);
  const token = cfg.USDC_ADDRESS as Address;
  const payer = privateKeyToAccount(generatePrivateKey());
  const now = BigInt(Math.floor(Date.now() / 1000));

  const message = {
    from: payer.address,
    to: authorization.to ?? payTo,
    value: authorization.value ?? amount,
    validAfter: authorization.validAfter ?? now - 600n,
    validBefore: authorization.validBefore ?? now + 300n,
    nonce: authorization.nonce ?? `0x${randomBytes(32).toString("hex")}`,
  };

  const signature = await payer.signTypedData({
    domain: { name: cfg.USDC_NAME, version: "2", chainId: cfg.chain.id, verifyingContract: token },
    types: TRANSFER_WITH_AUTHORIZATION_TYPES,
    primaryType: "TransferWithAuthorization",
    message,
  });

  const requirements = {
    scheme: "exact",
    network,
    amount: amount.toString(),
    asset: token,
    payTo,
    maxTimeoutSeconds: 300,
    extra: { name: cfg.USDC_NAME, version: "2" },
  };

  const payload = {
    x402Version: 2,
    resource: { url: "https://api.example.com/test", description: "test", mimeType: "text/plain" },
    accepted: requirements,
    payload: {
      signature,
      authorization: {
        from: message.from,
        to: message.to,
        value: message.value.toString(),
        validAfter: message.validAfter.toString(),
        validBefore: message.validBefore.toString(),
        nonce: message.nonce,
      },
    },
  };

  return {
    payer: payer.address,
    token,
    name: cfg.USDC_NAME,
    payload,
    requirements,
    nonce: message.nonce,
  };
}
