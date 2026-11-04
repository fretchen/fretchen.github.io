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
 * `endpoints`; `registrations` is `[]` until the agent has an id. The top-level `agent_type`,
 * `tags` and `categories` are standard-allowed extensions for indexer filtering; the OASF
 * entry points at the manifest this origin serves at `OASF_MANIFEST_PATH`, not the taxonomy
 * repo's human page.
 *
 * The llm and search agents (97599, 97600) moved to `bunny_js` — their registration files are
 * served by the bunny twins; this module now carries only the genimg agent this package serves.
 */

export type AgentService = "genimg";

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
};

/**
 * OASF v0.8.0 capabilities per service. Every slug is a path that exists under `schema/skills/`
 * or `schema/domains/` in agntcy/oasf at tag v0.8.0; 8004scan warns on unknown slugs, so check
 * the tree there before adding one. Each entry also carries the taxonomy class `id` the OASF
 * reference server (schema.oasf.outshift.com/0.8.0) assigns to that slug — composed as
 * category×10000 + subcategory×100 + leaf for 3-level paths, category×100 + leaf for 2-level
 * ones — which the OASF record served at `OASF_MANIFEST_PATH` needs (`{name, id}` items per
 * the OASF Record Guide, docs.agntcy.org/oasf/agent-record-guide).
 */
export interface OasfClass {
  name: string;
  id: number;
}

export const OASF: Record<AgentService, { skills: OasfClass[]; domains: OasfClass[] }> = {
  genimg: {
    skills: [
      { name: "multi_modal/image_processing/text_to_image", id: 70102 },
      { name: "images_computer_vision/image_generation", id: 206 },
      { name: "images_computer_vision/image_to_image", id: 210 },
    ],
    domains: [
      { name: "media_and_entertainment/content_creation", id: 1302 },
      { name: "media_and_entertainment/digital_media", id: 1303 },
    ],
  },
};

/** The mainnets every 402 here quotes; the payTo is the same address on both. */
const PAYMENT_CHAINS = [8453, 10] as const;

/** The taxonomy tree the OASF slugs are pinned to (checked per slug before adding one). */
export const OASF_SOURCE = "https://github.com/agntcy/oasf/tree/v0.8.0";

/**
 * Trust models the agent declares per EIP-8004: reputation (on-chain feedback, which it
 * accepts) and crypto-economic — the x402 per-call payments that anchor feedback signals
 * to real transactions, the EIP's own example of payments enriching trust.
 */
export const SUPPORTED_TRUST = ["reputation", "crypto-economic"] as const;

/**
 * Free-form discovery keywords per the 8004scan Agent Metadata Standard's extension allowance
 * ("MAY omit these fields or add custom extensions"). The indexer surfaces them as the `tags`
 * filter on capability queries, so they are short, lowercase, and service-specific.
 */
export const TAGS: Record<AgentService, string[]> = {
  genimg: ["image-generation", "text-to-image", "nft", "x402", "base"],
};

/**
 * The OASF families the service belongs to (the unique first segments of its skills and
 * domains) — the coarse browse axis next to the fine-grained slugs.
 */
export function oasfCategories(service: AgentService): string[] {
  return [
    ...new Set(OASF[service].domains.concat(OASF[service].skills).map((s) => s.name.split("/")[0])),
  ];
}

export const AGENT_REGISTRATION_PATH = ".well-known/agent-registration.json";

/**
 * The machine-readable OASF artifact this origin serves for its service. The EIP shows the
 * OASF service `endpoint` as a resolvable artifact (`ipfs://{cid}`), and the CID-addressed
 * artifact in OASF is the record — so this is a schema-valid OASF record, not a link to the
 * taxonomy repo's human page.
 */
export const OASF_MANIFEST_PATH = ".well-known/oasf.json";

/**
 * The record's own version, its creation time and its static author/locator fields, per the
 * OASF Record Guide's required fields. Three versions, deliberately distinct: `schema_version`
 * below is the OASF taxonomy schema; this `version` is the record document itself; the
 * service's OpenAPI `info.version` is neither — the record changes independently of the spec
 * (adding an OASF skill bumps this, not the spec), so it must NOT be derived from it.
 */
const RECORD_VERSION = "1.0.0";
const RECORD_CREATED_AT = "2026-11-03T20:19:30Z";
const RECORD_AUTHORS = ["Fretchen"];
const RECORD_LOCATORS = [
  { type: "source_code", url: "https://github.com/fretchen/fretchen.github.io" },
];

/**
 * The OASF record served at `OASF_MANIFEST_PATH`, per the OASF Record Guide
 * (docs.agntcy.org/oasf/agent-record-guide): required name/description/version/schema_version/
 * authors/created_at/skills, recommended domains and modules, optional locators. skills and
 * domains carry the `{name, id}` taxonomy items pinned in `OASF`; the registration file's OASF
 * entry keeps the bare slug strings, the shape the 8004scan profile expects there.
 */
export function buildOasfRecord(spec: OpenApiSource, service: AgentService) {
  const oasf = OASF[service];
  return {
    name: spec.info.title,
    description: spec.info.description,
    version: RECORD_VERSION,
    schema_version: "0.8.0",
    authors: RECORD_AUTHORS,
    created_at: RECORD_CREATED_AT,
    skills: oasf.skills,
    domains: oasf.domains,
    locators: RECORD_LOCATORS,
    modules: [] as unknown[],
    annotations: { taxonomy_tree: OASF_SOURCE },
  };
}

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
    agent_type: "service",
    tags: TAGS[service],
    categories: oasfCategories(service),
    services: [
      { name: "OpenAPI", endpoint: `${origin}/openapi.json`, version: spec.openapi },
      { name: "web", endpoint: "https://www.fretchen.eu" },
      {
        name: "OASF",
        endpoint: `${origin}/${OASF_MANIFEST_PATH}`,
        version: "0.8.0",
        skills: oasf.skills.map((s) => s.name),
        ...(oasf.domains.length > 0 ? { domains: oasf.domains.map((s) => s.name) } : {}),
      },
      ...wallets,
    ],
    x402Support: true,
    active: true,
    registrations:
      agentId === null
        ? []
        : [{ agentId, agentRegistry: `eip155:${REGISTRY.chainId}:${REGISTRY.address}` }],
    supportedTrust: SUPPORTED_TRUST,
  };
}
