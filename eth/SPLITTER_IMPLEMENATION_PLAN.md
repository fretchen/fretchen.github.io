# Implementation Plan: USDC Fee Splitter using EIP-3009

## Status: ✅ Ready for Optimism Sepolia Deployment

**Last Updated:** January 4, 2026

### Implementation Progress

- ✅ **Core Contract (EIP3009SplitterV1.sol)** - Complete with security hardening (token-agnostic)
- ✅ **Comprehensive Test Suite** - 57 tests passing (38 functional + 19 deployment)
- ✅ **UUPS Upgradeability** - Storage gap, version tracking, OpenZeppelin validation
- ✅ **Security Audit** - SafeERC20, EIP-3009 validation, upgrade patterns, attack vector tests
- ✅ **Deployment Scripts** - Complete with config validation, dry-run, and verification
- ✅ **Deployment Tests** - 19 tests covering script integration and validation
- 🚀 **Ready for Sepolia Deployment** - All prerequisites met
- ⏳ **x402 Integration** - Pending post-deployment
- ⏳ **Frontend/SDK Updates** - Pending post-deployment

### Key Deviations from Original Plan

1. **Token Agnostic Design**: Changed from USDC-specific to generic ERC-20 + EIP-3009
   - Renamed: `IUSDC_EIP3009` → `IERC20_EIP3009`
   - Variable: `usdc` → `token`
   - Supports USDC, EURC, and any EIP-3009 compliant token

2. **SafeERC20 Integration**: Added OpenZeppelin SafeERC20 instead of raw transfers
   - Handles non-standard ERC-20 implementations
   - Better security for edge cases

3. **Comprehensive Test Coverage**: Expanded beyond basic split tests
   - EIP-3009 authorization security (expired, future, wrong signer)
   - Edge cases (buyer=seller, seller=facilitator)
   - Insufficient balance scenarios
   - Token parameter attack vectors (6 tests)
   - Deployment script integration tests (19 tests)
   - **Total: 57 tests** (38 functional + 19 deployment)
   - Split into two files following LLMv1 pattern:
     - `EIP3009SplitterV1_Functional.test.ts` - Business logic
     - `EIP3009SplitterV1_Deployment.ts` - Deployment & config validation

4. **Upgrade Patterns**: Added full upgrade infrastructure
   - Storage gap (`__gap[50]`)
   - Version constant (`VERSION = 1`)
   - Storage slot documentation
   - OpenZeppelin upgrades validator integration

5. **Modern Solidity**: Updated to Solidity 0.8.33 (from originally planned 0.8.27)
   - EVM version: osaka (default)
   - Can be configured to cancun for Optimism compatibility

---

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

### ✅ IMPLEMENTED: EIP3009SplitterV1.sol

**Status:** Complete with security hardening + token-agnostic design

**Key Changes from Plan:**
- ✅ Token as parameter (supports USDC, EURC, any EIP-3009 token)
- ✅ Uses `SafeERC20.safeTransfer()` instead of raw `IERC20.transfer()`
- ✅ Generic `IERC20_EIP3009` interface (not USDC-specific)
- ✅ Storage gap (`__gap[50]`) for upgrade safety
- ✅ Version constant (`VERSION = 1`)
- ✅ Fee-on-transfer documentation (not supported)
- ✅ Solidity 0.8.33 with OpenZeppelin validation
- ✅ 57 comprehensive tests (38 functional + 19 deployment, including 6 token parameter attack vector tests)

**Contract Location:** `/eth/contracts/EIP3009SplitterV1.sol`
**Test Files:** 
- `/eth/test/EIP3009SplitterV1_Functional.test.ts` (38 tests)
- `/eth/test/EIP3009SplitterV1_Deployment.ts` (19 tests)

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

contract EIP3009SplitterV1 is OwnableUpgradeable, UUPSUpgradeable {
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
  
  console.log("Deploying EIP3009SplitterV1 with config:", config);
  
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
  const splitter = await viem.deployContract("EIP3009SplitterV1", []);
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

### ✅ IMPLEMENTED: Comprehensive Test Suite

**Status:** 57 tests passing (100% success rate)

**Test Files:** 
- `/eth/test/EIP3009SplitterV1_Functional.test.ts` - 38 business logic tests
- `/eth/test/EIP3009SplitterV1_Deployment.ts` - 19 deployment & integration tests

**Functional Test Coverage (38 tests):**

#### Basic Functionality (2 tests)
- ✅ Initialize with correct parameters
- ✅ Owner correctly set

#### Split Execution (7 tests)
- ✅ Correct split with 1 cent fee
- ✅ Correct split with 2 cents fee (dynamic fee update)
- ✅ Emit SplitExecuted event
- ✅ Reject when amount equals fee (boundary)
- ✅ Reject when amount less than fee
- ✅ Reject invalid seller address (zero address)
- ✅ Reject reused authorization (nonce replay)
- ✅ Multiple buyers using same contract

#### Configuration Updates (8 tests)
- ✅ Owner can update fee
- ✅ Emit FixedFeeUpdated event
- ✅ Reject fee update from non-owner
- ✅ Reject fee update to zero
- ✅ Owner can update facilitator wallet
- ✅ Emit FacilitatorWalletUpdated event
- ✅ Reject wallet update from non-owner
- ✅ Reject wallet update to zero address
- ✅ Fees route to new wallet after update

#### Authorization State Query (2 tests)
- ✅ Correctly report unused authorization
- ✅ Correctly report used authorization

#### UUPS Upgradeability (2 tests)
- ✅ Owner can authorize upgrade
- ✅ Reject upgrade from non-owner

#### EIP-3009 Authorization Security (6 tests)
- ✅ Reject expired authorization (validBefore in past)
- ✅ Reject not-yet-valid authorization (validAfter in future)
- ✅ Reject wrong signer (signature mismatch)
- ✅ Reject insufficient buyer balance
- ✅ Work when seller equals buyer (self-payment edge case)
- ✅ Work when seller equals facilitator (edge case)

#### Seller Verification Security (5 tests)
- ✅ Reject facilitator redirect attack (wrong seller)
- ✅ Reject wrong salt for correct seller
- ✅ Reject seller swap between authorizations
- ✅ Verify cryptographic binding of seller to nonce
- ✅ Prevent facilitator self-theft attack

#### Token Parameter Attack Vectors (6 tests) **(NEW - Token Agnostic Design)**
- ✅ Reject zero address token
- ✅ Handle fake token gracefully (non-contract EOA)
- ✅ Prevent cross-token replay (EIP-712 domain binding)
- ✅ Support multiple different tokens in sequence
- ✅ Prevent nonce reuse across tokens
- ✅ Verify no persistent contract balance

**Deployment Test Coverage (19 tests):**

#### Basic Deployment (5 tests)
- ✅ Deploy with correct parameters
- ✅ UUPS proxy verification
- ✅ Upgrade-ready validation
- ✅ VERSION constant check
- ✅ Re-initialization prevention

#### Token Agnostic Design (2 tests)
- ✅ Verify no token storage in state
- ✅ Token as parameter in executeSplit and isAuthorizationUsed

#### Script Integration Tests (6 tests)
- ✅ Deploy using deployment script with config
- ✅ Validate configuration only mode
- ✅ Dry run simulation
- ✅ Config schema validation (rejects invalid)
- ✅ Invalid address rejection
- ✅ Deployment info file creation

#### Configuration Validation (2 tests)
- ✅ Reject invalid fixed fee (zero)
- ✅ Accept different valid fee amounts

#### Post-Deployment Verification (4 tests)
- ✅ Implementation contract exists
- ✅ Proxy admin verification (UUPS zero address)
- ✅ Correct owner after deployment
- ✅ Correct parameters after deployment

**Mock Contracts:**
- ✅ `MockUSDC_EIP3009.sol` - Full EIP-3009 implementation with domain separation

**Test Execution:**
```bash
# Functional tests (38)
npx hardhat test test/EIP3009SplitterV1_Functional.test.ts
# 38 passing (937ms)

# Deployment tests (19)
npx hardhat test test/EIP3009SplitterV1_Deployment.ts
# 19 passing (934ms)

# All tests (57)
npx hardhat test test/EIP3009SplitterV1*.ts
# 57 passing (2s)
```

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

### ✅ IMPLEMENTED: Security Review Complete

**Security Measures Applied:**

1. **SafeERC20 Integration** ✅
   - Handles non-standard ERC-20 returns
   - Protects against tokens like USDT

2. **Upgrade Safety** ✅
   - Storage gap `__gap[50]` for future variables
   - Version tracking (`VERSION = 1`)
   - OpenZeppelin validator passing:
     ```bash
     npx @openzeppelin/upgrades-core validate artifacts/build-info --contract EIP3009SplitterV1
     # ✔ contracts/EIP3009SplitterV1.sol:EIP3009SplitterV1
     # SUCCESS
     ```

3. **Storage Layout Documentation** ✅
   - `@custom:storage-slot` annotations
   - Storage slot positions documented
   - Upgrade guide prepared

4. **Input Validation** ✅
   - Zero address checks for seller, token, facilitator
   - Fee > 0 validation
   - Amount > fee validation
   - EIP-3009 signature verification

5. **Access Control** ✅
   - `onlyOwner` for configuration changes
   - `onlyOwner` for upgrades (UUPS pattern)

6. **Fee-on-Transfer Warning** ✅
   - Documented as NOT compatible
   - Limited to standard ERC-20 + EIP-3009 tokens

7. **Test Coverage** ✅
   - 57 comprehensive tests (38 functional + 19 deployment)
   - Security scenarios covered (replay, expiry, invalid signer, attack vectors)
   - Deployment script integration validated

**Contract Metrics:**
- Lines of Code: ~210 (including comments)
- State Variables: 2 (facilitatorWallet, fixedFee) - token is parameter
- Functions: 6 public/external
- Events: 3
- OpenZeppelin Dependencies: OwnableUpgradeable, UUPSUpgradeable, SafeERC20

**Deployment Infrastructure:**
- ✅ Config-driven deployment script (`deploy-splitter-v1.ts`)
- ✅ Zod schema validation for config
- ✅ Three modes: deploy, validateOnly, dryRun
- ✅ Comprehensive post-deployment verification
- ✅ Deployment info file generation (JSON)
- ✅ OpenZeppelin validation integration

**Remaining Security Steps:**
- ⏳ External audit before mainnet
- ⏳ Bug bounty program consideration
- ⏳ Production deployment monitoring

### Original Plan Items

- ✅ Keep contract <150 LOC (core logic) → 210 LOC with full documentation
- UUPS proxy for future upgrades
- Inline NatSpec documentation
- External review before mainnet
- Storage layout documentation for upgrade compatibility

## 14. Deployment Checklist

### Phase 1: Development & Testing ✅ COMPLETE

- ✅ Contract implementation (EIP3009SplitterV1.sol - token agnostic)
- ✅ Mock contracts (MockUSDC_EIP3009.sol)
- ✅ Comprehensive test suite (57 tests: 38 functional + 19 deployment)
- ✅ Security hardening (SafeERC20, upgrade patterns)
- ✅ Attack vector testing (6 token parameter tests, 5 seller verification tests)
- ✅ OpenZeppelin validation passing
- ✅ Solidity 0.8.33 update
- ✅ Deployment script (`deploy-splitter-v1.ts`) with Zod validation
- ✅ Deployment configuration (`deploy-splitter-v1.config.json`)
- ✅ Deployment tests (19 integration tests)

### Phase 2: Optimism Sepolia Deployment 🚀 READY TO EXECUTE

**Prerequisites Met:**
- ✅ Hardhat configured for Optimism Sepolia (`optsepolia` network)
- ✅ Etherscan V2 API configured for Sepolia verification
- ✅ Deployment script supports network selection
- ✅ Config file ready (facilitatorWallet: `0xAAEB...239C`, fixedFee: `10000`)

**Next Steps:**
1. ⏳ Update config for Sepolia deployment:
   ```json
   {
     "options": {
       "validateOnly": false,
       "dryRun": false,  // Set to false for actual deployment
       "verify": true,
       "waitConfirmations": 2
     },
     "metadata": {
       "environment": "testnet"  // Change from "mainnet"
     }
   }
   ```

2. ⏳ Ensure Hardhat vars are set:
   ```bash
   npx hardhat vars set SEPOLIA_PRIVATE_KEY
   npx hardhat vars set ALCHEMY_API_KEY
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

3. ⏳ Deploy to Optimism Sepolia:
   ```bash
   npx hardhat run scripts/deploy-splitter-v1.ts --network optsepolia
   ```

4. ⏳ Verify deployment:
   - Check proxy address in deployment output
   - Verify on Sepolia Optimism Etherscan
   - Test `executeSplit()` with Sepolia USDC

5. ⏳ Document deployment addresses:
   - Proxy address → Update x402_facilitator/ config
   - Implementation address → For reference
   - Deployment file → Saved automatically in `scripts/deployments/`

**Optional Pre-Deployment Validation:**
```bash
# Validate config without deploying
npx hardhat run scripts/deploy-splitter-v1.ts --network optsepolia
# (Set validateOnly: true in config first)
```

### Phase 3: Integration & Testing on Sepolia ⏳ PENDING

- ⏳ Update x402_facilitator/ with Sepolia Splitter address
- ⏳ Update x402_facilitator/ USDC address for Sepolia
- ⏳ Deploy updated x402_facilitator to Scaleway Functions
- ⏳ Update scw_js/genimg_x402_token.js for Sepolia
- ⏳ Deploy updated scw_js to Scaleway Functions
- ⏳ End-to-end test on Sepolia:
  - Buyer signs EIP-3009 authorization
  - x402 facilitator verifies and settles
  - Verify seller receives correct amount
  - Verify facilitator receives fee
- ⏳ Monitor wallet warnings (MetaMask, Blockaid)

### Phase 4: Optimism Mainnet Deployment ⏳ PENDING SEPOLIA SUCCESS

- ⏳ Review Sepolia test results
- ⏳ Update config for mainnet (`environment: "mainnet"`)
- ⏳ Deploy to Optimism mainnet
- ⏳ Verify on Optimistic Etherscan
- ⏳ Update production x402_facilitator/ configuration
- ⏳ Update production scw_js/ configuration
- ⏳ Deploy to production Scaleway Functions
- ⏳ Monitor initial transactions
- ⏳ Announce to users

### ⚠️ EVM Version Consideration

**Current:** Default to `osaka` (Solidity 0.8.33)

**Recommendation for Optimism:** May need to configure `evmVersion: "cancun"` in `hardhat.config.ts` if Optimism doesn't support Osaka yet:

```typescript
solidity: {
  version: "0.8.33",
  settings: {
    evmVersion: "cancun"  // For Optimism compatibility
  }
}
```

**Action Required:** Verify Optimism mainnet/Sepolia EVM version support before deployment.

### Original Checklist Items
- ⏳ Select L2
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

1. Deploy `EIP3009SplitterV1` proxy on Optimism
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

---

## 18. Deployment Readiness Summary

### ✅ What's Ready

**Contract & Tests:**
- ✅ EIP3009SplitterV1.sol (210 LOC, token-agnostic, UUPS upgradeable)
- ✅ 57 comprehensive tests (100% passing)
  - 38 functional tests (business logic, security, attack vectors)
  - 19 deployment tests (script integration, validation)
- ✅ MockUSDC_EIP3009.sol (full EIP-3009 test implementation)

**Deployment Infrastructure:**
- ✅ `deploy-splitter-v1.ts` script with:
  - Zod config validation
  - validateOnly mode (dry run without gas)
  - dryRun mode (simulation with logs)
  - Full deployment with verification
  - Post-deployment checks
- ✅ `deploy-splitter-v1.config.json` (mainnet template)
- ✅ Hardhat network configs for Sepolia & Mainnet
- ✅ Etherscan V2 API integration

**Security:**
- ✅ SafeERC20 for transfers
- ✅ Seller verification (nonce = keccak256(seller, salt))
- ✅ Token parameter (EIP-712 domain separation prevents cross-token replay)
- ✅ UUPS upgrade pattern with onlyOwner authorization
- ✅ No persistent balances (atomic splits)
- ✅ OpenZeppelin validation passing

### 🚀 Ready to Deploy to Optimism Sepolia

**What You Need:**
1. **Environment Variables** (via `npx hardhat vars set`):
   - `SEPOLIA_PRIVATE_KEY` - Deployer wallet private key
   - `ALCHEMY_API_KEY` - For RPC access
   - `ETHERSCAN_API_KEY` - For contract verification (V2 API)

2. **Config Update** (`deploy-splitter-v1.config.json`):
   ```json
   {
     "options": {
       "validateOnly": false,
       "dryRun": false,
       "verify": true
     },
     "metadata": {
       "environment": "testnet"  // Change from "mainnet"
     }
   }
   ```

3. **Deploy Command**:
   ```bash
   npx hardhat run scripts/deploy-splitter-v1.ts --network optsepolia
   ```

**Expected Output:**
- Proxy address (use this for x402_facilitator config)
- Implementation address (for reference)
- Deployment file saved to `scripts/deployments/splitter-v1-optsepolia-YYYY-MM-DD.json`
- Etherscan verification link

### ⏳ What's Pending (Post-Deployment)

**x402 Integration (Requires Deployed Address):**
- Update `x402_facilitator/x402_settle.js` with Splitter address
- Update `x402_facilitator/x402_verify.js` validation logic
- Update USDC address for Sepolia (different from mainnet)
- Deploy updated facilitator to Scaleway Functions

**Resource Server Updates:**
- Update `scw_js/genimg_x402_token.js` paymentRequirements
- Change `payTo` from seller → Splitter address
- Add `actualRecipient` field for seller
- Deploy updated scw_js to Scaleway Functions

**Testing:**
- End-to-end test on Sepolia (buyer → facilitator → settlement)
- Verify correct splits (seller gets price, facilitator gets 0.01 USDC)
- Monitor wallet warnings (MetaMask, Blockaid)

**Mainnet Migration (After Sepolia Success):**
- Review Sepolia test results
- Update config for mainnet environment
- Deploy to Optimism mainnet
- Update production x402_facilitator & scw_js configs
- Monitor initial production transactions

### 📋 Pre-Deployment Checklist

- [ ] Hardhat vars set (`SEPOLIA_PRIVATE_KEY`, `ALCHEMY_API_KEY`, `ETHERSCAN_API_KEY`)
- [ ] Config file updated for testnet environment
- [ ] Test wallet has Sepolia ETH for gas (get from [Alchemy faucet](https://www.alchemy.com/faucets/optimism-sepolia))
- [ ] Optional: Run validateOnly mode first (`validateOnly: true` in config)
- [ ] Optional: Run dryRun mode (`dryRun: true` in config)
- [ ] Ready to execute deployment command

### 🎯 Next Reasonable Step

**Deploy to Optimism Sepolia** is the logical next step because:
1. ✅ All contract code complete and tested
2. ✅ Deployment infrastructure ready
3. ✅ Network configuration in place
4. ✅ No blocking dependencies
5. ⏳ Post-deployment work (x402 integration) requires deployed address

**Command to execute:**
```bash
# 1. Validate config first (optional but recommended)
# Set validateOnly: true in config, then:
npx hardhat run scripts/deploy-splitter-v1.ts --network optsepolia

# 2. If validation passes, deploy
# Set validateOnly: false, dryRun: false in config, then:
npx hardhat run scripts/deploy-splitter-v1.ts --network optsepolia

# 3. Save the proxy address from output for x402 integration
```

---