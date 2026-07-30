/**
 * Fetches an OpenAPI document at runtime so documentation pages can render *from the spec*
 * rather than from hand-written tables (see components/ParamTable.tsx).
 *
 * Runtime rather than build-time on purpose: our services patch live values into the served
 * document — `sc_llm_x402.ts` rewrites `x-payment-info.price.max` from the current token
 * pricing before serving it — so a bundled copy would show a stale price.
 *
 * Deliberately separate from `x402Discovery.ts`: that module is the payment/compatibility
 * checker, this is a docs concern.
 */
import { useQuery } from "@tanstack/react-query";

/** A minimal JSON-Schema node — only the parts our docs rendering reads. */
export interface OpenApiSchema {
  type?: string;
  description?: string;
  required?: string[];
  enum?: unknown[];
  default?: unknown;
  format?: string;
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
}

/** The slice of an OpenAPI document the docs pages use. */
export interface OpenApiDocument {
  info?: { title?: string; version?: string; description?: string };
  "x-service-type"?: string;
  components?: { schemas?: Record<string, OpenApiSchema> };
  paths?: Record<string, unknown>;
}

export interface UseOpenApiSpecResult {
  spec: OpenApiDocument | null;
  isLoading: boolean;
  error: string | null;
}

async function fetchSpec(url: string): Promise<OpenApiDocument> {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`The spec at ${url} returned ${res.status}.`);
  return (await res.json()) as OpenApiDocument;
}

/**
 * Fetch and cache an OpenAPI document. Never throws — a failure surfaces as `error` so the
 * caller can degrade (show a link to the spec) instead of rendering an empty table.
 */
export function useOpenApiSpec(url: string): UseOpenApiSpecResult {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["openApiSpec", url],
    queryFn: () => fetchSpec(url),
    staleTime: Infinity,
    retry: false,
  });

  return {
    spec: data ?? null,
    isLoading: isPending,
    error: isError ? (error instanceof Error ? error.message : "Could not load the spec.") : null,
  };
}

export default useOpenApiSpec;
