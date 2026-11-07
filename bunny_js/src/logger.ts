/**
 * bunny_js's stand-in for scw_js/logger.ts. scw_js builds one pino instance; pino is a
 * Node-runtime library (worker transports, stdout handles), so it does not belong in a
 * Deno isolate bundle. The call surface is kept pino-shaped — `logger.info(obj, msg)`,
 * `logger.error({ err }, msg)` — because the ported files use that convention verbatim.
 *
 * On top of the console output (the bunny dashboard's own log view), every line is buffered
 * and flushed to Scaleway Cockpit's custom Loki data source at the end of the request
 * (observability/bunny-edge-script-observability-kiss-implementation-plan.md), where a
 * single datasource-managed alert rule on `level="error"` pages by email — the same
 * `logger.error` = "ours, and should be alertable" convention the Scaleway functions have.
 */

type BufferedLine = { level: string; event: object };

const lines: BufferedLine[] = [];

/** Per-script `service` label (searchapi/llm/mcp differ); set by withLogFlush at entry setup. */
let serviceLabel = "bunny-js";

/**
 * Loki rejects duplicate timestamps within one push (`duplicate timestamp for series`) by
 * dropping the whole batch, so a monotonic per-isolate counter keeps same-millisecond lines
 * strictly increasing. String concat for the nanosecond part: `Date.now() * 1e6` as a number
 * exceeds Number.MAX_SAFE_INTEGER.
 */
let nsCounter = 0;
function nsTimestamp(): string {
  return `${Date.now()}${String(++nsCounter).padStart(6, "0")}`;
}

/**
 * pino serializes Error values (the `err` key) into message + stack; JSON.stringify does not
 * (it yields `{}`). The ported core logs caught exceptions as `{ err: Error }` and pino parity
 * matters both for debugging and for `| json` reads in Grafana — without this, a swallowed
 * exception logs as `"err":{}` and its cause is invisible.
 */
function stringifyLine(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    v instanceof Error ? { name: v.name, message: v.message, stack: v.stack } : v,
  );
}

function emit(level: string, arg: unknown, maybeMsg?: string): void {
  const [obj, msg] = typeof arg === "string" ? [{}, arg] : [(arg as object) ?? {}, maybeMsg ?? ""];
  // pino prints `level then message then context`; JSON-lines keeps the same fields.
  const line = stringifyLine({ level, time: Date.now(), msg, ...obj });
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
  // debug stays console-only — never buffered: the llm twins log { prompt } at
  // debug, and user content must not egress to Cockpit. On scw the pino gate
  // (LOG_LEVEL ?? "info") suppressed these lines; buffering them here would be
  // a NEW egress, not parity with the pre-move setup.
  if (level !== "debug") {
    lines.push({ level, event: { message: msg, ...obj } });
  }
}

/**
 * Pushes the buffered lines to Cockpit as one Loki batch. Best-effort by design — no retry,
 * no queue — but AWAITED when the buffer is non-empty: the edge runtime has no waitUntil, so
 * an un-awaited fetch racing the handler's return would be lost most of the time. A failed
 * push is console.error'd, so an ingest outage stays visible in the bunny dashboard instead
 * of silently eating every alert. Auth is Scaleway's documented `X-Token` header; unpushed
 * when URL/token are unset (local dev, tests).
 */
export async function flushLogs(): Promise<void> {
  const batch = lines.splice(0);
  const url = process.env.COCKPIT_LOKI_URL;
  const token = process.env.SCW_COCKPIT_PUSH_TOKEN;
  if (batch.length === 0 || !url || !token) {
    return;
  }
  const byLevel = new Map<string, [string, string][]>();
  for (const { level, event } of batch) {
    const vals = byLevel.get(level) ?? [];
    vals.push([nsTimestamp(), stringifyLine(event)]);
    byLevel.set(level, vals);
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      // A slow/brownout Cockpit must not stall every logged request: the flush is
      // awaited precisely because the runtime has no waitUntil, and this timeout
      // is what keeps that await from becoming a latency coupling to ingest
      // health. An abort lands in the catch below like any other failure.
      signal: AbortSignal.timeout(1500),
      // Labels stay {service, level} only — high-cardinality labels are the classic Loki trap.
      headers: { "X-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify({
        streams: [...byLevel].map(([level, values]) => ({
          stream: { service: serviceLabel, level },
          values,
        })),
      }),
    });
    if (!res.ok) {
      console.error(
        JSON.stringify({ level: "error", msg: "log flush failed", status: res.status }),
      );
    }
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "log flush failed", err: String(err) }));
  }
}

/**
 * Wraps a script entry handler so the buffered lines reach Cockpit however the request ended —
 * early returns (OPTIONS, discovery, the 404, the unpaid 402) and throws alike, which is why
 * this wraps the entry's top-level handler instead of touching any route file's returns.
 */
export function withLogFlush(
  service: string,
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  serviceLabel = service;
  return async (request: Request): Promise<Response> => {
    try {
      return await handler(request);
    } finally {
      await flushLogs();
    }
  };
}

/**
 * pino-parity for the ported core: it gates debug logging behind this (pino's Gating API),
 * e.g. `if (logger.isLevelEnabled("debug"))`. The same env gate as scw's pino instance:
 * LOG_LEVEL (default info) lets debug be turned on in the dashboard without a deploy.
 */
const LEVEL_ORDER = { debug: 10, info: 20, warn: 30, error: 40 } as const;
function configuredLevel(): keyof typeof LEVEL_ORDER {
  const raw = (process.env.LOG_LEVEL ?? "info").toLowerCase();
  return raw in LEVEL_ORDER ? (raw as keyof typeof LEVEL_ORDER) : "info";
}

export const logger = {
  info: (arg: unknown, msg?: string) => emit("info", arg, msg),
  warn: (arg: unknown, msg?: string) => emit("warn", arg, msg),
  error: (arg: unknown, msg?: string) => emit("error", arg, msg),
  debug: (arg: unknown, msg?: string) => emit("debug", arg, msg),
  isLevelEnabled: (level: string): boolean =>
    LEVEL_ORDER[configuredLevel()] <=
    (LEVEL_ORDER[level as keyof typeof LEVEL_ORDER] ?? LEVEL_ORDER.info),
};
