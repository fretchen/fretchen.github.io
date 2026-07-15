# Upstream `@x402/evm` issues affecting this repo

Bugs found in the `@x402/evm`/`@x402/core`/`@x402/fetch` SDK (not our code) while verifying
Phase B of the batch-settlement migration (see `assistent_plan.md` §F) against a real,
locally-running server and real Base Sepolia transactions. Kept here — not filed yet — so the
evidence isn't lost before it's posted to [x402-foundation/x402](https://github.com/x402-foundation/x402/issues).

## Open: `processSettleResponse` crashes on deposit-type settle responses

**Status:** drafted, not yet filed. Draft text below, ready to paste into a new GitHub issue.

**Impact:** blocks a clean run of `wrapFetchWithPayment` for batch-settlement — every
first-time channel-opening request crashes client-side immediately after a real,
correctly-settled payment, before the caller's code ever sees success. Confirmed present in
`@x402/evm` 2.17.0 (what `scw_js`/`x402_facilitator` actually run) and 2.18.0 (npm latest).
`x402HTTPClient.processResponse()` — the higher-level API the official reference client uses
instead of `getPaymentSettleResponse()` — does **not** avoid it; the crash happens inside
`wrapFetchWithPayment` itself, before either method is reached.

**Workaround adopted:** a local `patch-package` patch applying the one-line defensive guard
from the "Suggested fix" section below, in `scw_js` and `x402_facilitator`. Removable once
upstream ships a real fix (patch-package fails loudly on a version bump if the patched file's
content changes, so we can't silently drift past the fix).

**Relation to prior report:** [#2404](https://github.com/x402-foundation/x402/issues/2404) is
the same crash, filed against 2.12.0, but withdrawn by its author for lack of a precise repro
("the condition... is something narrower than I claimed"). We have that repro — see below.

---

<!-- The following is the literal draft for the GitHub issue. Paste as-is (or edited) into
     https://github.com/x402-foundation/x402/issues/new -->

### Title

`@x402/evm/batch-settlement/client`: `processSettleResponse` crashes with `Cannot read properties of undefined (reading 'toLowerCase')` on deposit-type settle responses (reproducible, root-caused; supersedes withdrawn #2404)

### Summary

`processSettleResponse` in `@x402/evm/batch-settlement/client/channel.ts` guards `channelState` for null/undefined but not `channelState.channelId`. The server-side counterpart, `handleEnrichSettlementResponse` in `@x402/evm/batch-settlement/server/scheme.ts`, **unconditionally omits `channelId`** from the `channelState` it returns for `deposit`-type settlement responses (and, from source inspection, for the other two payload-type branches too). The combination means: **every** first-time channel-opening request through `wrapFetchWithPayment` crashes on a successful settlement, before the caller's code regains control.

This is the same crash reported and then withdrawn in #2404 ("re-checked... clean 3-call run and they all include channelId... the condition... is something narrower than I claimed"). We have the evidence that report was missing: the omission is not narrow or intermittent — it is unconditional for the `deposit` payload type, which is exactly the first call of every fresh channel. A "clean" run that never opened a _new_ channel (e.g. reused a warm one, or only exercised voucher-type settles that happened to include the field) would not hit it, which is consistent with why it looked intermittent.

### Environment

- `@x402/evm`: reproduced on **2.18.0** (current npm latest) and confirmed present (via direct source read, not just inference) in **2.17.0**
- `@x402/core`, `@x402/fetch`: 2.18.0
- Node 24.16.0, viem 2.21.x, TypeScript strict mode
- Network: Base Sepolia (`eip155:84532`), real facilitator, real on-chain deposit transaction

### Root cause

**Server side** — `@x402/evm/batch-settlement/server/scheme.ts`, `handleEnrichSettlementResponse`:

```js
if (isBatchSettlementDepositPayload(raw)) {
  return {
    channelState: { chargedCumulativeAmount: channel.chargedCumulativeAmount },
    chargedAmount: ctx.requirements.amount,
  };
}
```

No `channelId` field, for every deposit-type settlement — not conditional on anything.

**Client side** — `@x402/evm/batch-settlement/client/channel.ts`, `processSettleResponse`:

```js
async function processSettleResponse(storage, settle) {
  const extra = settle.extra ?? {};
  const channelState = readResponseChannelState(extra);
  if (!channelState) return;
  const channelId = channelState.channelId;
  const key = channelId.toLowerCase(); // <- throws: channelId is undefined
  ...
}
```

### Minimal reproduction (official reference code, both sides)

Server: `examples/typescript/servers/batch-settlement/index.ts`, unmodified, run as-is.

Client: `examples/typescript/clients/batch-settlement/index.ts`, with exactly two changes irrelevant to the bug (needed only because our resource server takes `POST` with a JSON body instead of `GET /weather`, and to pin the network instead of the default wildcard which otherwise may select a network the funded test wallet has no balance on):

```diff
- const response = await fetchWithPayment(url, { method: "GET" });
+ const response = await fetchWithPayment(url, { method: "POST", headers: {...}, body: "..." });
```

```diff
- client.register("eip155:*", batchedScheme);
+ client.register("eip155:84532", batchedScheme);
```

Run:

```
payer: 0x553179556FC2A39e535D65b921e01fA995E79101
salt: 0xd197dbcc92c14f70a441ccd3724347fa9eaa50b230524c98b850a5b51d6237f1
Request 1 — THREW: Cannot read properties of undefined (reading 'toLowerCase')
TypeError: Cannot read properties of undefined (reading 'toLowerCase')
    at processSettleResponse (.../@x402/evm/src/batch-settlement/client/channel.ts:97:25)
    at handleBatchSettlementPaymentResponse (.../@x402/evm/src/batch-settlement/client/hooks.ts:47:11)
    at onPaymentResponse (.../@x402/evm/src/batch-settlement/client/hooks.ts:18:31)
    at _x402Client.handlePaymentResponse (.../@x402/core/src/client/x402Client.ts:368:28)
    at x402HTTPClient.processPaymentResult (.../@x402/core/src/http/x402HTTPClient.ts:218:38)
    at <anonymous> (.../@x402/fetch/src/index.ts:125:37)
```

The underlying HTTP exchange succeeded — the resource server logged a real, correctly-settled payment (verified against on-chain state, not just `success: true`) — but the caller's `await fetchWithPayment(...)` promise **rejects**, so there is no way for application code to observe that success through the documented API.

We also confirmed `x402HTTPClient.processResponse()` — the higher-level method used by the official example instead of `getPaymentSettleResponse()` — does **not** avoid this. The crash occurs inside `wrapFetchWithPayment` itself (`x402HTTPClient.processPaymentResult`, called from `@x402/fetch`'s own wrapper), before either response-processing method is reached.

### Secondary, compounding effect

Because the crash happens before any client-side storage write, the client's local `ClientChannelStorage` never learns the channel was opened. Since `BatchSettlementEvmScheme`'s default `salt` is a fixed constant (undocumented on docs.x402.org, though the official example does expose it as a configurable `CHANNEL_SALT` env var), a retry — or even a fresh process using the same signer/receiver/network — recomputes the _same_ deterministic channel ID and collides with the server's already-updated state:

```
Request 2 — { "reason": "invalid_batch_settlement_evm_cumulative_amount_mismatch" }
Request 3 — { "reason": "invalid_batch_settlement_evm_cumulative_amount_mismatch" }
```

Fixing the primary crash should resolve this too, since the client would then persist state normally.

### Suggested fix

Symmetric with the existing `if (!channelState) return;` guard, client side:

```diff
   const channelState = readResponseChannelState(extra);
   if (!channelState) return;
   const channelId = channelState.channelId;
+  if (typeof channelId !== "string") return;
   const key = channelId.toLowerCase();
```

Defense in depth, server side: consider including `channelId` in all three `handleEnrichSettlementResponse` branches rather than only `chargedCumulativeAmount`/`chargedAmount`, since the client evidently expects it.

### Workaround we're using in the meantime

A local `patch-package` patch applying the one-line client-side guard above — identical in shape to the workaround #2404's author reported already shipping in their own production use before withdrawing the issue for lack of a precise repro. We now have that repro.
