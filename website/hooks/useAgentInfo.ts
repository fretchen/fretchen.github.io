/**
 * Hook to load and parse EIP-8004 agent registration data.
 *
 * Fetches the agent-registration.json from the public folder and provides
 * parsed data for display in the UI.
 *
 * This approach allows for:
 * 1. Same workflow as loading external agent registrations
 * 2. Easy migration to IPFS/S3 later
 * 3. No build-time coupling
 */

import { useState, useEffect, useCallback } from "react";

// EIP-8004 Registration File Schema
export interface AgentEndpoint {
  name: string;
  endpoint: string;
  version?: string;
}

export interface AgentRegistration {
  type: string;
  name: string;
  description: string;
  image: string;
  endpoints: AgentEndpoint[];
  registrations: Array<{
    agentId: number;
    agentRegistry: string;
  }>;
  supportedTrust: string[];
}

// Parsed agent info for UI display
export interface AgentInfo {
  name: string;
  description: string;
  image: string;
  wallet: string | null;
  walletShort: string | null;
  genimgEndpoint: string | null;
  llmEndpoint: string | null;
  openApiUrl: string | null;
  supportedTrust: string[];
  raw: AgentRegistration | null;
}

// Parse CAIP-10 address format: eip155:chainId:address
const parseCAIP10 = (caip10: string): string | null => {
  const parts = caip10.split(":");
  if (parts.length === 3) {
    return parts[2]; // Return just the address
  }
  return null;
};

const DEFAULT_AGENT_URL = "/agent-registration.json";

export interface UseAgentInfoOptions {
  agentUrl?: string;
  autoFetch?: boolean;
}

export interface UseAgentInfoResult {
  agent: AgentInfo;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const emptyAgent: AgentInfo = {
  name: "",
  description: "",
  image: "",
  wallet: null,
  walletShort: null,
  genimgEndpoint: null,
  llmEndpoint: null,
  openApiUrl: null,
  supportedTrust: [],
  raw: null,
};

export function useAgentInfo(options: UseAgentInfoOptions = {}): UseAgentInfoResult {
  const { agentUrl = DEFAULT_AGENT_URL, autoFetch = true } = options;

  const [agent, setAgent] = useState<AgentInfo>(emptyAgent);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgent = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(agentUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch agent registration: ${response.status}`);
      }

      const data: AgentRegistration = await response.json();

      // Parse endpoints
      const walletEndpoint = data.endpoints.find((e) => e.name === "agentWallet")?.endpoint;
      const wallet = walletEndpoint ? parseCAIP10(walletEndpoint) : null;

      const parsedAgent: AgentInfo = {
        name: data.name,
        description: data.description,
        image: data.image,
        wallet,
        walletShort: wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : null,
        genimgEndpoint: data.endpoints.find((e) => e.name === "genimg")?.endpoint || null,
        llmEndpoint: data.endpoints.find((e) => e.name === "llm")?.endpoint || null,
        openApiUrl: data.endpoints.find((e) => e.name === "OpenAPI")?.endpoint || null,
        supportedTrust: data.supportedTrust,
        raw: data,
      };

      setAgent(parsedAgent);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error fetching agent";
      setError(message);
      console.error("Agent fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [agentUrl]);

  useEffect(() => {
    if (autoFetch) {
      fetchAgent();
    }
  }, [autoFetch, fetchAgent]);

  return {
    agent,
    isLoading,
    error,
    refetch: fetchAgent,
  };
}

export default useAgentInfo;
