/** Maximum age of a wallet-signed auth token in milliseconds (5 minutes). */
export const AUTH_TOKEN_MAX_AGE_MS = 5 * 60 * 1000;

/**
 * Build the message a wallet should sign for authentication.
 * Format: "<prefix>:<unix-seconds>"
 *
 * Server-side: verified by scw_js/auth_utils.ts verifySignedMessage()
 * Client-side: built by website/hooks/useWalletAuth.ts
 */
export function buildAuthMessage(prefix: string): string {
  return `${prefix}:${Math.floor(Date.now() / 1000)}`;
}
