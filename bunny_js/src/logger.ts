/**
 * bunny_js's stand-in for scw_js/logger.ts. scw_js builds one pino instance; pino is a
 * Node-runtime library (worker transports, stdout handles), so it does not belong in a
 * Deno isolate bundle. The call surface is kept pino-shaped — `logger.info(obj, msg)`,
 * `logger.error({ err }, msg)` — because the ported files use that convention verbatim.
 *
 * The `logger.error` convention (observability alert rules key on it) does not carry over
 * to bunny: the edge script's logs live in the bunny dashboard, not Loki, and shipping
 * structured logs out is a documented follow-up if this twin graduates.
 */

function emit(level: string, arg: unknown, maybeMsg?: string): void {
  const [obj, msg] = typeof arg === "string" ? [{}, arg] : [(arg as object) ?? {}, maybeMsg ?? ""];
  // pino prints `level then message then context`; JSON-lines keeps the same fields.
  const line = JSON.stringify({ level, time: Date.now(), msg, ...obj });
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (arg: unknown, msg?: string) => emit("info", arg, msg),
  warn: (arg: unknown, msg?: string) => emit("warn", arg, msg),
  error: (arg: unknown, msg?: string) => emit("error", arg, msg),
  debug: (arg: unknown, msg?: string) => emit("debug", arg, msg),
};
