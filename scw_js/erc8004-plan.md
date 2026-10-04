# ERC-8004 for the scw_js x402 services — plan

Goal: register the three x402 origins as ERC-8004 agents on **Base**, one agent per origin.

| Service    | Origin                               | Handler                |
| ---------- | ------------------------------------ | ---------------------- |
| Image gen  | `https://imagegen-agent.fretchen.eu` | `genimg_x402_token.ts` |
| LLM chat   | `https://llm-agent.fretchen.eu`      | `sc_llm_x402.ts`       |
| Web access | `https://web-agent.fretchen.eu`      | `search_api.ts`        |

Registry: Identity Registry on Base, `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` (`eip155:8453`).
agentURI per agent: `https://<origin>/.well-known/agent-registration.json` (same origin as the endpoint ⇒ domain control is implied).

---

## Part A — Non-invasive: proper `agent-registration.json` files

> 🟢 **NON-INVASIVE.** No keys, no on-chain transactions, no change to payment flows. Only a new free GET route plus cleanup. Safe to ship on its own.

- [ ] **A1 Clean up.** Delete the stale `scw_js/agent-registration.json` (old `endpoints` key, dead OpenAPI link, raw scw URLs, Optimism wallet, minting). Update the README line that links it.
- [ ] **A2 Builder module.** `agent_registration.ts` builds the file per service from its OpenAPI spec (`info.title`, `info.description`, `servers[0].url`):
  - `type: …eip-8004#registration-v1`, `name`, `description`, `image: <origin>/favicon.png`
  - `services`: `OpenAPI → <origin>/openapi.json` (custom entry), `web → https://www.fretchen.eu`
  - `x402Support: true`, `active: true`, `supportedTrust: ["reputation"]`
  - `registrations`: empty while `AGENT_IDS.<service>` is `null`
- [ ] **A3 Route.** Each of the three handlers answers `GET|HEAD /.well-known/agent-registration.json` (free, unauthenticated) right before its `openapi.json` branch.
- [ ] **A4 Tests.** Unit tests for the builder (shape, `services` not `endpoints`, empty vs. filled `registrations`) and one route test per handler (static imports).
- [ ] **A5 Deploy functions + verify.** `curl https://<origin>/.well-known/agent-registration.json` on all three origins. Check that the Scaleway gateway passes `/.well-known/` (it swallows `/favicon.ico`). Fallback: serve `/agent-registration.json` and use that as the agentURI.

**Result:** valid registration files are live on all three origins. Nothing is registered yet.

---

## Part B — Deployments to the registry (on-chain, Base)

> 🔴 **ON-CHAIN / IRREVERSIBLE.** Real transactions on Base mainnet, signed by the owner key. agentIds and events are permanent. Do this only after Part A is live and verified.

- [ ] **B0 Prerequisites.**
  - Dedicated **owner key** (hardware wallet or Safe), **not** `NFT_WALLET` (the hot key lives in the function secrets; whoever owns the NFT controls the identity).
  - A little ETH on Base for the owner.
  - Optional: dry-run everything on Base Sepolia (`0x8004A818BFB912233c491871b3d84c89A494BD9e`).
- [ ] **B1 Register.** `scripts/register_agents.ts`: `register(agentURI)` once per service, then read `agentId` from the `Registered` event. → **3 tx**
- [ ] **B2 Fill IDs (off-chain).** Write the three agentIds into `AGENT_IDS`, then redeploy functions. The https agentURI means no extra transaction.
- [ ] **B3 Bind payTo.** `setAgentWallet(agentId, NFT_WALLET_PUBLIC_KEY, deadline, sig)` per agent. The EIP-712 sig comes from the hot wallet, the tx is sent by the owner. Take the typed-data struct from `erc-8004/erc-8004-contracts` tests. → **3 tx**
- [ ] **B4 Verify.** For each agent: `tokenURI(agentId)` resolves, the file's `registrations` matches `(eip155:8453:<registry>, agentId)`, and `getAgentWallet(agentId) == payTo` in the 402 response.

**Result:** three discoverable agents on Base, with payTo verifiable on-chain. 6 tx total.

---

## Part C — Later / optional

- Hint in paid responses that feedback can be given to `agentId` X (Reputation Registry; owner and operators cannot self-rate). Feedback files can carry `proofOfPayment` (x402 tx hash).
- Cross-link: reference the agentIds from `x-discovery` in `openapi.*.json`.
- Move the agentURI to IPFS or a `data:` URI (one `setAgentURI` tx) if the domain dependency becomes a concern.
- Validation Registry: wait, the spec section is still under revision.
- Additional registrations on other chains (e.g. Optimism) via the `registrations` list.
