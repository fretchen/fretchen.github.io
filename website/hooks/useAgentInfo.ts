import { useQuery } from "@tanstack/react-query";

/**
 * The image generation agent's ERC-8004 registration file, served live by the agent itself
 * (scw_js `agent_registration.ts`), not a copy in this site's `public/`.
 */
export const IMAGEGEN_AGENT_REGISTRATION_URL = "https://imagegen-agent.fretchen.eu/.well-known/agent-registration.json";

export interface AgentService {
  name: string;
  endpoint: string;
  version?: string;
}

/** EIP-8004 registration-v1, the fields this site reads. */
export interface AgentRegistration {
  type: string;
  name: string;
  description: string;
  image: string;
  services: AgentService[];
  registrations: Array<{
    agentId: number;
    agentRegistry: string;
  }>;
  supportedTrust: string[];
}

export interface AgentInfo {
  name: string;
  description: string;
  image: string;
  /** Id in the ERC-8004 Identity Registry; null while the file lists no registration. */
  agentId: number | null;
  /** `eip155:<chainId>:<registry address>`, or null alongside `agentId`. */
  agentRegistry: string | null;
  /** Where the registration file was read from — the link the panel shows. */
  registrationUrl: string;
  /** Hostname of the agent's origin, from the registration file's own URL. */
  endpointHost: string | null;
  openApiUrl: string | null;
  supportedTrust: string[];
  raw: AgentRegistration | null;
}

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

const emptyAgent = (registrationUrl: string): AgentInfo => ({
  name: "",
  description: "",
  image: "",
  agentId: null,
  agentRegistry: null,
  registrationUrl,
  endpointHost: null,
  openApiUrl: null,
  supportedTrust: [],
  raw: null,
});

/** Maps a registration file to what the panel shows. Pure, so it is tested without fetch. */
export function parseAgentRegistration(data: AgentRegistration, registrationUrl: string): AgentInfo {
  const registration = data.registrations?.[0];
  let endpointHost: string | null = null;
  try {
    endpointHost = new URL(registrationUrl).hostname;
  } catch {
    // A relative URL has no host of its own; leave it out of the panel.
  }
  return {
    name: data.name,
    description: data.description,
    image: data.image,
    agentId: registration?.agentId ?? null,
    agentRegistry: registration?.agentRegistry ?? null,
    registrationUrl,
    endpointHost,
    openApiUrl: data.services?.find((s) => s.name === "OpenAPI")?.endpoint ?? null,
    supportedTrust: data.supportedTrust ?? [],
    raw: data,
  };
}

async function fetchAgentInfo(agentUrl: string): Promise<AgentInfo> {
  const response = await fetch(agentUrl);
  if (!response.ok) throw new Error(`Failed to fetch agent registration: ${response.status}`);
  return parseAgentRegistration((await response.json()) as AgentRegistration, agentUrl);
}

export function useAgentInfo(options: UseAgentInfoOptions = {}): UseAgentInfoResult {
  const { agentUrl = IMAGEGEN_AGENT_REGISTRATION_URL, autoFetch = true } = options;

  const {
    data,
    isPending,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["agentInfo", agentUrl],
    queryFn: () => fetchAgentInfo(agentUrl),
    enabled: autoFetch,
    staleTime: Infinity,
  });

  return {
    agent: data ?? emptyAgent(agentUrl),
    isLoading: isPending && autoFetch,
    error: isError ? (queryError instanceof Error ? queryError.message : "Unknown error fetching agent") : null,
    refetch: async () => {
      await refetch();
    },
  };
}

export default useAgentInfo;
