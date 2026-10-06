/**
 * parseAgentRegistration maps the live EIP-8004 registration-v1 file (scw_js
 * agent_registration.ts) to what AgentInfoPanel shows. The old site-local copy used an
 * `endpoints` key and carried a wallet; the live file uses `services` and the wallet lives in
 * the registry, so these tests pin the new shape.
 */
import { describe, it, expect } from "vitest";
import { IMAGEGEN_AGENT_REGISTRATION_URL, parseAgentRegistration, type AgentRegistration } from "../hooks/useAgentInfo";

const file: AgentRegistration = {
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  name: "Fretchen AI Image Generation Service",
  description: "AI-powered image generation",
  image: "https://imagegen-agent.fretchen.eu/favicon.png",
  services: [
    { name: "OpenAPI", endpoint: "https://imagegen-agent.fretchen.eu/openapi.json", version: "3.1.0" },
    { name: "web", endpoint: "https://www.fretchen.eu" },
  ],
  registrations: [{ agentId: 97598, agentRegistry: "eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" }],
  supportedTrust: ["reputation"],
};

describe("parseAgentRegistration", () => {
  it("reads the agent id, registry, OpenAPI link and host from the live file", () => {
    const agent = parseAgentRegistration(file, IMAGEGEN_AGENT_REGISTRATION_URL);
    expect(agent).toMatchObject({
      name: "Fretchen AI Image Generation Service",
      agentId: 97598,
      agentRegistry: "eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
      registrationUrl: IMAGEGEN_AGENT_REGISTRATION_URL,
      endpointHost: "imagegen-agent.fretchen.eu",
      openApiUrl: "https://imagegen-agent.fretchen.eu/openapi.json",
      supportedTrust: ["reputation"],
    });
  });

  it("has no agent id while the file lists no registration", () => {
    const agent = parseAgentRegistration({ ...file, registrations: [] }, IMAGEGEN_AGENT_REGISTRATION_URL);
    expect(agent.agentId).toBeNull();
    expect(agent.agentRegistry).toBeNull();
  });

  it("reads from the agent's own origin, not a copy in this site", () => {
    expect(IMAGEGEN_AGENT_REGISTRATION_URL).toBe(
      "https://imagegen-agent.fretchen.eu/.well-known/agent-registration.json",
    );
  });
});
