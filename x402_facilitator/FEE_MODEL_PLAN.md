# Fee Model: Implementation Plan

Status: Phase 1 deployed. Phase 5 code complete; 5.3 (ask existing merchants to
re-approve) is the only outstanding item that reduces live exposure — see _Sequencing_.
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

These are independent. Phase 1 (deployed) addressed only the second. The economics work is
deferred until there is traffic to justify it — see Phase 3.

A third concern surfaced later, from external review: merchants approve a standing USDC
allowance to the **same hot key that signs every settlement**, so a key compromise drains
every merchant. That is the only exposure here involving other people's money. Addressed in
Phase 5 by cutting the recommended approval 100× rather than by adding a contract.

A fourth, smaller item: the buyer-pays splitter experiment (`x402_splitter_*.js`,
`EIP3009SplitterV1`) has been superseded by the merchant-pays model but is still
present in the repo without any marking.

Terminology: _merchant_, _seller_, _recipient_ and `payTo` all refer to the same party —
the operator of the resource server who receives the payment.

## Phase 1 — Make fee collection reliable ✅ complete

**Scope: reliability only.** Latency and unit economics are explicitly deferred —
see _Deferred from Phase 1_ at the end of this phase. The goal is that a fee owed is
never silently lost and never collected twice, with **no new infrastructure**: no
cron, no queue, no new deployed function.

Fee collection stays inline on the request path: one `transferFrom` for the flat fee,
with a bounded wait (1.1), reported honestly in the receipt (1.5).

**Accepted tradeoff:** a fee whose collection fails is logged and lost — not retried.
An accrual ledger to recover it was built and removed; see below for why. At 0.01 USDC
the bookkeeping costs far more than the fee.

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

A timed-out collection is not reconciled by the facilitator; its **tx hash is returned
in the receipt** so the seller can resolve it themselves. 1.1 guarantees the ambiguity
is never resolved _at the buyer's expense_.

### 1.2 / 1.3 / 1.6 — Fee ledger: built, then removed

**Status: rejected. Do not rebuild without new evidence.**

These three items were fully implemented (an S3-backed accrual ledger, idempotent
reconcile-then-sweep collection, and a stuck-balance failure counter) and then removed
after review. The reasoning is recorded here so the decision is not relitigated.

**What they did.** One JSON object per `(seller, network)` on `@fretchen/s3-utils`
tracking `accrued`, a `pending` tx hash, `lastSuccess` and `consecutiveFailures`. Every
settlement reconciled any pending collection, accrued the new fee, then swept the whole
accrued balance in one `transferFrom`.

**Why removed:**

1. **The economics do not support it.** At current traffic the ledger recovered on the
   order of **5 cents a month**, for ~700 lines of production code plus a new secret and
   bucket to configure.

2. **It regressed the bug 1.1 was written to fix.** The ledger put **5-13 S3
   round-trips on the payment path**. With `s3-utils` at `REQUEST_TIMEOUT_MS = 10_000`
   and `MAX_ATTEMPTS = 3`, worst case exceeds the 60s handler budget — so under S3
   slowness the handler dies _after_ settlement lands and the buyer loses their receipt.
   That is a strictly worse outcome than the lost fee it was protecting.

3. **Most of it existed to service itself.** 1.3 (idempotency) was needed only because
   1.2 introduced retry; 1.4's sweep cap only because 1.3 introduced sweeping; 1.6 only
   because 1.3 could wedge a seller behind an unresolved pending hash. Removing the
   ledger removes the double-charge risk entirely — it never existed in `main`.

**What replaces it:** nothing. A failed fee is logged and lost. The `pending` outcome
from 1.1 returns its **tx hash in the receipt**, so a seller can resolve an ambiguous
collection themselves — the same information the reconcile loop computed, delivered to
the party who cares, at zero infrastructure cost.

**If this is ever revisited**, the trigger should be a volume where lost fees are
material, and the design must bound its own cost on the request path.

### 1.4 Allowance check fails open

`checkMerchantAllowance()` returned `{ allowance: 0n, sufficient: true }` on any RPC
error — indistinguishable from a genuine reading. The caller could not tell "we could
not check" from "the allowance is fine".

- [x] RPC/read error → fail open, log at `warn`.
- [x] Surface `remainingSettlements` in the verify response so sellers get warning
      before they hit zero.

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

The original bullet also proposed capping collection at the allowance. That went with the
sweep it was written for — without a ledger there is no backlog to exceed the allowance,
so the flat fee either fits or the payment was already rejected.

### 1.5 Receipt semantics

`facilitatorFeePaid` used to be zeroed whenever collection did not succeed, conflating
_what this payment was charged_ with _whether we managed to collect it_. With a bounded
wait (1.1) a collection can legitimately be unresolved at response time, so those two
facts diverge.

- [x] Report the fee **assessed** for this payment in the `facilitatorFees` extension.
- [x] Report collection status as a separate field, not by zeroing the amount.
- [x] Keep the `#1016` disclosure shape so this stays compatible with the Sei fee
      transparency proposal.

`facilitatorFeePaid` now always carries this payment's assessed fee and never varies with
the collection outcome. The outcome moved to a nested `collection: { status, txHash }` —
additive, so consumers reading `facilitatorFeePaid` / `asset` / `model` are unaffected.

`FeeStatus` is `"collected" | "pending" | "failed"`, derived in `x402_settle.ts` from the
`FeeResult`. `"pending"` is distinct from `"failed"` on purpose: the transfer was sent
and may still land, and its **tx hash travels with it** so the seller can check.
`SettleResult.fee` carries `status`, keeping `collected` as a derived boolean.

**Known imperfection:** reporting an assessed amount in a field named
`facilitatorFeePaid` is a compromise. Reporting `"0"` because collection failed would
understate what the payment cost and make the facilitator look cheaper than it is — the
worse distortion for a transparency extension. `collection.status` removes the ambiguity
the field name creates. Worth raising if #1016 stabilises.

### Deferred from Phase 1

Both items are real, neither is a reliability problem, and neither is on the critical
path. Revisit only with evidence.

**Batching fee collection into periodic sweeps** _(economics)_. Replace the
per-settlement `transferFrom` with a scheduled sweep triggered by accrued balance ≥
threshold or age ≥ 24h, one `transferFrom` per seller per sweep, run off the request
path (`wallet_report_cron.ts` is the pattern to model it on). This is what drives
fee-collection gas per payment toward zero. The settle transaction remains an
irreducible floor for `exact` either way — one on-chain transfer per payment.

Note this now presupposes the rejected accrual ledger: a sweep needs a durable balance to
sweep. Anyone reviving this must first make the ledger pay for itself.

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

**Blocked.** This depended on the Phase 1 accrual store, which was built and then removed
(see 1.2/1.3/1.6 above). Charging fees on batch-settlement claims would first have to
rebuild per-seller accrual — so the ledger's cost/benefit has to be settled before any of
this is worth starting.

External review independently proposed both the accrual store and batched collection,
arguing a 10-50× reduction in fee-collection gas. The ratio is probably right; the
absolute figure is not the point. At current volume the swing is on the order of **a
dollar a month**, against ~700 lines and a regression risk on the payment path. The
blocker is volume, not the idea — revisit when lost fees are material enough to measure.

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

## Phase 5 — Approval blast radius ✅ code complete

Raised by external review. The only item in that review about **merchants' money** rather
than our own 0.01 — which is why it outranked Phases 2-4.

### The exposure

`/supported` told merchants to `approve()` the facilitator for **100 USDC**
(`recommended_amount`, = 10,000 settlements) with `spender = facilitatorAddress`.

That spender is `FACILITATOR_WALLET_PRIVATE_KEY` — and the same key **signs every
settlement** (`facilitator_instance.ts`). So the address holding a standing allowance from
every merchant is not a rarely-touched wallet: it is a hot key exercised on every single
request, living in a Scaleway secret. A compromise drains every merchant up to their
approval.

### 5.1 Right-size the recommended allowance

- [x] `recommended_amount` in `x402_supported.ts`: `100000000` → `1000000`
      (100 USDC → 1 USDC, 10,000 → 100 settlements).
- [x] Bounding test in `test/x402_supported.test.js` asserting the recommendation covers
      ≤ 100 settlements — a bound, not an equality check, so it encodes the security
      property ("stays small relative to the fee") rather than the literal number.

**One constant, 100× smaller blast radius, no contract, no deployment.**

**Accepted tradeoff — availability.** 100 settlements per approval instead of 10,000. When
an allowance runs out the hook **fails closed**: `invalidReason:
"insufficient_fee_allowance"` — the merchant's _payments_ are rejected, not just their
fees. So this trades 100× less exposure for a 100× higher chance of hitting a
payment-blocking state. At current volume 100 settlements is ample runway, and
`remainingSettlements` (1.4, returned by `/verify`) is what makes it visible — that Phase 1
feature became load-bearing here rather than nice-to-have. If a merchant is ever rejected
for this, raise the constant; it is a one-line reversal.

### 5.2 Make the disclosure honest

5.1 falsified the existing `setup.description`, which read _"One-time USDC approval
required."_ Re-approval is now expected.

- [x] Rewrite `setup.description` to state the recurrence, why the amount is deliberately
      small (the spender is a hot wallet), and how to revoke (`approve(spender, 0)`).
- [x] Update the sample `/supported` response in `README.md` to match.

Turning the recommendation into informed consent is most of the trust improvement the
review was reaching for, at zero risk.

### 5.4 FeeCollector contract — out of scope

The review's actual proposal was to replace the approval target with a small immutable
`FeeCollector` contract, so merchants approve auditable code instead of trusting our keys.

**Not doing it.** After 5.1 the contract closes the gap between "an attacker steals ~1 USDC
per merchant" and "an attacker steals nothing" — which does not justify a Solidity
contract, a deployment per network, a facilitator refactor (`checkMerchantAllowance` and
`collectFee` both key off `getFacilitatorAddress()`), a deliberate exception to the repo's
UUPS-everywhere convention, and a merchant migration.

The reasoning worth keeping, because it is not obvious:

- **An ERC-20 allowance constrains _how much_, never _where_.** `approve(spender, amount)`
  lets the spender call `transferFrom(from, to, amount)` with any `to`. So pointing our own
  code at a cold recipient achieves nothing — an attacker with the hot key writes their own
  transaction. Only making a **contract** the spender fixes the destination, because then
  the hot key can only invoke the contract's function.
- **And that only helps if the recipient is cold.** With the hot EOA as recipient, a stolen
  key triggers the collector repeatedly and the funds land where the attacker already is.
  The two pieces are complementary, not alternatives.
- The review's "only once per settled payment reference" refinement needs on-chain state
  per payment; those storage writes cost more than the 0.01 fee they protect.

**Trigger to revisit:** when per-merchant allowances must be large enough that a hot-key
compromise would actually hurt — i.e. when settlement volume makes 100-settlement
re-approval genuinely painful. Requires a cold address first.

---

## Reviewed and declined

External review also proposed two items that were checked and rejected. Recorded so they
are not re-raised.

**A `/quote` endpoint.** The argument was that it completes Sei's three-part fee proposal
(quote / receipt / client-side max-fee) and gives a live reference implementation to cite
in standardization. Verified against the
[x402 extensions registry](https://docs.x402.org/extensions/overview): there is **no fee
quote, fee disclosure, or fee transparency extension upstream at all**. So this means
implementing an unmerged proposal, and the justification was explicitly
standardization-credibility — not a goal here. A client can already compute a flat fee from
`/supported`'s `flatFee`. Cheap (~30 lines) if a real client ever needs it; nothing is
asking for it now.

**Migrating the receipt to the `offer-receipt` extension.** The review claimed this carries
"same information, spec-conformant shape." It does not. `offer-receipt` ("Signed Offers &
Receipts") signs offers on 402 responses and receipts on 200 responses to produce
**cryptographic proof that an interaction happened**. Our `facilitatorFees` block discloses
**what the facilitator charged**. Different information; migrating would lose the
disclosure. Adopting `offer-receipt` additionally, for its own purpose, is an unrelated
question and not a fee concern.

---

## Sequencing

```
Phase 1  ✅ deployed   (1.1 bounded wait · 1.4 allowance · 1.5 receipt)
   │
   ▼
Phase 5  ✅ code done  (5.1 allowance 100→1 USDC · 5.2 honest disclosure)
   │
   ├─ 5.3  ⬅ NEXT      ask existing merchants to re-approve  (email, not code)
   │
   └─ Phase 2          retire the splitter  (docs only, independent, any time)

Rejected:  1.2 / 1.3 / 1.6 — fee ledger (built, removed)
           5.4 FeeCollector contract  (disproportionate after 5.1)
           /quote endpoint · offer-receipt migration  (see Reviewed and declined)
Deferred:  batching/sweeps · nonce serialization  (both presuppose the ledger)
Blocked:   Phase 3, Phase 4 — need the ledger question settled first
```

**5.3 is the only remaining item that reduces live exposure.** 5.1 changed what
`/supported` advises; it cannot touch approvals already on-chain. Everything else
outstanding is either documentation (Phase 2) or blocked on volume (Phases 3-4).

**Phase 3 and Phase 4** are blocked on the same question, not on Phase 1: whether
per-seller accrual can be made to pay for itself. Until then batch-settlement would
inherit the same economics at greater volume, plus rebuild the ledger just removed.

---

## Non-goals

- Reviving the buyer-pays splitter as a production path.
- Proposing a new x402 _scheme_. Nothing in this plan requires a protocol change;
  as of 2026-09-01 the upstream repo still has no fee extension or split scheme
  merged, and none is assumed here.
- Competing on price with subsidised facilitators. At realistic volumes the absolute
  revenue is small; the value of this work is a defensible reference implementation
  and credible operating experience for the #937 discussion.
