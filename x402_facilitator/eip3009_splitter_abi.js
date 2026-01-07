// @ts-check

/**
 * EIP3009SplitterV1 Contract ABI
 *
 * Minimal ABI containing only the functions needed by the x402 splitter facilitator.
 * Full ABI available in: ../eth/abi/contracts/EIP3009SplitterV1.json
 *
 * Deployed Addresses:
 * - Optimism Sepolia: 0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946
 * - Optimism Mainnet: TBD
 */

/**
 * Minimal ABI for x402 facilitator operations
 * Only includes: executeSplit, facilitatorWallet, fixedFee, isAuthorizationUsed
 */
export const SPLITTER_ABI = [
  {
    name: "executeSplit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "buyer", type: "address" },
      { name: "seller", type: "address" },
      { name: "salt", type: "bytes32" },
      { name: "totalAmount", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "facilitatorWallet",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "fixedFee",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "isAuthorizationUsed",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "authorizer", type: "address" },
      { name: "nonce", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
];

/**
 * Deployed splitter contract addresses by network
 * Network format: CAIP-2 (eip155:chainId)
 */
export const SPLITTER_ADDRESSES = {
  "eip155:10": process.env.SPLITTER_ADDRESS_MAINNET || "", // Optimism Mainnet (TBD)
  "eip155:11155420":
    process.env.SPLITTER_ADDRESS_SEPOLIA || "0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946", // Optimism Sepolia
};

/**
 * Get splitter address for a given network
 * @param {string} network - CAIP-2 network identifier (e.g., "eip155:10")
 * @returns {string} Splitter contract address
 * @throws {Error} If network is not supported
 */
export function getSplitterAddress(network) {
  const address = SPLITTER_ADDRESSES[network];
  if (!address) {
    throw new Error(`Splitter not deployed on network ${network}`);
  }
  return address;
}
