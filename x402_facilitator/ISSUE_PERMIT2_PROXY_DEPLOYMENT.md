# x402 Permit2 Proxy (`x402BasePermit2Proxy`) only deployed on Base Sepolia — silent settlement failure on other chains

## Description

The `x402BasePermit2Proxy` at `0x4020615294c913F045dc10f0a5cdEbd86c280001` is only deployed on Base Sepolia. On all other chains the address has no code:

| Chain | Status |
|-------|--------|
| Base Sepolia | ✅ 2440 bytes |
| OP Sepolia | ❌ empty |
| OP Mainnet | ❌ empty |
| Base Mainnet | ❌ empty |

Verified via `eth_getCode` on 2025-02-21 using `@x402/evm@2.3.1`.

## Impact

Permit2 settlements on OP Sepolia (and likely OP Mainnet / Base Mainnet) return `success: true` but transfer 0 tokens. Sending a transaction to an empty address doesn't revert — it silently succeeds with no effect.

The facilitator's `/supported` endpoint still advertises Permit2 capability for these chains, and `settle()` reports success, so the caller has no indication that anything went wrong.

## Reproduction

1. Configure facilitator with OP Sepolia (`eip155:11155420`)
2. Create a WETH Permit2 payment payload (`assetTransferMethod: "permit2"`)
3. Call `settle()` → returns `{ success: true, transaction: "0x..." }`
4. Check balances → 0 tokens transferred
5. Example tx: https://sepolia-optimism.etherscan.io/tx/0x56796d86e771e5719c8e22f6bda055ebd553d6bc7a068d24dbed0e7cc0a59af0

## Suggested fix

Either deploy `x402BasePermit2Proxy` to all supported chains, or add a runtime `getCode()` check before settlement to fail explicitly when the proxy is missing.
