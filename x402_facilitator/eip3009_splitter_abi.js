// @ts-check

/**
 * EIP3009SplitterV1 Contract ABI
 *
 * Re-exports from @fretchen/chain-utils for backward compatibility.
 * Full ABI available in: ../eth/abi/contracts/EIP3009SplitterV1.json
 *
 * Deployed Addresses:
 * - Optimism Sepolia: 0x7F2b5E60e26B31E32c40F48e0e7D1CA5E62C5b7a
 * - Optimism Mainnet: 0x4a0EA6E7A8B23C95Da07d59a8e36E9c5C5f6c5Bf
 */

import { EIP3009SplitterV1ABI, getEIP3009SplitterAddress } from "@fretchen/chain-utils";

// Re-export ABI with legacy name for backward compatibility
export const SPLITTER_ABI = EIP3009SplitterV1ABI;

// Re-export getter function
export { getEIP3009SplitterAddress as getSplitterAddress };
