## scw_js: dependency updates + full TypeScript migration

Two things in one branch: dependency bumps (PR #493) and the TypeScript migration that was always the follow-up.

---

### Part 1 — Dependency updates

| Package | From | To | Notes |
|---|---|---|---|
| `@aws-sdk/client-s3` | 3.975.0 | 3.1061.0 | |
| `@x402/core` | 2.2.0 | 2.14.0 | breaking — see below |
| `@x402/evm` | 2.2.0 | 2.14.0 | breaking — see below |
| `dotenv` | 17.2.3 | 17.4.2 | |
| `pino` | 10.3.0 | 10.3.1 | |
| `tsx` | 4.21.0 | 4.22.4 | |
| `@vitest/eslint-plugin` | 1.6.18 | 1.6.19 | |
| `@types/node` | 24.10.9 | 25.9.1 | |
| `serverless-scaleway-functions` | 0.4.18 | 0.5.1 | |
| `vitest` | — | 4.1.8 | patched via `npm audit fix` (2 critical CVEs) |

**`@x402/core` 2.14.0 breaking changes fixed:**
- `HTTPFacilitatorClient` now calls `response.text()` instead of `response.json()`, then validates through Zod.
- `logExtensionResponsesHeader` reads `response.headers.get("EXTENSION-RESPONSES")` after every verify/settle call.

Test mocks were plain objects with only `json`. The missing `text()` caused a TypeError; the missing `headers` caused a crash in the post-verify hook that silently swallowed the result, making every payment test return 402. Fixed by introducing `makeMockResponse()` in `test/setup.ts` — a factory that returns a proper Response-like object.

**vitest 4 breaking change fixed:** `test.poolOptions.threads.singleThread` is now a top-level option. Updated `vitest.config.js`.

**Remaining audit notices (17):** all in devDependencies only (`@scaleway/serverless-functions`, `serverless-scaleway-functions`, `@openzeppelin/merkle-tree`). No non-breaking fix available upstream. None reach the deployed bundle.

---

### Part 2 — TypeScript migration

`scw_js` was the only serverless package in the monorepo with mixed JS/TS and no `tsconfig.json`. This PR brings it in line with `comment_service` and `x402_facilitator`.

#### Deleted

- `classic_llm.js` — dead code, never imported, not in tsup entries.

#### New `tsconfig.json`

Matches the sibling packages: `strict: true`, `verbatimModuleSyntax: true`, `moduleResolution: bundler`, `noEmit: true`. Source files only — test files excluded (Vitest handles their TypeScript independently, and the mock patterns don't type-check cleanly under strict mode).

#### Converted source files

| File | Notable types added |
|---|---|
| `getChain.js` → `getChain.ts` | `NetworkValidationResult` discriminated union; `readonly string[]` return types |
| `x402_server.js` → `x402_server.ts` | `PaymentRequirementsOptions`, `PaymentRequirements`, `HttpResponse` interfaces |
| `image_service.js` → `image_service.ts` | `Provider` union (`"ionos" \| "bfl"`), `ProviderConfig` interface |
| `sc_llm.js` → `sc_llm.ts` | `ScwEvent` interface — canonical handler event type, re-used by `genimg_x402_token.ts` |
| `llm_service.js` → `llm_service.ts` | `Leaf`, `MerkleTreeData`, `TreesData` interfaces (from JSDoc typedefs) |
| `genimg_x402_token.js` → `genimg_x402_token.ts` | `PreFlightResult`, `MintResult`, `GenerateResult` interfaces |

#### Converted test files

6 test files renamed `.js` → `.ts`. Import paths retain `.js` extensions (correct for ESM TypeScript with `moduleResolution: bundler`).

#### Config updates

- `tsup.config.js` — entry points updated to `.ts`
- `package.json` — `check` script adds `tsc --noEmit` before lint/tests; `dev:x402` uses `tsx` instead of `node`
- `eslint.config.js` — type-aware rules enabled for source files (`project: true`); test files use a separate block with `project: false`

#### Known `any` casts (3 locations)

- `contract.write` calls in `genimg_x402_token.ts` — viem's `GetContractReturnType` generics require the wallet account type embedded to infer write option types; casting to `any` is the pragmatic resolution for an initial migration
- `getResult.Body as unknown as AsyncIterable<Uint8Array>` in `llm_service.ts` — AWS SDK's `StreamingBlobPayloadOutputTypes` union doesn't directly overlap with `AsyncIterable`
- `getViemChain()` returns `Chain` from `chain-utils/node_modules/viem` (dual viem install in the monorepo); cast with `as unknown as Chain` from the local viem to avoid the structural mismatch

---

### Verification

`tsc --noEmit` ✅ · `npm run build` ✅ · `npm run lint` ✅ · 178/178 tests ✅
