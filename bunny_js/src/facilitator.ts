/**
 * The facilitator's entry — the x402 payment facilitator (/verify, /settle, /supported,
 * /openapi.json) at facilitator.fretchen.eu, ported from the Scaleway Function to a Bunny
 * Edge Script (x402_facilitator/bunny-port-implementation-plan.md). The routing lives in
 * facilitator_routes.ts; the payment core in the ported x402_*.ts files — one twin, one
 * bundle, no Scaleway concept anywhere.
 *
 * The runtime shims must import first: the ported payment core assumes the Node `Buffer`
 * and `process` globals, which bunny's Deno isolate does not guarantee.
 */
import "./runtime-shims.js";
import * as BunnySDK from "@bunny.net/edgescript-sdk";
import { withLogFlush } from "./logger.js";
import { handleFacilitatorRequest } from "./facilitator/facilitator_routes.js";

BunnySDK.net.http.serve(withLogFlush("facilitator", handleFacilitatorRequest));
