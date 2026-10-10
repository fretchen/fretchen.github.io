# Repo Review Checklist (Layer 2)

This is the project-specific review view for this repository — the checked-in equivalent of
upstream's `.claude/review-checklist.md`. It is **derived**: the authoritative sources are the
nested `AGENTS.md` files, the skills in `.agents/skills/*/SKILL.md`, and the convention tests.
When a rule here and a rule there disagree, the authoritative source wins and this file should
be fixed. Update it only through the skill's explicit `update repo-checklist.md` flow.

Item format (upstream checklist-schema v2.3):

```markdown
- [ ] Short description (source: path)
  severity: P0|P1|P2|P3
  scope: universal|project|module
  frequency: 1x|2x+|chronic
```

Sort on load: chronic > 2x+ > 1x, then P0 > P1 > P2 > P3, then universal > project > module.

## Security & keys

- [ ] Private keys only in the Hardhat keystore or Scaleway secrets — never in code, tests, fixtures, logs, or commits (source: AGENTS.md → Security)
  severity: P0
  scope: universal
  frequency: chronic

- [ ] Any code calling GenImNFTv4's requestImageUpdate() must verify isAuthorizedAgent() first — the CVE-2025-11-26 pattern (source: eth/AGENTS.md → Security)
  severity: P0
  scope: project
  frequency: 1x

- [ ] EIP-712 domain names differ by network: mainnet USDC is "USD Coin", testnet is "USDC" — check the verified per-network table before touching payment signing (source: AGENTS.md → scw_js/README.md, Adding New Networks)
  severity: P0
  scope: module
  frequency: 1x

- [ ] Serverless secrets are configured via Scaleway Console only; `env:` in serverless.yml is public by definition (source: AGENTS.md → Serverless)
  severity: P1
  scope: universal
  frequency: 2x+

- [ ] All serverless responses include CORS headers (Access-Control-Allow-Origin: *) (source: AGENTS.md → Security)
  severity: P1
  scope: universal
  frequency: chronic

- [ ] Changes touching auth, payments, or keys are checked against .github/THREAT_MODEL.md for blast radius before approval (source: AGENTS.md → Security)
  severity: P1
  scope: project
  frequency: 2x+

## Payments & x402

- [ ] The x402 role map: /imagegen and /assistent are buyers; the *-agent.fretchen.eu endpoints are sellers — any PR or doc that names a role gets this wrong half the time (source: .agents/skills/x402/SKILL.md)
  severity: P1
  scope: project
  frequency: chronic

- [ ] Channel identity: wallet + voucher signer + receiver + token + network hash into channelId — code that recomputes any of these mid-turn silently opens a second channel the user must fund again (source: website/utils/x402PaidFetch.ts)
  severity: P1
  scope: module
  frequency: 1x

## OpenAPI / serverless handlers

- [ ] Published OpenAPI strictness must match handler behavior: z.object only for bodies built field by field, z.looseObject when unknown keys are forwarded or ignored (source: AGENTS.md → Serverless; enforced by test/openapi_*_generation.test.ts)
  severity: P1
  scope: universal
  frequency: 2x+

## Contracts (eth/)

- [ ] UUPS upgradeable proxy pattern — never deploy an implementation contract directly (source: eth/AGENTS.md → Upgrades)
  severity: P0
  scope: module
  frequency: 1x

- [ ] Upgrades append new state variables after existing ones only — reordering or inserting corrupts proxy storage (source: eth/AGENTS.md → Upgrades)
  severity: P0
  scope: module
  frequency: 1x

- [ ] Hardhat here uses Viem, not Ethers: contract calls return bigint, format with viem helpers (source: eth/AGENTS.md)
  severity: P2
  scope: module
  frequency: chronic

- [ ] Tests go in the right category: *_Functional.ts (Viem, contract logic) vs *_Deployment.ts (ethers + upgrades plugin, script coverage) — never both libraries in one file (source: eth/AGENTS.md → Tests)
  severity: P2
  scope: module
  frequency: 2x+

- [ ] Deploy/upgrade scripts export their deploy function and guard direct execution, so the *_Deployment.ts import does not run a deployment (source: eth/AGENTS.md → Deployment scripts)
  severity: P2
  scope: module
  frequency: 2x+

- [ ] After changing a contract: run npx hardhat run scripts/export-abi.ts, then update the website's ABI imports from eth/abi/contracts/*.ts (source: AGENTS.md → Commands)
  severity: P2
  scope: project
  frequency: 2x+

## Website (Vike + React 19 + Panda CSS)

- [ ] Panda compiles css({}) statically — the six silent-failure rules (variable values, spacing shorthands, unknown tokens, token() outside css({}), fontFamily faces, recipe variants as variables) pass tsc AND tests while the CSS is simply missing; bulk style changes are verified by diffing emitted declarations (source: website/AGENTS.md; enforced by test/styleConventions.test.ts)
  severity: P1
  scope: module
  frequency: chronic

- [ ] Client-only components are imported with { ssr: false } (source: website/AGENTS.md)
  severity: P2
  scope: module
  frequency: chronic

- [ ] npm run prepare (Panda codegen) after config changes; styled-system/ is generated — never edited directly (source: website/AGENTS.md)
  severity: P2
  scope: module
  frequency: 2x+

- [ ] Wagmi hooks are auto-generated from wagmi.config.ts, not hand-written (source: website/AGENTS.md)
  severity: P2
  scope: module
  frequency: 1x

- [ ] Never read useAccount().isConnected directly — go through useIsWalletConnected (source: website/hooks/useIsWalletConnected.ts; enforced by test/walletConnectionConvention.test.ts)
  severity: P2
  scope: module
  frequency: chronic

- [ ] The design system in website/README.md is read before adding any style — colors and their jobs, the button recipe, the scales (source: website/AGENTS.md)
  severity: P2
  scope: module
  frequency: 2x+

## Assistant chat tools (website/tools/, AssistantChat.tsx)

- [ ] Every TOOL_REGISTRY entry needs a toolRunners entry — the test suite iterates the registry, so a tool without a runner fails the suite (source: .agents/skills/chat-tools/SKILL.md)
  severity: P1
  scope: module
  frequency: 2x+

- [ ] website/tools/*.ts stay React-free — no hooks, no React imports; that is what keeps them importable from non-browser callers (source: .agents/skills/chat-tools/SKILL.md)
  severity: P1
  scope: module
  frequency: 2x+

- [ ] Tool definitions and results are input tokens on every later hop: serialized tools stay under MAX_TOOLS_BYTES (8192), results projected hard, and `tools: []` is never sent — pass undefined so the key is absent (source: .agents/skills/chat-tools/SKILL.md)
  severity: P1
  scope: module
  frequency: chronic

- [ ] A non-ok tool status withdraws the tool for the rest of the turn unless it is an answer-like status marked recoverable: true (source: .agents/skills/chat-tools/SKILL.md)
  severity: P1
  scope: module
  frequency: 2x+

## Blog

- [ ] No MDX before an approved website/blog/<slug>.plan.md exists (source: AGENTS.md → Blog Posts; .agents/skills/blog-planner/SKILL.md)
  severity: P1
  scope: project
  frequency: 2x+

- [ ] Prose carries no manufactured suspense: concede-then-swing, forward promise, meta-announcement, and withheld reveal are banned — figure captions included (source: AGENTS.md → Blog Posts)
  severity: P2
  scope: project
  frequency: chronic

## Process

- [ ] Branch off origin/main with --no-track; set tracking on first push with -u — auto-setup makes the new branch track origin/main and can misdirect pushes (source: AGENTS.md → Git Workflow)
  severity: P2
  scope: project
  frequency: 2x+

- [ ] shared/chain-utils is a local file dependency — build it before rebuilding any dependent package (source: AGENTS.md → Commands)
  severity: P2
  scope: project
  frequency: 2x+
