/**
 * The ported scw_js files assume two Node globals exist: `Buffer` (x402_server's
 * create402Response/createSettlementHeaders/extractPaymentPayload) and `process` (env
 * reads at module top level, e.g. x402_server's FACILITATOR_URL). bunny's Deno 1.x
 * isolate provides Node compat through `node:` imports but does not guarantee the
 * bare globals, so this module pins both before anything else executes.
 *
 * index.ts imports this FIRST: rolldown preserves the order of side-effect imports,
 * so these assignments run before any ported module's top-level code.
 */
import { Buffer as NodeBuffer } from "node:buffer";
import process from "node:process";

const g = globalThis as Record<string, unknown>;
if (g.Buffer === undefined) {
  g.Buffer = NodeBuffer;
}
if (g.process === undefined) {
  g.process = process;
}
