## scw_js: full TypeScript migration

`scw_js` was the only serverless package in the monorepo with a mixed JS/TS codebase and no `tsconfig.json`. This PR brings it in line with `comment_service` and `x402_facilitator`.

### Deleted

- `classic_llm.js` — dead code, never imported, not in tsup entries.

### New `tsconfig.json`

Matches the sibling packages: `strict: true`, `verbatimModuleSyntax: true`, `moduleResolution: bundler`, `noEmit: true`. Source files only — test files are excluded (Vitest handles their TypeScript independently, and the mock patterns don't type-check cleanly under strict mode).

### Converted source files

| File | Notable types added |
|---|---|
| `getChain.js` → `getChain.ts` | `NetworkValidationResult` discriminated union; `readonly string[]` return types |
| `x402_server.js` → `x402_server.ts` | `PaymentRequirementsOptions`, `PaymentRequirements`, `HttpResponse` interfaces |
| `image_service.js` → `image_service.ts` | `Provider` union (`"ionos" \| "bfl"`), `ProviderConfig` interface |
| `sc_llm.js` → `sc_llm.ts` | `ScwEvent` interface — canonical handler event type, re-used by `genimg_x402_token.ts` |
| `llm_service.js` → `llm_service.ts` | `Leaf`, `MerkleTreeData`, `TreesData` interfaces (from JSDoc typedefs) |
| `genimg_x402_token.js` → `genimg_x402_token.ts` | `PreFlightResult`, `MintResult`, `GenerateResult` interfaces |

### Converted test files

6 test files renamed `.js` → `.ts`. Import paths retain `.js` extensions (correct for ESM TypeScript with `moduleResolution: bundler`).

### Config updates

- `tsup.config.js` — entry points updated to `.ts`
- `package.json` — `check` script adds `tsc --noEmit` before lint/tests; `dev:x402` uses `tsx` instead of `node`
- `eslint.config.js` — type-aware rules enabled for source files (`project: true`); test files use a separate block with `project: false`

### Known `any` casts (3 locations)

- `contract.write` in `genimg_x402_token.ts` — viem's `GetContractReturnType` generics require the wallet account type embedded to infer write option types; `any` is the pragmatic resolution for an initial migration
- `getResult.Body as unknown as AsyncIterable<Uint8Array>` in `llm_service.ts` — AWS SDK's `StreamingBlobPayloadOutputTypes` union doesn't overlap directly with `AsyncIterable`
- `getViemChain()` returns `Chain` from `chain-utils/node_modules/viem` (dual viem install); cast with `as unknown as Chain` to resolve the structural mismatch with the local viem

### Verification

`tsc --noEmit` ✅ · `npm run build` ✅ · `npm run lint` ✅ · 178/178 tests ✅
