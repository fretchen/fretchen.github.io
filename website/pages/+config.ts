import vikeReact from "vike-react/config";
import vikeReactQuery from "vike-react-query/config";
import type { Config } from "vike/types";
import Layout from "../layouts/LayoutDefault.js";
import { SITE_CONFIG } from "../utils/siteConfig.js";

// Default config (can be overridden by pages)
// https://vike.dev/config

export default {
  // https://vike.dev/Layout
  Layout,

  // https://vike.dev/head-tags
  title: "Notes and Thoughts | fretchen.eu",
  description: SITE_CONFIG.description,
  // <html lang> is set per-locale in +lang.ts — Vike requires a separate file for
  // function-valued configs, since +config.ts values are serialised to JSON.
  prerender: true,
  extends: [vikeReact, vikeReactQuery],

  // Custom setting holding a page's Schema.org JSON-LD, rendered by pages/+Head.tsx.
  //
  // JSON-LD is per-page data, but `+Head` — where it used to live — is *cumulative*:
  // it accumulates down the directory tree and cannot be overridden, so /x402/sellers
  // rendered the /x402 head as well as its own and shipped two BreadcrumbLists, a stray
  // CollectionPage, and three conflicting canonical tags. `cumulative: false` is the fix:
  // only the deepest +structuredData.ts on the page's path applies, so a section's schema
  // stops reaching its subpages without any guards or path checks.
  //
  // Server-only — head tags are emitted during SSR/pre-rendering, and crawlers read the
  // pre-rendered HTML. https://vike.dev/meta
  meta: {
    structuredData: {
      env: { server: true },
      cumulative: false,
    },
  },

  queryClientConfig: {
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  },
} satisfies Config;
