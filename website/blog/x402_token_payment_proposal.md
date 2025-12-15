# x402 Token Payment + Auto-Mint Proposal

## Executive Summary

Migrate from **Pay-by-Mint** to **Pay-by-Token + Auto-Mint** using standard x402 protocol.

**Current Flow (Non-Standard):**
```
Client mints NFT → Client provides txHash → Server verifies → Server generates image
```

**Proposed Flow (x402 Standard):**
```
Client signs token transfer → Server verifies → Server mints NFT + generates image → Facilitator settles
```

## Why Change?

### Current Implementation Issues

1. **Not x402 Compliant**
   - Custom payment verification (NFT mint check)
   - No facilitator integration
   - Breaks protocol assumptions

2. **Poor UX**
   - Requires MetaMask transaction (gas, slow)
   - User must wait for TX confirmation
   - Double popup (approve + sign)

3. **Limited Ecosystem Integration**
   - Can't use x402 clients (Python, TypeScript, Go)
   - Can't leverage facilitator infrastructure
   - Isolated from x402 ecosystem

### Proposed Solution Benefits

1. **x402 Protocol Compliance**
   - Uses standard `exact` scheme (EIP-3009)
   - Integrates with facilitators
   - Compatible with x402 clients

2. **Superior UX**
   - Single signature (no gas for user!)
   - Instant response (no waiting)
   - No MetaMask popup (just sign)

3. **Server-Controlled Minting**
   - Mint after payment verification
   - Batch multiple mints (gas optimization)
   - Guaranteed delivery

## Technical Architecture

### Token Configuration

**Supported Tokens:** USDC on Optimism
- **Contract:** `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85`
- **Decimals:** 6
- **EIP-3009:** ✅ Supported
- **Price:** 0.001 USDC per image (~$0.001)

### x402 Payment Flow

#### 1. Initial Request (No Payment)

**Request:**
```http
POST /genimg HTTP/1.1
Content-Type: application/json

{
  "prompt": "A beautiful sunset"
}
```

**Response:**
```http
HTTP/1.1 402 Payment Required
X-Payment: {
  "x402Version": 2,
  "resource": {
    "url": "https://api.example.com/genimg",
    "description": "AI Image Generation with NFT Certificate"
  },
  "accepts": [{
    "scheme": "exact",
    "network": "eip155:10",
    "amount": "1000",
    "asset": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    "payTo": "0x...SERVER_WALLET",
    "maxTimeoutSeconds": 60,
    "extra": {
      "name": "USDC",
      "version": "2"
    }
  }]
}

{
  "error": "Payment required",
  "message": "Please provide payment to access this service"
}
```

#### 2. Client Creates Payment Signature

Using x402 Python client:

```python
from eth_account import Account
from x402.clients.requests import x402_requests

# Load wallet
account = Account.from_key(private_key)

# Create x402 session (handles 402 automatically!)
session = x402_requests(
    account=account,
    max_value=1000000  # Max 1 USDC
)

# Make request - signature is created automatically
response = session.post(
    "https://api.example.com/genimg",
    json={"prompt": "A beautiful sunset"}
)

# Get result
result = response.json()
print(f"Image: {result['image_url']}")
print(f"NFT: {result['tokenId']}")
```

**What happens under the hood:**
1. Session receives 402 response
2. Extracts payment requirements
3. Creates EIP-3009 authorization:
   ```javascript
   transferWithAuthorization(
     from: clientAddress,
     to: serverAddress,
     value: 1000,
     validAfter: now,
     validBefore: now + 60s,
     nonce: randomBytes32()
   )
   ```
4. Signs with private key
5. Retries request with X-Payment header

#### 3. Server Verification + Minting

**Server Flow:**

```typescript
// genimg_x402_token.js
import { createPublicClient, parseUnits } from 'viem'
import { optimism } from 'viem/chains'
import { verify } from 'x402/verify'

const USDC_ADDRESS = '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'
const SERVER_WALLET = '0x...'
const MINT_PRICE = parseUnits('0.001', 6) // 1000 USDC base units

export const handler = async (event) => {
  const { prompt, payment } = JSON.parse(event.body)
  
  // No payment? Return 402
  if (!payment) {
    return create402Response()
  }
  
  // Verify payment with facilitator
  const verification = await verify({
    paymentPayload: payment,
    facilitatorUrl: 'https://facilitator.x402.org'
  })
  
  if (!verification.valid) {
    return {
      statusCode: 402,
      body: JSON.stringify({
        error: 'Invalid payment',
        reason: verification.reason
      })
    }
  }
  
  // Extract payer address from payment
  const payerAddress = payment.payload.authorization.from
  
  // Generate image
  const { imageUrl, metadataUrl } = await generateImage(prompt)
  
  // Mint NFT to payer (server pays gas)
  const mintTx = await mintNFT({
    to: payerAddress,
    tokenURI: metadataUrl
  })
  
  // Settle payment (facilitator executes token transfer)
  const settlementTx = await settle({
    paymentPayload: payment,
    facilitatorUrl: 'https://facilitator.x402.org'
  })
  
  return {
    statusCode: 200,
    headers: {
      'X-Payment-Response': JSON.stringify({
        transactionHash: settlementTx.hash,
        network: 'eip155:10'
      })
    },
    body: JSON.stringify({
      image_url: imageUrl,
      metadata_url: metadataUrl,
      tokenId: mintTx.tokenId,
      mintTxHash: mintTx.hash,
      paymentTxHash: settlementTx.hash
    })
  }
}

async function mintNFT({ to, tokenURI }) {
  // Server mints NFT (pays gas)
  const tx = await nftContract.write.mint([to, tokenURI], {
    account: serverWallet
  })
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash: tx })
  const tokenId = extractTokenIdFromLogs(receipt.logs)
  
  return { hash: tx, tokenId }
}
```

#### 4. Settlement

Facilitator executes the token transfer:

```solidity
// On-chain execution by facilitator
USDC.transferWithAuthorization(
  from: clientAddress,
  to: serverAddress, 
  value: 1000,
  validAfter: payment.authorization.validAfter,
  validBefore: payment.authorization.validBefore,
  nonce: payment.authorization.nonce,
  v: signature.v,
  r: signature.r,
  s: signature.s
)
```

### Smart Contract Changes

**GenImNFTv5 Requirements:**

```solidity
// New minting function for server
function mintWithMetadata(
    address to,
    string memory tokenURI
) external onlyRole(MINTER_ROLE) returns (uint256) {
    _tokenIds++;
    uint256 newTokenId = _tokenIds;
    
    _safeMint(to, newTokenId);
    _setTokenURI(newTokenId, tokenURI);
    
    emit TokenMinted(to, newTokenId, tokenURI);
    
    return newTokenId;
}

// Grant MINTER_ROLE to server wallet
function grantMinterRole(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
    grantRole(MINTER_ROLE, minter);
}
```

**Changes:**
- ✅ No public `mint()` function (prevent direct minting)
- ✅ `mintWithMetadata()` only callable by server
- ✅ Server wallet has `MINTER_ROLE`
- ✅ Events for tracking

### Client Integration

#### Python Client (Notebook)

```python
from eth_account import Account
from x402.clients.requests import x402_requests

# Setup
account = Account.from_key(private_key)
session = x402_requests(account, max_value=1000000)

# Generate image - ONE LINE!
response = session.post(
    "https://api.example.com/genimg",
    json={"prompt": "A sunset over mountains"}
)

result = response.json()
print(f"✅ Image generated: {result['image_url']}")
print(f"🎫 NFT minted: Token #{result['tokenId']}")
print(f"💰 Payment: {result['paymentTxHash']}")
```

#### TypeScript Client (Website)

```typescript
import { x402Client } from 'x402/client'
import { useAccount } from 'wagmi'

export function useImageGeneration() {
  const { address } = useAccount()
  
  const generateImage = async (prompt: string) => {
    // x402 client handles 402 automatically
    const client = new x402Client({
      account: address,
      maxValue: parseUnits('1', 6) // 1 USDC max
    })
    
    const response = await client.post('/genimg', {
      prompt
    })
    
    return response.data // { image_url, tokenId, mintTxHash, paymentTxHash }
  }
  
  return { generateImage }
}
```

## Implementation Phases

### Phase 1: Smart Contract Update (1-2 days)

- [ ] Deploy GenImNFTv5 with `mintWithMetadata()`
- [ ] Grant `MINTER_ROLE` to server wallet
- [ ] Test minting from server
- [ ] Verify on Etherscan

### Phase 2: Server Implementation (2-3 days)

- [ ] Install x402 npm package
- [ ] Implement `genimg_x402_token.js`
- [ ] Integrate facilitator (verify + settle)
- [ ] Add USDC payment configuration
- [ ] Test with facilitator testnet

### Phase 3: Client Integration (2-3 days)

- [ ] Update Python notebook with x402 client
- [ ] Update website with x402 TypeScript client
- [ ] Test end-to-end flow
- [ ] Monitor facilitator settlement

### Phase 4: Migration & Monitoring (1 day)

- [ ] Deploy to production
- [ ] Monitor payment success rate
- [ ] Track gas costs (server minting)
- [ ] Collect user feedback

**Total Timeline:** ~1 week

## Cost Analysis

### Current Approach (Pay-by-Mint)

**Per Image:**
- User pays gas: ~0.0001 ETH (~$0.40 on Optimism)
- User pays mint: 0.001 ETH (~$4.00)
- Total user cost: ~$4.40

### Proposed Approach (Token Payment)

**Per Image:**
- User pays: 0.001 USDC ($0.001) - NO GAS!
- Server pays gas: ~0.0001 ETH (~$0.40) for mint
- Server pays gas: ~0 (facilitator batches settlements)

**User savings:** ~$4.39 per image (99.98% reduction!)

**Server costs:**
- Mint gas: $0.40 per image
- Covered by: 0.001 USDC payment ($0.001)
- **Net loss:** $0.399 per image

**Optimization:** Batch minting
- Mint 10 NFTs in single TX: ~$0.80 total
- Cost per image: $0.08
- **Net loss:** $0.079 per image

**Better pricing:** Charge 0.1 USDC ($0.10) per image
- User cost: $0.10 (still 97% cheaper!)
- Server revenue: $0.02 per image after gas

## Security Considerations

### EIP-3009 Safety

**Client Protection:**
- Fixed amount authorization (can't be increased)
- Time-bounded validity (60s window)
- Single-use nonce (can't replay)
- Recipient locked (can't redirect)

**Server Protection:**
- Payment verified before service
- Facilitator ensures on-chain settlement
- No refund vulnerability

### Attack Vectors

**❌ Double-spend:** Impossible (nonce prevents reuse)
**❌ Front-running:** N/A (no public mempool)
**❌ Replay attack:** Prevented (unique nonce per payment)
**❌ Price manipulation:** Fixed amount in signature
**✅ Free mint:** Prevented (no public mint function)

## Risks & Mitigations

### Risk 1: Facilitator Downtime

**Impact:** Payments can't be verified/settled

**Mitigation:**
- Run own facilitator instance
- Fallback to multiple facilitators
- Local verification for trusted users

### Risk 2: Server Gas Costs

**Impact:** Server pays mint gas (~$0.40/image)

**Mitigation:**
- Batch minting (10x reduction)
- Charge higher payment (0.1 USDC)
- Use L3/cheaper chain for NFTs

### Risk 3: USDC Approval

**Impact:** Users must approve USDC spending

**Mitigation:**
- EIP-3009 requires NO approval! (signature only)
- First-time users just sign (no TX)

## Success Metrics

### Primary KPIs

- **Conversion rate:** % of 402 → successful payment
- **Payment latency:** Time from 402 → 200
- **User satisfaction:** Feedback on UX
- **Cost per image:** Server gas costs

### Technical Metrics

- **Facilitator uptime:** % availability
- **Verification success:** % valid signatures
- **Settlement time:** Time to on-chain confirm
- **Batch efficiency:** Mints per TX

## Rollout Strategy

### Week 1: Beta Testing

- Deploy to staging
- Test with 10 beta users
- Monitor metrics closely
- Fix critical bugs

### Week 2: Soft Launch

- Enable for 10% of users (A/B test)
- Compare metrics vs old flow
- Gather user feedback
- Optimize pricing

### Week 3: Full Rollout

- Enable for all users
- Deprecate old endpoint
- Monitor costs
- Celebrate success! 🎉

## Conclusion

**Recommendation:** ✅ Proceed with migration

**Benefits:**
- x402 protocol compliance
- 99.98% cost reduction for users
- Better UX (single signature)
- Ecosystem integration

**Risks:** Manageable
- Facilitator dependency (mitigated)
- Server gas costs (optimized via batching)
- Migration complexity (phased rollout)

**Timeline:** 1 week implementation + 2 weeks testing

**Next Steps:**
1. Review and approve proposal
2. Deploy GenImNFTv5 contract
3. Implement server changes
4. Test with beta users
5. Full rollout

---

**Questions?** Open an issue or contact @fretchen
