import { verifyMessage } from "viem";

const MAX_AUTH_AGE_MS = 5 * 60 * 1000;

export interface BearerPayload {
  address: string;
  signature: string;
  message: string;
}

/**
 * Parses a `Bearer <base64>` Authorization header into its decoded payload.
 * Returns null if the header is missing, malformed, or fails JSON parsing.
 */
export function parseBearerToken(authHeader: string | undefined): BearerPayload | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
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
 * Verifies a parsed wallet signature payload against an expected message prefix and address.
 * Returns null on success, or an error string describing the failure.
 *
 * Checks (in order): message format, timestamp freshness, address match, signature validity.
 */
export async function verifySignedMessage(
  address: string,
  signature: string,
  message: string,
  expectedPrefix: string,
  expectedAddress: string,
): Promise<string | null> {
  const match = message.match(new RegExp(`^${expectedPrefix}:(\\d+)$`));
  if (!match) return "Unauthorized";

  const ts = parseInt(match[1], 10);
  if (ts > 9_999_999_999) return "Unauthorized"; // guard against year >2286 / integer overflow
  if (Math.abs(Date.now() - ts * 1000) > MAX_AUTH_AGE_MS) return "Token expired";

  if (address.toLowerCase() !== expectedAddress.toLowerCase()) return "Address mismatch";

  try {
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    if (!isValid) return "Invalid signature";
  } catch {
    return "Invalid signature";
  }

  return null;
}
