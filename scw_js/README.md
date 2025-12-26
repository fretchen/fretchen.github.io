# Fretchen AI Services

Serverless functions for AI image generation and LLM services with blockchain integration on Optimism L2.

## 📖 API Documentation

- **OpenAPI Spec**: [`openapi.json`](./openapi.json) - Full REST API documentation
- **EIP-8004 Registration**: [`agent-registration.json`](./agent-registration.json) - Agent discovery and trust

### Quick Links

| Service          | Endpoint      | Description                       |
| ---------------- | ------------- | --------------------------------- |
| Image Generation | `genimgbfl`   | AI image generation + NFT minting |
| LLM              | `llm`         | Blockchain-authenticated LLM      |
| Leaf History     | `leafhistory` | Merkle tree leaf queries          |
| NFT Reader       | `readnftv2`   | Read NFT metadata                 |

## Functions

### `genimg_bfl.js` - AI Image Generation

Generates AI images using Black Forest Labs API and updates NFT tokens on Optimism.

**Endpoint:** POST

**Parameters:**

| Field            | Type   | Required | Description                          |
| ---------------- | ------ | -------- | ------------------------------------ |
| `prompt`         | string | ✅       | Text prompt for AI image generation  |
| `tokenId`        | number | ✅       | NFT token ID to update               |
| `mode`           | string | ❌       | `generate` (default) or `edit`       |
| `size`           | string | ❌       | `1024x1024` (default) or `1792x1024` |
| `referenceImage` | base64 | ❌       | Required for `edit` mode             |

**Example:**

```json
{
  "prompt": "A beautiful sunset over mountains",
  "tokenId": 42,
  "mode": "generate",
  "size": "1024x1024"
}
```

**Response:**

```json
{
  "metadata_url": "https://...",
  "image_url": "https://...",
  "transaction_hash": "0x...",
  "mintPrice": "500000000000000"
}
```

### `sc_llm.js` - Blockchain LLM

LLM service with wallet signature authentication and Merkle-tree based usage tracking.

**Endpoint:** POST

**Parameters:**

```json
{
  "data": {
    "prompt": "Your question here",
    "useDummyData": false
  },
  "auth": {
    "address": "0xYourWalletAddress",
    "signature": "0x...",
    "message": "Signed message"
  }
}
```

**Requirements:**

- Wallet must have minimum balance of 0.00001 ETH
- Valid EIP-191 signature required

### `readhandler_v2.js`

NFT metadata reader.

### `leaf_history.js`

Query Merkle tree leaves for usage tracking.

## 🔗 On-Chain Integration

| Contract   | Chain    | Address                                      |
| ---------- | -------- | -------------------------------------------- |
| GenImNFTv4 | Optimism | `0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb` |

## Local Testing

```bash
# Image Generation
NODE_ENV=test node genimg_bfl.js

# LLM Service
NODE_ENV=test node sc_llm.js
```

## Deployment

```bash
serverless deploy
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
