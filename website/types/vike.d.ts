import type { PageContext as VikePageContext } from "vike/types";

export {};

declare global {
  namespace Vike {
    /** Set by pages/+onBeforeRoute.ts from the URL's locale prefix. https://vike.dev/pageContext#typescript */
    interface PageContext {
      locale?: string;
    }

    interface Config {
      /**
       * A page's Schema.org JSON-LD, declared in pages/+config.ts and rendered by
       * pages/+Head.tsx. Non-cumulative, so the deepest +structuredData.ts wins.
       */
      structuredData?: (pageContext: VikePageContext) => object[];

      /**
       * Open Graph `og:type`, rendered by pages/+Head.tsx. Non-cumulative, so the deepest
       * +ogType.ts wins; pages that declare none get "website".
       */
      ogType?: "website" | "article";
    }
  }
}
