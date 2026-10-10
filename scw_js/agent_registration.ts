/**
 * ERC-8004 agent registration file, built per x402 service from its committed OpenAPI spec.
 *
 * Served at `/.well-known/agent-registration.json` on each origin. That path is also the
 * on-chain `agentURI`, so the file doubles as the EIP's optional endpoint-domain proof.
 *
 * Shape: EIP-8004, "Agent URI and Agent Registration File", plus two services from the 8004scan
 * Agent Metadata Standard (best-practices.8004scan.io, 01-agent-metadata-standard): `OASF`
 * (capability taxonomy) and `agentWallet` (offchain copy of the payment wallet, which that
 * standard says an `x402Support: true` agent SHOULD declare). `services` replaced the draft-era
 * `endpoints`; `registrations` is `[]` until the agent has an id.
 */

export type AgentService = "genimg" | "llm" | "search";

/** Identity Registry on Base mainnet (erc-8004-contracts README). */
export const REGISTRY = {
  chainId: 8453,
  address: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
} as const;

/**
 * Agent ids in the Base mainnet Identity Registry (`REGISTRY`), from
 * `eth/scripts/deployments/erc8004-agents-base.json`. Owner: `0x1af51D…fBB20`. `null` = not registered.
 */
export const AGENT_IDS: Record<AgentService, number | null> = {
  genimg: 97598,
  llm: 97599,
  search: 97600,
};

/**
 * OASF v0.8.0 capabilities per service. Every slug is a path that exists under `schema/skills/`
 * or `schema/domains/` in agntcy/oasf at tag v0.8.0; 8004scan warns on unknown slugs, so check
 * the tree there before adding one.
 */
export const OASF: Record<AgentService, { skills: string[]; domains: string[] }> = {
  genimg: {
    skills: [
      "multi_modal/image_processing/text_to_image",
      "images_computer_vision/image_generation",
      "images_computer_vision/image_to_image",
    ],
    domains: ["media_and_entertainment/content_creation", "media_and_entertainment/digital_media"],
  },
  llm: {
    skills: [
      "natural_language_processing/natural_language_generation/dialogue_generation",
      "natural_language_processing/natural_language_generation/text_completion",
      "natural_language_processing/information_retrieval_synthesis/question_answering",
    ],
    domains: [],
  },
  search: {
    skills: [
      "natural_language_processing/information_retrieval_synthesis/search",
      "natural_language_processing/information_retrieval_synthesis/document_passage_retrieval",
    ],
    domains: [],
  },
};

/** The mainnets every 402 here quotes; the payTo is the same address on both. */
const PAYMENT_CHAINS = [8453, 10] as const;

export const AGENT_REGISTRATION_PATH = ".well-known/agent-registration.json";

/** The parts of a committed `openapi.*.json` this file is derived from. */
export interface OpenApiSource {
  info: { title: string; description: string };
  servers: { url: string }[];
  openapi: string;
}

/**
 * `payTo` is the address the service's 402 quotes (`NFT_WALLET_PUBLIC_KEY`). It is listed as an
 * `agentWallet` service per payment chain; when it is missing or malformed, the entries are left
 * out rather than publishing a wrong wallet. The registry's on-chain `agentWallet` stays the
 * authoritative value.
 */
export function buildAgentRegistration(spec: OpenApiSource, service: AgentService, payTo?: string) {
  const origin = spec.servers[0].url;
  const agentId = AGENT_IDS[service];
  const oasf = OASF[service];
  const wallets =
    payTo && /^0x[0-9a-fA-F]{40}$/.test(payTo)
      ? PAYMENT_CHAINS.map((chainId) => ({
          name: "agentWallet",
          endpoint: `eip155:${chainId}:${payTo}`,
        }))
      : [];
  return {
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: spec.info.title,
    description: spec.info.description,
    image: `${origin}/favicon.png`,
    services: [
      { name: "OpenAPI", endpoint: `${origin}/openapi.json`, version: spec.openapi },
      { name: "web", endpoint: "https://www.fretchen.eu" },
      {
        name: "OASF",
        endpoint: "https://github.com/agntcy/oasf/",
        version: "0.8.0",
        skills: oasf.skills,
        ...(oasf.domains.length > 0 ? { domains: oasf.domains } : {}),
      },
      ...wallets,
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
