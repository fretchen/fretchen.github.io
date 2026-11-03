/**
 * Pins the registration file to the EIP-8004 text ("Agent URI and Agent Registration File").
 * The EIP publishes no JSON Schema, so these assertions are the checkable form of its MUSTs.
 * Registry address: erc-8004-contracts README, Base mainnet Identity Registry.
 *
 * The llm (97599) and search (97600) agents keep their on-chain identities and registration
 * files, but those are served by the bunny_js twins now — this package serves only genimg.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  AGENT_IDS,
  OASF,
  OASF_MANIFEST_PATH,
  OASF_SOURCE,
  REGISTRY,
  SUPPORTED_TRUST,
  TAGS,
  buildAgentRegistration,
  buildOasfManifest,
  oasfCategories,
} from "../agent_registration.js";
import genimgSpec from "../openapi.genimg.json" with { type: "json" };

const SERVICES = [
  { service: "genimg", spec: genimgSpec, origin: "https://imagegen-agent.fretchen.eu" },
] as const;

describe("agent registration file (EIP-8004)", () => {
  it("uses the Base mainnet Identity Registry from the contracts README", () => {
    expect(REGISTRY.chainId).toBe(8453);
    expect(REGISTRY.address).toBe("0x8004A169FB4a3325136EB29fA0ceB6D2e539a432");
  });

  it("lists the ids recorded by the registration script on Base mainnet", () => {
    const recorded = JSON.parse(
      readFileSync(
        fileURLToPath(
          new URL("../../eth/scripts/deployments/erc8004-agents-base.json", import.meta.url),
        ),
        "utf8",
      ),
    ) as { registry: string; agents: Record<string, { agentId: string }> };

    expect(recorded.registry).toBe(REGISTRY.address);
    // The deployments file also carries the llm/search agents (served by bunny_js now) —
    // every id this package publishes must match what the registration script recorded.
    for (const [service, id] of Object.entries(AGENT_IDS)) {
      expect(Number(recorded.agents[service].agentId)).toBe(id);
    }
  });

  describe.each(SERVICES)("$service", ({ service, spec, origin }) => {
    const file = buildAgentRegistration(spec, service);

    it("carries the exact registration-v1 type", () => {
      expect(file.type).toBe("https://eips.ethereum.org/EIPS/eip-8004#registration-v1");
    });

    it("takes name and description from the OpenAPI spec", () => {
      expect(file.name).toBe(spec.info.title);
      expect(file.description).toBe(spec.info.description);
    });

    it("uses `services`, not the draft-era `endpoints`, with a name and endpoint each", () => {
      expect(file).not.toHaveProperty("endpoints");
      expect(file.services.length).toBeGreaterThan(0);
      for (const s of file.services) {
        expect(typeof s.name).toBe("string");
        expect(typeof s.endpoint).toBe("string");
      }
    });

    it("keeps image and OpenAPI endpoint on the service origin", () => {
      expect(file.image).toBe(`${origin}/favicon.png`);
      expect(file.services[0]).toEqual({
        name: "OpenAPI",
        endpoint: `${origin}/openapi.json`,
        version: "3.1.0",
      });
    });

    it("declares x402 support and its registration in the Base mainnet registry", () => {
      expect(file.x402Support).toBe(true);
      expect(file.active).toBe(true);
      expect(file.registrations).toEqual([
        { agentId: AGENT_IDS[service], agentRegistry: `eip155:8453:${REGISTRY.address}` },
      ]);
      // Both trust models: reputation (on-chain feedback) plus the crypto-economic x402
      // payments that anchor feedback to real transactions.
      expect(file.supportedTrust).toEqual(["reputation", "crypto-economic"]);
    });

    it("carries the discovery fields the indexer filters on", () => {
      expect(file.agent_type).toBe("service");
      expect(file.tags).toEqual(TAGS[service]);
      expect(file.categories).toEqual(oasfCategories(service));
      expect(file.categories.length).toBeGreaterThan(0);
    });
  });

  /**
   * 8004scan Agent Metadata Standard: an OASF service names the taxonomy repo and a semver
   * version, and carries at least one of skills/domains as `category/.../leaf` slugs.
   */
  describe.each(SERVICES)("$service OASF", ({ service, spec, origin }) => {
    const oasf = buildAgentRegistration(spec, service).services.find((s) => s.name === "OASF") as
      { endpoint: string; version: string; skills: string[]; domains?: string[] } | undefined;

    it("declares an OASF v0.8.0 service with skills from the pinned map", () => {
      // The endpoint resolves to this origin's machine-readable manifest, not the taxonomy
      // repo's human page (the EIP shows the OASF endpoint as a resolvable manifest).
      expect(oasf?.endpoint).toBe(`${origin}/${OASF_MANIFEST_PATH}`);
      expect(oasf?.version).toBe("0.8.0");
      expect(oasf?.skills).toEqual(OASF[service].skills);
      expect(oasf?.skills.length).toBeGreaterThan(0);
    });

    it("uses slash-separated lowercase slugs only", () => {
      for (const slug of [...(oasf?.skills ?? []), ...(oasf?.domains ?? [])]) {
        expect(slug).toMatch(/^[a-z0-9_]+(\/[a-z0-9_]+)+$/);
      }
    });
  });

  it("pins the OASF capabilities per service (each slug checked against agntcy/oasf v0.8.0)", () => {
    expect(OASF).toEqual({
      genimg: {
        skills: [
          "multi_modal/image_processing/text_to_image",
          "images_computer_vision/image_generation",
          "images_computer_vision/image_to_image",
        ],
        domains: [
          "media_and_entertainment/content_creation",
          "media_and_entertainment/digital_media",
        ],
      },
    });
  });

  it("serves a machine-readable OASF manifest at the OASF entry's endpoint", () => {
    const manifest = buildOasfManifest("genimg");
    expect(manifest).toEqual({
      name: "OASF",
      version: "0.8.0",
      source: OASF_SOURCE,
      skills: OASF.genimg.skills,
      domains: OASF.genimg.domains,
    });
    // The `source` pins the tree the slugs came from; it lives here, not in the registration
    // file, whose OASF entry stays strictly profile-shaped.
    expect(manifest.source).toBe("https://github.com/agntcy/oasf/tree/v0.8.0");
    expect(OASF_MANIFEST_PATH).toBe(".well-known/oasf.json");
  });

  it("derives categories from the OASF taxonomy roots and tags from the pinned map", () => {
    // Roots of domains first, then skills: genimg spans three OASF category families.
    expect(oasfCategories("genimg")).toEqual([
      "media_and_entertainment",
      "multi_modal",
      "images_computer_vision",
    ]);
    expect(TAGS.genimg).toEqual(["image-generation", "text-to-image", "nft", "x402", "base"]);
    expect(SUPPORTED_TRUST).toEqual(["reputation", "crypto-economic"]);
  });

  describe("agentWallet (x402Support: true SHOULD declare one)", () => {
    const PAY_TO = "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C";
    const wallets = (payTo?: string) =>
      buildAgentRegistration(genimgSpec, "genimg", payTo).services.filter(
        (s) => s.name === "agentWallet",
      );

    it("lists the payTo as CAIP-10 on Base and Optimism", () => {
      expect(wallets(PAY_TO)).toEqual([
        { name: "agentWallet", endpoint: `eip155:8453:${PAY_TO}` },
        { name: "agentWallet", endpoint: `eip155:10:${PAY_TO}` },
      ]);
    });

    it("leaves the wallet out rather than publishing a missing or malformed one", () => {
      expect(wallets(undefined)).toEqual([]);
      expect(wallets("")).toEqual([]);
      expect(wallets("not-an-address")).toEqual([]);
    });
  });

  it("claims no registration for a service without an id", () => {
    const original = AGENT_IDS.genimg;
    AGENT_IDS.genimg = null;
    try {
      expect(buildAgentRegistration(genimgSpec, "genimg").registrations).toEqual([]);
    } finally {
      AGENT_IDS.genimg = original;
    }
  });

  it("formats a registration as {agentId: number, agentRegistry: eip155:<chain>:<address>}", () => {
    for (const { service, spec } of SERVICES) {
      const { registrations } = buildAgentRegistration(spec, service);
      expect(registrations).toHaveLength(1);
      expect(Object.keys(registrations[0]).sort()).toEqual(["agentId", "agentRegistry"]);
      expect(typeof registrations[0].agentId).toBe("number");
      expect(registrations[0].agentRegistry).toMatch(/^eip155:\d+:0x[0-9a-fA-F]{40}$/);
    }
  });
});
