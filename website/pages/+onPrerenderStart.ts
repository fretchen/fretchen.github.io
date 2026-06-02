// https://vike.dev/onPrerenderStart
export default onPrerenderStart;

import { locales, defaultLocale } from "../locales/locales";

interface PageContextPrerender {
  urlOriginal: string;
  [key: string]: unknown;
}

interface PrerenderContext {
  pageContexts: PageContextPrerender[];
}

// We only need this for pre-rendered apps https://vike.dev/pre-rendering
function onPrerenderStart(prerenderContext: PrerenderContext): { prerenderContext: PrerenderContext } {
  const pageContexts: PageContextPrerender[] = [];
  prerenderContext.pageContexts.forEach((pageContext) => {
    duplicateWithLocale(pageContext, pageContexts);
  });
  return {
    prerenderContext: {
      pageContexts,
    },
  };
}

function duplicateWithLocale(pageContext: PageContextPrerender, pageContexts: PageContextPrerender[]) {
  // Duplicate pageContext for each locale
  locales.forEach((locale) => {
    // Localize URL
    let { urlOriginal } = pageContext;
    if (locale !== defaultLocale) {
      urlOriginal = `/${locale}${pageContext.urlOriginal}`;
    }
    pageContexts.push({
      ...pageContext,
      urlOriginal,
      // Set pageContext.locale
      locale,
    });
  });
}
