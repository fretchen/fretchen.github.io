# Upstream issue draft — x402-foundation/x402

> Draft of a GitHub issue for the `@x402/evm` batch-settlement server SDK, to be filed under
> x402-foundation/x402. Delete this file once filed; the PR description carries the link.
> Repro data is from this repo's production, 2026-10-11 (see the 2026-10-11 alert pair and the
> sweep partition in `llm_x402_cron.ts` for the local workaround).
>
> Suggested title: "batch-settlement: a fully-claimed channel record blocks the whole refund
> sweep forever (ZeroRefund loop)".

---

## What happened

Our claim cron (`ChannelManager.claimAndSettle()` then `refundIdleChannels()`) entered a livelock: one channel with nothing left to refund caused every refund in the sweep to fail, twice a day, until we intervened manually.

Production repro (Base, EURe, `x402BatchSettlement` at 0x4020074e9dF2ce1deE5A9C1b5c3f541D02a10003):

- Channel `0x282ed18b770dd680dbd082dd5873c2d2d71c5ab41a6cc385bb94f605a8ad609e`: `balance == totalClaimed == chargedCumulativeAmount == 0.011` (all on-chain, read via `channels()`). The payer spent their whole deposit; the chain holds nothing for this channel.
- Claims never delete the channel record (only a successful refund does, `refundChannel` → `updateChannel(id, () => undefined)`), so the record lingered with `balance != 0`.
- `getIdleChannelsForRefundFromChannels` filters on `balance !== 0`, so the dead record was re-selected on every sweep.
- `refundChannel` computes `refundAmount = balance - chargedCumulativeAmount = 0` and submits it anyway.
- The contract reverts `ZeroRefund()` (`contracts/evm/src/x402BatchSettlement.sol`, selector 0xd758525c). Note the SDK's ABI fragment for `refundWithSignature` declares no `error` entries, so viem logs "Unable to decode signature 0xd758525c" — the revert reason is invisible without a signature-DB lookup.
- `refundChannels` has no per-channel catch: the first failure throws out of the loop, so the two genuinely refundable channels behind it (0.028611 + 0.029157 EURe) never got their refunds. They would have been stuck indefinitely.

## The four gaps

1. **Zero-amount refunds are built and submitted** (`server/index.js` `refundChannel`): a channel with `balance <= chargedCumulativeAmount` should never be submitted for refund — the contract structurally rejects it (`ZeroRefund()`).
2. **`refundChannels` aborts the batch on the first failure.** One bad channel (this, or the already-documented stale-`refundNonce` case, selector 0x164f1afe) blocks refunds for every other channel. We now loop `manager.refund([id])` per channel with our own try/catch to work around this.
3. **Fully-claimed records are never garbage-collected.** After `totalClaimed` reaches `balance`, the record has no purpose, but it stays and re-triggers gap 1 on every sweep — forever, since the failed refund also never deletes it.
4. **The facilitator's own zero-refund guard is unreachable for zero-amount requests** (`@x402/evm` 2.28, `batch-settlement/facilitator/index.js`). `getRefundableAmount` returns `null` when `requestedAmount === 0n` (or when the claims exceed the balance), but `executeRefundWithSignature` only checks `if (refundableAmount === 0n)` — `null` falls through, the request reaches `refundWithSignature` simulation, reverts `ZeroRefund()`, and surfaces as `invalid_batch_settlement_evm_refund_simulation_failed` with viem's "Unable to decode signature" text instead of the intended `invalid_batch_settlement_evm_refund_no_balance` ("Nothing to refund"). The dedicated error code exists but cannot fire for the one case its message describes. (`refund_no_balance` is still reachable — a _non-zero_ refund request against a drained channel — which is why this reads like a null/0n confusion rather than a missing feature.)

## Also observed

- The reference TypeScript example (`examples/typescript/servers/batch-settlement/index.ts`) selects refund targets with the same under-selective predicate — `balance !== 0`, live-pending filter, idle threshold — so a fully-claimed record re-enters the refund job there too; with `refundIntervalSecs: 180` the job throws every 180 s into `onError` and no other idle channel is refunded. Durable storage makes this permanent; the default in-memory storage only hides it until the next restart, which may be why it is more visible in serverless deployments.
- With in-memory channel storage (the default), a restart wipes the dead record and the livelock self-heals — durable storage (File, Redis, or a custom implementation like our S3 one) keeps it forever. The record lifecycle — created on verify, updated on claim, deleted only on a successful refund — lives entirely in the manager, not in any storage backend; this is not a storage-implementation bug.

## Suggested fixes

- `refundChannel`: skip (and delete the record, or flag it drained) when `balance <= chargedCumulativeAmount` — nothing is refundable.
- `refundChannels`: isolate per-channel failures (collect results, don't throw on the first).
- `claimAndSettle`/claim paths: delete or drain-flag the record once the chain shows `balance == totalClaimed` and nothing is claimable, so the idle-refund filter stops selecting it.
- `executeRefundWithSignature`: treat `getRefundableAmount(...) === null` as `ErrRefundNoBalance` (or make it return `0n` for the zero-request case), so the intended error code fires instead of a `ZeroRefund` simulation failure.
- Optional: include the contract's custom errors in the ABI fragment used for simulation, so reverts decode to `ZeroRefund()` instead of a raw selector.

We have implemented 2 and 3 as a workaround in our own cron (per-channel `refund([id])` + garbage-collecting fully-claimed records), and would happily drop the workaround once the SDK handles these.

Environment: @x402/evm 2.57.x (TS server package), Base mainnet, EURe (Monerium).
