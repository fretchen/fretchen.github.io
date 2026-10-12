import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Purity guard for the deployed handlers: no source file named as a handler in
 * serverless.yml may reference fastify, in any form. fastify is a devDependency that
 * exists only for the local dev servers; when a handler imported it anyway (even inside
 * a NODE_ENV=test block), Dependabot reported payment-endpoint CVEs that looked
 * production-critical and every triage had to re-verify they were not. The local
 * servers live in dev_server_*.ts, which tsup never bundles.
 */

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.join(TEST_DIR, "..");

const serverlessYml = fs.readFileSync(path.join(PACKAGE_ROOT, "serverless.yml"), "utf8");

const handlerSources = [...serverlessYml.matchAll(/handler:\s*dist\/(\w+)\.handle/g)].map(
  (match) => `${match[1]}.ts`,
);

describe("handler purity", () => {
  it("found the handlers in serverless.yml", () => {
    // Guards against the regex silently matching nothing, which would make the next
    // assertion vacuously pass.
    expect(handlerSources.length).toBeGreaterThanOrEqual(5);
  });

  it("no deployed handler references fastify", () => {
    const offenders: string[] = [];
    for (const source of handlerSources) {
      const content = fs.readFileSync(path.join(PACKAGE_ROOT, source), "utf8");
      if (content.includes("fastify")) {
        offenders.push(source);
      }
    }
    expect(
      offenders,
      "fastify belongs in dev_server_*.ts (local dev only, never bundled), not in a deployed handler",
    ).toEqual([]);
  });
});
