import{t as e}from"./chunk-BLhQqvoO.js";var t=e(),n={title:`Multi-Chain Architecture: Technical Notes`,publishing_date:`2026-02-05`,category:`webdev`,tokenID:189,secondaryCategory:`blockchain`,description:`Technical summary of implementing multi-chain support for an NFT minting application. Notes on architecture, testing patterns, and lessons learned.`};function r(e){let n={a:`a`,code:`code`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.p,{children:`This document summarizes the technical changes required to expand a single-chain NFT minting application (Optimism) to support multiple chains (Optimism + Base). Written as reference notes for future projects and interested developers.`}),`
`,(0,t.jsx)(n.h2,{children:`Motivation`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`User reach`}),`: Base has significantly higher transaction volume (~15x Optimism), primarily due to Coinbase wallet integration`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`ERC-8004 preparation`}),`: Base testnets have active reference implementations for agent authorization patterns`]}),`
`]}),`
`,(0,t.jsx)(n.h2,{children:`Architecture Overview`}),`
`,(0,t.jsx)(n.h3,{children:`Before: Hardcoded Chain`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-typescript`,children:`// Scattered across codebase
const chainId = 10;
const contractAddress = "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb";
`})}),`
`,(0,t.jsx)(n.h3,{children:`After: CAIP-2 Network Identifiers`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-typescript`,children:`// Centralized in @fretchen/chain-utils
const network = "eip155:8453"; // CAIP-2 format
const address = getGenAiNFTAddress(network);
const chain = getViemChain(network);
`})}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`Why CAIP-2?`})}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`Human-readable (`,(0,t.jsx)(n.code,{children:`eip155:10`}),` vs `,(0,t.jsx)(n.code,{children:`10`}),`)`]}),`
`,(0,t.jsx)(n.li,{children:`Standard across wallets, indexers, block explorers`}),`
`,(0,t.jsx)(n.li,{children:`Type-safe with TypeScript (can't accidentally pass chainId where network expected)`}),`
`]}),`
`,(0,t.jsx)(n.h2,{children:`Project Structure`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{children:`monorepo/
├── shared/
│   └── chain-utils/          # Shared package (single source of truth)
│       ├── src/
│       │   ├── index.ts      # CAIP-2 utilities, chain mapping
│       │   ├── addresses.ts  # Contract addresses per network
│       │   └── abi/          # Contract ABIs
│       └── test/
├── scw_js/                   # Backend (Scaleway Functions)
├── x402_facilitator/         # Payment facilitator
└── website/                  # Frontend (Vike + React)
`})}),`
`,(0,t.jsx)(n.h2,{children:`Key Changes by Component`}),`
`,(0,t.jsxs)(n.h3,{children:[`1. Shared Package: `,(0,t.jsx)(n.code,{children:`@fretchen/chain-utils`})]}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`Exports:`})}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`toCAIP2(chainId)`}),` / `,(0,t.jsx)(n.code,{children:`fromCAIP2(network)`}),` - conversion utilities`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`getViemChain(network)`}),` - returns viem Chain object`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`getGenAiNFTAddress(network)`}),` - contract address lookup`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`getUSDCConfig(network)`}),` - USDC address, decimals, EIP-712 domain`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`GENAI_NFT_NETWORKS`}),` - list of supported networks`]}),`
`,(0,t.jsx)(n.li,{children:`Contract ABIs`}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Critical detail:`}),` No `,(0,t.jsx)(n.code,{children:`prepare`}),` script. CI must explicitly build before consumers install:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`- run: cd shared/chain-utils && npm ci && npm run build
- run: cd website && npm ci # Now chain-utils is built
`})}),`
`,(0,t.jsx)(n.h3,{children:`2. Backend: Network Parameter`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-javascript`,children:`// Before
const sepoliaTest = body.sepoliaTest; // boolean

// After
const network = body.network; // "eip155:10" | "eip155:8453" | ...
`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Security consideration:`}),` Added `,(0,t.jsx)(n.code,{children:`validatePaymentNetwork(network, isTestMode)`}),` to prevent testnet payments being accepted in production. This was a real bug found by tests.`]}),`
`,(0,t.jsx)(n.h3,{children:`3. Frontend: Multi-Chain Hooks`}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsxs)(n.strong,{children:[`New hook: `,(0,t.jsx)(n.code,{children:`useMultiChainNFTs`})]})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-typescript`,children:`const { tokens, isLoading, reload } = useMultiChainUserNFTs();
// Returns NFTs from ALL supported chains, merged
`})}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsxs)(n.strong,{children:[`New component: `,(0,t.jsx)(n.code,{children:`ChainBadge`})]})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-typescript`,children:`<ChainBadge network="eip155:8453" /> // Renders "Base" badge
`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Counter fix:`}),` "My Artworks (N)" now shows total across all chains, not just current wallet chain.`]}),`
`,(0,t.jsx)(n.h3,{children:`4. Payment Flow: x402 Protocol`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{children:`1. Client: POST /genimg { prompt, network: "eip155:8453" }
2. Server: 402 Payment Required (Base USDC requirements)
3. Client: Signs EIP-3009 authorization for Base USDC
4. Server: Verifies, mints NFT on Base, transfers to client
`})}),`
`,(0,t.jsxs)(n.p,{children:[`The `,(0,t.jsx)(n.code,{children:`network`}),` parameter flows through the entire stack:`]}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Frontend → Backend → Payment Facilitator → Smart Contract`}),`
`]}),`
`,(0,t.jsx)(n.h2,{children:`Testing Architecture (Key Learning)`}),`
`,(0,t.jsxs)(n.p,{children:[`The most significant improvement was `,(0,t.jsx)(n.strong,{children:`splitting tests into two categories`}),`:`]}),`
`,(0,t.jsxs)(n.h3,{children:[`Functional Tests (`,(0,t.jsx)(n.code,{children:`*_Functional.ts`}),`)`]}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Purpose:`}),` Test contract logic in isolation`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Stack:`}),` Viem only (no ethers, no OpenZeppelin plugins)`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Speed:`}),` Fast (~50ms per test)`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Example:`}),` Does `,(0,t.jsx)(n.code,{children:`safeMint`}),` emit correct events? Does `,(0,t.jsx)(n.code,{children:`transferFrom`}),` check ownership?`]}),`
`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-typescript`,children:`// Functional test: Pure contract behavior
it("should emit Transfer event on mint", async () => {
  const hash = await contract.write.safeMint([uri, true], { value: mintPrice });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  expect(receipt.logs).toContainEqual(/* Transfer event */);
});
`})}),`
`,(0,t.jsxs)(n.h3,{children:[`Deployment Tests (`,(0,t.jsx)(n.code,{children:`*_Deployment.ts`}),`)`]}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Purpose:`}),` Test deployment scripts and upgrade paths`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Stack:`}),` Ethers + OpenZeppelin Upgrades Plugin`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Speed:`}),` Slower (~500ms per test)`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Example:`}),` Does the deployment script handle missing config? Does upgrade preserve storage?`]}),`
`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-typescript`,children:`// Deployment test: Script behavior
it("should fail gracefully with invalid config", async () => {
  const config = createTempConfig({ validateOnly: true, dryRun: false });
  config.proxyAddress = "invalid";
  await expect(deployFunction()).rejects.toThrow("Invalid proxy address");
});
`})}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`Why this matters:`})}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Functional tests are 10x faster → run on every save`}),`
`,(0,t.jsx)(n.li,{children:`Deployment tests catch CI/CD issues → run before deploy`}),`
`,(0,t.jsx)(n.li,{children:`Clear separation prevents "test pollution" (ethers global state affecting viem tests)`}),`
`]}),`
`,(0,t.jsx)(n.h3,{children:`Frontend Test Mocking`}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Problem:`}),` Testing multi-chain components required mocking `,(0,t.jsx)(n.code,{children:`@fretchen/chain-utils`}),` deeply, causing tests to hang.`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Solution:`}),` Mock at the hook level, not the utility level:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-typescript`,children:`// ❌ Deep mocking (caused hangs)
vi.mock("@fretchen/chain-utils", () => ({ ... }));

// ✅ Hook-level mocking (fast, reliable)
vi.mock("../hooks/useMultiChainNFTs", () => ({
  useMultiChainUserNFTs: () => ({
    tokens: mockTokens,
    isLoading: false,
    reload: vi.fn(),
  }),
}));
`})}),`
`,(0,t.jsx)(n.h2,{children:`Deployment Checklist`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`chain-utils:`}),` Build and verify exports`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Backend:`}),` Deploy scw_js with new network parameter`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Facilitator:`}),` Update supported networks`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Contracts:`}),` Deploy to new chain, verify on block explorer`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`chain-utils:`}),` Add new addresses, rebuild`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Frontend:`}),` Deploy with multi-chain components`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Order matters:`}),` Backend must support new network before frontend offers it.`]}),`
`,(0,t.jsx)(n.h2,{children:`Metrics`}),`
`,(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{children:`Metric`}),(0,t.jsx)(n.th,{children:`Value`})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`Planning duration`}),(0,t.jsx)(n.td,{children:`~4 weeks`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`Implementation duration`}),(0,t.jsx)(n.td,{children:`~3-4 weeks`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`Lines changed`}),(0,t.jsx)(n.td,{children:`~2,500`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`New tests`}),(0,t.jsx)(n.td,{children:`~50`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`Test coverage`}),(0,t.jsx)(n.td,{children:`>90%`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:`Breaking changes`}),(0,t.jsx)(n.td,{children:`0`})]})]})]}),`
`,(0,t.jsx)(n.h2,{children:`Common Pitfalls`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Symlinks in serverless:`}),` Local packages (`,(0,t.jsx)(n.code,{children:`file:../shared/chain-utils`}),`) don't deploy. Use bundler (tsup) to inline dependencies.`]}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Nonce race conditions:`}),` Parallel requests can cause "nonce too low" errors. Viem auto-manages nonces, but add retry logic for resilience.`]}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Type casting with wagmi:`}),` `,(0,t.jsx)(n.code,{children:`chainId`}),` from `,(0,t.jsx)(n.code,{children:`fromCAIP2()`}),` returns `,(0,t.jsx)(n.code,{children:`number`}),`, but wagmi expects specific chain IDs:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-typescript`,children:`const chainId = fromCAIP2(network) as SupportedChainId;
`})}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`EIP-712 domain names:`}),` USDC has different domain names per chain ("USD Coin" on mainnet, "USDC" on testnet). Must match exactly for signatures to verify.`]}),`
`]}),`
`]}),`
`,(0,t.jsx)(n.h2,{children:`References`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:(0,t.jsx)(n.a,{href:`https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md`,children:`CAIP-2 Specification`})}),`
`,(0,t.jsx)(n.li,{children:(0,t.jsx)(n.a,{href:`https://viem.sh/docs/clients/chains.html`,children:`Viem Multi-Chain Guide`})}),`
`,(0,t.jsx)(n.li,{children:(0,t.jsx)(n.a,{href:`https://eips.ethereum.org/EIPS/eip-8004`,children:`ERC-8004 (Agent Authorization)`})}),`
`,(0,t.jsx)(n.li,{children:(0,t.jsx)(n.a,{href:`/website/MULTICHAIN_EXPANSION_PROPOSAL.md`,children:`Implementation Proposal`})}),`
`]})]})}function i(e={}){let{wrapper:n}=e.components||{};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(r,{...e})}):r(e)}export{i as default,n as frontmatter};