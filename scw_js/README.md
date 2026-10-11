# Fretchen AI Services

Serverless functions for AI image generation and LLM services with blockchain integration on Optimism L2.

## 📖 API Documentation

- **OpenAPI Specs**: [`openapi.genimg.json`](./openapi.genimg.json) / [`openapi.llm.json`](./openapi.llm.json) - Per-service x402 discovery contracts, each served live at `GET /openapi.json` on its own origin
- **EIP-8004 Registration**: built per service by [`agent_registration.ts`](./agent_registration.ts), served live at `GET /.well-known/agent-registration.json` on each origin (see [ERC-8004 agent registration](#erc-8004-agent-registration))

### Quick Links

| Service          | Endpoint          | Description                                            |
| ---------------- | ----------------- | ------------------------------------------------------ |
| Image Generation | `genimgx402token` | AI image generation + NFT minting (x402 USDC payment)  |
| LLM Chat         | `llmx402`         | x402 batch-settlement LLM chat (USDC payment channels) |
| LLM Claim/Settle | `llmx402cron`     | Claims and settles accumulated LLM channels every 12h  |
| Growth API       | `growthapi`       | Draft approval API for Growth Agent (wallet auth)      |
| Web access       | `searchapi`       | Brave search + web fetch (x402)                        |

## Functions

### `genimg_x402_token.js` - AI Image Generation (x402 Payment)

Generates AI images using Black Forest Labs API with USDC payment via x402 protocol. Mints new NFT tokens on Optimism or Base.

**Endpoint:** POST to `imagegen-agent.fretchen.eu`

**Parameters:** the authoritative list is [`openapi.genimg.json`](./openapi.genimg.json), generated
from [`genimg_schemas.ts`](./genimg_schemas.ts) — the table below is a summary and the spec wins.

| Field             | Type    | Required | Description                                                   |
| ----------------- | ------- | -------- | ------------------------------------------------------------- |
| `prompt`          | string  | ✅       | Text prompt for AI image generation                           |
| `model`           | string  | ❌       | Only `flux-kontext-pro` is advertised; defaults to it         |
| `size`            | string  | ❌       | `1024x1024` (default) or `1792x1024`                          |
| `n`               | number  | ❌       | Only `1` — pricing and the mint are per-image                 |
| `response_format` | string  | ❌       | Only `url`                                                    |
| `network`         | string  | ❌       | CAIP-2 network ID (e.g. `eip155:10`) to narrow the 402 offer  |
| `mode`            | string  | ❌       | Vendor extension: `generate` (default) or `edit`              |
| `referenceImage`  | base64  | ❌       | Vendor extension: required for `edit` mode                    |
| `isListed`        | boolean | ❌       | Vendor extension: list the NFT publicly. Alias `x_nft.listed` |
| `payment`         | object  | ❌       | x402 payment payload, if not sent as a header                 |

**Unknown fields are rejected, not ignored** (400 `invalid_request_error`, `param` naming the
field). This endpoint charges per call, so silently dropping a `quality: "hd"` the caller believed
in would mean taking money for a request we did not fulfil as asked. It is also what the real
OpenAI API does. Any new field a client wants to send has to be added to `genimg_schemas.ts` first.

**An unpaid POST is always answered with the 402 challenge**, whatever its body says, so a client
can discover the payment terms it is supposed to satisfy. Validation runs only on the paid path,
before verify or settle — a malformed paid request is rejected without being charged.

**Payment Authorization (EIP-3009):**

```json
{
  "from": "0xBuyerAddress",
  "to": "0xFacilitatorAddress",
  "value": "70000",
  "validAfter": "0",
  "validBefore": "...",
  "nonce": "0x...",
  "v": 28,
  "r": "0x...",
  "s": "0x..."
}
```

**Response:**

```json
{
  "created": 1757260000,
  "data": [{ "url": "https://...", "revised_prompt": null }],
  "model": "flux-kontext-pro",
  "x_nft": {
    "status": "minted",
    "token_id": 42,
    "contract": "0x...",
    "network": "eip155:10",
    "metadata_url": "https://...",
    "mint_tx": "0x...",
    "transfer_tx": "0x...",
    "listed": false,
    "mint_price": "10000000000000000",
    "owner": "0x..."
  }
}
```

**A 200 does not mean the NFT was minted — check `x_nft.status`.** If generation succeeds but the
mint fails, the response is still 200 with a usable `data[0].url` and
`x_nft: { status: "mint_failed", reason }`: the caller is holding the image, so a 5xx would be a
lie. **Nothing is settled in that case** — no `Payment-Response` header, no charge. This is the one
place the endpoint answers 200 with no payment settled, and it preserves the behaviour the service
has always had, since settlement only ever ran after a successful mint.

**`images/v1` contract.** [`openapi.genimg.json`](./openapi.genimg.json) declares
`x-service-type: "images/v1"` — the interchangeable-agent contract, defined entirely by that
document: the request/response body is the **OpenAI images-generation shape** (`{ prompt, model?, size?, n?, response_format? }`
in → `{ created, data: [{ url }], model }` out — `ImageGenerationRequest`/`ImageGenerationResponse`),
plus the `x-interop-floor` (≥1 `accepts[]` entry with USDC on Optimism `eip155:10` or Base
`eip155:8453`, scheme `exact`; `size: "1024x1024"` supported at minimum). Payment stays x402, so
the OpenAI shape is for **body legibility, not drop-in OpenAI-SDK use** — a stock SDK sends
`Authorization: Bearer` and can't satisfy the 402.

**The NFT is deliberately outside the floor**, declared as `x-capabilities: ["nft-mint"]` and
reported under the `x_nft` response extension. Putting the mint inside would mean any second
implementer needed an NFT contract, a funded agent wallet and a transfer flow — the opposite of
interchangeable. A response with no `x_nft` is still valid `images/v1`, and a client that only
wants an image reads `data[0].url` and never learns an NFT exists.

`mode` and `referenceImage` (image editing) are likewise vendor extensions, not part of the floor.

**Testnet networks return a placeholder image**, not a generated one — real inference budget is
never spent on a valueless testnet payment. The x402 verify/settle flow still runs for real.

### `sc_llm_x402.js` / `llm_x402_cron.js` - x402 Batch-Settlement LLM Chat

LLM chat paid via x402 batch-settlement USDC payment channels — no bearer token, the payment voucher itself proves wallet control. `llmx402` handles chat requests (deposit/voucher/402 flow); `llmx402cron` claims and settles accumulated channels on a 12h schedule. See [`assistent_plan.md`](../assistent_plan.md) at the repo root for the full design record (deposit/voucher/claim/settle lifecycle, pricing model, gotchas).

**Fee allowance.** The facilitator charges a flat fee on `claim`/`settle`, same as the `exact` scheme — one standing USDC `approve()` for the facilitator's wallet covers both, so no separate approval is needed for batch-settlement. Because `claim`/`settle` skip `/verify` (see `x402_facilitator/README.md` → _Recipient gating_), there is no built-in early warning the way `exact` gets `remainingSettlements`; `llmx402cron` reads the allowance itself before each claim and logs a warning once it is close to running out.

**`llm/v1` contract.** [`openapi.llm.json`](./openapi.llm.json) declares `x-service-type: "llm/v1"` — the interchangeable-agent contract. It is defined entirely by that document: the request/response body is the **OpenAI chat-completions shape** (`{ model, messages }` in → an OpenAI `chat.completion` object out — `LLMChatRequest`/`LLMChatResponse`), plus the `x-interop-floor` (a compatible agent must advertise ≥1 `accepts[]` entry with USDC on Optimism `eip155:10` or Base `eip155:8453`, scheme `batch-settlement`). Payment stays x402 batch-settlement, so the OpenAI shape is for **body legibility, not drop-in OpenAI-SDK use** — a stock SDK sends `Authorization: Bearer` and can't satisfy the 402. Streaming is not supported. `model` is validated against the advertised id(s) (`mistral-large-latest`; more can be added later).

### `search_api.ts` - Web Access for /assistent (x402)

The assistant's two web tools, sold per call. `search_service.ts` proxies Brave's LLM Context API; `web_fetch_service.ts` retrieves one arbitrary page.

**Endpoint:** GET to `web-agent.fretchen.eu` — named for what it does rather than for `searchapi`, which is only half of it, and carrying the `-agent` suffix that marks the paid sellers. The generated Scaleway hostname still answers; this is the identity the 402 advertises and the one discovery lists.

| Method | Path      | Price       | Atomic units |
| ------ | --------- | ----------- | ------------ |
| GET    | `/search` | $0.01 USDC  | `10000`      |
| GET    | `/fetch`  | $0.001 USDC | `1000`       |

**One way in: everybody pays.** There was an owner-signature path that served for free, justified as what let server-side callers work without a funded wallet. It was removed once that proved to name a consumer that does not exist — `growth-agent` never called this endpoint, the frontend stopped using it when the assistant's tools moved to paid fetch, and the buyer notebook's owner cell was a demonstration. `genimg` and `llmx402` never had such a path. The consequence, accepted deliberately: there is no free path and no testnet, so exercising these routes costs real money — the same trade `genimg` already makes.

**Payment is x402 batch-settlement on the chat's channel.** `createLLMResourceServer` is shared with `sc_llm_x402.ts`, giving both the same receiver, receiver authorizer, token and withdraw delay — the tuple `computeChannelId` hashes. A tool call from `/assistent` therefore bills onto the channel the chat already funded, with no second deposit, and `llmx402cron` claims it unchanged. The exact scheme could not be used at these prices: the facilitator's flat 0.01 USDC per settlement is the entire price of a search.

**Mainnet only** (`eip155:10`, `eip155:8453`), unlike the chat. Testnet USDC is free and both routes spend real money — Brave bills per query, `/fetch` is egress — so a testnet offer would hand out a metered API for nothing.

**Settlement follows success.** Verify → run → settle, so an upstream failure or a refused URL costs the caller nothing. The advertised `maxTimeoutSeconds` is 30 rather than the chat's 120, because a lock orphaned that way sits on the shared channel and would block the user's next chat message.

**The SSRF defence is unchanged by payment.** A payment authorises a fetch, not a fetch of `169.254.169.254`. See the header comment of [`web_fetch_service.ts`](./web_fetch_service.ts).

**Refunds, and the one exercise that tests them.** Cooperative refunds are the seller's job (`llmx402cron`, or `scripts/recover_channels.ts` on demand), and the SDK builds each one entirely from the **stored** channel record — the amount from `balance - chargedCumulativeAmount`, the candidate filter from `balance !== 0`, and the signature from `refundNonce`. All three are caches of chain state, and all three have gone stale in production. `resyncChannelState` re-reads them before every sweep, which is the only thing standing between a working refund and a permanently broken one.

The failure mode that hid for months: a successful refund **deletes** the channel record, and a later deposit with the same voucher signer recreates it with `refundNonce: 0` while the chain has moved on. Every later refund is then signed against a consumed nonce and reverts (`0x164f1afe`) — and because the SDK's refund loop has no per-channel catch, one such channel blocks the whole sweep. 2.08 USDC accumulated behind it.

No unit test can catch that: every test here replaces the chain with a mock that agrees with the local record by construction. The exercise that _would_ catch it needs a real chain, and it must **refund the same channel twice** — a single refund passes and proves nothing, because the nonce only goes stale after the first one. On Base Sepolia (free USDC, and the escrow contract is deployed there):

```bash
# 1. buyer: open a channel and spend on it — scw_js/notebooks/sc_llm_x402_buyer.ipynb (USE_BASE, testnet)
# 2. seller: claim what is owed, then refund the rest
npx tsx scripts/recover_channels.ts eip155:84532 --apply
# 3. buyer: run the notebook again — same voucher signer, so the SAME channelId is re-funded
# 4. seller: refund a second time. THIS is the step that used to revert.
npx tsx scripts/recover_channels.ts eip155:84532 --apply
```

Run it before touching the refund path. It is deliberately not in CI: it needs a funded key and a network, and CI stays hermetic.

### `growth_api.ts` - Growth Agent Draft Approval

API for reviewing, editing, and approving AI-generated social media drafts. Used by the Growth Agent notebooks and cron job.

**Auth:** All routes require EIP-191 wallet signature matching `OWNER_ETH_ADDRESS`.

| Method | Path                  | Description                          |
| ------ | --------------------- | ------------------------------------ |
| GET    | `/drafts`             | List all drafts (optional `?status`) |
| PUT    | `/drafts/:id`         | Edit draft content                   |
| POST   | `/drafts/:id/approve` | Approve draft (optional scheduling)  |
| POST   | `/drafts/:id/reject`  | Reject draft                         |
| GET    | `/insights`           | Website analytics insights           |
| GET    | `/performance`        | Post performance metrics             |

**State:** Reads/writes JSON files in S3 (`growth-agent/` prefix in `my-imagestore` bucket).

## 🔗 On-Chain Integration

| Contract   | Chain    | Address                                      |
| ---------- | -------- | -------------------------------------------- |
| GenImNFTv4 | Optimism | `0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb` |

### RPC configuration

Direct on-chain calls (image mint, x402 batch-settlement claim/settle) use `getRpcUrl` from
`@fretchen/chain-utils`, falling back to each chain's public endpoint when unset — fine
for local dev, but the public endpoints are aggressively rate-limited under real traffic.
Set a dedicated provider (e.g. Alchemy) as a Scaleway secret for production:

- `RPC_URL_EIP155_10` — Optimism mainnet
- `RPC_URL_EIP155_8453` — Base mainnet
- `RPC_URL_EIP155_11155420` — Optimism Sepolia
- `RPC_URL_EIP155_84532` — Base Sepolia

### ERC-8004 agent registration

Each x402 origin is a registered ERC-8004 agent on **Base** (Identity Registry `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`, `eip155:8453`). The on-chain `agentURI` is the origin's own `https://<origin>/.well-known/agent-registration.json`, so the endpoint and the identity share a domain.

| Service    | Origin                               | agentId |
| ---------- | ------------------------------------ | ------- |
| Image gen  | `https://imagegen-agent.fretchen.eu` | 97598   |
| LLM chat   | `https://llm-agent.fretchen.eu`      | 97599   |
| Web access | `https://web-agent.fretchen.eu`      | 97600   |

- **The file** is built per request by [`agent_registration.ts`](./agent_registration.ts) from the committed `openapi.*.json` (`info.title`, `info.description`, `servers[0].url`), so it cannot drift from the published API document. Beyond the EIP fields it carries the two services the [8004scan Agent Metadata Standard](https://best-practices.8004scan.io/docs/01-agent-metadata-standard.html) recommends: `OASF` (skills and domains from the OASF v0.8.0 taxonomy, pinned in `OASF`; check a new slug exists in agntcy/oasf before adding it) and `agentWallet` (the 402 `payTo` as CAIP-10 on Base and Optimism, from `NFT_WALLET_PUBLIC_KEY`). The ids live in `AGENT_IDS` there; `test/agent_registration.test.ts` pins them to `eth/scripts/deployments/erc8004-agents-base.json`.
- **Ownership:** the agents are owned by the contract-owner EOA (`0x1af51D…fBB20`), not by a key in the function secrets, so a leaked server secret cannot repoint or transfer an identity. The registry's `agentWallet` is bound to the x402 `payTo` (`NFT_WALLET`), so `getAgentWallet(agentId)` equals the `payTo` in every 402.
- **Changing it:** registering, clearing or re-binding the wallet is `eth/scripts/register-agents.ts` (usage, rollout and safety are in its JSDoc; dry run by default). Updating an `agentURI` is `setAgentURI` from the owner key.
- **Check a deployment:**

```bash
for o in imagegen-agent llm-agent web-agent; do
  curl -sS "https://$o.fretchen.eu/.well-known/agent-registration.json" | jq '{name, registrations}'
done
```

Each file must list its `agentId` and `eip155:8453:0x8004A169…` as `agentRegistry`. On the registry, `tokenURI(agentId)` must return the same URL and `getAgentWallet(agentId)` the 402 `payTo`.

### Bazaar discovery metadata

Every paid route's 402 challenge carries an `extensions.bazaar` block — the [x402 Bazaar discovery extension](https://docs.x402.org/extensions/bazaar): the route's method, an example request, and the request's JSON Schema, so a discovery layer can list and pre-validate the route without a paid probe. The `resource` object additionally carries the optional service metadata (`serviceName`, `tags`, `iconUrl`) facilitators use to enrich search results.

- **Built by** [`bazaar_discovery.ts`](./bazaar_discovery.ts): a thin wrapper over `declareDiscoveryExtension` from `@x402/extensions` (same org as `@x402/core`), with the input schemas derived via `z.toJSONSchema` from the same Zod request schemas the OpenAPI specs are generated from — one source of truth, including the strictness distinction (`z.object` vs `z.looseObject`). `test/bazaar_discovery.test.ts` pins the wire shape and runs each block through the package's own `validateDiscoveryExtension`.
- **Wired in** `x402_server.ts`: both `createPaymentRequirements` and `createBatchSettlementPaymentRequirements` accept `extensions`, `serviceName`, `tags`, `iconUrl`; the caller-supplied extensions merge with (never clobber) the existing `eip2612GasSponsoring` entry, and the metadata is sanitized onto `resource` by the package's soft-drop rules.
- **This deployment is metadata-only.** Settlement runs through `facilitator.fretchen.eu`, so the Coinbase Bazaar does not index these routes. Full CDP Bazaar indexing would additionally require: (1) a settled payment through the **CDP Facilitator** with `paymentPayload.extensions.bazaar` and `paymentPayload.resource` set, (2) a CDP-supported `accepts` list — Base/USDC-shaped; the validator rejects `eip155:10` and non-USDC entries, and (3) a re-settlement at least every **30 days**, or the listing is dropped. The llm/search blocks could only ever lead to a listing via an exact-scheme alias route — the CDP Facilitator does not verify the batch-settlement scheme.
- **Check a deployment** (free, no key; the same preflight the CDP Facilitator applies):

```bash
curl -X POST https://api.cdp.coinbase.com/platform/v2/x402/validate \
  -H "Content-Type: application/json" \
  -d '{"resource": "https://imagegen-agent.fretchen.eu/imagegen", "method": "POST"}' | jq '.valid, .simulation'
```

Note: with the default mainnet offer (Optimism + Base), the validator still fails the `eip155:10` accepts entry — passing it fully would mean narrowing the default offer, a payment-flow decision this metadata-only deployment deliberately does not make.

### MCP endpoint

`mcp_server.ts` (deployed as the `mcp` function, `mcp-agent.fretchen.eu/mcp`) is a **stateless paid MCP endpoint**: JSON-RPC 2.0 over a single POST route, no sessions, no SSE — GET and DELETE answer `405`, which the Streamable HTTP spec allows a session-less server. No MCP SDK server runs inside it: a Scaleway function receives a parsed event, never Node's `req`/`res`, so the SDK's transports cannot attach — and the four messages a stateless server must answer (`initialize`, notifications → 202, `tools/list`, `tools/call`) are dispatched by hand.

- **Tools** (`mcp_tools.ts`) are a **pure translation layer** over the real handlers: `tools/call` becomes an in-process invocation of `search_api.handle` / `sc_llm_x402.handle` with a synthetic event. No payment, pricing, or cost policy lives in the MCP surface — the handlers own all of it, so the MCP tools serve the same challenge config, prices, channels, and cost rules as the REST API and cannot drift from them. (A first version assembled its own challenge config around `@x402/mcp`'s payment wrapper and diverged — offering testnet accepts the search route forbids; the translation design makes that class of bug unconstructible. `@x402/mcp` remains only as the source of the two `_meta` key constants.)
- **Payment** rides the handlers' native protocol, translated both ways: the client's `_meta["x402/payment"]` becomes the base64 `payment-signature` header (what every REST buyer sends); the handler's own 402 — whose body IS the PaymentRequired JSON (`create402Response`) — becomes the MCP payment-required result (`isError` + `structuredContent`, the official client's extraction form; JSON-RPC error `-32042` client-side); the handler's `Payment-Response` header becomes the settlement receipt in `_meta["x402/payment-response"]`. Clients pay with `@x402/mcp`'s `createx402MCPClient` (register `BatchSettlementEvmScheme` client-side, as the x402 MCP guide shows).
- **Every cost and security rule is the handler's own**, inherited by construction: no-free-path (the translation layer runs no service code, it can only relay to the handler that enforces payment), mainnet-only search (testnet coins can never buy metered Brave queries), testnet-mocked completions (worthless coins never buy real Mistral spend), usage-derived settlement (the chat's authorize-ceiling/claim-usage split, no proxy needed). `test/mcp_server.test.ts` pins all four through the real handlers.
- **Input schemas** come from the same Zod modules the OpenAPI specs are generated from — the MCP tools advertise exactly the real API's contract.
- **Registry**: each agent's registration file declares the shared MCP service with its own `mcpTools` (`agent_registration.ts` → `MCP_SERVICE`); genimg has no MCP tool yet (its mint/no-mint decision is still open).
- **Local check**: `npm run dev:mcp` serves `handle()` on `127.0.0.1:8086`; point `npx @modelcontextprotocol/inspector` at `http://127.0.0.1:8086/mcp` to exercise the handshake, the tool list, and the unpaid payment demand before any deploy. The buyer notebook `notebooks/mcp_x402_buyer.ipynb` drives the full paid walk — note that on testnet, paid `web_search` is unpayable by design (mainnet-only accepts); `llm_complete` is the testnet walk.

8004scan is the external validator. Its API shows how it parsed each agent; `errors` and `warnings` should be empty:

```bash
for id in 97598 97599 97600; do
  curl -sS "https://8004scan.io/api/v1/agents/8453/$id" | jq '{name, parse_status, metadata_completeness_score, is_endpoint_verified}'
done
```

8004scan serves what it last parsed (`parse_status.last_parsed_at`), so a change to the file shows there only after it parses the file again.

Later, if wanted: tell paying clients they can leave feedback for the `agentId` (Reputation Registry); reference the ids from `x-discovery` in the OpenAPI specs; move the `agentURI` to IPFS or a `data:` URI if the domain dependency becomes a concern. The Validation Registry waits on its spec section.

### Stablecoins and pricing (USDC, EURC, EURe)

All three sellers (image, chat, search) take **USDC on every network and EURC and EURe on
Base / Base Sepolia**. Circle has no EURC and Monerium no EURe on Optimism. USDC, EURC and EURe
are **three parallel price lists**: every price is set explicitly in each token, and nothing is
converted between them. EURe has **18 decimals** (USDC and EURC have 6), so its atomic prices
are twelve orders of magnitude larger than the same nominal price in EURC — `tokensToCost`
rescales by the token's decimals, and a price literal that assumes 6 decimals is wrong by 10¹².
EURe has no EIP-3009: its 402 entries carry `assetTransferMethod: "permit2"` and its challenges
advertise `eip2612GasSponsoring`, so a buyer needs no `approve()` — not to Permit2, not to the
token contract.

| What           | USDC               | EURC               | EURe               | Where it is set                                                                        |
| -------------- | ------------------ | ------------------ | ------------------ | -------------------------------------------------------------------------------------- |
| Image          | 0.07               | 0.06               | 0.06               | `USDC_PAYMENT_AMOUNT` / `EURC_PAYMENT_AMOUNT` / `EURE_PAYMENT_AMOUNT` (serverless.yml) |
| Search / fetch | 0.01 / 0.001       | 0.01 / 0.001       | 0.01 / 0.001       | `PRICE_ATOMIC` in `search_schemas.ts`                                                  |
| Chat           | Mistral's USD card | Mistral's EUR card | Mistral's EUR card | `pricePerMillion` in `llm_service.ts`                                                  |

The chat price is computed per message from token usage, on the rate card of the currency the
channel is in: $0.50 / $1.50 per million input/output tokens, or €0.44 / €1.50 (EURC and EURe
share the EUR card — a euro is a euro). Each card is the provider's own published price in that
currency. OpenAPI `x-payment-info.price` must be quoted in USD, so it carries the USDC price;
the EURC and EURe prices are stated in the description.

- **Preference:** on Base the 402 lists EURe, then EURC, then USDC (`STABLECOIN_PREFERENCE`). A
  stock x402 client pays with the first entry its spend controls allow, and the SDK's built-in
  asset registry only knows USDC, so a default client keeps paying USDC until it allowlists
  EURe or EURC.
- **Facilitator fee:** charged in the token the payment settled in, so the seller wallet
  (`NFT_WALLET_PUBLIC_KEY`) needs an `approve()` for the facilitator for **every (network, token)
  pair the sellers offer**. Without it every payment or claim in that pair fails with
  `insufficient_fee_allowance`. `npm run fee-allowances` lists every offered pair and exits 1 if
  any is below one fee; `npm run fee-allowances -- --approve` fixes the short ones (needs
  `NFT_WALLET_PRIVATE_KEY` and a little gas). It runs as `predeploy`, so `npm run deploy` refuses to
  ship an offer that cannot be paid. The claim cron still warns per token when an approval runs
  low between deploys. EURe's fee approval is **1 EURe (10¹⁸)** — a `1000000` allowance, right
  for the 6-decimal tokens, covers no EURe fee at all.
- **Channels:** USDC, EURC and EURe channels share each network's `channels/<network>/` prefix
  (the token is part of the channel id). The cron claims one token at a time, because a claim
  batch must not mix tokens. `scripts/recover_channels.ts` takes the token as an argument for
  the same reason.

## 🗄️ S3 Storage Layout & Data Classification

All functions share the `my-imagestore` bucket (region `nl-ams`). Access is controlled **per object** (object ACL), independent of the bucket ACL. When writing, only publish what is meant to be public — the table below is the source of truth for whether a prefix is public.

| Prefix / object                            | Access        | Why                                                                                                                                                                                                                                |
| ------------------------------------------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `images/`, `metadata/`, root `image*.json` | `public-read` | NFT assets referenced on-chain via `tokenURI` — must be publicly fetchable.                                                                                                                                                        |
| `channels/`                                | private       | x402 batch-settlement channel state (`x402_channel_storage.ts`) — per-channel balance, cumulative claim, pending-request lock. Not public; settled totals are independently verifiable on-chain via the batch-settlement contract. |
| `growth-agent/`, `growth-agent-dev/`       | private       | Internal growth-agent state; owner-only, read/written via the authenticated `growthapi` function.                                                                                                                                  |
| `comments/`                                | private       | Comment-service state.                                                                                                                                                                                                             |
| `terraform/`                               | private       | Infrastructure-as-code state.                                                                                                                                                                                                      |

> Note: anonymous bucket **listing** is currently enabled, which exposes object _key names_ (not contents) of the private prefixes. This is an accepted low-severity item — see [SECURITY.md](./SECURITY.md).

## Local Testing

```bash
# Image Generation (x402)
npm run dev:x402

# Growth API (port 8083)
npm run dev:growth

# LLM Chat (x402 batch-settlement)
npm run dev:llmx402
npm run dev:llmx402cron
```

## Logs and alerting

Reading logs and the Loki alert rules for these functions live in
[`../observability/`](../observability/README.md), since they cover the whole Scaleway project.
This package's part of it: `logger.error` means "ours, and should page", and
`test/alert_coverage.test.ts` fails if a `logger.error` has no matching rule there or a file
uses bare `console.*`. Log through the shared `logger.ts`.

## Deployment

```bash
npm run deploy
```

---

## 🔐 Adding New Networks (USDC Configuration)

When adding support for a new network, follow this checklist to prevent EIP-712 domain mismatches (see CVE-2025-12-26).

### Background: Why This Matters

USDC contracts use EIP-3009 (`transferWithAuthorization`) which requires EIP-712 typed signatures. The signature includes a **domain separator** with the token's name and version. If our configuration doesn't match the on-chain contract, settlements will fail **after** expensive operations (like image generation) have completed.

**The Bug Pattern:**

1. Server returns `paymentRequirements.extra: {name: "USDC"}` in 402 response
2. Client creates signature with domain `{name: "USDC"}`
3. Server verifies signature → ✅ **PASSES** (both use same value)
4. Server performs expensive operation (BFL image generation)
5. Settlement on-chain → ❌ **FAILS** (contract uses `{name: "USD Coin"}`)

### Checklist: Adding a New Network

- [ ] **Step 1: Find USDC Contract Address**
  - Official Circle docs: https://developers.circle.com/stablecoins/docs/usdc-on-main-networks
  - Verify on block explorer (Etherscan, Basescan, etc.)

- [ ] **Step 2: Read EIP-712 Domain from Contract**

  ```javascript
  // Use viem to read the domain
  const domain = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: [{ name: "eip712Domain", type: "function", ... }],
    functionName: "eip712Domain",
  });
  console.log("Name:", domain[1]);    // e.g., "USD Coin" or "USDC"
  console.log("Version:", domain[2]); // e.g., "2"
  ```

- [ ] **Step 3: Add Configuration to `getChain.js`**

  ```javascript
  case "eip155:CHAIN_ID":
    return {
      name: getChainNameFromEIP155(network),
      chainId: CHAIN_ID,
      address: "0x...",
      decimals: 6,
      usdcName: "EXACT_NAME_FROM_CONTRACT", // From Step 2!
      usdcVersion: "2",
    };
  ```

- [ ] **Step 4: Add viem Chain to `getViemChain()`**

  ```javascript
  case "eip155:CHAIN_ID":
    return newChain; // Import from viem/chains
  ```

- [ ] **Step 5: Add Integration Test**
      Add the network to `test/getChain.test.js` in the "EIP-712 Domain Validation" section.

- [ ] **Step 6: Run Validation Tests**

  ```bash
  npm test -- --run getChain.test.js
  ```

- [ ] **Step 7: Test on Testnet First**
      Always deploy to testnet and verify a complete payment flow before mainnet.

### Known USDC Domain Names

| Network          | CAIP-2 ID         | Domain Name | Version | Verified      |
| ---------------- | ----------------- | ----------- | ------- | ------------- |
| Optimism Mainnet | `eip155:10`       | `USD Coin`  | `2`     | ✅ 2025-12-26 |
| Optimism Sepolia | `eip155:11155420` | `USDC`      | `2`     | ✅ 2025-12-26 |
| Base Mainnet     | `eip155:8453`     | `USD Coin`  | `2`     | ✅ 2025-12-26 |
| Base Sepolia     | `eip155:84532`    | `USDC`      | `2`     | ✅ 2025-12-26 |

### Known EURC Domain Names

EURC exists on Base only (Circle has no Optimism deployment). Unlike USDC, mainnet and testnet share one name.

| Network      | CAIP-2 ID      | Address                                      | Domain Name | Version | Verified      |
| ------------ | -------------- | -------------------------------------------- | ----------- | ------- | ------------- |
| Base Mainnet | `eip155:8453`  | `0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42` | `EURC`      | `2`     | ✅ 2026-09-25 |
| Base Sepolia | `eip155:84532` | `0x808456652fdb597867f38412077A9182bf77359F` | `EURC`      | `2`     | ✅ 2026-09-25 |

### Known EURe Domain Names

EURe (Monerium) exists on Base only. It has **no EIP-3009** — it settles via Permit2 with an
EIP-2612 permit (`assetTransferMethod: "permit2"`), so the domain below signs the permit, not a
`transferWithAuthorization`. Mainnet and sandbox share one name and version; the sandbox address
is the testnet token. Domain values recomputed from `DOMAIN_SEPARATOR()` on-chain, 2026-10-04.

| Network      | CAIP-2 ID      | Address                                      | Domain Name     | Version | Verified      |
| ------------ | -------------- | -------------------------------------------- | --------------- | ------- | ------------- |
| Base Mainnet | `eip155:8453`  | `0xbf6e2966A9C3D99C9E4D069E04f7Bdb9C8aa762C` | `Monerium EURe` | `1`     | ✅ 2026-10-04 |
| Base Sepolia | `eip155:84532` | `0x29F37F6adCa168B79B8d9567eab9BE3fBF21db85` | `Monerium EURe` | `1`     | ✅ 2026-10-04 |

> ⚠️ **Warning:** Mainnet and Testnet often have DIFFERENT domain names! Always verify.

---
