/**
 * EIP-3009 `transferWithAuthorization` — shared typed-data + signature helpers.
 *
 * Canonical shape verified against:
 * - @x402/evm SDK: src/exact/client/eip3009.ts (signEIP3009Authorization — domain/types/message)
 *   and src/exact/facilitator/eip3009-utils.ts (parsedSig.v ?? parsedSig.yParity — v handling)
 * - x402_facilitator/x402_splitter_verify.js (server-side verifyTypedData call, same repo)
 * - x402_facilitator/test/eip712_reference.test.js (EIP-712 hash vectors)
 *
 * Used by any caller that signs or verifies a `transferWithAuthorization` payload directly
 * (USDC, EURC, or any other EIP-3009 token) — e.g. SupportV2.donateToken, EIP3009SplitterV1.
 */

import type { Address, Hex, Signature } from "viem";
import { parseSignature, toHex } from "viem";
import type { USDCConfig } from "./addresses";

/** EIP-712 type definition for TransferWithAuthorization — do not reorder fields. */
export const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

export interface TransferWithAuthorizationMessage {
  from: Address;
  to: Address;
  value: bigint;
  validAfter: bigint;
  validBefore: bigint;
  nonce: Hex;
}

/**
 * Build the EIP-712 domain + types + message for a `transferWithAuthorization` signature.
 * Pass the result straight to a viem `signTypedData` (or `verifyTypedData`) call.
 *
 * @param usdcConfig From `getUSDCConfig(network)` — supplies domain name/version/chainId/address.
 */
export function buildTransferWithAuthorizationTypedData(usdcConfig: USDCConfig, message: TransferWithAuthorizationMessage) {
  return {
    domain: {
      name: usdcConfig.usdcName,
      version: usdcConfig.usdcVersion,
      chainId: usdcConfig.chainId,
      verifyingContract: usdcConfig.address,
    },
    types: TRANSFER_WITH_AUTHORIZATION_TYPES,
    primaryType: "TransferWithAuthorization" as const,
    message,
  };
}

/**
 * Generate a fresh random 32-byte nonce for a `transferWithAuthorization` authorization.
 * @dev Same construction as @x402/evm's own `createNonce()` (src/utils.ts).
 */
export function randomAuthorizationNonce(): Hex {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

/**
 * Split a signature into the `(v, r, s)` triple the EIP-3009 `transferWithAuthorization`
 * ABI overload expects.
 *
 * @dev Mirrors @x402/evm's own facilitator-side handling exactly (`parsedSig.v ?? parsedSig.yParity`
 * in src/exact/facilitator/eip3009-utils.ts): a standard 65-byte ECDSA signature — what
 * `signTypedData` / `eth_signTypedData_v4` always returns for an EOA wallet — carries `v` as
 * 27/28 via viem's `parseSignature`, so the `yParity` fallback only matters for signature forms
 * this call path never produces (e.g. EIP-2098 compact 64-byte signatures). Deliberately not
 * renormalizing yParity -> 27/28 here so this stays byte-for-byte compatible with the SDK.
 */
export function splitAuthorizationSignature(signature: Hex): { v: number; r: Hex; s: Hex } {
  const parsed: Signature = parseSignature(signature);
  const v = parsed.v !== undefined ? Number(parsed.v) : Number(parsed.yParity);
  return { v, r: parsed.r, s: parsed.s };
}
