/**
 * Base URL of the `searchapi` Scaleway function (`scw_js/search_api.ts`), which serves
 * `GET /search?q=` in front of Brave's LLM Context API and `GET /fetch?url=` for one arbitrary
 * page.
 *
 * Same shape as `analyticsApi.ts`: the fallback is what production uses, because
 * `.github/workflows/pages.yml` sets no `PUBLIC_ENV__*` variables — the env var is a local-dev
 * override only (point it at `npm run dev:search` on localhost:8084).
 *
 * The custom domain rather than the generated Scaleway hostname, matching `imagegen-agent` and
 * `llm-agent`: it is the identity the endpoint publishes, and the one its 402 advertises as
 * `resource.url`. Declared in `scw_js/serverless.yml` — the deploy plugin deletes any domain that
 * file does not list.
 */
export const SEARCH_URL =
  (import.meta.env.PUBLIC_ENV__SEARCH_URL as string | undefined) ?? "https://web-agent.fretchen.eu";
