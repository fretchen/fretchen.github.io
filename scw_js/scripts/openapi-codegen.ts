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

/**
 * What `toComponentSchema` produces: JSON Schema 2020-12 as `z.toJSONSchema` emits it. Left
 * unmodelled on purpose — it is a superset of OpenAPI's own schema object (`const`, `prefixItems`,
 * `$defs`), so any field-by-field type here would be a lie that costs casts at every call site.
 * This is also why `openapi-types` is not a dependency: its `SchemaObject` does not accept this.
 */
export type JsonSchemaObject = Record<string, unknown>;

/** A fixed per-call price, or a metered one with a ceiling. */
export type PaymentInfo =
  | { protocols: readonly ["x402"]; price: { mode: "fixed"; currency: "USD"; amount: string } }
  | {
      protocols: readonly ["x402"];
      price: { mode: "dynamic"; currency: "USD"; min: string; max: string };
    };

interface ResponseObject {
  description: string;
  content?: Record<string, { schema: { $ref: string } | JsonSchemaObject }>;
}

/**
 * A paid operation. `x-payment-info` is required: an endpoint that charges and does not say so is
 * undiscoverable, and the omission is invisible in review.
 */
export interface PaidOperation<P extends PaymentInfo = PaymentInfo> {
  operationId: string;
  summary: string;
  description: string;
  tags: readonly string[];
  security: readonly [];
  "x-payment-info": P;
  requestBody: { required: true; content: Record<string, { schema: { $ref: string } }> };
  /** 200 and 402 are the floor every paid endpoint publishes; anything beyond is per-service. */
  responses: { "200": ResponseObject; "402": ResponseObject } & Record<string, ResponseObject>;
}

/**
 * The shape every spec this package publishes must have, so that dropping or misspelling a
 * load-bearing key is a compile error rather than a test assertion.
 *
 * `TServiceType` is a string *literal* per service — `website/hooks/x402Discovery.ts` compares
 * `x-service-type` with `===`, so a typo there makes the agent fail its own compatibility checker.
 * `TSchema` is the union of schema names the published docs render by name via `SpecParamTable`;
 * as a literal union it makes each name required and any third name an excess-property error.
 *
 * What this deliberately does NOT do: check conformance to the OpenAPI 3.1 standard. That would
 * need `openapi-types`, whose `paths` is an index signature (so it enforces nothing about `"/"` or
 * `post`) and whose operation extensions are all-or-nothing via `Document<T>` — it cannot express
 * any of the four guarantees above. See `test/openapi_*_generation.test.ts` for what remains
 * asserted at runtime and why.
 */
export interface ServiceSpec<
  TServiceType extends string,
  TSchema extends string,
  TPay extends PaymentInfo = PaymentInfo,
> {
  openapi: "3.1.0";
  info: {
    title: string;
    description: string;
    version: string;
    "x-guidance": string;
    contact: typeof CONTACT;
  };
  /** A signature over the origin — cannot be regenerated, so it is carried forward verbatim. */
  "x-discovery": { ownershipProofs: readonly [`0x${string}`] };
  "x-service-type": TServiceType;
  "x-interop-floor": string;
  "x-capabilities"?: readonly string[];
  servers: readonly [{ url: string }, ...{ url: string }[]];
  tags: readonly { name: string; description: string }[];
  paths: {
    "/": { post: PaidOperation<TPay> };
    "/openapi.json": ReturnType<typeof openApiJsonPath>;
  };
  components: { schemas: Record<TSchema, JsonSchemaObject> };
}

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
