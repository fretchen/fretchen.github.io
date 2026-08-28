// Stufe 2, website/MDX_MIGRATION.md — see utils/postModuleCache.ts.
// Client counterpart of +onBeforeRenderHtml.ts. Awaited by vike-react before
// ReactDOM.hydrateRoot/createRoot (dist/integration/onRenderClient.js), so
// the very first client render already has the module cached — no flash of
// the old loading state, no hydration mismatch against the server's output.
export { onBeforeRenderClient };

import type { PageContextClient } from "vike/types";
import { getBlogComponentPath, primePostModule, recordPostModuleError } from "../utils/postModuleCache";

async function onBeforeRenderClient(pageContext: PageContextClient) {
  const componentPath = getBlogComponentPath(pageContext);
  try {
    await primePostModule(componentPath);
  } catch (err) {
    // Here (unlike the server) a failure is a runtime event outside our control
    // (stale hashed chunk URL after a redeploy, flaky network) — record it so
    // Post.tsx's error UI can show a reload button instead of failing the app.
    if (componentPath) recordPostModuleError(componentPath, err);
  }
}
