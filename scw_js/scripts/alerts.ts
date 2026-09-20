/**
 * Manage the Cockpit (Loki) alerting rules that watch our log lines.
 *
 * Why log-based rules: Scaleway's preconfigured alerts are metric-based, and the failure that
 * started all this produced no error metric at all — the facilitator answered 200 with
 * `success: false` and the revert reason in the body. It was only ever visible as text in a log
 * line. See `logs.ts` for the companion read-only tool.
 *
 * Needs `SCW_COCKPIT_LOGS_URL` and `SCW_COCKPIT_RULES_TOKEN` in `scw_js/.env`. Deliberately a
 * *different* token from `SCW_COCKPIT_LOGS_TOKEN`: `logs.ts` is run casually and often and should
 * keep a credential that can only read, while this one can write and delete alerting rules.
 *
 *   scw cockpit token create name=<name> token-scopes.0=full_access_logs_rules region=fr-par
 *
 * Usage (from scw_js/):
 *   npx tsx scripts/alerts.ts                  # list the rule groups on the ruler
 *   npx tsx scripts/alerts.ts --push           # upload alerts/payments.yaml
 *   npx tsx scripts/alerts.ts --push alerts/experiment.yaml
 *   npx tsx scripts/alerts.ts --delete payments
 *
 * Push is never wired into deploy. Alerting config that changes as a side effect of shipping code
 * is its own kind of surprise — and a rule silently removed by a deploy is indistinguishable from
 * a system that is simply quiet.
 */
import { readFileSync } from "node:fs";
import dotenv from "dotenv";

dotenv.config();

const URL_BASE = process.env.SCW_COCKPIT_LOGS_URL;
const TOKEN = process.env.SCW_COCKPIT_RULES_TOKEN;

if (!URL_BASE || !TOKEN) {
  console.error(
    "Missing SCW_COCKPIT_LOGS_URL / SCW_COCKPIT_RULES_TOKEN in scw_js/.env — see this file's header.",
  );
  process.exit(1);
}

/** Loki namespaces its rule groups. One per package keeps `--delete` from reaching across
 *  packages, and keeps the listing readable once something other than scw_js has rules. */
const NAMESPACE = "scw-js";

async function ruler(path: string, init: RequestInit = {}): Promise<string> {
  const res = await fetch(`${URL_BASE}/loki/api/v1/rules${path}`, {
    ...init,
    headers: { "X-Token": TOKEN!, ...(init.headers ?? {}) },
  });
  const text = await res.text();
  // An empty ruler answers 404 with "no rule groups found" — that is success, not an error, and
  // it looks identical to a missing namespace. A real permission problem is a bare 403.
  if (!res.ok && !(res.status === 404 && text.includes("no rule groups found"))) {
    // Never echo the token, not even truncated — this output gets pasted into issues.
    throw new Error(`${init.method ?? "GET"} ${path} failed: HTTP ${res.status} ${text.slice(0, 300)}`);
  }
  return text;
}

async function list(): Promise<void> {
  const text = await ruler("");
  console.log(text.trim() || "(empty)");
  console.log(`\nPush with:  npx tsx scripts/alerts.ts --push`);
}

async function push(file: string): Promise<void> {
  const yaml = readFileSync(file, "utf8");
  await ruler(`/${NAMESPACE}`, {
    method: "POST",
    headers: { "Content-Type": "application/yaml" },
    body: yaml,
  });
  console.log(`pushed ${file} to namespace ${NAMESPACE}\n`);
  await list();
}

async function remove(group: string): Promise<void> {
  await ruler(`/${NAMESPACE}/${encodeURIComponent(group)}`, { method: "DELETE" });
  console.log(`deleted group ${group} from namespace ${NAMESPACE}\n`);
  await list();
}

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const next = process.argv[i + 1];
  return next?.startsWith("--") ? undefined : next;
}

if (process.argv.includes("--delete")) {
  const group = flag("delete");
  if (!group) {
    console.error("--delete needs a group name, e.g. --delete payments");
    process.exit(1);
  }
  await remove(group);
} else if (process.argv.includes("--push")) {
  await push(flag("push") ?? "alerts/payments.yaml");
} else {
  await list();
}
