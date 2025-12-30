# Implementation Plan: USDC Fee Splitter using EIP-3009

## 1. Objective

Implement a minimal, auditable smart-contract–based fee mechanism for USDC payments where:
- The **buyer signs a single EIP-3009 authorization**.
- A **facilitator (relayer)** submits the transaction and earns a **fixed fee (1–2 cents)**.
- The **seller receives the remainder**.
- No custody is taken beyond a single transaction.

## 2. Scope & Non-Goals

### In Scope
- USDC transfers via `transferWithAuthorization`
- Fixed cent-denominated facilitator fee
- Stateless splitter / forwarder contract
- L2 deployment (Base / Optimism / Arbitrum)

### Out of Scope (for v1)
- Percentage-based or dynamic fees
- Multi-recipient splits
- Refunds / partial fills
- Cross-chain support
- On-chain price discovery

## 3. Architecture Overview

```
Buyer (EOA)
└─ signs EIP-3009 authorization
↓
Facilitator / Relayer
└─ calls Splitter.execute(...)
↓
Splitter Contract
├─ pulls total USDC from buyer
├─ transfers fixed fee to facilitator
└─ transfers remainder to seller
```

## 4. Token Assumptions

- Token: **USDC**
- Decimals: **6**
- Interface: **EIP-3009 compliant**
- Authorization model: **exact-value, single-use**

## 5. Fee Model

### Fixed Fee
- `FEE = 10_000` (=$0.01) or `20_000` (=$0.02)
- Expressed in USDC base units
- Fee is **added on top of price**

```
totalAmount = price + fee
sellerAmount = totalAmount - fee
```

### Validation Rules

- `totalAmount >= fee`
- `sellerAmount > 0`
- `fee == EXPECTED_FEE`


## 6. Contract Design (Conceptual)

### ⚠️ EIP-3009 Limitation

**Important**: Standard `transferWithAuthorization` transfers funds directly from `from` to `to`. The Splitter contract must therefore:
1. Receive the full amount first (`to = Splitter`)
2. Then distribute via regular ERC-20 transfers

This means the Splitter **temporarily holds USDC** within a single transaction. While atomically safe, this is not truly "custodyless". A future improvement could use `receiveWithAuthorization` (EIP-3009 extension) which allows the recipient contract to initiate the pull.

### Core Responsibilities
- Execute exactly **one EIP-3009 transfer** (buyer → Splitter)
- Split proceeds deterministically via ERC-20 transfers
- Hold no persistent balances (all funds distributed in same tx)

### Key State (Upgradeable)
- `address public facilitatorWallet` — receives fee
- `uint256 public fixedFee` — fee amount in USDC base units
- `address public usdc` — USDC contract address
- `mapping(address => bool) public allowedFacilitators` — optional multi-facilitator support

### Main Entry Function (Sketch)

```
executeSplit(
buyer,
seller,
totalAmount,
validAfter,
validBefore,
nonce,
signature
)
```

### Internal Steps
1. Validate fee and amounts
2. Call `USDC.transferWithAuthorization`
3. Transfer `fixedFee` to facilitator
4. Transfer remainder to seller

## 7. Authorization Flow (Off-chain)

### Data Buyer Signs
- `from = buyer`
- `to = splitter contract`
- `value = totalAmount`
- `validAfter`
- `validBefore`
- `nonce`

### Guarantees
- Authorization is single-use
- Value is exact
- Split logic is deterministic


## 8. Relayer / Facilitator Logic

### Responsibilities
- Quote price + fee
- Construct EIP-3009 payload
- Submit transaction
- Pay gas
- Collect fee

### Incentives
- Fixed cent fee
- Gas cost amortized or subsidized
- Clean UX for buyer


## 9. Gas & Deployment Strategy

### Target Network
- **Optimism** (primary — aligns with existing GenImNFTv4 and LLMv1 deployments)
- Optimism Sepolia for testnet

### Rationale
- Sub-cent gas costs
- USDC widely available
- Wallet support for EIP-3009
- Consistent with existing x402 Facilitator infrastructure

### Contract Architecture (UUPS Proxy Pattern)

Following repository conventions (see `GENIMG_DEPLOY_V4_GUIDE.md`), the Splitter uses **OpenZeppelin UUPS Proxy Pattern**:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IUSDC_EIP3009 {
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}

contract USDCSplitterV1 is OwnableUpgradeable, UUPSUpgradeable {
    address public usdc;
    address public facilitatorWallet;
    uint256 public fixedFee;
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(
        address _usdc,
        address _facilitatorWallet,
        uint256 _fixedFee
    ) initializer public {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        usdc = _usdc;
        facilitatorWallet = _facilitatorWallet;
        fixedFee = _fixedFee;
    }
    
    function executeSplit(
        address buyer,
        address seller,
        uint256 totalAmount,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(totalAmount > fixedFee, "Amount must exceed fee");
        
        // Step 1: Pull USDC from buyer to this contract
        IUSDC_EIP3009(usdc).transferWithAuthorization(
            buyer,
            address(this),
            totalAmount,
            validAfter,
            validBefore,
            nonce,
            v, r, s
        );
        
        // Step 2: Distribute - seller gets remainder, facilitator gets fee
        uint256 sellerAmount = totalAmount - fixedFee;
        IERC20(usdc).transfer(seller, sellerAmount);
        IERC20(usdc).transfer(facilitatorWallet, fixedFee);
    }
    
    function setFixedFee(uint256 _fixedFee) external onlyOwner {
        fixedFee = _fixedFee;
    }
    
    function setFacilitatorWallet(address _wallet) external onlyOwner {
        facilitatorWallet = _wallet;
    }
    
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
```

### Config-Driven Deployment

Following repository patterns, deployment uses JSON config with Zod validation:

**File: `scripts/splitter-v1.config.json`**
```json
{
  "network": "optimisticEthereum",
  "usdc": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  "facilitatorWallet": "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
  "fixedFee": "10000",
  "validateOnly": false,
  "dryRun": true
}
```

**File: `scripts/deploy-splitter-v1.ts`**
```typescript
import { z } from "zod";
import { viem } from "hardhat";
import fs from "fs";

const ConfigSchema = z.object({
  network: z.enum(["optimisticEthereum", "optsepolia"]),
  usdc: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  facilitatorWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  fixedFee: z.string(),
  validateOnly: z.boolean().default(false),
  dryRun: z.boolean().default(true),
});

async function main() {
  const configPath = process.env.CONFIG_PATH || "./scripts/splitter-v1.config.json";
  const config = ConfigSchema.parse(JSON.parse(fs.readFileSync(configPath, "utf-8")));
  
  console.log("Deploying USDCSplitterV1 with config:", config);
  
  if (config.validateOnly) {
    console.log("✅ Config validated successfully");
    return;
  }
  
  if (config.dryRun) {
    console.log("🔍 Dry run - would deploy with:");
    console.log(`   USDC: ${config.usdc}`);
    console.log(`   Facilitator: ${config.facilitatorWallet}`);
    console.log(`   Fee: ${config.fixedFee} (${Number(config.fixedFee) / 1_000_000} USDC)`);
    return;
  }
  
  // Deploy implementation + proxy
  const splitter = await viem.deployContract("USDCSplitterV1", []);
  console.log(`Implementation deployed: ${splitter.address}`);
  
  // Deploy proxy with initialization
  const proxy = await viem.deployContract("ERC1967Proxy", [
    splitter.address,
    splitter.interface.encodeFunctionData("initialize", [
      config.usdc,
      config.facilitatorWallet,
      BigInt(config.fixedFee),
    ]),
  ]);
  
  console.log(`Proxy deployed: ${proxy.address}`);
}

main().catch(console.error);
```


## 10. Security Considerations

### On-chain
- Enforce fixed fee
- Prevent zero-value seller transfers
- No reentrancy (simple transfer flow)
- Use safe ERC-20 transfer helpers

### Off-chain
- Nonce management
- Short authorization validity window
- Whitelisted facilitator (optional)

## 11. Wallet & UX Considerations

- Buyer sees **single USDC authorization**
- No allowance approval
- Compatible with MetaMask, Rabby, WalletConnect
- Avoid ambiguous or dynamic fee displays


## 12. Testing Plan

### Unit Tests
- Correct split for $0.01 / $0.02
- Revert on incorrect fee
- Revert on reused nonce
- Boundary conditions (fee == total)

### Integration Tests
- End-to-end authorization signing
- Relayer submission
- Seller + facilitator balances


## 13. Auditing & Review

- Keep contract <150 LOC (core logic)
- UUPS proxy for future upgrades
- Inline NatSpec documentation
- External review before mainnet
- Storage layout documentation for upgrade compatibility

## 14. Deployment Checklist

- [ ] Select L2
- [ ] Fix fee amount
- [ ] Deploy splitter
- [ ] Verify contract
- [ ] Configure relayer
- [ ] Test wallet flows
- [ ] Monitor Blockaid / wallet warnings


## 15. x402 Facilitator Integration

The Splitter requires changes across the x402 infrastructure:

### 15.1 Payment Flow Changes

**Current Flow (x402_facilitator/):**
```
Buyer signs authorization (to = seller/payTo)
    ↓
Facilitator verifies signature
    ↓
Facilitator calls USDC.transferWithAuthorization
    ↓
Seller receives full amount (Facilitator pays gas, gets nothing)
```

**New Flow with Splitter:**
```
Buyer signs authorization (to = Splitter contract)
    ↓
Facilitator verifies signature  
    ↓
Facilitator calls Splitter.executeSplit(buyer, seller, ...)
    ↓
Splitter pulls USDC, distributes:
  └─ Seller receives (amount - fee)
  └─ Facilitator wallet receives fee
```

### 15.2 x402_facilitator/ Changes

**File: `x402_settle.js`**
```javascript
// Add Splitter contract interaction
import { splitterAbi } from "./splitter_abi.js";

const SPLITTER_ADDRESS = "0x..."; // Deployed proxy address

export async function settlePaymentWithSplitter(paymentPayload, paymentRequirements) {
  // ... existing verification ...
  
  const auth = paymentPayload.payload.authorization;
  const { v, r, s } = parseSignature(paymentPayload.payload.signature);
  
  // Call Splitter instead of direct USDC transfer
  const hash = await walletClient.writeContract({
    address: SPLITTER_ADDRESS,
    abi: splitterAbi,
    functionName: "executeSplit",
    args: [
      auth.from,                    // buyer
      paymentRequirements.payTo,    // actual seller (whitelisted)
      BigInt(auth.value),
      BigInt(auth.validAfter),
      BigInt(auth.validBefore),
      auth.nonce,
      v, r, s
    ],
  });
  
  return { success: true, transaction: hash };
}
```

**File: `x402_verify.js`**
- Validate `authorization.to === SPLITTER_ADDRESS`
- Validate `payTo` (actual seller) is whitelisted via existing `isAgentWhitelisted()`

**File: `x402_whitelist.js`**
- No changes needed — whitelist validates the seller, not the authorization target

### 15.3 Resource Server Changes (scw_js/)

**File: `genimg_x402_token.js`**
```javascript
// Update payment requirements to target Splitter
const SPLITTER_ADDRESS = "0x..."; // Same as facilitator
const FACILITATOR_FEE = "10000"; // 0.01 USDC

function createPaymentRequirements(sellerAddress, priceUSDC) {
  const totalAmount = BigInt(priceUSDC) + BigInt(FACILITATOR_FEE);
  
  return {
    scheme: "exact",
    network: "eip155:10",
    amount: totalAmount.toString(),
    asset: USDC_ADDRESS,
    payTo: SPLITTER_ADDRESS,  // Authorization target is Splitter
    actualRecipient: sellerAddress,  // New field: actual seller
    // ...
  };
}
```

### 15.4 Client SDK Changes

Clients signing EIP-3009 authorizations must set:
- `to = Splitter contract address` (not seller)
- `value = price + facilitatorFee` (total amount)

### 15.5 Deployment Sequence

1. Deploy `USDCSplitterV1` proxy on Optimism
2. Verify contract on Etherscan
3. Update `x402_facilitator/` with Splitter address
4. Update `scw_js/genimg_x402_token.js` paymentRequirements
5. Deploy updated Scaleway Functions
6. Test end-to-end on Optimism Sepolia
7. Migrate production

## 16. Future Extensions (Post-v1)

- `receiveWithAuthorization` support (cleaner pull pattern)
- Tiered or percentage fees
- Multi-facilitator splits
- Gas sponsorship accounting
- Signature aggregation
- Standardization / EIP proposal

## 17. Success Criteria

- Buyer signs once (single EIP-3009 authorization)
- Facilitator earns fixed fee reliably (0.01-0.02 USDC)
- Seller receives correct net amount
- No approvals, no allowances required
- Minimal wallet friction
- Atomic execution (no partial states)
- Compatible with existing x402 whitelist (NFT holders)

