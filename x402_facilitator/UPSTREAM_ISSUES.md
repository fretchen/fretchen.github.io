# Upstream `@x402/evm` issues affecting this repo

Bugs we hit in the `@x402/evm` SDK (not our code) while testing the batch-settlement
migration against a real server and real Base Sepolia transactions. Kept here until filed
at [x402-foundation/x402](https://github.com/x402-foundation/x402/issues).

## `processSettleResponse` crashes when a channel is first opened

**Status:** not yet filed. The draft below is ready to paste into a new issue.

**Effect:** the first request that opens a payment channel through `wrapFetchWithPayment`
throws `Cannot read properties of undefined (reading 'toLowerCase')` — even though the
payment settled correctly on-chain. The caller sees a thrown error instead of a success.

**Workaround we use:** a one-line `patch-package` guard on the client (see the fix below),
in `scw_js` and `x402_facilitator`. `patch-package` will fail if the file changes upstream,
so we'll notice when a real fix ships.

**Versions:** seen on `@x402/evm` 2.17.0 (what we run) and 2.18.0 (latest).

---

<!-- Draft for the GitHub issue. Paste into https://github.com/x402-foundation/x402/issues/new -->

### Title

`batch-settlement/client`: `processSettleResponse` throws `toLowerCase` of undefined when a channel is first opened

### What happens

The first request that opens a channel through `wrapFetchWithPayment` throws:

```
TypeError: Cannot read properties of undefined (reading 'toLowerCase')
    at processSettleResponse (@x402/evm/batch-settlement/client/channel.ts)
```

The payment itself succeeds — the server settles it on-chain — but the client throws while
reading the settlement response, so application code never sees the success.

### Cause

The client reads `channelId` from the settlement response and lowercases it:

```js
// batch-settlement/client/channel.ts
const channelId = channelState.channelId;
const key = channelId.toLowerCase();   // channelId is undefined here
```

But the server does not put `channelId` in the response for a deposit (channel-open) settlement:

```js
// batch-settlement/server/scheme.ts — handleEnrichSettlementResponse
if (isBatchSettlementDepositPayload(raw)) {
  return {
    channelState: { chargedCumulativeAmount: channel.chargedCumulativeAmount },
    // no channelId
    chargedAmount: ctx.requirements.amount,
  };
}
```

So on the first request of every new channel, the client reads a field the server didn't send.

### Environment

- `@x402/evm` 2.18.0 (also present in 2.17.0), `@x402/core` / `@x402/fetch` 2.18.0
- Network: Base Sepolia (`eip155:84532`), real facilitator, real on-chain deposit

### Reproduction

Run the official batch-settlement client and server examples against Base Sepolia with a
funded wallet. The first request throws with the stack trace above; the server logs a
successful settlement.

(In our own setup we call `POST` with a JSON body instead of `GET /weather`, and pin the
network with `client.register("eip155:84532", ...)` instead of `"eip155:*"` — neither
affects the crash.)

### Suggested fix

Guard the client read, matching the existing null check just above it:

```diff
   const channelId = channelState.channelId;
+  if (typeof channelId !== "string") return;
   const key = channelId.toLowerCase();
```

Or include `channelId` in the deposit response server-side, since the client expects it.

### Note

Looks like the same crash as #2404, which was filed against 2.12.0 and withdrawn for lack of
a clear reproduction. If so, this can supersede it.
