# Fretchen AI Services

Serverless functions for AI image generation and LLM services with blockchain integration on Optimism L2.

## 📖 API Documentation

- **OpenAPI Specs**: [`openapi.genimg.json`](./openapi.genimg.json) / [`openapi.llm.json`](./openapi.llm.json) - Per-service x402 discovery contracts, each served live at `GET /openapi.json` on its own origin
- **EIP-8004 Registration**: [`agent-registration.json`](./agent-registration.json) - Agent discovery and trust

### Quick Links

| Service          | Endpoint          | Description                                            |
| ---------------- | ----------------- | ------------------------------------------------------ |
| Image Generation | `genimgx402token` | AI image generation + NFT minting (x402 USDC payment)  |
| LLM Chat         | `llmx402`         | x402 batch-settlement LLM chat (USDC payment channels) |
| LLM Claim/Settle | `llmx402cron`     | Claims and settles accumulated LLM channels every 12h  |
| Growth API       | `growthapi`       | Draft approval API for Growth Agent (wallet auth)      |

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

> ⚠️ **Warning:** Mainnet and Testnet often have DIFFERENT domain names! Always verify.

---
