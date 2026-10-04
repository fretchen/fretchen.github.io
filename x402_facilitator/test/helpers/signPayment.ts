/**
 * Builds REAL, correctly signed x402 v2 exact payments for tests: EIP-3009 (USDC/EURC) and
 * Permit2 (EURe).
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
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { EURE_ADDRESSES, getChainConfig } from "../../chain_utils";

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

export interface Permit2SignOptions {
  network?: string;
  amount?: bigint;
  payTo?: Address;
  /** Attach an EIP-2612 permit to Permit2 (eip2612GasSponsoring), so no prior approve() is needed. */
  gasSponsoring?: boolean;
  /** The EIP-712 domain the EIP-2612 permit is signed for. Defaults to the real EURe domain. */
  permitDomain?: { name: string; version: string };
  /** Edit the payment requirements before the client signs, to model a buyer signing other terms. */
  signRequirements?: (requirements: Record<string, unknown>) => Record<string, unknown>;
}

/** The EURe EIP-712 domain, read on-chain on Base and Base Sepolia (2026-10-04). */
export const EURE_DOMAIN = { name: "Monerium EURe", version: "1" } as const;

/**
 * Builds a REAL x402 v2 exact Permit2 payment — the only way EURe (no EIP-3009) can be paid —
 * with the SDK's own client scheme, so the test exercises the wire format a real buyer sends
 * rather than a hand-rolled copy of it.
 *
 * With `gasSponsoring` the client also signs an EIP-2612 permit for Permit2 and carries it in
 * `extensions.eip2612GasSponsoring`; the buyer then needs no separate approve() transaction.
 * The client only does this when the 402 advertises the extension and the payer's Permit2
 * allowance is short — its two chain reads (`allowance`, `nonces`) are answered here as a
 * fresh wallet would: no allowance, permit nonce 0.
 */
export async function signPermit2Payment({
  network = "eip155:8453",
  amount = 100_000_000_000_000_000n, // 0.1 EURe
  payTo = SELLER,
  gasSponsoring = true,
  permitDomain = EURE_DOMAIN,
  signRequirements = (r) => r,
}: Permit2SignOptions = {}) {
  const token =
    EURE_ADDRESSES[network] ??
    // EURe is not deployed here (e.g. Optimism): reuse the Base address to model a payment
    // naming a token the facilitator must refuse on this network.
    EURE_ADDRESSES["eip155:8453"];
  const account = privateKeyToAccount(generatePrivateKey());

  const requirements = {
    scheme: "exact",
    network,
    amount: amount.toString(),
    asset: token,
    payTo,
    maxTimeoutSeconds: 300,
    extra: { ...permitDomain, assetTransferMethod: "permit2" },
  };

  const client = new ExactEvmScheme({
    address: account.address,
    signTypedData: (msg) => account.signTypedData(msg),
    readContract: async ({ functionName }: { functionName: string }) => {
      if (functionName === "allowance" || functionName === "nonces") {
        return 0n;
      }
      throw new Error(`signPermit2Payment: unexpected client read ${functionName}`);
    },
  });

  const signed = await client.createPaymentPayload(
    2,
    signRequirements(requirements) as unknown as Parameters<typeof client.createPaymentPayload>[1],
    gasSponsoring ? { extensions: { eip2612GasSponsoring: {} } } : undefined,
  );

  const payload = {
    x402Version: 2,
    resource: { url: "https://api.example.com/test", description: "test", mimeType: "text/plain" },
    accepted: requirements,
    payload: signed.payload,
    ...(signed.extensions && { extensions: signed.extensions }),
  };

  return { payer: account.address, token, payload, requirements };
}
