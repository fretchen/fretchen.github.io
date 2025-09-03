// pages/+onPrerenderStart.ts
// Environment: build-time

export { onPrerenderStart };

import type { PrerenderContext, PageContextServer } from "vike/types";

const locales = ["en", "de"];
const localeDefault = "en";

async function onPrerenderStart(prerenderContext: PrerenderContext) {
  const pageContexts: PageContextServer[] = [];
  prerenderContext.pageContexts.forEach((pageContext) => {
    // Duplicate pageContext for each locale
    locales.forEach((locale) => {
      // Localize URL
      let { urlOriginal } = pageContext;
      if (locale !== localeDefault) {
        urlOriginal = `/${locale}${pageContext.urlOriginal}`;
      }
      pageContexts.push({
        ...pageContext,
        urlOriginal,
        // Set pageContext.locale
        locale,
      });
    });
  });
  return {
    prerenderContext: {
      pageContexts,
    },
  };
}
