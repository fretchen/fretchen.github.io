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
   silently, and it blocks the settle response while waiting for a second confirmation.

A third, smaller item: the buyer-pays splitter experiment (`x402_splitter_*.js`,
`EIP3009SplitterV1`) has been superseded by the merchant-pays model but is still
present in the repo without any marking.

Terminology: *merchant*, *seller*, *recipient* and `payTo` all refer to the same party —
the operator of the resource server who receives the payment.

---

## Phase 0 — Measure first

**Blocking.** Everything below is calibrated against numbers we do not have yet.

- [ ] Pull the last ~50 `settle` transactions and ~50 fee `transferFrom` transactions
      from the facilitator wallet, on Optimism and Base separately.
- [ ] For each, compute `gasUsed × effectiveGasPrice`, in ETH and in USD at the time
      of the transaction.
- [ ] Produce, per network: median settle cost, median fee-collection cost.
- [ ] Compare against the configured fee (`FACILITATOR_FEE_AMOUNT`, default `10000` =
      0.01 USDC).

**Output:** a table stating whether `exact` is currently profitable per network.

**Decision gate:** if Optimism is underwater and Base is positive, treat "which
networks carry a fee" as an explicit product decision rather than leaving it implicit
(see Phase 4).

---

## Phase 1 — Fix fee collection

Five defects, in severity order. 1.2 and 1.3 are the substantive ones; the rest depend
on them.

### 1.1 Fee collection blocks the settle response

`collectFee()` awaits `waitForTransactionReceipt`, and `x402_settle.ts` awaits
`collectFee()` inline before returning. The buyer therefore waits for **two** on-chain
confirmations to receive a resource that only the first one paid for.

- [ ] Remove fee collection from the request path.
- [ ] Settlement records the fee owed (see 1.2) and returns immediately.
- [ ] Actual collection happens in a scheduled job.

Note: Scaleway Functions gives no reliable post-response execution window, so
"fire-and-forget in-process" is not an option — this necessarily becomes
record-now/collect-later. `wallet_report_cron.ts` is an existing scheduled-job pattern
to model the sweep on.

### 1.2 No persistence for uncollected fees

The current code logs `"flagging for retry"` but nothing is flagged anywhere; a failed
fee is simply lost.

- [ ] Add a store (Scaleway Serverless SQL, or Redis) with one row per
      `(seller, network)`:
      - accrued atomic units owed
      - last collection attempt timestamp
      - last successful collection timestamp + tx hash
- [ ] Every settlement that owes a fee increments the accrued balance.
- [ ] Collection decrements it only on confirmed success.

This table is the foundation for 1.3, 1.4 and all of Phase 3.

### 1.3 Fee collected per payment

This is the change that moves unit economics.

- [ ] Replace the per-settlement `transferFrom` with periodic sweeps.
- [ ] Sweep trigger: accrued balance ≥ threshold (suggested: 20× unit fee) **or**
      age ≥ 24h, whichever comes first.
- [ ] One `transferFrom` per seller per sweep, covering the whole accrued balance.
- [ ] Sweep runs as a scheduled job, not on the request path.

Effect: fee-collection gas per payment drops toward zero. The settle transaction
remains an irreducible floor for `exact` — one on-chain transfer per payment.

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

### 1.5 Nonce contention on the facilitator wallet

Each request can currently fire two sequential transactions from a single EOA;
concurrent settlements risk nonce collisions and stuck transactions.

- [ ] Batching (1.3) removes roughly half the transaction volume — re-measure after.
- [ ] If contention persists, serialize sends through a single nonce-managing path.

### 1.6 Receipt semantics under accrual

With accrual, `facilitatorFeePaid` would read `"0"` on every receipt until a sweep runs.

- [ ] Report the fee **assessed** for this payment in the `facilitatorFees` extension.
- [ ] Report collection status as a separate field, not by zeroing the amount.
- [ ] Keep the `#1016` disclosure shape so this stays compatible with the Sei fee
      transparency proposal.

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

Depends on Phase 0 and a re-measurement after Phase 1.

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
                                                          
Phase 2  ──────────────────────────────────────────────►  (independent, any time)
```

**Checkpoint after Phase 1:** re-run Phase 0 measurement. Do not start Phase 3 until
`exact` unit margin is positive on at least one network — otherwise batch-settlement
inherits the same broken economics at greater volume.

---

## Non-goals

- Reviving the buyer-pays splitter as a production path.
- Proposing a new x402 *scheme*. Nothing in this plan requires a protocol change;
  as of 2026-09-01 the upstream repo still has no fee extension or split scheme
  merged, and none is assumed here.
- Competing on price with subsidised facilitators. At realistic volumes the absolute
  revenue is small; the value of this work is a defensible reference implementation
  and credible operating experience for the #937 discussion.
