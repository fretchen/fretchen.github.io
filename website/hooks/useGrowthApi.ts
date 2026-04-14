import { useCallback, useMemo, useRef } from "react";
import { useAccount, useSignMessage } from "wagmi";
import type { ContentQueue, Draft, Insights, Performance } from "../types/growth";

const API_BASE =
  import.meta.env.PUBLIC_ENV__GROWTH_API_URL ||
  "https://mypersonaljscloudivnad9dy-growthapi.functions.fnc.fr-par.scw.cloud";

const AUTH_CACHE_TTL_MS = 4 * 60 * 1000; // 4 minutes (backend allows 5 min)

async function createAuthHeader(
  address: string,
  signMessageAsync: (args: { message: string }) => Promise<string>,
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const message = `growth-api:${timestamp}`;
  const signature = await signMessageAsync({ message });
  const payload = JSON.stringify({ address, signature, message });
  return `Bearer ${btoa(payload)}`;
}

async function apiFetch<T>(path: string, auth: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
}

export interface UseGrowthApi {
  fetchDrafts: (status?: string) => Promise<ContentQueue>;
  fetchInsights: () => Promise<Insights>;
  fetchPerformance: () => Promise<Performance>;
  updateDraft: (id: string, body: Partial<Draft>) => Promise<Draft>;
  approveDraft: (id: string, scheduledAt?: string) => Promise<Draft>;
  rejectDraft: (id: string) => Promise<Draft>;
}

export function useGrowthApi(): UseGrowthApi {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const authCache = useRef<{ token: string; timestamp: number; address: string } | null>(null);
  const pendingAuth = useRef<Promise<string> | null>(null);

  const getAuth = useCallback(async () => {
    if (!address) throw new Error("Wallet not connected");

    const cached = authCache.current;
    if (cached && cached.address === address && Date.now() - cached.timestamp < AUTH_CACHE_TTL_MS) {
      return cached.token;
    }

    // If a signing request is already in flight, reuse it
    if (pendingAuth.current) {
      return pendingAuth.current;
    }

    const promise = createAuthHeader(address, signMessageAsync)
      .then((token) => {
        authCache.current = { token, timestamp: Date.now(), address };
        pendingAuth.current = null;
        return token;
      })
      .catch((err) => {
        pendingAuth.current = null;
        throw err;
      });

    pendingAuth.current = promise;
    return promise;
  }, [address, signMessageAsync]);

  const fetchDrafts = useCallback(
    async (status?: string) => {
      const auth = await getAuth();
      const query = status ? `?status=${encodeURIComponent(status)}` : "";
      return apiFetch<ContentQueue>(`drafts${query}`, auth);
    },
    [getAuth],
  );

  const fetchInsights = useCallback(async () => {
    const auth = await getAuth();
    return apiFetch<Insights>("insights", auth);
  }, [getAuth]);

  const fetchPerformance = useCallback(async () => {
    const auth = await getAuth();
    return apiFetch<Performance>("performance", auth);
  }, [getAuth]);

  const updateDraft = useCallback(
    async (id: string, body: Partial<Draft>) => {
      const auth = await getAuth();
      return apiFetch<Draft>(`drafts/${encodeURIComponent(id)}`, auth, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
    [getAuth],
  );

  const approveDraft = useCallback(
    async (id: string, scheduledAt?: string) => {
      const auth = await getAuth();
      return apiFetch<Draft>(`drafts/${encodeURIComponent(id)}/approve`, auth, {
        method: "POST",
        body: scheduledAt ? JSON.stringify({ scheduled_at: scheduledAt }) : undefined,
      });
    },
    [getAuth],
  );

  const rejectDraft = useCallback(
    async (id: string) => {
      const auth = await getAuth();
      return apiFetch<Draft>(`drafts/${encodeURIComponent(id)}/reject`, auth, {
        method: "POST",
      });
    },
    [getAuth],
  );

  return useMemo(
    () => ({ fetchDrafts, fetchInsights, fetchPerformance, updateDraft, approveDraft, rejectDraft }),
    [fetchDrafts, fetchInsights, fetchPerformance, updateDraft, approveDraft, rejectDraft],
  );
}
