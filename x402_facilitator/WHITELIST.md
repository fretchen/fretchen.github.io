# Agent Whitelist System

The x402 Facilitator implements a multi-source agent whitelist system to control access to payment verification and settlement endpoints.

## Overview

The whitelist system uses **OR logic**: an agent is authorized if **any enabled source** returns true. This provides flexible access control while maintaining security.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Payment Verification Request                   │
│  (from: 0xABCD...)                              │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│  1. Basic Format Validation                     │
│     - x402 version                              │
│     - Scheme (exact)                            │
│     - Network (eip155:10 or eip155:11155420)    │
└───────────────┬─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│  2. Agent Whitelist Check (Multi-Source)        │
│                                                 │
│     ┌──────────────┐  ┌──────────────┐         │
│     │    Manual    │  │ Test Wallets │         │
│     │  Whitelist   │  │  (Testnet)   │         │
│     └──────┬───────┘  └──────┬───────┘         │
│            │                  │                 │
│     ┌──────┴───────┐  ┌──────┴───────┐         │
│     │  GenImNFTv4  │  │    LLMv1     │         │
│     │   Contract   │  │   Contract   │         │
│     └──────┬───────┘  └──────┬───────┘         │
│            │                  │                 │
│            └────────┬─────────┘                 │
│                     │ OR Logic                  │
│                     ▼                           │
│            ┌─────────────────┐                  │
│            │   isWhitelisted? │                  │
│            └────────┬─────────┘                  │
│                     │                           │
└─────────────────────┼───────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  ✓ Authorized          │
         │  ✗ unauthorized_agent  │
         └────────────────────────┘
```

## Whitelist Sources

### 1. Manual Whitelist (Simplest)

A simple comma-separated list of Ethereum addresses. Works on **all networks** (Mainnet and Testnet).

**Configuration:**
```bash
# Enable manual whitelist
WHITELIST_SOURCES=manual

# Add addresses (comma-separated)
MANUAL_WHITELIST=0x1234...,0x5678...,0xABCD...
```

**Use Cases:**
- Quick access grants without smart contract deployment
- Emergency access during contract issues
- Temporary agent authorization
- Development/staging environments

**⚠️ Security Note:**
- Manual whitelist is stored in environment variables
- Suitable for small number of trusted agents
- For large-scale production, use smart contract whitelists

### 2. GenImNFTv4 Contract (Primary)

The GenImNFTv4 smart contract maintains an on-chain whitelist of authorized agents.

**Contract Function:**
```solidity
function isAuthorizedAgent(address agent) public view returns (bool)
```

**Configuration:**
```bash
# Enable GenImNFTv4 whitelist
WHITELIST_SOURCES=genimg_v4

# Optimism Mainnet
GENIMG_V4_MAINNET_ADDRESS=0x...

# Optimism Sepolia (Testnet)
GENIMG_V4_SEPOLIA_ADDRESS=0x...
```

**Authorizing an Agent:**
```bash
# On-chain transaction required (contract owner only)
cast send $GENIMG_V4_ADDRESS "authorizeAgentWallet(address)" 0xYourAgentAddress \
  --private-key $OWNER_PRIVATE_KEY \
  --rpc-url $OPTIMISM_RPC_URL
```

### 2. LLMv1 Contract (Optional)

Similar to GenImNFTv4, the LLMv1 contract can also maintain an agent whitelist.

**Configuration:**
```bash
# Enable both GenImNFTv4 and LLMv1
WHITELIST_SOURCES=genimg_v4,llmv1

# LLMv1 addresses
LLMV1_MAINNET_ADDRESS=0x...
LLMV1_SEPOLIA_ADDRESS=0x...
```

### 3. Test Wallets (Development Only)

For local development and testing on Sepolia testnet, you can whitelist specific addresses without on-chain authorization.

**Configuration:**
```bash
# Enable test wallets (comma-separated addresses)
WHITELIST_SOURCES=test_wallets
TEST_WALLETS=0x1111...,0x2222...,0x3333...
```

**⚠️ Security Note:**
- Test wallets are **only active on Sepolia** (eip155:11155420)
- Automatically disabled on Mainnet (eip155:10)
- Never use in production!

## Caching

The whitelist system implements a **1-minute TTL cache** to reduce blockchain RPC calls and improve performance.

**Cache Key Format:**
```
{network}:{normalized_address}
```

**Cache Statistics:**
```javascript
import { getWhitelistCacheStats } from './x402_whitelist.js';

const stats = getWhitelistCacheStats();
console.log(stats);
// {
//   size: 5,
//   entries: [
//     {
//       key: "eip155:11155420:0xabcd...",
//       isWhitelisted: true,
//       source: "genimg_v4",
//       age: 15234
//     }
//   ]
// }
```

**Manual Cache Clear:**
```javascript
import { clearWhitelistCache } from './x402_whitelist.js';

clearWhitelistCache(); // Clears all cached entries
```

## Error Codes

### `unauthorized_agent`

Returned when the payer address is not whitelisted in any enabled source.

**Example Response:**
```json
{
  "isValid": false,
  "invalidReason": "unauthorized_agent",
  "payer": "0x1234567890123456789012345678901234567890"
}
```

**Resolution:**
1. **Check Configuration:** Ensure `WHITELIST_SOURCES` is set correctly
2. **Verify Contract Addresses:** Check `GENIMG_V4_*_ADDRESS` environment variables
3. **On-Chain Authorization:** Call `authorizeAgentWallet()` on the contract
4. **Cache Issue:** Clear cache with `clearWhitelistCache()`

## Performance

**Typical Whitelist Check Times:**
- **Test Wallets:** <1ms (in-memory lookup)
- **Contract Call (cached):** <1ms (cache hit)
- **Contract Call (uncached):** ~50ms (RPC call to blockchain)

**Optimization:**
- Parallel contract checks when multiple sources enabled
- 1-minute cache TTL reduces RPC load by ~99%
- Case-insensitive address normalization

## Multi-Source Logic (OR)

When multiple sources are enabled, the whitelist check succeeds if **ANY source** returns true.

**Example:**
```bash
WHITELIST_SOURCES=genimg_v4,llmv1,test_wallets
```

**Check Order:**
1. Test Wallets (fastest - in-memory)
2. GenImNFTv4 & LLMv1 (parallel contract calls)
3. Return true if ANY source authorized

**Use Cases:**
- **Development:** `test_wallets` for quick local testing
- **Production:** `genimg_v4` for GenImNFT agents
- **Multi-Project:** `genimg_v4,llmv1` for agents from multiple contracts

## Integration Examples

### Local Development

```bash
# .env file
WHITELIST_SOURCES=test_wallets
TEST_WALLETS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

### Sepolia Testnet

```bash
# Enable both test wallets and contract
WHITELIST_SOURCES=test_wallets,genimg_v4
TEST_WALLETS=0xDev1...,0xDev2...
GENIMG_V4_SEPOLIA_ADDRESS=0x123...
```

### Production (Optimism Mainnet)

```bash
# Only contract-based authorization
WHITELIST_SOURCES=genimg_v4
GENIMG_V4_MAINNET_ADDRESS=0x456...

# Test wallets automatically ignored on mainnet
```

## Testing

The whitelist system includes comprehensive tests covering:

✅ Configuration parsing
✅ Test wallet authorization (testnet only)
✅ GenImNFTv4 contract integration
✅ Multi-source OR logic
✅ Caching behavior
✅ Error handling

**Run Tests:**
```bash
npm test -- x402_whitelist.test.js
```

## Monitoring & Logging

The whitelist system logs all authorization checks:

**Authorized Agent:**
```json
{
  "level": "info",
  "msg": "Agent whitelisted via contract",
  "address": "0xABCD...",
  "network": "eip155:11155420",
  "source": "genimg_v4"
}
```

**Unauthorized Agent:**
```json
{
  "level": "warn",
  "msg": "Agent not whitelisted",
  "address": "0x1234...",
  "network": "eip155:10",
  "sources": ["genimg_v4"]
}
```

**Cache Hit:**
```json
{
  "level": "debug",
  "msg": "Whitelist cache hit",
  "address": "0xABCD...",
  "network": "eip155:10",
  "source": "genimg_v4"
}
```

## Future Enhancements

Planned features for Phase 4:

- [ ] Admin Dashboard for whitelist management
- [ ] Webhook notifications for authorization changes
- [ ] Rate limiting per agent
- [ ] Usage analytics and metrics
- [ ] Redis-based distributed caching
- [ ] Additional contract sources (DAO, multi-sig)
