// SPIKE (Stufe 2.0, website/MDX_MIGRATION.md) — see utils/postModuleCache.ts.
// Root-level so this one file covers /blog/@id and all four /quantum/*/@id
// routes. Awaited by vike-react before renderToString/renderToStream runs
// (dist/integration/onRenderHtml.js), so the module is already in the
// synchronous cache by the time components/Post.tsx renders.
export { onBeforeRenderHtml };

import type { PageContextServer } from "vike/types";
import { primePostModule } from "../utils/postModuleCache";

async function onBeforeRenderHtml(pageContext: PageContextServer) {
  const componentPath = (pageContext.data as { blog?: { componentPath?: string } } | undefined)?.blog?.componentPath;
  await primePostModule(componentPath);
}
