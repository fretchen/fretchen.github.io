import { useAccount } from "wagmi";
import { useIsMounted } from "./useIsMounted";

/**
 * The one safe way to read wallet connection status. False during SSR (this app
 * treats SSR as always-disconnected by design) and for the one client render
 * before wagmi's post-hydration reconnect effect resolves (wagmi.config.ts's
 * `ssr: true` moved that reconnect out of render and into an effect) — so
 * callers never flash a stale "disconnected" state for a previously-connected
 * wallet, and never trip a hydration mismatch.
 *
 * Prefer this over `useAccount().isConnected` everywhere; see
 * test/walletConnectionConvention.test.ts, which enforces that.
 */
export function useIsWalletConnected(): boolean {
  const { status } = useAccount();
  const hasMounted = useIsMounted();
  return hasMounted && status === "connected";
}
