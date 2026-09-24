import pino from "pino";

/**
 * The one pino instance for this package. Every file previously constructed its own
 * `pino({ level: process.env.LOG_LEVEL ?? "info" })` — thirteen identical instances, and every
 * function that imports more than one of those modules (e.g. genimgx402token, which pulls in
 * both image_service.ts and x402_server.ts) built several of them per cold start for no
 * behavioral difference. `logger.error` vs `logger.warn` is a load-bearing convention now (see
 * `alerts/*.yaml`'s "The logger.error convention" and `test/alert_coverage.test.ts`), which makes
 * one shared, importable instance the natural place to enforce that structurally later, too.
 */
export const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });
