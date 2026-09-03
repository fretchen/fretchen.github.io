---
description: "Use when: writing or reviewing anything about x402 in this repo — the /x402 pages, blog posts on payments, the facilitator, the paid Scaleway endpoints, the imagegen/assistant buyers, EIP-3009, batch-settlement, or any code touching @x402/fetch, x402_server.ts, or x402_facilitator. Carries the role vocabulary, the repo's role map, and where the official spec lives."
---

# x402 in this repo

Load this **before** writing a sentence, a diagram, or a code change that names an x402 role.
Getting a role backwards is the failure this skill exists to prevent — it has happened, in
published copy on `/x402`.

## The one thing to get right

**Roles are about direction of payment, not about who owns the code.** Everything on this site
is written by the same person, so "my service" tells you nothing about its role. Ask instead:

> Does this thing **pay** (client/buyer), **charge** (resource server/seller), or **verify and
> settle for a seller** (facilitator)?

A browser UI that spends the user's USDC is a **buyer**, even though it is "our page". A
serverless function that returns 402 is a **seller**, even though it is "our backend".

## Official vocabulary

From the spec — use these words, in this order of preference:

| Official term | Also acceptable here | Never |
|---|---|---|
| **Client** | buyer | "consumer", "payer app" |
| **Resource server** | seller, server | "vendor", "merchant" (except the facilitator's own fee code, which uses `merchant`) |
| **Facilitator** | — | "gateway", "processor", "escrow" |

The facilitator **does not hold funds and is not a custodian**. It verifies signed payloads and
broadcasts transactions on the seller's behalf. Say so; do not imply custody.

**The client never talks to the facilitator.** The resource server does. If a diagram or sentence
has a buyer calling `/verify`, it is wrong.

### The flow

1. Client requests a resource with no payment.
2. Server responds **402** with a `PAYMENT-REQUIRED` header (base64 `PaymentRequired` object).
3. Client signs an authorization and **retries the same request** with a `PAYMENT-SIGNATURE`
   header (base64 `PaymentPayload`). It is a retry, not a separate payment flow.
4. Server POSTs the payload to the facilitator's `/verify`.
5. Server delivers the resource, and POSTs to the facilitator's `/settle`.
6. Server returns the resource plus a `PAYMENT-RESPONSE` header (base64 `SettlementResponse`).

**Schemes** decide *when* value moves: `exact`, `upto`, `batch-settlement`.

## This repo's role map — verified, not guessed

| Role | Component | Deployed as | Key files |
|---|---|---|---|
| **Client / buyer** | `website/` — `/imagegen` and `/assistent` | GitHub Pages | `hooks/useX402ImageGeneration.ts`, `hooks/useX402Chat.ts` — both use `wrapFetchWithPayment` from `@x402/fetch` |
| **Resource server / seller** | `scw_js/` — two paid endpoints | Scaleway Functions | `genimg_x402_token.ts` → `imagegen-agent.fretchen.eu`; `sc_llm_x402.ts` → `llm-agent.fretchen.eu`; shared `x402_server.ts` (`create402Response`) |
| **Facilitator** | `x402_facilitator/` | Scaleway Functions | `x402_facilitator.ts` — `/verify`, `/settle`, `/supported` at `facilitator.fretchen.eu` |

Plus `scw_js/llm_x402_cron.ts` — a 12-hourly cron that claims and settles accumulated
batch-settlement channels. It is seller-side infrastructure, not a fourth role.

**The trap:** `/imagegen` and `/assistent` are *buyers*. They are the site's own UIs, which makes
them feel like "the product we sell" — but they spend USDC, they do not collect it. The sellers
are the `*-agent.fretchen.eu` Scaleway endpoints those pages call. `website/pages/x402/buyers/+Page.tsx`
states it plainly: the endpoints are *"consumed on the site by"* the Image Generator and the
assistant. "Consumed by" identifies the client.

## Where the docs are

Official spec and guides: **https://docs.x402.org** — `core-concepts/http-402` for the flow and
headers, `core-concepts/facilitator` for the facilitator contract. Coinbase's overview:
https://docs.cdp.coinbase.com/x402/welcome. Reference implementation:
https://github.com/coinbase/x402.

Fetch the page rather than recalling it. The spec is young and the header names changed between
v1 (`X-PAYMENT`) and v2 (`PAYMENT-SIGNATURE`); this repo negotiates v2 and accepts v1 as a
fallback (see `genimg_x402_token.ts`).

## Repo-specific facts that are easy to get wrong

- **EIP-712 domain names differ by network.** Mainnet USDC is `"USD Coin"`, testnet is `"USDC"`.
  The verified per-network table is in `scw_js/README.md` → *Adding New Networks*. Never guess one.
- **The batch-settlement recipient whitelist is OR logic** across a manual list, testnet-only test
  wallets, and NFT-holder status — and it checks `payTo`, the recipient, not the payer. See
  `x402_facilitator/README.md` → *Whitelist Architecture*.
- **The facilitator collects a fee** via `transferFrom(merchant, facilitator, fee)`, which needs a
  one-time USDC `approve()` from the merchant. Amounts live only in `website/pages/x402/sellers/`.

## Writing about x402 on the site

The page comment at the top of `website/pages/x402/+Page.tsx` sets the content rule, and it holds
for all four x402 pages:

> the hub teaches the concept and routes; any fact that could drift — **fee amount, endpoint URLs,
> approval mechanics** — belongs on exactly one of the two deep pages (`sellers/`, `buyers/`),
> never restated on the hub.

Before publishing any role claim, check it against the table above. If a sentence names a
component and a role together, open the file and confirm which direction the money flows.
