import pino from "pino";

/**
 * Redaction set: the exact configured `RPC_URL_*` values (see `getRpcUrl` in
 * @fretchen/chain-utils). A configured RPC URL embeds a provider API key (e.g. an Alchemy
 * URL), and viem's RPC errors print the configured endpoint verbatim into their
 * `message`/`stack` ("URL: <rpc-url>\nRequest body: …"), so an unredacted `err` field
 * writes the credential into Loki and the alert emails that quote log lines. Only these
 * exact strings are redacted — nothing heuristic: a secret that is not a configured RPC
 * URL is a new finding (and its key is rotatable), not something this serializer
 * guesses at. Computed at module load; the environment does not change at runtime.
 */
const RPC_URL_REDACTIONS = new Map(
  Object.entries(process.env)
    .filter(([key, value]) => key.startsWith("RPC_URL_") && !!value?.trim())
    .map(([key, value]) => [value!.trim(), `<rpc-url:${key.slice("RPC_URL_".length)}>`]),
);

/** Exact-substring replacement of every configured RPC URL inside `value`, recursively. */
function redactRpcUrls(value: unknown): unknown {
  if (typeof value === "string") {
    let redacted = value;
    for (const [url, placeholder] of RPC_URL_REDACTIONS) {
      redacted = redacted.split(url).join(placeholder);
    }
    return redacted;
  }
  if (Array.isArray(value)) {
    return value.map(redactRpcUrls);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, redactRpcUrls(entry)]),
    );
  }
  return value;
}

/**
 * pino's standard err serializer, then the configured RPC URLs scrubbed out of every
 * string it produced — `message`, `stack`, and viem's extra enumerable props (the
 * request body viem embeds is public calldata; only the URL is secret-bearing).
 * Non-Errors pass through `stdSerializers.err` untouched and are redacted as plain
 * values, which is harmless for anything that is not a string carrier.
 */
export function errSerializer(err: unknown): unknown {
  return redactRpcUrls(pino.stdSerializers.err(err as Error));
}

/**
 * The one pino instance for this package. Every file previously constructed its own
 * `pino({ level: process.env.LOG_LEVEL ?? "info" })` — thirteen identical instances, and every
 * function that imports more than one of those modules (e.g. genimgx402token, which pulls in
 * both image_service.ts and x402_server.ts) built several of them per cold start for no
 * behavioral difference. `logger.error` vs `logger.warn` is a load-bearing convention now (see
 * `observability/alerts/*.yaml`'s "The logger.error convention" and `test/alert_coverage.test.ts`),
 * which makes one shared, importable instance the natural place to enforce that structurally
 * later, too — and the one place the RPC-URL redaction above applies to every `err` field.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  serializers: { err: errSerializer },
});
