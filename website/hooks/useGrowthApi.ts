import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, useSignMessage } from "wagmi";
import type { ContentQueue, Draft, Insights, Performance } from "../types/growth";

const API_BASE =
  (import.meta.env.PUBLIC_ENV__GROWTH_API_URL as string | undefined) ??
  "https://mypersonaljscloudivnad9dy-growthapi.functions.fnc.fr-par.scw.cloud";

const AUTH_CACHE_TTL_MS = 4 * 60 * 1000; // 4 minutes (backend allows 5 min)

// Module-level cache shared across all hook instances for the same address.
// This prevents multiple wallet signature prompts when different hooks (e.g.
// useGrowthDrafts + useApproveDraft) both call getAuth in the same session.
const authCacheMap = new Map<string, { token: string; timestamp: number }>();
const pendingAuthMap = new Map<string, Promise<string>>();

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

async function getOrCreateToken(
  address: string,
  signMessageAsync: (args: { message: string }) => Promise<string>,
): Promise<string> {
  const cached = authCacheMap.get(address);
  if (cached && Date.now() - cached.timestamp < AUTH_CACHE_TTL_MS) return cached.token;

  const pending = pendingAuthMap.get(address);
  if (pending) return pending;

  const promise = createAuthHeader(address, signMessageAsync)
    .then((token) => {
      authCacheMap.set(address, { token, timestamp: Date.now() });
      pendingAuthMap.delete(address);
      return token;
    })
    .catch((err) => {
      pendingAuthMap.delete(address);
      throw err;
    });

  pendingAuthMap.set(address, promise);
  return promise;
}

export function clearAuthCacheForTesting() {
  authCacheMap.clear();
  pendingAuthMap.clear();
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
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Thin wrapper: supplies current address + signMessageAsync to the shared module-level cache.
function useGrowthAuth() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  return useCallback(async () => {
    if (!address) throw new Error("Wallet not connected");
    return getOrCreateToken(address, signMessageAsync);
  }, [address, signMessageAsync]);
}

export function useGrowthDrafts(enabled: boolean) {
  const { address } = useAccount();
  const getAuth = useGrowthAuth();

  return useQuery<ContentQueue>({
    queryKey: ["growthDrafts", address],
    queryFn: async () => {
      const auth = await getAuth();
      return apiFetch<ContentQueue>("drafts", auth);
    },
    enabled,
  });
}

export function useGrowthInsights(enabled: boolean) {
  const { address } = useAccount();
  const getAuth = useGrowthAuth();

  return useQuery<Insights>({
    queryKey: ["growthInsights", address],
    queryFn: async () => {
      const auth = await getAuth();
      return apiFetch<Insights>("insights", auth);
    },
    enabled,
  });
}

export function useUpdateDraft() {
  const { address } = useAccount();
  const getAuth = useGrowthAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<Draft> }) => {
      const auth = await getAuth();
      return apiFetch<Draft>(`drafts/${encodeURIComponent(id)}`, auth, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<ContentQueue>(["growthDrafts", address], (prev) => {
        if (!prev) return prev;
        const updateIn = (list: Draft[]) => list.map((d) => (d.id === updated.id ? { ...d, ...updated } : d));
        return { ...prev, drafts: updateIn(prev.drafts), approved: updateIn(prev.approved) };
      });
    },
  });
}

export function useApproveDraft() {
  const { address } = useAccount();
  const getAuth = useGrowthAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      scheduledAt,
      reviewComment,
    }: {
      id: string;
      scheduledAt?: string;
      reviewComment?: string;
    }) => {
      const auth = await getAuth();
      const body: Record<string, string> = {};
      if (scheduledAt) body.scheduled_at = scheduledAt;
      if (reviewComment) body.review_comment = reviewComment;
      return apiFetch<Draft>(`drafts/${encodeURIComponent(id)}/approve`, auth, {
        method: "POST",
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      });
    },
    onSuccess: (response, { id }) => {
      queryClient.setQueryData<ContentQueue>(["growthDrafts", address], (prev) => {
        if (!prev) return prev;
        const draft = prev.drafts.find((d) => d.id === id);
        if (!draft) return prev;
        const updated = { ...draft, ...response };
        return { ...prev, drafts: prev.drafts.filter((d) => d.id !== id), approved: [...prev.approved, updated] };
      });
    },
  });
}

export function useRejectDraft() {
  const { address } = useAccount();
  const getAuth = useGrowthAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reviewComment }: { id: string; reviewComment?: string }) => {
      const auth = await getAuth();
      return apiFetch<Draft>(`drafts/${encodeURIComponent(id)}/reject`, auth, {
        method: "POST",
        body: reviewComment ? JSON.stringify({ review_comment: reviewComment }) : undefined,
      });
    },
    onSuccess: (response, { id }) => {
      queryClient.setQueryData<ContentQueue>(["growthDrafts", address], (prev) => {
        if (!prev) return prev;
        const draft = prev.drafts.find((d) => d.id === id) ?? prev.approved.find((d) => d.id === id);
        if (!draft) return prev;
        const updated = { ...draft, ...response };
        return {
          ...prev,
          drafts: prev.drafts.filter((d) => d.id !== id),
          approved: prev.approved.filter((d) => d.id !== id),
          rejected: [...prev.rejected, updated],
        };
      });
    },
  });
}

// Legacy imperative interface kept for backward compatibility
export interface UseGrowthApi {
  fetchDrafts: () => Promise<ContentQueue>;
  fetchInsights: () => Promise<Insights>;
  fetchPerformance: () => Promise<Performance>;
  updateDraft: (id: string, body: Partial<Draft>) => Promise<Draft>;
  approveDraft: (id: string, scheduledAt?: string, reviewComment?: string) => Promise<Draft>;
  rejectDraft: (id: string, reviewComment?: string) => Promise<Draft>;
}

export function useGrowthApi(): UseGrowthApi {
  const getAuth = useGrowthAuth();

  const fetchDrafts = useCallback(async () => {
    const auth = await getAuth();
    return apiFetch<ContentQueue>("drafts", auth);
  }, [getAuth]);

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
      return apiFetch<Draft>(`drafts/${encodeURIComponent(id)}`, auth, { method: "PUT", body: JSON.stringify(body) });
    },
    [getAuth],
  );

  const approveDraft = useCallback(
    async (id: string, scheduledAt?: string, reviewComment?: string) => {
      const auth = await getAuth();
      const body: Record<string, string> = {};
      if (scheduledAt) body.scheduled_at = scheduledAt;
      if (reviewComment) body.review_comment = reviewComment;
      return apiFetch<Draft>(`drafts/${encodeURIComponent(id)}/approve`, auth, {
        method: "POST",
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      });
    },
    [getAuth],
  );

  const rejectDraft = useCallback(
    async (id: string, reviewComment?: string) => {
      const auth = await getAuth();
      return apiFetch<Draft>(`drafts/${encodeURIComponent(id)}/reject`, auth, {
        method: "POST",
        body: reviewComment ? JSON.stringify({ review_comment: reviewComment }) : undefined,
      });
    },
    [getAuth],
  );

  return { fetchDrafts, fetchInsights, fetchPerformance, updateDraft, approveDraft, rejectDraft };
}
