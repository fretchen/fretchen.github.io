/**
 * Base URL of the `analytics` Scaleway function, which serves both endpoints:
 * `POST /hit` (anonymous beacon) and `GET /stats` (owner-gated readout).
 *
 * One constant because it is one function — get the value from `npm run info`
 * in `analytics/` after deploying.
 *
 * The fallback is what production actually uses: `.github/workflows/pages.yml`
 * sets no `PUBLIC_ENV__*` variables, so the env var is a local-dev override
 * only (point it at `npm run dev` on localhost:8086).
 */
export const ANALYTICS_URL =
  (import.meta.env.PUBLIC_ENV__ANALYTICS_URL as string | undefined) ??
  "https://analyticsserviceebp8thpt-analytics.functions.fnc.fr-par.scw.cloud";
