import { useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { buildAuthMessage } from "@fretchen/chain-utils";

const AUTH_CACHE_TTL_MS = 4 * 60 * 1000; // 4 minutes (backend allows 5 min)

// Module-level caches shared across all hook instances and all message prefixes.
// Key format: `${messagePrefix}:${address}` — prevents cross-service token reuse.
const authCacheMap = new Map<string, { token: string; timestamp: number }>();
const pendingAuthMap = new Map<string, Promise<string>>();

export function clearAuthCacheForTesting() {
  authCacheMap.clear();
  pendingAuthMap.clear();
}

async function buildToken(
  address: string,
  messagePrefix: string,
  signMessageAsync: (args: { message: string }) => Promise<string>,
): Promise<string> {
  const message = buildAuthMessage(messagePrefix);
  const signature = await signMessageAsync({ message });
  const payload = JSON.stringify({ address, signature, message });
  return `Bearer ${btoa(payload)}`;
}

async function getOrCreateToken(
  address: string,
  messagePrefix: string,
  signMessageAsync: (args: { message: string }) => Promise<string>,
): Promise<string> {
  const cacheKey = `${messagePrefix}:${address}`;
  const cached = authCacheMap.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < AUTH_CACHE_TTL_MS) return cached.token;

  const pending = pendingAuthMap.get(cacheKey);
  if (pending) return pending;

  const promise = buildToken(address, messagePrefix, signMessageAsync)
    .then((token) => {
      authCacheMap.set(cacheKey, { token, timestamp: Date.now() });
      pendingAuthMap.delete(cacheKey);
      return token;
    })
    .catch((err: unknown) => {
      pendingAuthMap.delete(cacheKey);
      throw err;
    });

  pendingAuthMap.set(cacheKey, promise);
  return promise;
}

/**
 * Returns a stable `getAuth()` callback that signs and caches a wallet Bearer token
 * for the given `messagePrefix`. Multiple callers with the same prefix+address share
 * the cache, preventing duplicate signature prompts.
 */
export function useWalletAuth(messagePrefix: string) {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  return useCallback(async () => {
    if (!address) throw new Error("Wallet not connected");
    return getOrCreateToken(address, messagePrefix, signMessageAsync);
  }, [address, messagePrefix, signMessageAsync]);
}
