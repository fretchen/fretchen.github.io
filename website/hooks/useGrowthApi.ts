import { useCallback, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, useSignMessage } from "wagmi";
import type { ContentQueue, Draft, Insights, Performance } from "../types/growth";

const API_BASE =
  (import.meta.env.PUBLIC_ENV__GROWTH_API_URL as string | undefined) ??
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
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Shared auth getter — keeps signing token cached per address for 4 min.
function useGrowthAuth() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const authCache = useRef<{ token: string; timestamp: number; address: string } | null>(null);
  const pendingAuth = useRef<{ promise: Promise<string>; address: string } | null>(null);

  return useCallback(async () => {
    if (!address) throw new Error("Wallet not connected");

    const cached = authCache.current;
    if (cached && cached.address === address && Date.now() - cached.timestamp < AUTH_CACHE_TTL_MS) {
      return cached.token;
    }

    if (pendingAuth.current && pendingAuth.current.address === address) {
      return pendingAuth.current.promise;
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

    pendingAuth.current = { promise, address };
    return promise;
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
