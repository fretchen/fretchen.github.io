# Fretchen AI Services

Serverless functions for AI image generation and LLM services with blockchain integration on Optimism L2.

## 📖 API Documentation

- **OpenAPI Spec**: [`openapi.json`](./openapi.json) - Full REST API documentation
- **EIP-8004 Registration**: [`agent-registration.json`](./agent-registration.json) - Agent discovery and trust

### Quick Links

| Service | Endpoint | Description |
|---------|----------|-------------|
| Image Generation | `genimgbfl` | AI image generation + NFT minting |
| LLM | `llm` | Blockchain-authenticated LLM |
| Leaf History | `leafhistory` | Merkle tree leaf queries |
| NFT Reader | `readnftv2` | Read NFT metadata |

## Functions

### `genimg_bfl.js` - AI Image Generation

Generates AI images using Black Forest Labs API and updates NFT tokens on Optimism.

**Endpoint:** POST

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | ✅ | Text prompt for AI image generation |
| `tokenId` | number | ✅ | NFT token ID to update |
| `mode` | string | ❌ | `generate` (default) or `edit` |
| `size` | string | ❌ | `1024x1024` (default) or `1792x1024` |
| `referenceImage` | base64 | ❌ | Required for `edit` mode |

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

| Contract | Chain | Address |
|----------|-------|---------|
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

## 🏷️ EIP-8004 Agent Registration

This service is designed to be discoverable via [EIP-8004](https://eips.ethereum.org/EIPS/eip-8004) (Trustless Agents). 

The [`agent-registration.json`](./agent-registration.json) file contains:
- Service endpoints (OpenAPI, direct URLs)
- Agent wallet address for on-chain identity
- Pricing information
- Contract addresses

To register this agent on-chain, mint an NFT in the EIP-8004 Identity Registry pointing to this registration file.
