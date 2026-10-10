# Universal Review Checklist (Layer 1)

Vendored from Wubabalala/claude-skills `skills/code-review/references/universal-checklist.md`
(commit ba4e5e4a), then **adapted to this repo's stack** (TypeScript/React SSR, Solidity/Hardhat,
Scaleway serverless, x402 stablecoin payments). The language-agnostic sections are unchanged;
the stack-specific examples were translated — upstream's Java/Spring transaction items became
money-and-atomicity items for this codebase.

## P0 Security Issues [must fix]

- Hardcoded passwords, API keys, tokens, private keys (also in tests and fixtures)
- SQL injection (unparameterized queries)
- XSS (unescaped user input rendered into HTML rather than JSX text)
- Unsafe eval / new Function / exec of interpolated input
- Permission checks removed or relaxed (auth gates in Scaleway handlers, NFT-holder or
  owner checks in contracts, wagmi-based gating in the frontend)

## P0 Money & State Atomicity [must fix]

Check whenever code moves money or mutates state across a boundary (x402 payments,
channel deposits, contract writes, serverless handler state):

- A multi-step money operation that can half-apply: the deposit or signature succeeded but
  the follow-up request failed (or vice versa), leaving paid-but-unrecorded or
  recorded-but-unpaid state. Ask: what does the code do when step 2 throws?
- On-chain state and the client's cached copy diverge with no reconciliation path —
  verify a resync/recovery exists before caching anything the chain is authoritative for
  (the drained-channel resync in `website/utils/x402PaidFetch.ts` is the pattern).
- A wallet signature request that can hang or be dropped silently (no timeout, no error
  surfaced) — the user sees an infinite spinner and the turn never ends.
- A catch block that swallows a payment failure so the caller cannot distinguish
  "paid and done" from "paid nothing, got nothing".
- Channel identity: deposit/top-up parameters (wallet, receiver, token, network, salt)
  hash into `channelId` — a change that recomputes the id silently opens a second channel
  the user has to fund again.

## P0 Logging Secrets Leakage [must fix]

Hardcoded secrets in source code is a known risk; this section covers the often-missed
runtime leakage and persistence patterns.

### P0a: Direct print of secrets at runtime

Any logger / console call printing a secret-bearing value directly:

- Pattern: `(console|log|logger|print)\.(log|info|debug|warn|error|println).*\b(token|password|auth.?code|secret|api.?key|credential|private.?key)\b`
- Example: `console.log('Token restored:', user.token)` — leaks the JWT/token to anyone with browser DevTools or to log aggregators

### P0b: Persisting secrets to client-accessible storage

Writing a secret to any client-readable storage location:

- Pattern: `(localStorage|sessionStorage)\..*\b(token|password|authCode|secret|apiKey|credential)\b`
- Example: `localStorage.setItem('token', jwt)` — any XSS or third-party JS on the page reads the full credential
- For `zustand` / `redux-persist` etc.: verify the `partialize` / persist allowlist EXCLUDES secret fields; persisting `user` object that contains `user.token` is the same leak
- **Known accepted exception in this repo**: the x402 voucher-signer private key in
  `localStorage` (`x402-voucher-signer:*`) is deliberate and its blast radius is bounded —
  it can only sign vouchers against the already-escrowed deposit. Do not report it as P0;
  the reasoning is in `website/utils/x402PaidFetch.ts`.

### P0b extension (conditional): JS-writable cookies

`document.cookie = '...token=...; ...'` is a P0 ONLY when the cookie is JS-writable.

- HttpOnly server-set cookies are NOT in this category — they're a defense (JS cannot read them), not a leak
- The reviewer MUST first verify the cookie is JS-writable (no `HttpOnly` flag, set from client code) before flagging as P0
- If unclear, ask the author rather than flagging

## P1 Logic Bugs [must fix]

- Errors that will cause crashes
- Logic that will produce incorrect data
- Resource leaks: unclosed connections, uncleared timers/intervals/subscriptions
  (including React effects that subscribe without cleaning up)
- Race conditions — including stale-closure bugs in React hooks (a callback capturing an
  outdated value because it was not re-created when its dependency changed)
- Floating promises: an async call without `await` whose rejection nobody handles, so a
  failure is invisible at the point where the caller believes the work is done
- Return value disconnected from computed result (e.g., builds a list then returns empty/different object)
- Request attribute name mismatch between producer and consumer (e.g., an interceptor
  sets "adminId" but the handler reads "userId")

## P1 API Input Validation [must fix]

- Request body fields accessed without checking presence — `body.x.y` throws when the key
  is absent; the handler must parse through the Zod schema instead of reaching into the raw body
- Numeric fields parsed without validation — `Number(input)`, `BigInt(input)` throw or
  silently produce `NaN` on invalid input
- Missing business validation before use (empty strings, negative amounts, zero values,
  out-of-range pagination)

## P2 Robustness [should fix]

- Missing necessary try-catch
- Empty catch blocks
- Unhandled edge cases (null, empty arrays)
- N+1 reads: per-item RPC or contract reads inside a loop when a multicall batch
  (wagmi `useReadContracts`, viem `readContract` batching) exists for exactly this
- Repeated computation/requests inside loops or per-render (missing memoization where it matters)
- Obvious memory leaks
- Unbounded caches (a Map or object that grows with user input and is never pruned)

## P3 Maintainability [optional fix]

- Functions longer than 100 lines
- Nesting deeper than 4 levels
- Significant code duplication (>20 similar lines)
- Magic numbers
- console.log / print debug remnants
- Commented-out code blocks
- TODO/FIXME
