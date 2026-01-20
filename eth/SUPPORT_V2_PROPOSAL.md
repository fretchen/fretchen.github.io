# SupportV2 Contract — Implementation Plan

**Status:** ✅ FREIGEGEBEN  
**Letzte Aktualisierung:** 20. Januar 2026

---

## 1. Feature-Übersicht

| Feature | Beschreibung |
|---------|--------------|
| 🔄 UUPS Upgradeable | Proxy-Architektur für spätere Updates |
| 💰 ETH Donations | `donate(url, recipient)` |
| 🪙 EIP-3009 Tokens | `donateToken(...)` für USDC und kompatible Tokens |
| 📊 Like-Counting | On-chain `urlLikes` Mapping |
| 🌐 Multi-Chain | Optimism + Base |
| ✅ Token Whitelist | Nur verifizierte EIP-3009 Tokens |

---

## 2. Contract Design

### 2.1 Shared Interface (contracts/interfaces/IEIP3009.sol)

Wiederverwendbares Interface für alle EIP-3009 kompatiblen Contracts (SupportV2, zukünftige Splitter-Versionen).

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IEIP3009
 * @notice Interface for ERC-20 tokens with EIP-3009 extension (transferWithAuthorization)
 * @dev https://eips.ethereum.org/EIPS/eip-3009
 * @dev Compatible with USDC, EURC, and other EIP-3009 compliant tokens
 * @dev Shared interface for SupportV2, EIP3009SplitterV2, etc.
 */
interface IEIP3009 {
    /**
     * @notice Execute a transfer with a signed authorization (v,r,s format)
     * @param from Payer's address (Authorizer)
     * @param to Payee's address
     * @param value Amount to be transferred
     * @param validAfter The time after which this is valid (unix time)
     * @param validBefore The time before which this is valid (unix time)
     * @param nonce Unique nonce
     * @param v ECDSA recovery id
     * @param r ECDSA signature r
     * @param s ECDSA signature s
     */
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

    /**
     * @notice Check if an authorization nonce has been used
     * @param authorizer Authorizer's address
     * @param nonce Nonce of the authorization
     * @return True if the nonce has been used
     */
    function authorizationState(address authorizer, bytes32 nonce) external view returns (bool);
}
```

**Hinweis:** USDC verwendet das `(v, r, s)` Format. Das ist konsistent mit dem bestehenden EIP3009SplitterV1.

### 2.2 SupportV2.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./interfaces/IEIP3009.sol";

contract SupportV2 is UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    
    mapping(bytes32 => uint256) public urlLikes;
    mapping(address => bool) public allowedTokens;
    
    event Donation(
        address indexed from,
        address indexed recipient,
        bytes32 indexed urlHash,
        string url,
        uint256 amount,
        address token  // address(0) = ETH
    );
    
    event TokenAllowed(address indexed token, bool allowed);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address _owner) public initializer {
        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
    }
    
    // ETH Donation
    function donate(
        string calldata _url, 
        address _recipient
    ) external payable nonReentrant {
        require(msg.value > 0, "No ETH sent");
        require(_recipient != address(0), "Invalid recipient");
        
        bytes32 urlHash = keccak256(bytes(_url));
        urlLikes[urlHash]++;
        
        (bool success, ) = payable(_recipient).call{value: msg.value}("");
        require(success, "Transfer failed");
        
        emit Donation(msg.sender, _recipient, urlHash, _url, msg.value, address(0));
    }
    
    // EIP-3009 Token Donation (v,r,s format)
    function donateToken(
        string calldata _url,
        address _recipient,
        address _token,
        uint256 _amount,
        uint256 _validAfter,
        uint256 _validBefore,
        bytes32 _nonce,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external nonReentrant {
        require(_recipient != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be > 0");
        require(allowedTokens[_token], "Token not allowed");
        
        IEIP3009(_token).transferWithAuthorization(
            msg.sender,
            _recipient,
            _amount,
            _validAfter,
            _validBefore,
            _nonce,
            _v,
            _r,
            _s
        );
        
        bytes32 urlHash = keccak256(bytes(_url));
        urlLikes[urlHash]++;
        
        emit Donation(msg.sender, _recipient, urlHash, _url, _amount, _token);
    }
    
    function setAllowedToken(address _token, bool _allowed) external onlyOwner {
        allowedTokens[_token] = _allowed;
        emit TokenAllowed(_token, _allowed);
    }
    
    function getLikesForUrl(string calldata _url) external view returns (uint256) {
        return urlLikes[keccak256(bytes(_url))];
    }
    
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
```

---

## 3. Token-Adressen

| Token | Chain | Adresse |
|-------|-------|---------|
| USDC | Optimism | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` |
| USDC | Base | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| USDC | Optimism Sepolia | `0x5fd84259d66Cd46123540766Be93DFE6D43130D7` |
| USDC | Base Sepolia | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |

---

## 4. Frontend Integration

### 4.1 EIP-3009 Signatur (v,r,s Format)

```typescript
import { hexToSignature } from 'viem';

async function signEIP3009(
  token: Address,
  recipient: Address,
  amount: bigint,
  chainId: number
) {
  const nonce = `0x${crypto.randomUUID().replace(/-/g, '')}` as `0x${string}`;
  const validAfter = 0n;
  const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600);
  
  const signature = await walletClient.signTypedData({
    domain: {
      name: 'USD Coin',
      version: '2',
      chainId,
      verifyingContract: token,
    },
    types: {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' },
      ],
    },
    primaryType: 'TransferWithAuthorization',
    message: { from: userAddress, to: recipient, value: amount, validAfter, validBefore, nonce },
  });
  
  // Split signature into v, r, s for contract
  const { v, r, s } = hexToSignature(signature);
  
  return { v: Number(v), r, s, nonce, validAfter, validBefore };
}
```

### 4.2 Contract Calls

```typescript
// ETH
await writeContract({
  ...supportV2Config,
  functionName: 'donate',
  args: [url, recipient],
  value: amount,
});

// USDC (EIP-3009)
const sig = await signEIP3009(USDC_ADDRESS, recipient, amount, chainId);
await writeContract({
  ...supportV2Config,
  functionName: 'donateToken',
  args: [url, recipient, USDC_ADDRESS, amount, sig.validAfter, sig.validBefore, sig.nonce, sig.v, sig.r, sig.s],
});
```

---

## 5. Implementierungsplan

### Phase 1: Contract ✅ ABGESCHLOSSEN

| Schritt | Beschreibung | Status |
|---------|--------------|--------|
| 1.1 | `contracts/interfaces/IEIP3009.sol` | ✅ |
| 1.2 | `contracts/SupportV2.sol` | ✅ |
| 1.3 | `test/SupportV2.test.ts` (16 Tests) | ✅ |
| 1.4 | `scripts/deploy-support-v2.ts` + Config | ✅ |

### Phase 2: Multi-Chain & Testing (2h)

| Schritt | Beschreibung |
|---------|--------------|
| 2.1 | Base + Base Sepolia zu `hardhat.config.ts` hinzufügen (Optimism bereits vorhanden) |
| 2.2 | Deploy auf Optimism Sepolia + Base Sepolia |
| 2.3 | ABI Export |
| 2.4 | `notebooks/support_v2_demo.ipynb` — Deno TypeScript Notebook für Tests (wie x402_facilitator_demo_ts) |

### Phase 3: Frontend (5h)

| Schritt | Beschreibung |
|---------|--------------|
| 3.1 | SupportV2 ABI + `getChain.ts` Update |
| 3.2 | EIP-3009 Signatur-Helper |
| 3.3 | Token-Auswahl UI (ETH / USDC) |
| 3.4 | `useSupportAction.ts` refactoren |

### Phase 4: Production (2h)

| Schritt | Beschreibung |
|---------|--------------|
| 4.1 | Deploy auf Optimism + Base Mainnet |
| 4.2 | Etherscan/Basescan Verification |
| 4.3 | Frontend Deploy |

---

## 6. Referenzen

- [UUPS Pattern](https://docs.openzeppelin.com/contracts/5.x/api/proxy#UUPSUpgradeable)
- [EIP-3009 Spec](https://eips.ethereum.org/EIPS/eip-3009)
- [GenImNFTv4 Deploy Guide](GENIMG_DEPLOY_V4_GUIDE.md)
