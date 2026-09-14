/**
 * Wallet-signature auth, both halves.
 *
 * A client signs `"<prefix>:<unix-seconds>"` with its wallet and sends
 * `Authorization: Bearer <base64 {address, signature, message}>`; a service
 * decodes that, checks the timestamp is fresh and the recovered signer is who
 * it expects. The `prefix` scopes a token to one service, so a token minted
 * for the growth API cannot be replayed against another.
 *
 * Signing and verification live together because they are one wire format:
 * changing the message shape or the freshness window on one side silently
 * breaks the other.
 *
 * Clients: `website/hooks/useWalletAuth.ts`.
 * Services: `scw_js/growth_service.ts`, `analytics/stats.ts`.
 */
import { verifyMessage } from "viem";

/**
 * Declared rather than pulled in via `@types/node`, matching `env-utils.ts` —
 * and `atob` rather than `Buffer` because this package is consumed by the
 * browser too, where `Buffer` does not exist.
 */
declare const atob: (data: string) => string;

/** Maximum age of a wallet-signed auth token in milliseconds (5 minutes). */
export const AUTH_TOKEN_MAX_AGE_MS = 5 * 60 * 1000;

export interface BearerPayload {
  address: `0x${string}`;
  signature: string;
  message: string;
}

/**
 * Build the message a wallet should sign for authentication.
 * Format: "<prefix>:<unix-seconds>"
 */
export function buildAuthMessage(prefix: string): string {
  return `${prefix}:${Math.floor(Date.now() / 1000)}`;
}

/**
 * Parses a `Bearer <base64>` Authorization header into its decoded payload.
 * Returns null if the header is missing, malformed, or fails JSON parsing.
 *
 * `atob` yields a binary string, so a payload containing non-ASCII would
 * decode wrong — harmlessly, since a mangled message cannot then satisfy
 * `verifySignedMessage`'s prefix check or verify against its signature. Every
 * real token is ASCII: hex address, hex signature, `<prefix>:<digits>`.
 */
export function parseBearerToken(authHeader: string | undefined): BearerPayload | null {
  if (!authHeader) {
    return null;
  }
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return null;
  }
  try {
    const decoded = JSON.parse(atob(match[1])) as BearerPayload;
    const { address, signature, message } = decoded;
    if (
      typeof address === "string" &&
      address.startsWith("0x") &&
      typeof signature === "string" &&
      signature.startsWith("0x") &&
      typeof message === "string" &&
      message.length > 0
    ) {
      return { address, signature, message };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Splits the `OWNER_ETH_ADDRESS` environment value into the addresses it authorises.
 *
 * The variable keeps its singular name and accepts either one address or a comma-separated list,
 * so an existing single-address deployment stays valid and code can be rolled out before the
 * configuration is touched.
 *
 * Shared rather than duplicated in each consumer because a stray space around a comma locks the
 * owner *out* silently — there is no error to notice, only a 401 that looks like a wallet problem.
 */
export function parseOwnerAddresses(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/**
 * Verifies a parsed wallet signature payload against an expected message prefix and the addresses
 * allowed to pass it. Returns null on success, or an error string describing the failure.
 *
 * Checks (in order): message format, timestamp freshness, address match, signature validity.
 * The timestamp check is what stops a captured token being replayed indefinitely.
 *
 * `expectedAddresses` accepts a single address or a list. **An empty list authorises nobody** —
 * the opposite reading ("no restriction configured, so allow everything") is the expensive
 * mistake here, so callers can pass an unvalidated `parseOwnerAddresses(...)` result safely.
 */
export async function verifySignedMessage(
  address: string,
  signature: string,
  message: string,
  expectedPrefix: string,
  expectedAddresses: string | readonly string[]
): Promise<string | null> {
  const match = message.match(new RegExp(`^${expectedPrefix}:(\\d+)$`));
  if (!match) {
    return "Unauthorized";
  }

  const ts = parseInt(match[1], 10);
  if (ts > 9_999_999_999) {
    return "Unauthorized";
  } // guard against year >2286 / integer overflow
  if (Math.abs(Date.now() - ts * 1000) > AUTH_TOKEN_MAX_AGE_MS) {
    return "Token expired";
  }

  const allowed = typeof expectedAddresses === "string" ? [expectedAddresses] : expectedAddresses;
  const signer = address.toLowerCase();
  if (!allowed.some((candidate) => candidate.toLowerCase() === signer)) {
    return "Address mismatch";
  }

  try {
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    if (!isValid) {
      return "Invalid signature";
    }
  } catch {
    return "Invalid signature";
  }

  return null;
}
