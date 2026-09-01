# Fee Model: Implementation Plan

Status: proposed
Scope: `x402_facilitator/` (fee collection, splitter retirement, batch-settlement fees)

## Context

The facilitator currently charges a flat fee on the `exact` scheme only, collected
**after** settlement via `transferFrom(seller → facilitatorWallet)` against a
seller-granted USDC allowance. `batch-settlement` is fee-free and gated by a manual
whitelist instead.

Two problems motivate this plan:

1. **Unit economics.** Collecting a 0.01 USDC fee costs a full extra on-chain
   transaction, whose gas is of the same order as the fee itself. On Optimism this is
   likely loss-making per settlement; on Base it is around break-even.
2. **Reliability.** Fee collection has no persistence, so any failure loses the fee
   silently. It also runs inline with an unbounded wait for a second confirmation, so a
   slow fee transaction can time out the handler _after_ settlement has landed — losing
   the buyer's receipt for a payment that succeeded.

These are independent, and Phase 1 addresses only the second. The economics work is
deferred until the reliability work is in and there is traffic to justify it.

A third, smaller item: the buyer-pays splitter experiment (`x402_splitter_*.js`,
`EIP3009SplitterV1`) has been superseded by the merchant-pays model but is still
present in the repo without any marking.

Terminology: _merchant_, _seller_, _recipient_ and `payTo` all refer to the same party —
the operator of the resource server who receives the payment.

## Phase 1 — Make fee collection reliable

**Scope: reliability only.** Latency and unit economics are explicitly deferred —
see _Deferred from Phase 1_ at the end of this phase. The goal is that a fee owed is
never silently lost and never collected twice, with **no new infrastructure**: no
cron, no queue, no new deployed function.

Fee collection stays inline on the request path. Every settlement:

1. Reconciles the seller's outstanding pending collection, if any (1.3).
2. Accrues the fee owed for this payment (1.2).
3. Fires one `transferFrom` for the whole accrued total, with a bounded wait (1.1).

Retry falls out for free — the next payment from that seller picks up the previous
failure. No scheduled job is needed to make this correct.

**Accepted tradeoff:** a seller who stops trading leaves an uncollected dust balance
indefinitely, because nothing runs off the request path to collect it. This is an
economics concern, not a reliability one, and it is exactly what the deferred sweep
would fix if it ever becomes worth building.

### 1.1 Fee collection can consume the settle handler's timeout budget

`collectFee()` awaits `waitForTransactionReceipt` (`x402_fee.ts:247`) with **no
timeout**, and `x402_settle.ts` awaits `collectFee()` inline before returning — inside
a handler configured `timeout: 60s` (`serverless.yml`).

The latency cost (the buyer waits for two confirmations) is real but is _not_ what
makes this a defect. The defect is the failure mode: if the fee transaction is slow to
confirm, the handler is killed **after the settle transaction has already landed**, and
the buyer gets no receipt for a payment that succeeded. Money moved; the buyer cannot
prove it.

- [x] Bound the fee-collection wait — pass an explicit `timeout` to
      `waitForTransactionReceipt`, sized well inside the 60s handler budget.
      (`FEE_RECEIPT_TIMEOUT_MS = 10_000` in `x402_fee.ts`.)
- [x] On timeout, do not fail the settlement: return the buyer's receipt, and return
      the fee tx hash with `error: "fee_collection_pending"` so the outcome is
      recorded as _unknown_ rather than _failed_.

Fee collection must never be able to cost the buyer a receipt for a settled payment.

Note: the `transferFrom` _send_ was already bounded — viem's http transport defaults to
a 10s per-request timeout. Only the receipt polling loop was unbounded.

**Still open until 1.2/1.3:** `fee_collection_pending` is currently a dead end. The tx
hash is returned and logged, but nothing persists or reconciles it, so a timed-out fee
is still lost in practice. 1.1 only guarantees it is not lost _at the buyer's expense_.

### 1.2 No persistence for uncollected fees

The current code logs `"flagging for retry"` but nothing is flagged anywhere; a failed
fee is simply lost. This is the substantive change of the phase.

- [x] Add a store with one entry per `(seller, network)`, holding `accrued`,
      a nullable `pending` (`txHash` + `amount`, cleared on reconcile in 1.3),
      and `lastSuccess` (`txHash` + `at`).
- [x] Every settlement that owes a fee increments `accrued`.
- [x] Collection decrements it only on confirmed success.

Implemented in `x402_fee_ledger.ts` on `@fretchen/s3-utils` — no new infrastructure,
just one JSON object per seller at `fees/{network}/{seller}.json`. Scaleway Serverless
SQL and Redis were both considered and rejected: `shared/s3-utils` already provides
ETag compare-and-swap (`putS3ObjectConditional` with `ifMatch`/`ifNoneMatch`), which is
all the atomicity a per-seller counter needs, and `scw_js/x402_channel_storage.ts`
already proves the pattern in production.

Two normalisations are load-bearing: the seller address is lowercased (EIP-55 checksum
casing would otherwise split one seller across two entries) and the CAIP-2 colon is
replaced in the key.

**Failure policy:** every ledger operation swallows its errors, and the settle path
wraps them again in `safeLedgerWrite()`. An S3 outage degrades fee bookkeeping; it must
never stop payments. This is the same fail-open stance as 1.4, for the same reason —
the buyer's payment is worth far more than a 0.01 USDC fee.

This store is the foundation for 1.3, 1.4 and all of Phase 3.

### 1.3 Collection must be idempotent

Once the wait is bounded (1.1), a timeout means we genuinely **do not know** whether
the `transferFrom` landed. Retrying blindly double-charges the seller; assuming failure
and re-accruing does the same. This is the real remaining hazard once persistence
exists.

- [x] Fire `transferFrom(accrued_total)`, record the pending hash and amount, then wait
      only briefly.
- [x] On that seller's **next** settlement, resolve the pending hash _first_ —
      confirmed success decrements `accrued` by the pending amount, clears pending and
      records `lastSuccess`; reverted or still-not-found clears pending and leaves
      `accrued` intact so it retries naturally.
- [x] Never fire a new collection while a pending hash is unresolved.

Implemented in `x402_fee_collection.ts`, which owns the whole flow so `x402_settle.ts`
makes one call. Every fee-bearing settlement runs: reconcile → accrue → sweep. The
ordering is load-bearing — reconciling first clears the old debt before this payment's
fee is added, so the sweep total is right.

`getTransactionStatus()` (`x402_fee.ts`) resolves a pending hash with a point query.
It returns `"unknown"` for both "no receipt yet" and any RPC failure, and an unknown
outcome **blocks** collection rather than guessing: guessing "reverted" re-collects a
fee that already landed, guessing "success" drops one that never did.

**Stale pending:** an unresolved hash older than `PENDING_STALE_MS` (30 min) is written
off — pending cleared, debt left standing. Tradeoff: a tx landing after that window is
collected twice. On an L2 with ~2s blocks a tx unmined for 30 minutes has almost
certainly been dropped, and wedging a seller's collection forever on one lost tx is
worse. Revisit if it ever fires in practice.

**Ledger-disabled fallback preserved:** with no S3 credentials there is no accrued total,
so the sweep falls back to the flat per-settlement fee — byte-for-byte the pre-ledger
behaviour.

### 1.4 Allowance check fails open

`checkMerchantAllowance()` returned `{ allowance: 0n, sufficient: true }` on any RPC
error — indistinguishable from a genuine reading. The caller could not tell "we could
not check" from "the allowance is fine".

- [x] RPC/read error → fail open, log at `warn`, still accrue.
- [x] Surface `remainingSettlements` in the verify response so sellers get warning
      before they hit zero.
- [x] Cap the sweep at the seller's allowance (replaces the "accrued debt + new fee"
      bullet — see below).

`AllowanceInfo.sufficient` became `status: "ok" | "insufficient" | "unknown"`, with
`allowance` now **optional** and left undefined when unreadable. Changing the type was
the point: the compiler found every call site and forced each to handle the third case.

**Fail-closed already existed** (`facilitator_instance.ts`) and is unchanged — a payment
whose seller has not approved enough for one fee is still rejected. The original bullet
proposed escalating that threshold to _accrued debt + new fee_; that was dropped:

- the flat check is already self-limiting — collecting drains the allowance, so an
  under-approving seller is blocked naturally once it runs down;
- it punishes the **buyer** for the **seller's** backlog, rejecting a valid payment over
  the facilitator's own bookkeeping.

**Instead, the sweep is capped** at `min(accrued, allowance)`. This fixes a defect 1.3
introduced: one `transferFrom` for more than the seller approved reverts _in full_, so an
uncapped sweep of a backlog collected nothing at all rather than as much as possible. A
partial sweep leaves the remainder accrued.

An **unknown** allowance deliberately does not cap — capping to `0n` would silently halt
all collection during a transient RPC blip. This is the reason `allowance` is optional
rather than defaulting to zero.

The allowance is read once during verify and carried through to settle on `VerifyResult`,
so capping costs no extra RPC round-trip.

### 1.5 Receipt semantics under accrual

A single `transferFrom` covers the seller's whole accrued balance, which may span
several past payments — so the amount collected never maps cleanly onto the payment
whose receipt is being written. With a bounded wait it may also still be pending when
the receipt is returned. Reporting only what was collected would make
`facilitatorFeePaid` misleading on almost every receipt.

- [ ] Report the fee **assessed** for this payment in the `facilitatorFees` extension.
- [ ] Report collection status as a separate field, not by zeroing the amount.
- [ ] Keep the `#1016` disclosure shape so this stays compatible with the Sei fee
      transparency proposal.

### 1.6 Surface repeated collection failure

1.4 decides when to fail open and when to fail closed, but nothing tells a human that a
seller's balance has been stuck across many attempts. Persistence makes the debt
_recorded_; it does not make it _visible_.

- [x] Track a consecutive-failure counter on the row.
- [x] Log at `error` once it crosses a small threshold, reusing the existing logger.

Done alongside 1.3, which sharpened the need for it: "never collect while a pending hash
is unresolved" means one dropped transaction can wedge a seller's collection, and
without this that would be entirely silent. `recordCollectionFailure()` increments
`consecutiveFailures`; a success resets it to 0, and a pending outcome leaves it alone
(unknown is not failure). Crossing `FAILURE_ALERT_THRESHOLD` (5) logs at `error` with
the seller and accrued total. Deliberately just a log line.

Deliberately minimal — this is not a new alerting system.

### Deferred from Phase 1

Both items are real, neither is a reliability problem, and neither is on the critical
path. Revisit only with evidence.

**Batching fee collection into periodic sweeps** _(economics)_. Replace the
per-settlement `transferFrom` with a scheduled sweep triggered by accrued balance ≥
threshold or age ≥ 24h, one `transferFrom` per seller per sweep, run off the request
path (`wallet_report_cron.ts` is the pattern to model it on). This is what drives
fee-collection gas per payment toward zero. Note that inline collection of the _whole
accrued balance_ (1.3) already amortises naturally whenever a seller has a backlog, so
the threshold/age machinery buys less than it first appears. The settle transaction
remains an irreducible floor for `exact` either way — one on-chain transfer per payment.

**Nonce contention on the facilitator wallet** _(robustness under load)_. Each request
can fire two sequential transactions from a single EOA; concurrent settlements risk
nonce collisions and stuck transactions. Keeping collection inline means the fee
transaction stays on the concurrent request path, so this is _not_ reduced by anything
in Phase 1 — but the settle transaction is concurrent regardless, so moving fee
collection off the request path was never a real fix for it either. At current traffic
this is not worth pre-solving. If stuck or colliding transactions are actually
observed, serialize sends through a single nonce-managing path.

---

## Phase 2 — Retire the splitter

Independent of Phases 1 and 3; can run in parallel.

The splitter is **already absent from `serverless.yml`** — it is dead code, not a live
endpoint. This is documentation work, not deletion.

**Do not delete the contract or its deployment.** `EIP3009SplitterV1` at
`0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946` (Optimism Sepolia) is the reference
implementation cited in [issue #937](https://github.com/x402-foundation/x402/issues/937).
Deleting it would leave that open issue pointing at nothing.

- [ ] Add a header block to each of `x402_splitter_facilitator.js`,
      `x402_splitter_settle.js`, `x402_splitter_supported.js`,
      `x402_splitter_verify.js`: superseded by the merchant-pays model in
      `x402_fee.ts`; retained as the reference implementation for #937; not deployed.
- [ ] Add the same note at the top of `notebooks/x402_facilitator_demo_with_fees.ipynb`
      and `notebooks/x402_fee_facilitator_demo.ipynb`.
- [ ] Add a **"Fee model history"** section to `README.md` (draft below).
- [ ] Leave `eth/contracts/EIP3009SplitterV1.sol` and its deployment untouched.
- [ ] Add a lint-ignore / coverage-exclude entry so the retained files do not rot
      silently or distort coverage.

### Draft README section

> **Fee model history**
>
> Two fee models were implemented. Neither is friction-free without protocol support;
> the choice is about _where_ the friction lands.
>
> - **Buyer-pays split** (`x402_splitter_*.js`, `EIP3009SplitterV1`, retained but not
>   deployed): the buyer signs a single authorization to a splitter contract, which
>   atomically pays seller and facilitator. The seller needs no setup, but the buyer
>   needs a non-stock client, and `payTo` shows the splitter rather than the actual
>   recipient — so the buyer cannot see who they are paying from the payment
>   requirements alone.
> - **Merchant-pays post-settlement** (`x402_fee.ts`, current): the buyer is entirely
>   untouched and stock `@x402/fetch` works. The seller must `approve()` the
>   facilitator wallet for USDC and trust it not to over-pull.
>
> The current model matches the industry norm (Stripe, Coinbase CDP bill the merchant,
> not the payer). It does not eliminate onboarding friction — it moves it from the
> buyer to the seller.

This section is also the raw material for a substantive comment on #937: field
experience from having built both, which no one else in that thread has.

---

## Phase 3 — Fees on batch-settlement

Depends on the Phase 1 accrual store.

### 3.1 Charge per claim, not per voucher

A voucher costs nothing on-chain — verification is off-chain signature checking. A
claim is the only on-chain cost, and it is already amortised across N requests.

Charging per voucher would reintroduce exactly the gas problem that makes `exact`
marginal, on a scheme that does not have it.

- [ ] In `x402_settle.ts`, replace the blanket `!isBatchSettlement` fee exclusion with
      a branch: - voucher payloads → accrue nothing - `claim` / `settle` payloads → assess a fee

### 3.2 Scale the fee to the claim

- [ ] Assess `n_vouchers × unit_rate` rather than a flat amount — a claim sweeping 500
      vouchers is worth more to the seller than one sweeping 5.
- [ ] Set `unit_rate` well below the `exact` fee: marginal cost per request here is
      near zero. This is the best-margin product; price it to win volume.

### 3.3 Drop the whitelist

`BATCH_SETTLEMENT_MANUAL_WHITELIST` exists only because the scheme was fee-free and had
no abuse gate. A claim-time fee provides the same allowance-based gate that `exact`
uses.

- [ ] Retire `BATCH_SETTLEMENT_MANUAL_WHITELIST`; gate on allowance instead.
- [ ] Keep `BATCH_SETTLEMENT_TEST_WALLETS` for testnet convenience.
- [ ] Open the scheme to unlisted recipients.

### 3.4 Update `/supported`

`FacilitatorFeesDisclosure` in `x402_supported.ts` currently describes a single flat
model.

- [ ] Express fees per scheme: flat-per-settlement for `exact`,
      per-voucher-at-claim for `batch-settlement`.
- [ ] Preserve the `#1016` shape for forward compatibility.
- [ ] Update the `setup` block — it currently describes only the `exact` approval flow.

---

## Phase 4 — Network policy (decision, not code)

Depends on Phase 0 and on batching actually landing. Since batching is deferred out of
Phase 1, the re-measurement step below is **on hold** — Phase 1 does not change unit
economics, so re-measuring straight after it would only re-confirm Phase 0.

- [ ] Re-run the Phase 0 measurement after batching lands.
- [ ] If unit margin on Base is not clearly positive, the fee level or the sweep
      threshold is wrong — fix before opening batch-settlement publicly (3.3).
- [ ] Decide explicitly whether fee-bearing `exact` traffic on Optimism is wanted at
      all. Advertising `exact` fee-free on Optimism and fee-bearing on Base is a
      coherent product, provided it is disclosed in `/supported`.

---

## Sequencing

```
Phase 0  ──►  1.2  ──►  1.3  ──►  1.1  ──►  1.4, 1.5, 1.6  ──►  Phase 3  ──►  Phase 4
              store   idempot.  bounded
                                  wait
Phase 2  ──────────────────────────────────────────────►  (independent, any time)

Deferred (off the critical path): batching/sweeps · nonce serialization
```

**Checkpoint after Phase 1:** Phase 1 is reliability-only and does not move unit
economics, so there is nothing new to measure. What it does deliver is the accrual
store that Phase 3 depends on.

The economics gate still stands, but it now sits on the deferred batching work rather
than on Phase 1: do not start Phase 3 until `exact` unit margin is positive on at least
one network — otherwise batch-settlement inherits the same broken economics at greater
volume.

---

## Non-goals

- Reviving the buyer-pays splitter as a production path.
- Proposing a new x402 _scheme_. Nothing in this plan requires a protocol change;
  as of 2026-09-01 the upstream repo still has no fee extension or split scheme
  merged, and none is assumed here.
- Competing on price with subsidised facilitators. At realistic volumes the absolute
  revenue is small; the value of this work is a defensible reference implementation
  and credible operating experience for the #937 discussion.
