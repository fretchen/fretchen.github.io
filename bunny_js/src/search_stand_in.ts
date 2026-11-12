/**
 * The testnet stand-ins for the web seller's two routes — the twin's counterpart of
 * llm_service's mock LLM (scw parity in intent, not in shape).
 *
 * A paid request on a testnet network (Base Sepolia) exercises the FULL x402 machinery —
 * challenge, validation, channel verification, settlement, the Payment-Response header —
 * but must never touch the metered upstreams: Brave bills per query and /fetch is
 * egress, and a testnet payment is free. `run()` in searchapi_routes.ts therefore swaps
 * these in for searchWeb/fetchExternalHtml whenever the payment's network is a testnet.
 *
 * The output types are the SERVICES' own return types (SearchResult / FetchedPage), so the
 * rest of the response path is untouched. Content rules, deliberately strict:
 * - deterministic — same input, same bytes; no clock, no randomness, no drift;
 * - loud — every string carries the MOCKER marker, so no caller can mistake a stand-in
 *   for real data (a mock that looks real is worse than no mock);
 * - echoing — the input query/url appears in the output, so the caller sees their own
 *   request flow through the whole pipeline.
 */

import type { SearchResult } from "./search_service.js";
import type { FetchedPage } from "./web_fetch_service.js";

/** The marker every stand-in string carries — tests pin the exact phrase. */
export const TESTNET_MOCK_MARKER = "testnet mock";

const note =
  "This is a testnet mock answer: your payment's challenge, verification, settlement and " +
  "response all ran, but no real web search was performed. Pay on a mainnet network " +
  "(eip155:10 or eip155:8453) for real results.";

export function standInSearch(query: string): { results: SearchResult[] } {
  return {
    results: [
      {
        url: "https://web-agent.fretchen.eu/mock-result-1",
        title: `testnet mock result for "${query}"`,
        text: note,
      },
      {
        url: "https://web-agent.fretchen.eu/mock-result-2",
        title: "testnet mock: payment pipeline verified",
        text: `Your query "${query}" reached the seller and a signed, settled payment was accepted for it.`,
      },
      {
        url: "https://web-agent.fretchen.eu/mock-result-3",
        title: "testnet mock: how to get real results",
        text: "Aim the same client at a mainnet network entry of the 402 challenge and the live upstream runs.",
      },
    ],
  };
}

export function standInFetch(url: string): FetchedPage {
  return {
    finalUrl: url,
    contentType: "text/html; charset=utf-8",
    html: `<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8"><title>testnet mock page: ${escapeHtml(
      url,
    )}</title></head>\n<body>\n<h1>testnet mock page</h1>\n<p>${note}</p>\n<p>You requested <code>${escapeHtml(
      url,
    )}</code>; it was never fetched.</p>\n</body>\n</html>`,
  };
}

const escapeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
