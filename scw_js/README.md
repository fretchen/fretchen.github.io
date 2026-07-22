# Fretchen AI Services

Serverless functions for AI image generation and LLM services with blockchain integration on Optimism L2.

## 📖 API Documentation

- **OpenAPI Spec**: [`openapi.json`](./openapi.json) - Full REST API documentation
- **EIP-8004 Registration**: [`agent-registration.json`](./agent-registration.json) - Agent discovery and trust

### Quick Links

| Service          | Endpoint          | Description                                           |
| ---------------- | ----------------- | ----------------------------------------------------- |
| Image Generation | `genimgx402token` | AI image generation + NFT minting (x402 USDC payment) |
| LLM Chat         | `llmx402`         | x402 batch-settlement LLM chat (USDC payment channels) |
| LLM Claim/Settle | `llmx402cron`     | Claims and settles accumulated LLM channels every 12h |
| Growth API       | `growthapi`       | Draft approval API for Growth Agent (wallet auth)     |

## Functions

### `genimg_x402_token.js` - AI Image Generation (x402 Payment)

Generates AI images using Black Forest Labs API with USDC payment via x402 protocol. Mints new NFT tokens on Optimism or Base.

**Endpoint:** POST to `imagegen-agent.fretchen.eu`

**Parameters:**

| Field            | Type   | Required | Description                           |
| ---------------- | ------ | -------- | ------------------------------------- |
| `prompt`         | string | ✅       | Text prompt for AI image generation   |
| `network`        | string | ✅       | CAIP-2 network ID (e.g., `eip155:10`) |
| `mode`           | string | ❌       | `generate` (default) or `edit`        |
| `size`           | string | ❌       | `1024x1024` (default) or `1792x1024`  |
| `referenceImage` | base64 | ❌       | Required for `edit` mode              |
| `payment`        | object | ✅       | x402 USDC payment authorization       |

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
  "metadata_url": "https://...",
  "image_url": "https://...",
  "mint_tx_hash": "0x...",
  "transfer_tx_hash": "0x...",
  "token_id": "42",
  "network": "eip155:10"
}
```

### `sc_llm_x402.js` / `llm_x402_cron.js` - x402 Batch-Settlement LLM Chat

LLM chat paid via x402 batch-settlement USDC payment channels — no bearer token, the payment voucher itself proves wallet control. `llmx402` handles chat requests (deposit/voucher/402 flow); `llmx402cron` claims and settles accumulated channels on a 12h schedule. See [`assistent_plan.md`](../assistent_plan.md) at the repo root for the full design record (deposit/voucher/claim/settle lifecycle, pricing model, gotchas).

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

| Prefix / object                            | Access        | Why                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------ | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `images/`, `metadata/`, root `image*.json` | `public-read` | NFT assets referenced on-chain via `tokenURI` — must be publicly fetchable.                                                                                                                                                                                                                                                                           |
| `channels/`                                | private       | x402 batch-settlement channel state (`x402_channel_storage.ts`) — per-channel balance, cumulative claim, pending-request lock. Not public; settled totals are independently verifiable on-chain via the batch-settlement contract. |
| `growth-agent/`, `growth-agent-dev/`       | private       | Internal growth-agent state; owner-only, read/written via the authenticated `growthapi` function.                                                                                                                                                                                                                                                     |
| `comments/`                                | private       | Comment-service state.                                                                                                                                                                                                                                                                                                                                |
| `terraform/`                               | private       | Infrastructure-as-code state.                                                                                                                                                                                                                                                                                                                         |

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
