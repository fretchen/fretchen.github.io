import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useWalletAuth } from "./useWalletAuth";
import type { Stats } from "../types/analytics";

/**
 * Scaleway mints one URL per function, so this is NOT the URL
 * `utils/hitTracker.ts` posts to — that one belongs to the `hit` function.
 * Get this one from `npm run info` in `analytics/` after deploying.
 *
 * The fallback is what production actually uses: `.github/workflows/pages.yml`
 * sets no `PUBLIC_ENV__*` variables, so the env var is a local-dev override
 * only (point it at `npm run dev:stats` on localhost:8087).
 */
const API_BASE =
  (import.meta.env.PUBLIC_ENV__ANALYTICS_STATS_URL as string | undefined) ??
  "https://analyticsserviceebp8thpt-stats.functions.fnc.fr-par.scw.cloud";

/** Wakes the function up while the owner is still deciding on a range. */
export function prewarmAnalyticsApi(): void {
  fetch(`${API_BASE}/stats`, { method: "OPTIONS" }).catch(() => {});
}

export function useAnalyticsStats(enabled: boolean, days: number) {
  const { address } = useAccount();
  const getAuth = useWalletAuth("analytics-api");

  return useQuery<Stats>({
    queryKey: ["analyticsStats", address, days],
    queryFn: async () => {
      const auth = await getAuth();
      const res = await fetch(`${API_BASE}/stats?days=${days}`, {
        headers: { Authorization: auth },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Stats request failed (${res.status})`);
      }
      return res.json() as Promise<Stats>;
    },
    enabled: enabled && !!address,
  });
}
