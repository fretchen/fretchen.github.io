# x402 Permit2 Proxy (`x402BasePermit2Proxy`) only deployed on Base Sepolia — silent settlement failure on other chains

## Observed behavior

While testing WETH Permit2 payments on **Optimism Sepolia** (see [x402_permit2_demo.ipynb](https://github.com/fretchen/fretchen.github.io/blob/x402_permit/notebooks/x402_permit2_demo.ipynb)), Step 7 (Post-Settlement Verification) shows **0 WETH transferred** even though `settle()` returns `{ success: true }`. The Permit2 allowance is unchanged and no token balances move. The settlement transaction itself succeeds on-chain but has no internal transfers.

## Root cause

The `@x402/evm` library does not call the canonical Permit2 contract directly. It routes settlements through a **security proxy** called `x402BasePermit2Proxy` at a hardcoded address (`0x4020615294c913F045dc10f0a5cdEbd86c280001`). This proxy binds the payment recipient cryptographically via a `Witness` struct, prevents the facilitator from redirecting funds, and adds reentrancy protection.

This proxy is only deployed on **Base Sepolia**. On all other chains the address has no code:

| Chain | Status |
|-------|--------|
| Base Sepolia | ✅ 2440 bytes |
| OP Sepolia | ❌ empty |
| OP Mainnet | ❌ empty |
| Base Mainnet | ❌ empty |

Verified via `eth_getCode` on 2025-02-21 using `@x402/evm@2.3.1`.

When the EVM sends a `CALL` to an address with no code, it **silently succeeds** — no revert, no error, just a no-op. This is why `settle()` reports success while transferring nothing.

## Impact

- Permit2 settlements on OP Sepolia (and likely OP Mainnet / Base Mainnet) return `success: true` but transfer **0 tokens**
- The facilitator's `/supported` endpoint still advertises Permit2 capability for these chains
- The caller has **no indication** that anything went wrong — verification passes, settlement "succeeds"
- Only post-settlement balance checks (notebook Step 7) reveal the silent failure

## Reproduction

### Full notebook reproduction

Run the [x402_permit2_demo.ipynb](https://github.com/fretchen/fretchen.github.io/blob/x402_permit/notebooks/x402_permit2_demo.ipynb) notebook on the `x402_permit` branch with `USE_BASE = false` (Optimism Sepolia). Steps 1–6 succeed normally, Step 7 shows 0 WETH transferred, and Step 8 confirms the proxy has no code.

### Quick verification — missing proxy deployment

```js
import { createPublicClient, http } from "viem";
import { optimismSepolia, baseSepolia, optimism, base } from "viem/chains";

const PROXY = "0x4020615294c913F045dc10f0a5cdEbd86c280001";

for (const chain of [baseSepolia, optimismSepolia, optimism, base]) {
  const client = createPublicClient({ chain, transport: http() });
  const code = await client.getCode({ address: PROXY });
  const bytes = code ? (code.length - 2) / 2 : 0;
  console.log(`${chain.name}: ${bytes} bytes [${bytes > 0 ? "DEPLOYED" : "EMPTY"}]`);
}
```

Output:

```
Base Sepolia: 2440 bytes [DEPLOYED]
OP Sepolia: 0 bytes [EMPTY]
OP Mainnet: 0 bytes [EMPTY]
Base: 0 bytes [EMPTY]
```

### Example failed transaction

- Network: Optimism Sepolia
- Tx: https://sepolia-optimism.etherscan.io/tx/0x56796d86e771e5719c8e22f6bda055ebd553d6bc7a068d24dbed0e7cc0a59af0
- Observation: `settle()` returns `{ success: true }`, but the "Internal Txns" tab shows no token transfers

## Suggested fix

Either deploy `x402BasePermit2Proxy` to all supported chains, or add a runtime `getCode()` check before settlement to fail explicitly when the proxy is missing.
