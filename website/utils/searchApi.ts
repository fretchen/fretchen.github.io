/**
 * Base URL of the `searchapi` Scaleway function (`scw_js/search_api.ts`), which serves the
 * owner-gated `GET /search?q=` proxy in front of Brave's LLM Context API.
 *
 * Same shape as `analyticsApi.ts`: the fallback is what production uses, because
 * `.github/workflows/pages.yml` sets no `PUBLIC_ENV__*` variables — the env var is a local-dev
 * override only (point it at `npm run dev:search` on localhost:8084).
 *
 * The fallback below comes from `npm run info` in `scw_js/` after the first deploy; Scaleway
 * generates the hostname, so it cannot be known before then.
 */
export const SEARCH_URL =
  (import.meta.env.PUBLIC_ENV__SEARCH_URL as string | undefined) ??
  "https://mypersonaljscloudivnad9dy-searchapi.functions.fnc.fr-par.scw.cloud";
