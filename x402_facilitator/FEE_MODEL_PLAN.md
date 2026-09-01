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
   slow fee transaction can time out the handler *after* settlement has landed — losing
   the buyer's receipt for a payment that succeeded.

These are independent, and Phase 1 addresses only the second. The economics work is
deferred until the reliability work is in and there is traffic to justify it.

A third, smaller item: the buyer-pays splitter experiment (`x402_splitter_*.js`,
`EIP3009SplitterV1`) has been superseded by the merchant-pays model but is still
present in the repo without any marking.

Terminology: *merchant*, *seller*, *recipient* and `payTo` all refer to the same party —
the operator of the resource server who receives the payment.


## Phase 1 — Make fee collection reliable

**Scope: reliability only.** Latency and unit economics are explicitly deferred —
see *Deferred from Phase 1* at the end of this phase. The goal is that a fee owed is
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

The latency cost (the buyer waits for two confirmations) is real but is *not* what
makes this a defect. The defect is the failure mode: if the fee transaction is slow to
confirm, the handler is killed **after the settle transaction has already landed**, and
the buyer gets no receipt for a payment that succeeded. Money moved; the buyer cannot
prove it.

- [ ] Bound the fee-collection wait — pass an explicit `timeout` to
      `waitForTransactionReceipt`, sized well inside the 60s handler budget.
- [ ] On timeout, do not fail the settlement: record the collection as pending (1.3)
      and return the buyer's receipt.

Fee collection must never be able to cost the buyer a receipt for a settled payment.

### 1.2 No persistence for uncollected fees

The current code logs `"flagging for retry"` but nothing is flagged anywhere; a failed
fee is simply lost. This is the substantive change of the phase.

- [ ] Add a store (Scaleway Serverless SQL, or Redis) with one row per
      `(seller, network)`:
      - `accrued` — atomic units owed
      - `pending_tx_hash` + `pending_amount` — nullable; set when a collection is
        fired, cleared on reconcile (1.3)
      - `last_success_tx_hash` + `last_success_at`
- [ ] Every settlement that owes a fee increments `accrued`.
- [ ] Collection decrements it only on confirmed success.

This table is the foundation for 1.3, 1.4 and all of Phase 3.

### 1.3 Collection must be idempotent

Once the wait is bounded (1.1), a timeout means we genuinely **do not know** whether
the `transferFrom` landed. Retrying blindly double-charges the seller; assuming failure
and re-accruing does the same. This is the real remaining hazard once persistence
exists, and the current design does not address it at all.

- [ ] Fire `transferFrom(accrued_total)`, record `pending_tx_hash` and
      `pending_amount`, then wait only briefly.
- [ ] On that seller's **next** settlement, resolve the pending hash *first*:
      - confirmed success → decrement `accrued` by `pending_amount`, clear pending,
        record `last_success_*`
      - reverted, or still not found → clear pending, leave `accrued` intact so it
        retries naturally
- [ ] Never fire a new collection while a pending hash is unresolved.

### 1.4 Allowance check fails open

`checkMerchantAllowance()` returns `sufficient: true` on any RPC error. Combined with
no persistence, this loses fees silently.

Once 1.2 exists, failing open is acceptable *because the debt is recorded*. Tighten the
distinction:

- [ ] RPC/read error → fail open, log at `warn`, still accrue.
- [ ] Allowance genuinely insufficient to cover accrued debt + new fee → fail closed
      for new payments from that seller.
- [ ] Surface `remainingSettlements` (already computed) in the verify response so
      sellers get warning before they hit zero.

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
*recorded*; it does not make it *visible*.

- [ ] Track a consecutive-failure counter on the row.
- [ ] Log at `error` once it crosses a small threshold, reusing the existing logger.

Deliberately minimal — this is not a new alerting system.

### Deferred from Phase 1

Both items are real, neither is a reliability problem, and neither is on the critical
path. Revisit only with evidence.

**Batching fee collection into periodic sweeps** *(economics)*. Replace the
per-settlement `transferFrom` with a scheduled sweep triggered by accrued balance ≥
threshold or age ≥ 24h, one `transferFrom` per seller per sweep, run off the request
path (`wallet_report_cron.ts` is the pattern to model it on). This is what drives
fee-collection gas per payment toward zero. Note that inline collection of the *whole
accrued balance* (1.3) already amortises naturally whenever a seller has a backlog, so
the threshold/age machinery buys less than it first appears. The settle transaction
remains an irreducible floor for `exact` either way — one on-chain transfer per payment.

**Nonce contention on the facilitator wallet** *(robustness under load)*. Each request
can fire two sequential transactions from a single EOA; concurrent settlements risk
nonce collisions and stuck transactions. Keeping collection inline means the fee
transaction stays on the concurrent request path, so this is *not* reduced by anything
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
> the choice is about *where* the friction lands.
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
      a branch:
      - voucher payloads → accrue nothing
      - `claim` / `settle` payloads → assess a fee

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
- Proposing a new x402 *scheme*. Nothing in this plan requires a protocol change;
  as of 2026-09-01 the upstream repo still has no fee extension or split scheme
  merged, and none is assumed here.
- Competing on price with subsidised facilitators. At realistic volumes the absolute
  revenue is small; the value of this work is a defensible reference implementation
  and credible operating experience for the #937 discussion.
