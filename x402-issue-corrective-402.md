# Corrective 402 drops `assetTransferMethod` and the challenge `extensions`, making Permit2-only tokens unpayable after a voucher-base mismatch

> Upstream issue draft for `x402-foundation/x402` (packages `@x402/evm` / `@x402/core`).
> Verified against 2.28.0 on 2026-10-12.

## Summary

When a batch-settlement payment fails the voucher-base check
(`invalid_batch_settlement_evm_cumulative_amount_mismatch`), the corrective 402 that
`handleEnrichPaymentRequiredResponse` builds loses two fields the client needs:

1. `accepts[].extra.assetTransferMethod` — the enrichment spreads the **facilitator-derived**
   requirements, not the seller's original accept, so a Permit2-only token's
   `assetTransferMethod: "permit2"` is gone.
2. The top-level `extensions` map — the corrective response carries no
   `eip2612GasSponsoring`, so the client cannot sign the gas-sponsoring permit on retry.

The client retry then falls back to the defaults in
`BatchSettlementEvmScheme.createPaymentPayload`:

- `extra.assetTransferMethod ?? "eip3009"` → it signs an **EIP-3009 deposit for a token that
  has no EIP-3009** (Monerium EURe),
- `trySignEip2612PermitExtension` returns `undefined` (`context.extensions` empty) → no permit,
- the facilitator's deposit simulation reverts → `invalid_batch_settlement_evm_deposit_simulation_failed`.

## Reproduction

Environment: `@x402/evm`, `@x402/core`, `@x402/mcp` 2.28.0. Seller offers Monerium EURe
(Base Sepolia, Permit2-only) with `extra: { name, version, assetTransferMethod: "permit2" }`
and `extensions: { eip2612GasSponsoring: {} }` in the 402.

Trigger: facilitator channel snapshot `chargedCumulativeAmount` diverges from on-chain
`totalClaimed` (e.g. a client that cleared local storage recovers its voucher base from the
chain). Then, with payment capture on the client:

- **Attempt 1** — permit2 deposit (top-up) + valid EIP-2612 permit extension
  (`eip2612GasSponsoring`), correct nonce read from `nonces(owner)`. This payment is fine;
  it is aborted by the voucher-base check before deposit verification runs.
- **Corrective 402** — `accept.extra` contains `name`, `version`, `receiverAuthorizer`,
  `withdrawDelay`, `minDeposit`, `channelState`, `voucherState` — but **no
  `assetTransferMethod`** — and the response has **no `extensions` map**.
- **Attempt 2** — client sends `deposit.authorization.erc3009Authorization` (EIP-3009!) for
  EURe, no extensions. Facilitator returns `invalid_batch_settlement_evm_deposit_simulation_failed`.

An offline `eth_call` of `BatchSettlement.deposit(...)` with the attempt-1 payload (Permit2
witness + embedded EIP-2612 permit) succeeds, so the client's first-attempt construction is
correct — only the corrective round-trip degrades it.

## Suggested fix

When enriching the corrective response, derive the accept from the original challenge accept
matching `(scheme, network, asset)` (or at minimum carry over `assetTransferMethod`), and
re-emit the original challenge's `extensions` map on the corrective 402. Without this, any
Permit2-only token becomes unpayable for every client that enters the corrective path, while
the underlying state divergence is often transient and otherwise recoverable.
