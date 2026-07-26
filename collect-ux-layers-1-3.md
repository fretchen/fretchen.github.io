# Collect/Mint UX — Problems & Mitigations (Layers 1–3)

Reference note for a "collect / mint" button. Scope: **payment currency, wallet, gas, chain** friction.
Out of scope here: fiat on-ramps, Apple Pay, the full x402 protocol.
Principle: **KISS** — each layer lists the *smallest fix that removes the failure* first, then the fuller option.

## The core idea

"L2 complexity" is not one problem. It is a stack of frictions, and a user can fail at any one. Fix them independently. The payment-currency choice (Layer 0) sits underneath the rest — decide it first, because it changes everything above it.

| Layer | What the user hits | Failure mode |
|---|---|---|
| 0. Currency | "The price is some tiny ETH fraction" | Confused before starting |
| 1. Wallet | "I have to install something / manage a seed phrase" | Never starts |
| 2. Gas | "I have no ETH for fees on this chain" | Connected, can't pay |
| 3. Chain | "Which network? Wrong network." | Connected, funded, wrong place |

---

## Layer 0 — Payment currency (cross-cutting; decide this first)

**Problem:** Pricing/paying in native ETH means unreadable prices ("0.00031 ETH"), forces users to hold the gas token, and blocks clean chain abstraction.

**Mitigation (KISS):** Denominate the collect in a **regulated stablecoin** — USDC, and/or **EURC** for a European audience. This one decision improves Layers 2 and 3 at the same time.

**Why it's the keystone:** USDC/EURC are *programmable*. They support **EIP-3009** (`receiveWithAuthorization`): the user signs one off-chain authorization, the contract pulls the exact amount, no persistent allowance, bound to a specific recipient. That is the gasless, single-signature payment primitive the layers below build on. It is also the clean fix for the approve/`transferFrom` "spender" security warnings.

**Cross-chain bonus:** USDC has native burn-and-mint transfer via **Circle CCTP V2** (Fast Transfer ~8–20s, Hooks for same-transaction destination logic) — no wrapped tokens, no bridge liquidity pools. This is why "pay from any chain" becomes near-trivial once you are USDC-denominated.

**Honest trade-off:** USDC/EURC carry a Circle **freeze/blacklist** function; native ETH does not. You trade a slice of censorship-resistance for a large UX gain. Usually an easy trade for a creative-collect button — but name it, don't discover it later.

**Note:** x402 is one productized, backend-settled way to consume EIP-3009. Out of scope for this doc, but the EIP-3009 primitive is available to you with or without it.

---

## Layer 1 — Wallet & keys

**Problem:** Requires an injected wallet (MetaMask etc.) and a seed phrase. Non-crypto users bounce immediately.

**Root cause:** The flow gates on a connected EOA from a browser-extension wallet.

**Mitigation (KISS):** Offer a passkey smart wallet as an *additional* entry point (FaceID / no seed phrase), keeping "connect existing wallet" for crypto-natives.
- ERC-4337 → new smart-contract accounts (passkey sign-in, social recovery).
- ERC-7702 → upgrades an *existing* EOA in place (live since Pectra, May 2025).

**Smallest first step:** Don't remove wallet-connect. Add one passkey option beside it.

**Openness / trade-off:** Account contracts are open-source (Safe, Coinbase Smart Wallet). You depend on a swappable bundler + paymaster service (Pimlico / ZeroDev / Alchemy / self-host). Infra dependency, not vendor lock-in.

*Unchanged by the USDC move — key management is orthogonal to payment currency.*

---

## Layer 2 — Gas (highest leverage — and USDC makes it nearly free)

**Problem:** User must hold native ETH on the exact L2 to pay gas. The most common dead-end.

**Root cause:** User pays their own gas, and the mint is priced in native ETH.

**Mitigation (KISS):** With Layer 0 in place, the payment is a **signature**, and someone else submits the transaction and pays gas:
- A relayer / paymaster fronts gas → user needs zero ETH.
- EIP-3009 means no separate "approve" transaction either — one signature covers everything.

So "pay in USDC" delivers "gasless" almost for free; you stop solving gas as a separate problem. (A plain sponsoring paymaster on an ETH-priced flow still works if you delay Layer 0, but it's strictly less clean.)

**Smallest first step:** EIP-3009 authorization relayed by your backend/facilitator, or an AA paymaster. User signs once, holds no ETH.

**Openness / trade-off:** ERC-4337 and EIP-3009 are open and vendor-neutral. You fund the relayer/paymaster (real cost). Cap / allowlist to avoid drain.

---

## Layer 3 — Chains

**Problem:** User must know the right L2 and switch networks. Even technical users get confused.

**Root cause:** Network-switching logic puts chain selection on the user; funds may sit on another chain.

**Mitigation (KISS), simplest → fullest:**
1. **Single chain, no switching.** Commit to one L2, remove the switcher. Simplest fix; removes a whole decision.
2. **Accept-from-any-chain.** Once USDC-denominated, this is well-supported:
   - **CCTP V2** for native USDC burn-and-mint from other chains.
   - **ERC-7683 intents** (Across, Uniswap, CoW, Eco) or **Daimo Pay** (non-custodial, open contracts) to accept any coin / any chain and settle USDC on yours.

**Watch-out (now inverted):** Previously, an ETH-denominated bonding curve broke stablecoin routers. **USDC denomination removes that** — "settle as USDC on your chain" now maps directly onto your contract. The former obstacle has become the enabler.

**Openness / trade-off:** CCTP is permissionless Circle infra. Intents / Daimo = open contracts + non-custodial, but rely on hosted solver/routing (leaveable; self-runnable).

---

## KISS priority — do these in order

1. **Move to USDC/EURC + EIP-3009 (Layer 0).** The keystone. Retires ETH-fraction pricing, enables gasless, and unblocks chain abstraction — one decision, three wins.
2. **Gasless via relayer/paymaster (Layer 2).** Falls out of Layer 0 almost for free.
3. **Drop the chain switcher (Layer 3, option 1).** Commit to one L2.
4. **Passkey option (Layer 1).** Widen the door for non-crypto users.
5. **Full chain abstraction (Layer 3, option 2)** — only if users genuinely arrive with funds on other chains. CCTP / intents make this cheap once USDC-denominated.

## The one decision to make first

- **Trustless path:** contract pulls USDC via `receiveWithAuthorization`; user signs one gasless auth; relayer / AA submits. Direct-to-contract, max decentralization.
- **Backend-settled path:** a facilitator settles the USDC payment, your backend mints. Reuses payment infra; adds a trust assumption on your backend.

**USDC + EIP-3009 narrows the UX gap between these to almost nothing** — both are a single gasless signature. So decide on **trust / decentralization grounds**, not UX. Given a coupling-averse stance, the trustless path is now cheap enough to keep.

## Contract-side reality check

Moving to USDC is a **UUPS upgrade**: accept an ERC-20 via `receiveWithAuthorization`, re-denominate the bonding curve in USDC's **6 decimals** (cleaner than 18-decimal wei), and use **native USDC** on Optimism, not bridged `USDC.e`. Feasible on a proxy setup, but it touches the mint signature and price storage — the one place that needs care.
