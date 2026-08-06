export {};

declare global {
  namespace Vike {
    /** Set by pages/+onBeforeRoute.ts from the URL's locale prefix. https://vike.dev/pageContext#typescript */
    interface PageContext {
      locale?: string;
    }
  }
}
