# EURC alongside USDC

**Goal:** every x402 payment on the site can be made in EURC or USDC. EURC is the site's default.

**Decisions taken:**

| Decision        | Choice                                                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chain coverage  | EURC on **Base** and **Base Sepolia** only. Circle has not deployed EURC on Optimism or OP Sepolia, so Optimism stays USDC-only.                                  |
| Facilitator fee | Paid in the **settled asset**: a EURC settlement costs a EURC fee, a USDC settlement a USDC fee. Same nominal flat fee per token.                                 |
| Pricing         | Prices stay defined in USD. EURC amounts are derived with one static constant (`EUR_PER_USD`) in `scw_js/serverless.yml`, rounded up. Updated by hand; no oracle. |
| Default         | EURC is chosen by the website (the buyer), not forced by the sellers. See _How EURC becomes the default_.                                                         |

**Non-goals:** an FX oracle, EURC on Optimism (bridged or otherwise), any contract change, any
token beyond these two.

**Status:**

- **PR 1 is merged (#690).** The shared API differs from section 3: the type is
  `StablecoinSymbol`, the address lookup is `findStablecoin(network, address)`, and enumeration is
  `getStablecoins(network)`. That last one was added with PR 2, because only a seller needs it.
  `wallet_report_cron.ts` was also finished with PR 2.
- **PR 2 is implemented, not yet deployed.** Two changes against section 4:
  - `EUR_PER_USD` has no default and works as a kill switch (unset means no EURC).
  - The claim cron works on a token-filtered view of each network's channel store. The SDK's
    channel manager claims every stored channel in its one token, and the facilitator refuses
    mixed-token batches, so an unfiltered store would fail every Base claim.

  See `scw_js/README.md` → _Stablecoins and pricing_.

---

## 1. What does not change

- **Contracts.** `SupportV2.donateToken` and `EIP3009SplitterV1.executeSplit` take the token as a
  parameter and work with any EIP-3009 token. No deploy, no upgrade.
- **Facilitator verify.** `/verify` does not restrict the asset; the SDK checks the EIP-3009
  signature against whatever `accepted.asset` and domain the payload carries.
- **Client channel storage.** The SDK keys it by `channelId`, and the token is part of
  `computeChannelId`, so a USDC and a EURC channel on Base are separate records and cannot collide.

## 2. Facts to verify before writing code

- **EURC EIP-712 domain per network.** Read `name()` and `version()` on-chain for Base
  (`0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42`) and Base Sepolia
  (`0x808456652fdb597867f38412077A9182bf77359F`). Do not copy them from USDC or from memory — a
  wrong domain name makes every signature invalid, and the USDC names already differ between
  mainnet and testnet. Add the result to the table in `scw_js/README.md` → _Adding New Networks_.
- **Addresses** against [Circle's EURC list](https://developers.circle.com/stablecoins/eurc-contract-addresses).
- **Decimals** are 6 on both (assumed by every amount below; confirm with `decimals()`).

## 3. PR 1 — shared registry and facilitator

Deployable on its own and backward compatible: USDC settlements behave exactly as before.

**`shared/chain-utils`**

- Add `EURC_ADDRESSES` and `EURC_NAMES` (Base, Base Sepolia).
- Add `type Stablecoin = "USDC" | "EURC"` and `getStablecoinConfig(network, token)`, plus
  `getAvailableStablecoins(network)` (→ `["EURC", "USDC"]` on Base, `["USDC"]` on Optimism).
- Add `getStablecoinByAddress(network, address)` for the facilitator's asset lookup.
- Keep `getUSDCConfig` as a thin wrapper so untouched callers keep compiling.

**`x402_facilitator`**

- `x402_fee.ts`: resolve the fee token from `accepted.asset` via `getStablecoinByAddress`;
  reject any asset not in the registry. Allowance check and `transferFrom` run on that token.
- `x402_supported.ts`: advertise the fee and the approval instructions per asset
  (USDC everywhere, EURC on Base).
- `x402_settle.ts:282`: report the settled asset, not always USDC.
- `wallet_report_cron.ts`: report both balances where both exist.
- Batch-settlement claims: the fee for a claim is charged in the channel's token.
- Tests: a EURC exact settlement and a EURC claim on Base Sepolia charge a EURC fee; an unknown
  asset is refused; USDC paths unchanged.

**Deploy, then operations (before PR 2 is deployed):**

- Deploy the facilitator.
- From each seller's `payTo` wallet, `approve()` EURC for the facilitator on Base Sepolia and Base.
  Without this, every EURC settlement fails the allowance check.

## 4. PR 2 — sellers (`scw_js`)

Covers all three sellers: `genimg_x402_token.ts`, `sc_llm_x402.ts`, `search_api.ts`.

- `x402_server.ts`: `createPaymentRequirements` and `createBatchSettlementPaymentRequirements`
  emit one `accepts` entry per (network, stablecoin), EURC listed before USDC on Base. `extra`
  carries the token's own domain name and version.
- Pricing: one helper `usdAtomicToAsset(amount, token)` applies `EUR_PER_USD` and rounds up.
  Used for the image price, the LLM max price and settle amount, and the search prices.
- `llm_x402_cron.ts`: loop over (network, token) pairs — channel manager, fee-allowance warning
  and claim/refund per token.
- OpenAPI: regenerate; `x-payment-info.price` stays in decimal USD (the discovery spec requires
  USD).
- Tests: a 402 on Base lists EURC then USDC; on Optimism USDC only; the EURC amount is the
  converted, rounded-up value; the cron claims a EURC channel.

**Deploy** after PR 1 and the EURC approvals. Safe before PR 3 ships — see the next section.

## 5. PR 3 — buyer (`website`)

- **Currency preference:** `"EURC" | "USDC"`, default `"EURC"`, persisted in localStorage, shown as
  a small toggle next to the network display on `/imagegen` and `/assistent`.
- **Network follows currency:** EURC means Base. Choosing EURC switches the payment network to
  Base (`useAutoNetwork`, `negotiateNetwork`); choosing Optimism forces USDC.
- **Selection:** pass a `paymentRequirementsSelector` to the x402 client that picks the entry whose
  asset matches the preference, falling back to USDC when EURC is not offered.
- **Spend controls:** extend `buildUsdcAllowedAssets` → `buildStablecoinAllowedAssets`, adding
  EURC on Base with the same per-payment cap.
- **Support donation** (`useSupportAction.ts`): 0.50 in the preferred currency; its default chain
  follows the currency.
- **`FacilitatorApproval.tsx`:** token selector (EURC only offered on Base).
- **Copy:** "Get USDC" guidance, error texts, `locales/en.ts` and `de.ts` become currency-aware;
  `/x402/sellers` and `/x402/buyers` state both assets and the per-asset fee.
- Tests: preference defaults to EURC; Optimism forces USDC; the selector falls back to USDC; the
  allowlist contains EURC on Base only.

`pages.yml` deploys on merge, so this ships the moment it lands. It works against either seller
state: with PR 2 not yet deployed, the selector finds no EURC and falls back to USDC.

## 6. How EURC becomes the default

There are two defaults, and they are controlled in different places.

**The site's default is the buyer's choice (PR 3).** In x402 the server lists what it accepts and
the client picks. The website's selector picks EURC from the day PR 3 ships.

**The order of `accepts` is the default for everyone else** — third-party agents and notebooks.
The SDK's stock selector takes the first entry that survives spend controls. Listing EURC first on
Base (PR 2) is safe for default-configured clients: `@x402/evm`'s built-in asset registry knows only
USDC, so spend controls drop the EURC entry unless the client has allowlisted it, and such a client
pays in USDC as before. That includes the website before PR 3 and the repo's notebooks (their
`allowedAssets` is USDC-only).

The one client that would switch to EURC unintentionally is one with spend controls disabled
(`spendControls: false` or `allowedAssets: true`) and no EURC in its wallet. It gets a failed
payment, not a lost one. If that is a concern, ship PR 2 with USDC first and flip the order in a
one-line follow-up once the website has run on EURC for a while.

## 7. PR count

- **Recommended: 3 PRs** — facilitator, sellers, buyer — because the facilitator must be deployed
  and the EURC approvals made before any seller lists EURC, and each PR is testable on Base
  Sepolia before it touches mainnet.
- **Minimum: 2 PRs** — PR 1 as above; PR 2 + PR 3 combined. This works because the Scaleway deploy
  is manual and the website falls back to USDC while the sellers still offer only USDC. The cost is
  one large PR across two packages.

Docs (`scw_js/README.md` network table, `x402_facilitator/README.md`, `.claude/skills/x402` repo
facts) travel with the PR that changes the behaviour they describe.
