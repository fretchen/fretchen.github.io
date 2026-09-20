/**
 * Read any Scaleway function's logs from the terminal.
 *
 * Why this exists: the answer to an incident is routinely one log line, and until now there was no
 * way to reach it. The Scaleway console's log view and the Grafana/Cockpit dashboards both showed
 * nothing usable, so a refund that had been failing on every cron run for days was diagnosed by
 * replaying transactions on-chain instead — while `"Settlement failed"` sat in the facilitator's
 * logs the whole time, carrying the exact revert selector.
 *
 * **One token, the whole project.** Cockpit is scoped to the Scaleway *project*, not to a service,
 * so this reads every function in the account — `facilitator`, `llmx402`, `llmx402cron`,
 * `searchapi`, `genimgx402token`, `growthapi`, comments — even though the script lives in `scw_js`.
 * It is here because this package already holds the operational scripts; it is not about scw_js.
 * Do NOT copy it per package: that would mean the same secret in five gitignored files with no way
 * to rotate them together.
 *
 * Needs `SCW_COCKPIT_LOGS_URL` and `SCW_COCKPIT_LOGS_TOKEN` in `scw_js/.env`. The token is a
 * **Cockpit** token (`read_only_logs` scope) — a different credential type from `SCW_SECRET_KEY`,
 * which is rejected here with a 403. Create one with:
 *
 *   scw cockpit token create name=<name> token-scopes.0=read_only_logs region=fr-par
 *
 * Its secret is shown exactly once, so save it immediately; a token whose secret is lost cannot be
 * used or audited, only deleted.
 *
 * Usage (from scw_js/):
 *   npx tsx scripts/logs.ts                                    # what can I query? (labels + names)
 *   npx tsx scripts/logs.ts facilitator                        # last hour, by name fragment
 *   npx tsx scripts/logs.ts facilitator --since 36h --grep "Settlement failed"
 *   npx tsx scripts/logs.ts '{resource_name="…"}' --raw        # full LogQL, unformatted output
 */
import dotenv from "dotenv";

dotenv.config();

const URL_BASE = process.env.SCW_COCKPIT_LOGS_URL;
const TOKEN = process.env.SCW_COCKPIT_LOGS_TOKEN;

if (!URL_BASE || !TOKEN) {
  console.error(
    "Missing SCW_COCKPIT_LOGS_URL / SCW_COCKPIT_LOGS_TOKEN in scw_js/.env — see this file's header.",
  );
  process.exit(1);
}

/** `36h`, `90m`, `45s` → milliseconds. Relative only: an incident is always "recently", and an
 *  absolute range is one more thing to get wrong at 2am. */
function parseSince(raw: string): number {
  const match = /^(\d+)([smhd])$/.exec(raw.trim());
  if (!match) {
    throw new Error(`--since must look like 30m, 6h or 2d — got ${raw}`);
  }
  const scale = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]]!;
  return Number(match[1]) * scale;
}

function flag(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}

const RAW = process.argv.includes("--raw");
const positional = process.argv.slice(2).filter((a, i, all) => {
  if (a.startsWith("--")) return false;
  return !all[i - 1]?.startsWith("--") || all[i - 1] === "--raw";
});

const sinceMs = parseSince(flag("since", "1h")!);
const end = Date.now();
const start = end - sinceMs;
const ns = (ms: number) => `${ms}000000`;

async function loki(
  path: string,
  params: Record<string, string> = {},
): Promise<Record<string, unknown>> {
  const url = new global.URL(`${URL_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { "X-Token": TOKEN! } });
  if (!res.ok) {
    // Never echo the token, not even truncated — this output gets pasted into issues.
    throw new Error(`${path} failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

/**
 * With no selector, say what is queryable rather than making the caller guess.
 *
 * Guessing is how the previous attempt failed: `growth-agent/README.md` documents
 * `{service_name="growth-agent"}`, a *container* label, and serverless functions do not carry it.
 * Note the values are time-windowed by `--since`, so a function that has not run recently is
 * absent — widen the window before concluding it does not exist.
 */
async function describe(): Promise<void> {
  const labels = (await loki("/loki/api/v1/labels", { start: ns(start), end: ns(end) }))
    .data as string[];
  console.log(`labels: ${labels.join(", ")}\n`);

  const names = (
    await loki("/loki/api/v1/label/resource_name/values", { start: ns(start), end: ns(end) })
  ).data as string[];
  console.log(`functions logging in the last ${flag("since", "1h")}:`);
  for (const name of names ?? []) console.log(`  ${name}`);
  console.log(`\nQuery one with:  npx tsx scripts/logs.ts <fragment of the name> --since 6h`);
}

async function query(target: string): Promise<void> {
  // A bare word is matched as a substring of resource_name, because the deployed names carry a
  // namespace prefix nobody remembers (`mypersonaljscloudivnad9dy-llmx402`). Anything starting
  // with `{` is passed through as LogQL untouched.
  const selector = target.startsWith("{") ? target : `{resource_name=~".*${target}.*"}`;
  const grep = flag("grep");
  const q = grep ? `${selector} |= ${JSON.stringify(grep)}` : selector;

  const body = await loki("/loki/api/v1/query_range", {
    query: q,
    start: ns(start),
    end: ns(end),
    limit: flag("limit", "100")!,
    direction: "backward",
  });

  const streams = (body.data as { result?: { values: [string, string][] }[] })?.result ?? [];
  const lines = streams.flatMap((s) => s.values).sort((a, b) => Number(a[0]) - Number(b[0]));

  if (lines.length === 0) {
    console.log(`no lines for ${q} in the last ${flag("since", "1h")}`);
    return;
  }

  for (const [ts, line] of lines) {
    const when = new Date(Number(ts) / 1e6).toISOString().replace("T", " ").slice(0, 19);
    if (RAW) {
      console.log(`${when}  ${line}`);
      continue;
    }
    // Scaleway wraps each line as {"message": "<what the function printed>"}, so the useful text is
    // one level in. Anything that does not fit that shape is printed as-is rather than swallowed.
    let text = line;
    try {
      const parsed = JSON.parse(line) as { message?: string };
      if (typeof parsed.message === "string") text = parsed.message;
    } catch {
      /* not JSON — print the raw line */
    }
    console.log(`${when}  ${text}`);
  }
  console.log(`\n${lines.length} line(s). --raw for the unwrapped payload, --limit to widen.`);
}

const target = positional[0];
await (target ? query(target) : describe());
