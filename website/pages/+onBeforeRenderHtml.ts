// Stufe 2, website/MDX_MIGRATION.md — see utils/postModuleCache.ts.
// Root-level so this one file covers /blog/@id and all four /quantum/*/@id
// routes. Awaited by vike-react before renderToString/renderToStream runs
// (dist/integration/onRenderHtml.js), so the module is already in the
// synchronous cache by the time components/Post.tsx renders.
export { onBeforeRenderHtml };

import type { PageContextServer } from "vike/types";
import { getBlogComponentPath, primePostModule } from "../utils/postModuleCache";

async function onBeforeRenderHtml(pageContext: PageContextServer) {
  // No try/catch: a module that fails to resolve during prerender is a build
  // bug and must fail the build loudly — see primePostModule's doc comment.
  await primePostModule(getBlogComponentPath(pageContext));
}
