# AGENTS.md

Repo instructions for coding agents working in this repository.

## Policy: README vs AGENTS.md

READMEs are for humans — quick start, overview, deployment. Each package's `AGENTS.md` holds
only the rules agents need that the README does not already carry: silent failure modes,
ordering rules, skill routing. Every package has one; link, don't duplicate. The chain applies
from the edited file up to this root — the closest file wins on conflict, chat prompts override
everything.

## Repository Overview

Monorepo for a blockchain-based AI service platform. Each subdirectory is an independent npm package — there is no root `package.json` or workspace manager.

| Directory             | Purpose                                                                                  | Further reading                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `website/`            | Frontend (Vike SSR + React 19 + Panda CSS) — also the blog                               | [`README`](website/README.md) · [`AGENTS.md`](website/AGENTS.md)                       |
| `eth/`                | Solidity smart contracts (Hardhat, Optimism L2)                                          | [`README`](eth/README.md) · [`AGENTS.md`](eth/AGENTS.md)                               |
| `scw_js/`             | Serverless backend (Scaleway Functions: image gen, channel cron, growth API)             | [`README`](scw_js/README.md) · [`AGENTS.md`](scw_js/AGENTS.md)                         |
| `bunny_js/`           | Bunny Edge Scripts: the x402 llm/search/mcp sellers (plus the scw twins' origin domains) | [`README`](bunny_js/README.md) · [`AGENTS.md`](bunny_js/AGENTS.md)                     |
| `x402_facilitator/`   | EIP-3009 USDC payment facilitator (Scaleway Functions)                                   | [`README`](x402_facilitator/README.md) · [`AGENTS.md`](x402_facilitator/AGENTS.md)     |
| `comment_service/`    | Blog comment backend (Scaleway Functions)                                                | [`README`](comment_service/README.md) · [`AGENTS.md`](comment_service/AGENTS.md)       |
| `analytics/`          | Serverless pageview counter (Scaleway Functions, S3-backed)                              | [`README`](analytics/README.md) · [`AGENTS.md`](analytics/AGENTS.md)                   |
| `growth-agent/`       | AI growth agent cron container (Python, LangGraph)                                       | [`README`](growth-agent/README.md) · [`AGENTS.md`](growth-agent/AGENTS.md)             |
| `observability/`      | Log CLI + Loki alert rules for all Scaleway functions                                    | [`README`](observability/README.md) · [`AGENTS.md`](observability/AGENTS.md)           |
| `shared/chain-utils/` | Shared blockchain utility library (Viem peer dep)                                        | [`README`](shared/chain-utils/README.md) · [`AGENTS.md`](shared/chain-utils/AGENTS.md) |
| `notebooks/`          | Python Jupyter notebooks for analysis                                                    | [`README`](notebooks/README.md)                                                        |

## Commands

Each package documents its own commands in its `README.md`. Three ordering rules that are not obvious from `package.json`:

- **`website/`** — run `npm run prepare` (Panda codegen) before the first dev or build.
- **`shared/chain-utils/`** — it is a local file dependency (`"file:../shared/chain-utils"`). Run `npm run build` there before rebuilding any dependent package.
- **`eth/`** — after changing a contract, run `npx hardhat run scripts/export-abi.ts`, then update the website's ABI imports.

## Git Workflow

**Branching off `origin/main`: always pass `--no-track`.** `git switch -c <branch> origin/main`
(no `--no-track`) makes Git auto-configure the new branch's upstream as `origin/main` itself
(`branch.autoSetupMerge`), not a future same-named remote branch. Symptom: `git status` compares
against `origin/main` instead of showing the branch as unpublished, and a bare `git push` fails
with "the upstream branch ... does not match the name of your current branch" — or, with a
different `push.default`, could push straight onto `main`. Use
`git switch -c <branch> --no-track origin/main`, or fix an already-created branch with
`git branch --unset-upstream`. Set the correct tracking on first push with
`git push -u origin <branch>`.

## Planning

Use the **`planner`** skill before implementing any change that will touch more than one file or
one sitting — it grills the open decisions (proportionality, blast radius, verification) in
rounds with recommended answers, then writes a decisions-only plan with per-task verification
commands. Blog posts go to **`blog-planner`** instead; review skills stay read-only.

## Code Review

Use the **`code-review`** skill to review a change before pushing or merging — it layers
universal checks over this repo's own conventions (the nested `AGENTS.md` files and the
skills) and emits a graded inline report with a machine-readable gate verdict. The skill is
vendored in `.agents/skills/code-review/` (MIT; upstream origin and pin are in its SKILL.md) —
keep it out of `skills-lock.json`, which is only for CLI-managed skills.

## x402 payments

Applies to `scw_js/`, `x402_facilitator/`, and `bunny_js/`. Use the **`x402`** skill before
writing or reviewing anything that names an x402 role — it carries the official vocabulary,
this repo's verified role map, and links to the spec. The role map is counterintuitive and has
been published wrong: `/imagegen` and `/assistent` (scw_js) are **buyers** (they spend USDC);
the `*-agent.fretchen.eu` endpoints they call are the **sellers** (image gen on Scaleway,
llm/web/MCP on the bunny_js Edge Scripts).

Three traps, each documented in detail where it belongs:

- **EIP-712 domain names differ by network** (mainnet USDC is `"USD Coin"`, testnet is `"USDC"`). Follow the checklist in [`scw_js/README.md`](scw_js/README.md) → _Adding New Networks_, which carries the verified per-network table.
- **The x402 recipient whitelist uses OR logic** across a manual list, testnet-only test wallets, and NFT-holder status. See [`x402_facilitator/README.md`](x402_facilitator/README.md) → _Whitelist Architecture_.
- **Generated OpenAPI specs must publish the strictness they actually enforce.** `scw_js` and `x402_facilitator` generate their `openapi.*.json` from Zod, and `z.object` renders as `additionalProperties: false` — so a schema that merely _strips_ unknown keys publishes a strictness its handler does not enforce. Use `z.looseObject` for a request the handler forwards or ignores extras on, `z.object` where the body is built field by field (every response, and `genimg`'s request, which really does reject unknown fields). Each package's `test/openapi_*_generation.test.ts` asserts this, because nothing else catches it — and it has shipped wrong: the facilitator's published `PaymentRequest` described a request that could not be paid with, since real payloads carry the very fields it declared forbidden.

## Security

See [`.github/THREAT_MODEL.md`](.github/THREAT_MODEL.md) for the full asset inventory, blast radius, and trust boundaries, and [`eth/SECURITY.md`](eth/SECURITY.md) for contract-level findings. Use the **`cve-triage`** skill to evaluate open Dependabot alerts against the threat model; the criteria are in [`.github/CVE_TRIAGE.md`](.github/CVE_TRIAGE.md). Use the **`security-review`** skill for periodic deep audits of the agent and API layers — it operationalizes the threat model's review cadence with OWASP secure-agent-playbook procedures, vendored under `.agents/skills/security-review/` (CC-BY-4.0; keep it out of `skills-lock.json`). Contract-level rules like the GenImNFTv4 agent whitelist are in [`eth/AGENTS.md`](eth/AGENTS.md).

**Key hierarchy** (highest-value first):

- `CONTRACT_OWNER_PRIVATE_KEY` (Hardhat keystore) — dedicated EOA `0x1af51D…fBB20`, controls every upgradeable contract and owns the three ERC-8004 agent identities (Base). Never use it for anything else.
- `SEPOLIA_PRIVATE_KEY` (Hardhat keystore) — deployment/script signing key `0x073f26…`. Does NOT own contracts.
- Agent wallet `0xAAEBC1…` — backend-only, whitelisted on GenImNFTv4 via `authorizeAgentWallet()`.
- Facilitator wallet — stored as a Scaleway secret, receives USDC fees only.
- Receiver-authorizer key (`RECEIVER_AUTHORIZER_PRIVATE_KEY`, scw_js Scaleway secret) — signs batch-settlement channel-config and refund authorizations for the `/assistent` sellers; never sends transactions. Compromise means revenue denial (early refunds, stalled claims), not fund redirection.

Rules that apply everywhere:

- Private keys go in the Hardhat keystore (`npx hardhat keystore set SEPOLIA_PRIVATE_KEY`) or a Scaleway secret — never in code, never committed.
- All serverless responses must include CORS headers (`Access-Control-Allow-Origin: *`).

## Blog Posts

Posts live in `website/blog/` — the frontmatter rules and the prose conventions are in
[`website/AGENTS.md`](website/AGENTS.md). Plan with the **`blog-planner`** skill (it enforces
the plan-first rule: no MDX before an approved `website/blog/<slug>.plan.md`); review a draft
with the read-only **`blog-critic`**.
