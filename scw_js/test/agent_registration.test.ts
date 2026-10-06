/**
 * Pins the registration file to the EIP-8004 text ("Agent URI and Agent Registration File").
 * The EIP publishes no JSON Schema, so these assertions are the checkable form of its MUSTs.
 * Registry address: erc-8004-contracts README, Base mainnet Identity Registry.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { AGENT_IDS, OASF, REGISTRY, buildAgentRegistration } from "../agent_registration.js";
import genimgSpec from "../openapi.genimg.json" with { type: "json" };
import llmSpec from "../openapi.llm.json" with { type: "json" };
import searchSpec from "../openapi.search.json" with { type: "json" };

const SERVICES = [
  { service: "genimg", spec: genimgSpec, origin: "https://imagegen-agent.fretchen.eu" },
  { service: "llm", spec: llmSpec, origin: "https://llm-agent.fretchen.eu" },
  { service: "search", spec: searchSpec, origin: "https://web-agent.fretchen.eu" },
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
    expect(
      Object.fromEntries(Object.entries(recorded.agents).map(([k, v]) => [k, Number(v.agentId)])),
    ).toEqual(AGENT_IDS);
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
      expect(file.supportedTrust).toEqual(["reputation"]);
    });
  });

  /**
   * 8004scan Agent Metadata Standard: an OASF service names the taxonomy repo and a semver
   * version, and carries at least one of skills/domains as `category/.../leaf` slugs.
   */
  describe.each(SERVICES)("$service OASF", ({ service, spec }) => {
    const oasf = buildAgentRegistration(spec, service).services.find((s) => s.name === "OASF") as
      | { endpoint: string; version: string; skills: string[]; domains?: string[] }
      | undefined;

    it("declares an OASF v0.8.0 service with skills from the pinned map", () => {
      expect(oasf?.endpoint).toBe("https://github.com/agntcy/oasf/");
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
    });
  });

  it("omits an empty domains list instead of publishing []", () => {
    const oasf = buildAgentRegistration(llmSpec, "llm").services.find((s) => s.name === "OASF");
    expect(oasf).not.toHaveProperty("domains");
  });

  describe("agentWallet (x402Support: true SHOULD declare one)", () => {
    const PAY_TO = "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C";
    const wallets = (payTo?: string) =>
      buildAgentRegistration(searchSpec, "search", payTo).services.filter(
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
    const original = AGENT_IDS.llm;
    AGENT_IDS.llm = null;
    try {
      expect(buildAgentRegistration(llmSpec, "llm").registrations).toEqual([]);
    } finally {
      AGENT_IDS.llm = original;
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
