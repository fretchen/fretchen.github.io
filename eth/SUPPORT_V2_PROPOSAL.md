# SupportV2 Contract — Implementation Plan

**Status:** ✅ ABGESCHLOSSEN (Phase 4 Production Deployment fertig)  
**Letzte Aktualisierung:** 25. Januar 2026

---

## 0. Implementierungs-Übersicht

| Phase   | Beschreibung                       | Status                      |
| ------- | ---------------------------------- | --------------------------- |
| Phase 1 | Contract, Tests, Deployment Script | ✅ ABGESCHLOSSEN            |
| Phase 2 | Multi-Chain & Testing              | ✅ ABGESCHLOSSEN            |
| Phase 3 | Frontend Integration               | ✅ ABGESCHLOSSEN (ETH only) |
| Phase 4 | Production Deployment              | ✅ ABGESCHLOSSEN            |

### Deployment Adressen

#### Mainnets

| Chain    | Proxy Address                                | Deployed   |
| -------- | -------------------------------------------- | ---------- |
| Optimism | `0x4ca63f8A4Cd56287E854f53E18ca482D74391316` | 24.01.2026 |
| Base     | `0xB70EA4d714Fed01ce20E93F9033008BadA1c8694` | 25.01.2026 |

#### Testnets

| Chain            | Proxy Address                                | Deployed   |
| ---------------- | -------------------------------------------- | ---------- |
| Optimism Sepolia | `0x9859431b682e861b19e87Db14a04944BC747AB6d` | 20.01.2026 |
| Base Sepolia     | `0xaB44BE78499721b593a0f4BE2099b246e9C53B57` | 21.01.2026 |

---

## 1. Feature-Übersicht

| Feature             | Beschreibung                                                       |
| ------------------- | ------------------------------------------------------------------ |
| 🔄 UUPS Upgradeable | Proxy-Architektur für spätere Updates                              |
| 💰 ETH Donations    | `donate(url, recipient)`                                           |
| 🪙 EIP-3009 Tokens  | `donateToken(...)` für USDC und kompatible Tokens (permissionless) |
| 📊 Like-Counting    | On-chain `urlLikes` Mapping                                        |
| 🌐 Multi-Chain      | Optimism + Base                                                    |

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
pragma solidity ^0.8.27;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./interfaces/IEIP3009.sol";

/**
 * @title SupportV2
 * @notice "Buy me a coffee" contract with ETH and EIP-3009 token support
 * @dev Uses UUPS proxy pattern for upgradeability
 *
 * Features:
 * - ETH donations via donate(url, recipient)
 * - EIP-3009 token donations via donateToken() (USDC, EURC, etc.)
 * - On-chain like counting per URL
 * - Flexible recipient (passed as parameter)
 * - Permissionless: Any EIP-3009 token works (frontend controls which are offered)
 *
 * Multi-chain: Deploy on Optimism + Base
 */
contract SupportV2 is UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {

    /// @notice Contract version for upgrade tracking
    uint256 public constant VERSION = 1;

    mapping(bytes32 => uint256) public urlLikes;

    event Donation(
        address indexed from,
        address indexed recipient,
        bytes32 indexed urlHash,
        string url,
        uint256 amount,
        address token  // address(0) = ETH
    );

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

    // EIP-3009 Token Donation (v,r,s format) - Permissionless
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
        require(_token != address(0), "Invalid token");

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

    function getLikesForUrl(string calldata _url) external view returns (uint256) {
        return urlLikes[keccak256(bytes(_url))];
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
```

> **Design Note:** The contract is permissionless for EIP-3009 tokens. Any token that implements `transferWithAuthorization` can be used. The frontend controls which tokens are offered to users.

---

## 3. Token-Adressen

| Token | Chain            | Adresse                                      |
| ----- | ---------------- | -------------------------------------------- |
| USDC  | Optimism         | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` |
| USDC  | Base             | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| USDC  | Optimism Sepolia | `0x5fd84259d66Cd46123540766Be93DFE6D43130D7` |
| USDC  | Base Sepolia     | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |

---

## 4. Frontend Integration

### 4.1 EIP-3009 Signatur (v,r,s Format)

```typescript
import { hexToSignature } from "viem";

async function signEIP3009(token: Address, recipient: Address, amount: bigint, chainId: number) {
  const nonce = `0x${crypto.randomUUID().replace(/-/g, "")}` as `0x${string}`;
  const validAfter = 0n;
  const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600);

  const signature = await walletClient.signTypedData({
    domain: {
      name: "USD Coin",
      version: "2",
      chainId,
      verifyingContract: token,
    },
    types: {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    },
    primaryType: "TransferWithAuthorization",
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
  functionName: "donate",
  args: [url, recipient],
  value: amount,
});

// USDC (EIP-3009)
const sig = await signEIP3009(USDC_ADDRESS, recipient, amount, chainId);
await writeContract({
  ...supportV2Config,
  functionName: "donateToken",
  args: [url, recipient, USDC_ADDRESS, amount, sig.validAfter, sig.validBefore, sig.nonce, sig.v, sig.r, sig.s],
});
```

---

## 5. Implementierungsplan

### Phase 1: Contract ✅ ABGESCHLOSSEN

| Schritt | Beschreibung                                                    | Status |
| ------- | --------------------------------------------------------------- | ------ |
| 1.1     | `contracts/interfaces/IEIP3009.sol`                             | ✅     |
| 1.2     | `contracts/SupportV2.sol`                                       | ✅     |
| 1.3     | `test/SupportV2_Functional.ts` + `test/SupportV2_Deployment.ts` | ✅     |
| 1.4     | `scripts/deploy-support-v2.ts` + Config                         | ✅     |

### Phase 2: Multi-Chain & Testing ✅ ABGESCHLOSSEN

| Schritt | Beschreibung                                                 | Status |
| ------- | ------------------------------------------------------------ | ------ |
| 2.1     | Base + Base Sepolia zu `hardhat.config.ts` hinzufügen        | ✅     |
| 2.2     | Deploy auf Optimism Sepolia + Base Sepolia                   | ✅     |
| 2.3     | ABI Export (`abi/contracts/SupportV2.ts`)                    | ✅     |
| 2.4     | `notebooks/support_v2_demo.ipynb` — Deno TypeScript Notebook | ✅     |

### Phase 3: Frontend ✅ ABGESCHLOSSEN (ETH only)

| Schritt | Beschreibung                                              | Status |
| ------- | --------------------------------------------------------- | ------ |
| 3.1     | `wagmi.config.ts` — Base + Base Sepolia Chains hinzufügen | ✅     |
| 3.2     | `getChain.ts` — SupportV2 Multi-Chain Config              | ✅     |
| 3.3     | ~~EIP-3009 Signatur-Helper~~ (deprioritisiert)            | ⏸️     |
| 3.4     | ~~Token-Auswahl UI (ETH / USDC)~~ (deprioritisiert)       | ⏸️     |
| 3.5     | `useSupportAction.ts` — Multi-Chain Hook mit Auto-Switch  | ✅     |
| 3.6     | Legacy Support Config entfernt (`supportContractConfig`)  | ✅     |
| 3.7     | Unit Tests für `useSupportAction`                         | ✅     |
| 3.8     | `VITE_USE_TESTNET` Env-Variable für Testnet-Modus         | ✅     |
| 3.9     | Aggregierte Likes von beiden Chains                       | ✅     |

**Frontend-Änderungen (25. Januar 2026):**

- `website/.env`: `VITE_USE_TESTNET` Variable hinzugefügt (default: mainnet)
- `website/wagmi.config.ts`: Base + Base Sepolia zu Chains hinzugefügt
- `website/utils/getChain.ts`:
  - `VITE_USE_TESTNET` steuert Mainnet/Testnet Modus
  - `SUPPORT_V2_CHAINS` exportiert aktive Chains basierend auf Modus
  - `getSupportV2Config()`, `isSupportV2Chain()`, `DEFAULT_SUPPORT_CHAIN`
  - Legacy `supportContractConfig` entfernt
- `website/hooks/useSupportAction.ts`:
  - Multi-Chain mit automatischem Chain-Switch
  - Aggregierte Likes von beiden Chains im aktiven Modus
- `website/test/useSupportAction.test.ts`: 17 Unit Tests

### Phase 4: Production Deployment ✅ ABGESCHLOSSEN

| Schritt | Beschreibung                                  | Status |
| ------- | --------------------------------------------- | ------ |
| 4.1     | Deploy auf Optimism Mainnet                   | ✅     |
| 4.2     | Deploy auf Base Mainnet                       | ✅     |
| 4.3     | `getChain.ts` — Mainnet Adressen eintragen    | ✅     |
| 4.4     | `DEFAULT_SUPPORT_CHAIN` auf Mainnet umstellen | ✅     |

---

## 7. Frontend Multi-Chain Architektur (ETH only, Phase 3.1 + 3.4)

### 7.1 Aktuelles Problem

Die aktuelle Architektur verwendet `PUBLIC_ENV__CHAIN_NAME` als Build-Zeit-Konstante:

```typescript
// website/utils/getChain.ts (aktuell)
const CHAIN_NAME = import.meta.env?.PUBLIC_ENV__CHAIN_NAME || "optimism";
```

Das bedeutet: **Eine Build → Ein Netzwerk**. Für Multi-Chain-Support muss der User zur Laufzeit das Netzwerk wählen können.

### 7.2 SupportV2 Signatur-Änderung

SupportV2 hat eine **neue `donate()` Signatur** mit `recipient` Parameter:

```solidity
// Alte Support.sol:
function donate(string calldata _url) external payable

// Neue SupportV2.sol:
function donate(string calldata _url, address _recipient) external payable
```

### 7.3 Vorgeschlagene Lösung: Automatischer Chain-Switch (wie ImageGenerator)

#### Ablauf-Diagramm

```
┌─────────────────────────────────────────────────────────────────┐
│                    User öffnet Blog-Seite                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Likes werden von DEFAULT_READ_CHAIN gelesen         │
│              (z.B. optimismSepolia) – unabhängig von Wallet      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  User klickt "Support" ⭐                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│     isSupportV2Chain(chainId) prüft ob Chain unterstützt        │
│                                                                  │
│   TRUE → Direkt donaten auf User's Chain                        │
│                                                                  │
│   FALSE → AUTOMATISCHER Chain-Switch zu DEFAULT_READ_CHAIN      │
│           (Wallet-Popup erscheint, User bestätigt)              │
│           Dann: Donation auf neuer Chain                        │
└─────────────────────────────────────────────────────────────────┘
```

**Kein zusätzliches UI-Element nötig!** Der Chain-Switch passiert automatisch beim Klick auf "Support", genau wie im `ImageGenerator.tsx`.

#### Wo passiert was?

| Aktion          | Wo                      | Code                                                         |
| --------------- | ----------------------- | ------------------------------------------------------------ |
| Likes lesen     | `useSupportAction` Hook | `useReadContract` mit `DEFAULT_READ_CHAIN.id`                |
| Chain prüfen    | `handleSupport()`       | `if (!isSupported)`                                          |
| Chain wechseln  | `handleSupport()`       | `await switchChainAsync({ chainId: DEFAULT_READ_CHAIN.id })` |
| Donation senden | `handleSupport()`       | `writeContract({ ...activeConfig, ... })`                    |

#### Schritt 1: `wagmi.config.ts` — Base Chains hinzufügen

```typescript
import { http, createConfig } from "wagmi";
import { mainnet, optimism, sepolia, optimismSepolia, base, baseSepolia } from "wagmi/chains";

export const config = createConfig({
  chains: [mainnet, sepolia, optimism, optimismSepolia, base, baseSepolia],
  connectors: [injected(), walletConnect({ projectId }), metaMask()],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [optimism.id]: http(),
    [optimismSepolia.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
```

#### Schritt 2: `getChain.ts` — Multi-Chain Contract Config

```typescript
import { optimism, optimismSepolia, base, baseSepolia } from "wagmi/chains";
import type { Chain } from "wagmi/chains";
import SupportV2ABI from "../../eth/abi/contracts/SupportV2.json";

// SupportV2 Adressen pro Chain
const SUPPORT_V2_ADDRESSES: Record<number, `0x${string}`> = {
  // Testnets
  [optimismSepolia.id]: "0x9859431b682e861b19e87Db14a04944BC747AB6d",
  [baseSepolia.id]: "0xaB44BE78499721b593a0f4BE2099b246e9C53B57",
  // Mainnets (Phase 4 - nach Deployment ausfüllen)
  // [optimism.id]: "0x...",
  // [base.id]: "0x...",
};

// Unterstützte Chains für SupportV2
export const SUPPORTED_CHAINS: Chain[] = [optimismSepolia, baseSepolia];
// Nach Phase 4: [optimism, base, optimismSepolia, baseSepolia]

// Default Chain für Read-Operationen (wenn Wallet nicht verbunden)
export const DEFAULT_READ_CHAIN = optimismSepolia;

// Empfänger-Wallet (Owner)
export const RECIPIENT_ADDRESS = "0x073f26F0C3FC100e7b075C3DC3cDE0A777497D20" as const;

/**
 * Get SupportV2 contract config for a specific chain
 * @param chainId - The chain ID to get config for
 * @returns Contract config or null if chain not supported
 */
export function getSupportV2Config(chainId: number) {
  const address = SUPPORT_V2_ADDRESSES[chainId];
  if (!address) return null;

  return {
    address,
    abi: SupportV2ABI,
  } as const;
}

/**
 * Check if a chain supports SupportV2
 */
export function isSupportV2Chain(chainId: number): boolean {
  return chainId in SUPPORT_V2_ADDRESSES;
}
```

#### Schritt 3: `useSupportAction.ts` — Multi-Chain Hook (mit automatischem Chain-Switch)

```typescript
import * as React from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from "wagmi";
import { parseEther } from "viem";
import { useReadContract } from "wagmi";
import { getSupportV2Config, isSupportV2Chain, RECIPIENT_ADDRESS, DEFAULT_READ_CHAIN } from "../utils/getChain";
import { trackEvent } from "../utils/analytics";

/**
 * Custom hook for SupportV2 with multi-chain support
 * Automatic chain switch when user clicks "Support" (like ImageGenerator.tsx)
 */
export function useSupportAction(url: string) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fullUrl, setFullUrl] = React.useState(url);

  const { isConnected } = useAccount();
  const chainId = useChainId(); // ← Aktuelle Chain des Users
  const { switchChainAsync } = useSwitchChain(); // ← Async Version für await
  const donationAmount = parseEther("0.0002");

  const { writeContract, isPending, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // URL nach Hydration setzen
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const rawUrl = window.location.origin + url;
      const cleanUrl = rawUrl.replace(/\/+$/, "");
      setFullUrl(cleanUrl);
    }
  }, [url]);

  // ═══════════════════════════════════════════════════════════════
  // HIER WIRD GEPRÜFT: Ist die Chain unterstützt?
  // ═══════════════════════════════════════════════════════════════

  // Contract Config für aktuelle Chain holen (null wenn nicht unterstützt)
  const contractConfig = React.useMemo(() => getSupportV2Config(chainId), [chainId]);

  // Boolean: Ist die aktuelle Chain unterstützt?
  const isSupported = isSupportV2Chain(chainId);

  // Chain für Read-Operationen: User's Chain wenn unterstützt, sonst Default
  const readChainId = isSupported ? chainId : DEFAULT_READ_CHAIN.id;
  const readConfig = getSupportV2Config(readChainId)!;

  // ═══════════════════════════════════════════════════════════════

  // Read support data - funktioniert immer (auch wenn User auf falscher Chain)
  const {
    data: supportCount,
    error: readError,
    isPending: isReadPending,
    refetch,
  } = useReadContract({
    ...readConfig,
    functionName: "getLikesForUrl",
    args: [fullUrl],
    chainId: readChainId, // ← Liest von Default Chain wenn User's Chain nicht unterstützt
    query: { enabled: !!fullUrl },
  });

  // ═══════════════════════════════════════════════════════════════
  // AUTOMATISCHER CHAIN-SWITCH (wie in ImageGenerator.tsx)
  // Kein UI-Element nötig - passiert im Hintergrund beim Klick
  // ═══════════════════════════════════════════════════════════════
  const handleSupport = React.useCallback(async () => {
    setErrorMessage(null);
    if (!fullUrl) {
      setErrorMessage("URL ist erforderlich");
      return;
    }

    // Automatischer Chain-Switch wenn nicht auf unterstützter Chain
    if (!isSupported) {
      console.log(`[Support] Chain mismatch: current=${chainId}, switching to ${DEFAULT_READ_CHAIN.name}`);
      try {
        await switchChainAsync({ chainId: DEFAULT_READ_CHAIN.id });
        console.log(`[Support] Successfully switched to ${DEFAULT_READ_CHAIN.name}`);
        // Nach Switch: contractConfig neu berechnen
      } catch (switchError) {
        console.error("[Support] Chain switch failed:", switchError);
        setErrorMessage(`Chain-Wechsel zu ${DEFAULT_READ_CHAIN.name} fehlgeschlagen`);
        return;
      }
    }

    // Contract Config nach potentiellem Switch holen
    const activeConfig = getSupportV2Config(DEFAULT_READ_CHAIN.id);
    if (!activeConfig) {
      setErrorMessage("Konfigurationsfehler");
      return;
    }

    setIsLoading(true);

    // SupportV2 has recipient parameter
    writeContract({
      ...activeConfig,
      functionName: "donate",
      args: [fullUrl, RECIPIENT_ADDRESS], // ← Neuer recipient Parameter
      value: donationAmount,
    });
  }, [fullUrl, isSupported, chainId, switchChainAsync, writeContract, donationAmount]);

  // Update state after transaction
  React.useEffect(() => {
    if (isSuccess) {
      trackEvent("blog-support-success", { url: fullUrl, chainId });
      setIsLoading(false);
      setErrorMessage(null);
      setTimeout(() => refetch(), 2000);
    }
    if (writeError) {
      setIsLoading(false);
      setErrorMessage(writeError?.message || "Transaktion fehlgeschlagen");
    }
  }, [isSuccess, writeError, refetch, fullUrl, chainId]);

  // Warning message
  const warningMessage =
    errorMessage ||
    (!isSupported && isConnected ? `Wechsle zu ${SUPPORTED_CHAINS.map((c) => c.name).join(" oder ")}` : null);

  return {
    supportCount: supportCount?.toString() || "0",
    isLoading: isLoading || isPending || isConfirming,
    isSuccess,
    errorMessage: warningMessage,
    isConnected,
    isReadPending,
    readError,
    // Actions
    handleSupport,
  };
}
```

### 7.4 Aggregierte Like-Counts (Optional, später)

Da Likes jetzt auf mehreren Chains gespeichert werden, können sie aggregiert angezeigt werden:

```typescript
// Aggregiere Likes von allen Chains
const allCounts = await Promise.all(
  SUPPORTED_CHAINS.map(async (chain) => {
    const config = getSupportV2Config(chain.id);
    const count = await publicClient.readContract({
      ...config,
      functionName: "getLikesForUrl",
      args: [fullUrl],
    });
    return count;
  }),
);
const totalLikes = allCounts.reduce((sum, c) => sum + c, 0n);
```

---

## 8. Referenzen

- [UUPS Pattern](https://docs.openzeppelin.com/contracts/5.x/api/proxy#UUPSUpgradeable)
- [EIP-3009 Spec](https://eips.ethereum.org/EIPS/eip-3009)
- [GenImNFTv4 Deploy Guide](GENIMG_DEPLOY_V4_GUIDE.md)
