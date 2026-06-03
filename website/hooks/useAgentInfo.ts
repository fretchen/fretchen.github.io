import { useQuery } from "@tanstack/react-query";

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

const parseCAIP10 = (caip10: string): string | null => {
  const parts = caip10.split(":");
  return parts.length === 3 ? parts[2] : null;
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

async function fetchAgentInfo(agentUrl: string): Promise<AgentInfo> {
  const response = await fetch(agentUrl);
  if (!response.ok) throw new Error(`Failed to fetch agent registration: ${response.status}`);
  const data = (await response.json()) as AgentRegistration;

  const walletEndpoint = data.endpoints.find((e) => e.name === "agentWallet")?.endpoint;
  const wallet = walletEndpoint ? parseCAIP10(walletEndpoint) : null;

  return {
    name: data.name,
    description: data.description,
    image: data.image,
    wallet,
    walletShort: wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : null,
    genimgEndpoint: data.endpoints.find((e) => e.name === "genimg")?.endpoint ?? null,
    llmEndpoint: data.endpoints.find((e) => e.name === "llm")?.endpoint ?? null,
    openApiUrl: data.endpoints.find((e) => e.name === "OpenAPI")?.endpoint ?? null,
    supportedTrust: data.supportedTrust,
    raw: data,
  };
}

export function useAgentInfo(options: UseAgentInfoOptions = {}): UseAgentInfoResult {
  const { agentUrl = DEFAULT_AGENT_URL, autoFetch = true } = options;

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
    agent: data ?? emptyAgent,
    isLoading: isPending && autoFetch,
    error: isError ? (queryError instanceof Error ? queryError.message : "Unknown error fetching agent") : null,
    refetch: async () => {
      await refetch();
    },
  };
}

export default useAgentInfo;
