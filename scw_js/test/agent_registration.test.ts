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

  it("lists the ids registered on Base mainnet (eth/scripts/deployments/erc8004-agents-base.json)", () => {
    expect(AGENT_IDS).toEqual({ genimg: 97598, llm: 97599, search: 97600 });
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
