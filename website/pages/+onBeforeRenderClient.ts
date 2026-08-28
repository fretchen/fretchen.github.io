// Stufe 2, website/MDX_MIGRATION.md — see utils/postModuleCache.ts.
// Client counterpart of +onBeforeRenderHtml.ts. Awaited by vike-react before
// ReactDOM.hydrateRoot/createRoot (dist/integration/onRenderClient.js), so
// the very first client render already has the module cached — no flash of
// the old loading state, no hydration mismatch against the server's output.
export { onBeforeRenderClient };

import type { PageContextClient } from "vike/types";
import { primePostModule } from "../utils/postModuleCache";

async function onBeforeRenderClient(pageContext: PageContextClient) {
  const componentPath = (pageContext.data as { blog?: { componentPath?: string } } | undefined)?.blog?.componentPath;
  await primePostModule(componentPath);
}
