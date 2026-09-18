import { optimism, optimismSepolia, base, baseSepolia } from "wagmi/chains";
import { SupportV2ABI } from "../../eth/abi/contracts/SupportV2";

// ═══════════════════════════════════════════════════════════════
// Chain utilities are now in @fretchen/chain-utils
// Import directly where needed:
//   import { getGenAiNFTAddress, GenImNFTv4ABI, GENAI_NFT_NETWORKS } from "@fretchen/chain-utils";
//   import { getCollectorNFTAddress, CollectorNFTv1ABI, COLLECTOR_NFT_NETWORKS } from "@fretchen/chain-utils";
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// SupportV2: Multi-Chain Configuration
// ═══════════════════════════════════════════════════════════════

/**
 * Use testnet chains for SupportV2?
 * Set VITE_USE_TESTNET=true in .env for local development
 * Default: false (mainnet)
 */
const USE_TESTNET = import.meta.env.VITE_USE_TESTNET === "true";

/** SupportV2 contract addresses - mainnet */
const MAINNET_SUPPORT_V2_ADDRESSES: Record<number, `0x${string}`> = {
  [optimism.id]: "0x4ca63f8A4Cd56287E854f53E18ca482D74391316",
  [base.id]: "0xB70EA4d714Fed01ce20E93F9033008BadA1c8694",
};

/** SupportV2 contract addresses - testnet */
const TESTNET_SUPPORT_V2_ADDRESSES: Record<number, `0x${string}`> = {
  [optimismSepolia.id]: "0x9859431b682e861b19e87Db14a04944BC747AB6d",
  [baseSepolia.id]: "0xaB44BE78499721b593a0f4BE2099b246e9C53B57",
};

/** Active SupportV2 addresses based on VITE_USE_TESTNET */
const SUPPORT_V2_ADDRESSES = USE_TESTNET ? TESTNET_SUPPORT_V2_ADDRESSES : MAINNET_SUPPORT_V2_ADDRESSES;

/** Active chains for SupportV2 (both reading and writing) */
export const SUPPORT_V2_CHAINS = USE_TESTNET ? ([optimismSepolia, baseSepolia] as const) : ([optimism, base] as const);

/** Default chain for read operations and auto-switch target */
export const DEFAULT_SUPPORT_CHAIN = USE_TESTNET ? optimismSepolia : optimism;

// Donation recipient — intentionally different from the contract owner EOA (0x1af51D…fBB20).
// This is the general-purpose dev wallet that receives ETH from SupportV2.donate().
export const SUPPORT_RECIPIENT_ADDRESS = "0x073f26F0C3FC100e7b075C3DC3cDE0A777497D20" as const;

/** The site owner's admin wallet — the only one trusted with every scope. */
export const ADMIN_WALLET = "0xA37729CF2201c01C74bC868834c7cf8dC13CAE19" as const;

/**
 * Wallets that may use each admin capability, kept apart because the capabilities are not
 * interchangeable: reading traffic figures is harmless, approving a growth draft queues a post to
 * Mastodon and Bluesky.
 *
 * **Each scope mirrors the `OWNER_ETH_ADDRESS` of a different deploy** — `analytics` mirrors the
 * analytics function's, `growth` the scw_js one's. The two are independent values that happen to
 * share a variable name; they are not meant to be identical, and copying one into the other
 * re-grants exactly what this split removes. The server-side check is the one that decides — these
 * lists only govern what the browser bothers to offer. A mismatch is an annoyance rather than a
 * hole, and fails in a readable direction either way: an address listed only here gets the UI and
 * then a 401 from the API, one listed only there loses the UI but keeps API access.
 */
export const OWNER_SCOPES = {
  /** Read-only traffic figures: the dashboard and the assistant's `get_analytics` tool. */
  analytics: [ADMIN_WALLET, SUPPORT_RECIPIENT_ADDRESS],
  /** Approving a draft queues it for Mastodon/Bluesky — admin wallet only. */
  growth: [ADMIN_WALLET],
  /** Each `search_web` call spends metered Brave credit, so this is narrower than `analytics`,
   *  where reading a figure costs nothing. Admin wallet only. */
  search: [ADMIN_WALLET],
} as const;

export type OwnerScope = keyof typeof OWNER_SCOPES;

/**
 * Case-insensitive membership in one scope's list; false for an undefined address.
 *
 * `scope` is required on purpose: a default would let a new call site silently inherit the widest
 * list, which is the conflation this record exists to prevent.
 */
export function isOwnerAddress(address: string | undefined, scope: OwnerScope): boolean {
  if (!address) return false;
  const candidate = address.toLowerCase();
  return OWNER_SCOPES[scope].some((owner) => owner.toLowerCase() === candidate);
}

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
 * Check if a chain supports SupportV2 (in current mode: mainnet or testnet)
 */
export function isSupportV2Chain(chainId: number): boolean {
  return chainId in SUPPORT_V2_ADDRESSES;
}

// ═══════════════════════════════════════════════════════════════
// Legacy Contract Configurations
//
// GenAI NFT: MIGRATED to chain-utils (Phase 2):
//   import { getGenAiNFTAddress, GenImNFTv4ABI, GENAI_NFT_NETWORKS } from "@fretchen/chain-utils";
//   const { network } = useAutoNetwork(GENAI_NFT_NETWORKS);
//   const address = getGenAiNFTAddress(network);
//
// CollectorNFT: MIGRATED to chain-utils (Phase 3):
//   import { getCollectorNFTAddress, CollectorNFTv1ABI, COLLECTOR_NFT_NETWORKS } from "@fretchen/chain-utils";
//   const { network, switchIfNeeded } = useAutoNetwork(COLLECTOR_NFT_NETWORKS);
//   const address = getCollectorNFTAddress(network);
// ═══════════════════════════════════════════════════════════════
