/**
 * Owner-signature auth for the read endpoints. Writes (`POST /hit`) stay
 * anonymous — only `GET /stats` is gated.
 *
 * Copied from `scw_js/auth_utils.ts` rather than shared, matching how this
 * package already treats `getCorsHeaders`: the serverless packages duplicate
 * small HTTP shims instead of taking a cross-package dependency. This is the
 * second verifier — a third is the trigger to extract both functions into
 * `@fretchen/chain-utils`, which already hosts `buildAuthMessage` and
 * `AUTH_TOKEN_MAX_AGE_MS` on the signing side.
 */
import { verifyMessage } from "viem";

/** Matches `AUTH_TOKEN_MAX_AGE_MS` in `@fretchen/chain-utils`. */
const TOKEN_MAX_AGE_MS = 5 * 60 * 1000;

const MESSAGE_PREFIX = "analytics-api";

export interface BearerPayload {
  address: `0x${string}`;
  signature: string;
  message: string;
}

/**
 * Parses a `Bearer <base64>` Authorization header into its decoded payload.
 * Returns null if the header is missing, malformed, or fails JSON parsing.
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
    const decoded = JSON.parse(Buffer.from(match[1], "base64").toString("utf-8")) as BearerPayload;
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
 * Verifies a parsed payload against the configured owner address.
 * Returns null on success, or an error string describing the failure.
 *
 * Checks in order: message format, timestamp freshness, address match,
 * signature validity — the timestamp is what stops a captured token from
 * being replayed indefinitely.
 */
export async function verifyOwner(payload: BearerPayload): Promise<string | null> {
  const ownerAddress = process.env.OWNER_ETH_ADDRESS;
  if (!ownerAddress) {
    return "Owner address not configured";
  }

  const match = payload.message.match(new RegExp(`^${MESSAGE_PREFIX}:(\\d+)$`));
  if (!match) {
    return "Unauthorized";
  }

  const ts = parseInt(match[1], 10);
  if (ts > 9_999_999_999) {
    return "Unauthorized"; // guard against year >2286 / integer overflow
  }
  if (Math.abs(Date.now() - ts * 1000) > TOKEN_MAX_AGE_MS) {
    return "Token expired";
  }

  if (payload.address.toLowerCase() !== ownerAddress.toLowerCase()) {
    return "Address mismatch";
  }

  try {
    const isValid = await verifyMessage({
      address: payload.address,
      message: payload.message,
      signature: payload.signature as `0x${string}`,
    });
    return isValid ? null : "Invalid signature";
  } catch {
    return "Invalid signature";
  }
}
