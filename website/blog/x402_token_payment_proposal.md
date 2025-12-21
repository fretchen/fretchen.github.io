# x402 Token Payment + Auto-Mint Proposal

## Executive Summary

Migrate from **Pay-by-Mint** to **Pay-by-Token + Auto-Mint** using standard x402 protocol.

**Implementation Strategy:**
- 🚀 **MVP Phase:** Use existing GenImNFTv4 with mint+transfer (Option A) - Start immediately
- 🎯 **Final Phase:** Upgrade to GenImNFTv5 with `mintTo()` (Option B) - After MVP validation

**Current Status:**
- ✅ Facilitator deployed and ready (https://facilitator.fretchen.eu)
- ✅ GenImNFTv4 contract exists (0x80f95...1Cdb on Optimism)
- ✅ Can start MVP today with mint+transfer pattern
- ⚠️ Need server implementation (3-4 days)
- ⚠️ Need client integration (2-3 days)
- 📅 Contract upgrade to v5 (2 hours) - After MVP testing

**Current Flow (Non-Standard):**
```
Client mints NFT → Client provides txHash → Server verifies → Server generates image
```

**Target Flow (x402 Standard):**
```
Client signs token transfer → Server verifies → Server generates image + mints NFT → Facilitator settles
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
  // Option A: Use current GenImNFTv4 (mint + transfer)
  const mintTx = await nftContract.write.safeMint([tokenURI], {
    account: serverWallet,
    value: mintPrice
  })
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash: mintTx })
  const tokenId = extractTokenIdFromLogs(receipt.logs)
  
  // Transfer to client
  const transferTx = await nftContract.write.safeTransferFrom(
    [serverWallet.address, to, tokenId],
    { account: serverWallet }
  )
  
  await publicClient.waitForTransactionReceipt({ hash: transferTx })
  
  return { hash: transferTx, tokenId }
  
  // Option B: Use upgraded GenImNFTv4 with mintTo() (when available)
  // const tx = await nftContract.write.mintTo([to, tokenURI, true], {
  //   account: serverWallet,
  //   value: mintPrice
  // })
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

**Current State - GenImNFTv4:**
- ✅ Already deployed on Optimism Mainnet (0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb)
- ✅ Has `safeMint(string uri)` - anyone can mint by paying `mintPrice`
- ⚠️ Mints to `msg.sender` only - can't mint for others
- ✅ Owner can authorize agent wallets (`authorizeAgentWallet()`)

**Required Enhancement - Add Server Minting:**

```solidity
// Add to GenImNFTv4 via upgrade to v5
function mintTo(
    address recipient,
    string memory uri,
    bool isListed
) external payable returns (uint256) {
    require(_whitelistedAgentWallets[msg.sender], "Not authorized agent");
    require(msg.value >= mintPrice, "Insufficient payment");
    
    uint256 tokenId = _nextTokenId++;
    _safeMint(recipient, tokenId);
    _setTokenURI(tokenId, uri);
    _isListed[tokenId] = isListed;
    
    emit TokenListingChanged(tokenId, isListed);
    return tokenId;
}
```

**Changes Needed:**
- ✅ Add `mintTo()` function for authorized agents
- ✅ Server wallet gets authorized via `authorizeAgentWallet(serverAddress)`
- ✅ No role system needed - whitelist already exists!
- ✅ Server pays mint price + gas, NFT goes to client

**Alternative - Use Existing Contract:**
Server could also mint for itself first, then transfer:
```solidity
// 1. Server mints (pays price)
uint256 tokenId = genImNFT.safeMint(metadataUrl);
// 2. Server transfers to client
genImNFT.safeTransferFrom(serverAddress, clientAddress, tokenId);
```
⚠️ Less efficient (2 transactions), but works with current GenImNFTv4!

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

### Phase 0: Facilitator Setup ✅ COMPLETE

- ✅ Facilitator deployed at https://facilitator.fretchen.eu
- ✅ Whitelist system active (GenImNFTv4 + LLMv1 holders can receive payments)
- ✅ USDC support on Optimism Mainnet + Sepolia
- ✅ 63 tests passing, production ready

---

## 🚀 MVP Implementation (Option A: mint+transfer)

### Phase 1: Server Wallet Authorization (30 minutes)

**Goal:** Enable server wallet to receive x402 payments

- [ ] Mint one GenImNFTv4 NFT to server wallet (auto-whitelists it)
  ```bash
  # Server wallet mints one NFT to itself (0.01 ETH + gas)
  genImNFT.safeMint("ipfs://dummy-metadata", { value: 0.01 ether })
  ```
- [ ] OR: Add server wallet to `MANUAL_WHITELIST` env variable and redeploy facilitator
- [ ] Verify server wallet is whitelisted:
  ```bash
  curl https://facilitator.fretchen.eu/verify -d '{...}'
  ```
- [ ] Authorize server wallet for minting:
  ```solidity
  genImNFT.authorizeAgentWallet(SERVER_WALLET_ADDRESS)
  ```

### Phase 2: Server Implementation (3-4 days)

**Goal:** Implement x402 payment verification and NFT minting

- [ ] Install dependencies:
  ```bash
  npm install viem
  ```
- [ ] Implement `genimg_x402_token.js` handler:
  - [ ] Parse payment from x402 header
  - [ ] Verify with facilitator (`POST /verify`)
  - [ ] Generate image (existing logic)
  - [ ] Mint NFT to server (pays mintPrice + gas)
  - [ ] Transfer NFT to client (pays gas)
  - [ ] Settle payment with facilitator (`POST /settle`)
  - [ ] Return image + NFT info
- [ ] Add environment variables:
  ```bash
  FACILITATOR_URL=https://facilitator.fretchen.eu
  GENIMG_NFT_ADDRESS=0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb
  SERVER_WALLET_PRIVATE_KEY=...
  ```
- [ ] Deploy to Scaleway Functions
- [ ] Test on Sepolia testnet

### Phase 3: Client Integration (2-3 days)

**Goal:** Update clients to use x402 standard flow

**Python Notebook:**
- [ ] Install x402 client: `pip install x402`
- [ ] Replace mint transaction with x402 payment
- [ ] Test end-to-end flow

**Website:**
- [ ] Add x402 TypeScript client
- [ ] Update GenImg UI component
- [ ] Test wallet signature flow

### Phase 4: MVP Testing & Rollout (2-3 days)

- [ ] Beta test with 5-10 users
- [ ] Monitor facilitator logs
- [ ] Track server gas costs
- [ ] Measure user satisfaction
- [ ] Fix bugs
- [ ] Deploy to production

**MVP Timeline:** ~1.5-2 weeks

---

## 🎯 Optimization (Option B: mintTo upgrade)

**When:** After MVP validation (1-2 weeks of production use)

### Phase 5: GenImNFTv5 Upgrade (2 hours)

**Goal:** Reduce gas costs by 50% (mint+transfer → mintTo)

- [ ] Add `mintTo()` function to GenImNFTv4 contract
- [ ] Write tests for `mintTo()`
- [ ] Deploy to Sepolia
- [ ] Test on Sepolia
- [ ] Deploy to Mainnet
- [ ] Update server to use `mintTo()` instead of mint+transfer

**Expected Savings:**
- Before: ~$0.80 per image (2 transactions)
- After: ~$0.40 per image (1 transaction)
- **50% gas reduction**

**Total Timeline (MVP + Optimization):** ~3 weeks

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

**Recommendation:** ✅ Proceed with MVP (Option A), optimize later (Option B)

**Benefits:**
- x402 protocol compliance
- 99.98% cost reduction for users
- Better UX (single signature)
- Ecosystem integration
- Can start TODAY with existing contracts

**Risks:** Manageable
- Facilitator dependency (mitigated by running own instance)
- Server gas costs (optimized in Phase 5)
- Migration complexity (phased rollout)

**Timeline:** 
- MVP: 1.5-2 weeks
- Optimization: +2 hours
- Total: ~3 weeks to production-optimized

---

## 🎯 Next Steps (Start Now!)

### 1. Server Wallet Setup (30 minutes)

```bash
# Create or use existing wallet
export SERVER_WALLET_ADDRESS=0x...

# Option A: Mint GenImNFTv4 to auto-whitelist
# (Run from wallet with 0.01 ETH on Optimism)
cast send $GENIMG_NFT_ADDRESS \
  "safeMint(string)" \
  "ipfs://dummy-metadata" \
  --value 0.01ether \
  --private-key $SERVER_WALLET_PRIVATE_KEY

# Option B: Add to MANUAL_WHITELIST
echo "MANUAL_WHITELIST=$SERVER_WALLET_ADDRESS" >> x402_facilitator/.env
cd x402_facilitator && npm run deploy

# Authorize wallet for minting
cast send $GENIMG_NFT_ADDRESS \
  "authorizeAgentWallet(address)" \
  $SERVER_WALLET_ADDRESS \
  --private-key $OWNER_PRIVATE_KEY
```

### 2. Test Payment Verification (15 minutes)

Create test payment and verify with facilitator:

```python
# In notebook
from eth_account import Account
import requests

account = Account.from_key("0x...")

# Create EIP-3009 signature (simplified)
payment = create_payment_signature(
    from_address=account.address,
    to_address=SERVER_WALLET_ADDRESS,
    amount=1000,  # 0.001 USDC
    asset="0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"
)

# Verify with facilitator
response = requests.post(
    "https://facilitator.fretchen.eu/verify",
    json={"paymentPayload": payment}
)

print(response.json())  # Should return {"isValid": true}
```

### 3. Implement Server Handler (3-4 days)

Create `scw_js/genimg_x402_token.js`:

```javascript
import { createPublicClient, http, parseUnits } from 'viem'
import { optimism } from 'viem/chains'

const FACILITATOR_URL = 'https://facilitator.fretchen.eu'
const GENIMG_NFT = '0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb'
const MINT_PRICE = parseUnits('0.01', 18) // 0.01 ETH

export async function handler(event) {
  const { prompt, payment } = JSON.parse(event.body)
  
  // 1. Return 402 if no payment
  if (!payment) {
    return create402Response()
  }
  
  // 2. Verify payment
  const verification = await fetch(`${FACILITATOR_URL}/verify`, {
    method: 'POST',
    body: JSON.stringify({ paymentPayload: payment })
  })
  
  if (!verification.ok) {
    return { statusCode: 402, body: 'Invalid payment' }
  }
  
  // 3. Generate image
  const { imageUrl, metadataUrl } = await generateImage(prompt)
  
  // 4. Mint NFT (MVP: mint + transfer)
  const clientAddress = payment.payload.authorization.from
  const tokenId = await mintAndTransfer(clientAddress, metadataUrl)
  
  // 5. Settle payment
  await fetch(`${FACILITATOR_URL}/settle`, {
    method: 'POST',
    body: JSON.stringify({ paymentPayload: payment })
  })
  
  return {
    statusCode: 200,
    body: JSON.stringify({ imageUrl, tokenId })
  }
}
```

### 4. Update Clients (2-3 days)

See client integration examples in blog post above.

### 5. Deploy & Test (2-3 days)

```bash
# Deploy server
cd scw_js
npm run deploy

# Test end-to-end
python notebooks/genimg_x402_test.py
```

---

## 📊 Success Metrics

**Track these during MVP:**
- ✅ Payment verification success rate (target: >99%)
- ✅ Average response time (target: <10s)
- ✅ Server gas costs per mint (actual vs expected)
- ✅ User satisfaction (single signature vs double TX)
- ✅ Facilitator uptime (target: >99.9%)

**After 1 week MVP:**
- Decision: Proceed with Option B upgrade? (if >50 mints/day)

---

**Questions?** Open an issue or contact @fretchen
