/**
 * ERC-8004 agent registration file, built per x402 service from its committed OpenAPI spec.
 *
 * Served at `/.well-known/agent-registration.json` on each origin. That path is also what the
 * on-chain `agentURI` will point to (Part B of `erc8004-plan.md`), so the file doubles as the
 * EIP's optional endpoint-domain proof.
 *
 * Shape: EIP-8004, "Agent URI and Agent Registration File". `services` replaced the draft-era
 * `endpoints`; `registrations` is `[]` until the agent has an id.
 */

export type AgentService = "genimg" | "llm" | "search";

/** Identity Registry on Base mainnet (erc-8004-contracts README). */
export const REGISTRY = {
  chainId: 8453,
  address: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
} as const;

/** Filled in after `register()` (Part B2). `null` = not registered yet. */
export const AGENT_IDS: Record<AgentService, number | null> = {
  genimg: null,
  llm: null,
  search: null,
};

export const AGENT_REGISTRATION_PATH = ".well-known/agent-registration.json";

/** The parts of a committed `openapi.*.json` this file is derived from. */
export interface OpenApiSource {
  info: { title: string; description: string };
  servers: { url: string }[];
  openapi: string;
}

export function buildAgentRegistration(spec: OpenApiSource, service: AgentService) {
  const origin = spec.servers[0].url;
  const agentId = AGENT_IDS[service];
  return {
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: spec.info.title,
    description: spec.info.description,
    image: `${origin}/favicon.png`,
    services: [
      { name: "OpenAPI", endpoint: `${origin}/openapi.json`, version: spec.openapi },
      { name: "web", endpoint: "https://www.fretchen.eu" },
    ],
    x402Support: true,
    active: true,
    registrations:
      agentId === null
        ? []
        : [{ agentId, agentRegistry: `eip155:${REGISTRY.chainId}:${REGISTRY.address}` }],
    supportedTrust: ["reputation"],
  };
}
