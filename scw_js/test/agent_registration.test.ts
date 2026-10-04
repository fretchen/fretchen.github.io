/**
 * Pins the registration file to the EIP-8004 text ("Agent URI and Agent Registration File").
 * The EIP publishes no JSON Schema, so these assertions are the checkable form of its MUSTs.
 * Registry address: erc-8004-contracts README, Base mainnet Identity Registry.
 */
import { describe, it, expect } from "vitest";
import { AGENT_IDS, REGISTRY, buildAgentRegistration } from "../agent_registration.js";
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

  it("starts with no agent ids, so no registrations are claimed", () => {
    expect(Object.values(AGENT_IDS)).toEqual([null, null, null]);
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

    it("declares x402 support and an empty registrations list while unregistered", () => {
      expect(file.x402Support).toBe(true);
      expect(file.active).toBe(true);
      expect(file.registrations).toEqual([]);
      expect(file.supportedTrust).toEqual(["reputation"]);
    });
  });

  it("formats a filled registration as {agentId: number, agentRegistry: eip155:<chain>:<address>}", () => {
    AGENT_IDS.llm = 42;
    try {
      const { registrations } = buildAgentRegistration(llmSpec, "llm");
      expect(registrations).toHaveLength(1);
      expect(Object.keys(registrations[0]).sort()).toEqual(["agentId", "agentRegistry"]);
      expect(registrations[0].agentId).toBe(42);
      expect(registrations[0].agentRegistry).toMatch(/^eip155:\d+:0x[0-9a-fA-F]{40}$/);
      expect(registrations[0].agentRegistry).toBe(`eip155:8453:${REGISTRY.address}`);
    } finally {
      AGENT_IDS.llm = null;
    }
  });
});
