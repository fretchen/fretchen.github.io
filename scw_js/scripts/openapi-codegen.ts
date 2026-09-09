/**
 * The parts of OpenAPI generation that are the same for every service in this package.
 *
 * Extracted once `openapi.llm.json` became the second spec generated this way (genimg was the
 * first). Deliberately a **local module, not a `shared/` package**: the genuinely common surface is
 * ~20 lines, and a `shared/` package would add a `file:` build-ordering dependency to this
 * package's deploy path — `build` runs the generators before `tsup`, so an unbuilt shared package
 * would break `npm run build` and `npm run deploy`. Promote it only when a third *package* needs it.
 * See `genimg-openai-compat-migration.md` §3.
 *
 * What stays per-service: `info`, `servers`, `tags`, `paths`, `x-service-type`, `x-interop-floor`,
 * `x-discovery`. Those are prose and contract declarations, not data shapes, so they gain nothing
 * from codegen and are hand-written in each generator.
 */

import { writeFileSync } from "node:fs";
import { z } from "zod";

/** Shared across every spec this package publishes — one operator, one contact. */
export const CONTACT = {
  name: "fretchen",
  url: "https://www.fretchen.eu",
  email: "fretchen.dev@proton.me",
} as const;

/**
 * The self-describing `/openapi.json` path stanza. Every service serves its own spec at this path
 * (each handler has a `GET openapi.json` branch), so every spec should advertise it.
 */
export function openApiJsonPath(tag: string) {
  return {
    get: {
      operationId: "openapiSpec",
      summary: "This document",
      tags: [tag],
      responses: {
        "200": {
          description: "This OpenAPI document.",
          content: { "application/json": { schema: { type: "object" } } },
        },
      },
    },
  };
}

/**
 * zod's `toJSONSchema` stamps a top-level `$schema` key (correct for a standalone JSON Schema
 * document) — meaningless nested under `components.schemas.<Name>` in an OpenAPI document, which
 * declares its schema dialect once, globally, via `"openapi": "3.1.0"`. Strip it.
 */
export function toComponentSchema(schema: z.ZodType): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  delete jsonSchema["$schema"];
  return jsonSchema;
}

/**
 * Write a generated spec.
 *
 * Written unformatted, then Prettier'd by the npm script — the repo's `format:check` covers these
 * JSON files, so a raw `JSON.stringify` here would make every regeneration fail `npm run check`.
 * The golden-file tests compare parsed JSON, so formatting never affects them either way.
 */
export function writeSpec(outputPath: string, spec: object): void {
  writeFileSync(outputPath, JSON.stringify(spec, null, 2) + "\n");
  console.log(`Generated ${outputPath}`);
}
