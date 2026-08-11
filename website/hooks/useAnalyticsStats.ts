import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useWalletAuth } from "./useWalletAuth";
import { ANALYTICS_URL } from "../utils/analyticsApi";
import type { Stats } from "../types/analytics";

/** Wakes the function up while the owner is still deciding on a range. */
export function prewarmAnalyticsApi(): void {
  fetch(`${ANALYTICS_URL}/stats`, { method: "OPTIONS" }).catch(() => {});
}

/**
 * One query for the whole year — the range selector is a display concern and
 * never refetches.
 *
 * `staleTime` overrides the 60s global default in `pages/+config.ts`: a refetch
 * would need a fresh signature once `useWalletAuth`'s 4-minute token cache has
 * lapsed, so a short window means switching ranges could re-prompt the wallet.
 */
export function useAnalyticsStats(enabled: boolean) {
  const { address } = useAccount();
  const getAuth = useWalletAuth("analytics-api");

  return useQuery<Stats>({
    queryKey: ["analyticsStats", address],
    queryFn: async () => {
      const auth = await getAuth();
      const res = await fetch(`${ANALYTICS_URL}/stats`, {
        headers: { Authorization: auth },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Stats request failed (${res.status})`);
      }
      return res.json() as Promise<Stats>;
    },
    enabled: enabled && !!address,
    staleTime: 5 * 60_000,
  });
}
