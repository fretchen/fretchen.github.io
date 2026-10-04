/**
 * Registers the three x402 services (imagegen, llm, web) as ERC-8004 agents on Base and
 * clears the registry's default agentWallet.
 *
 * Usage (dry run is the default and sends nothing):
 *   npx hardhat run scripts/register-agents.ts --network baseSepolia            # simulate
 *   EXECUTE=true npx hardhat run scripts/register-agents.ts --network baseSepolia
 *   npx hardhat run scripts/register-agents.ts --network base                   # simulate
 *   EXECUTE=true npx hardhat run scripts/register-agents.ts --network base
 *
 * Rollout order:
 *   1. Run on baseSepolia first (EXECUTE). Testnet agentIds are NOT for production use.
 *   2. Run on base (EXECUTE): 6 transactions, permanent agentIds.
 *   3. Put the three mainnet agentIds from the result file into AGENT_IDS in
 *      scw_js/agent_registration.ts and redeploy scw_js. Each origin's
 *      /.well-known/agent-registration.json then lists its registration; check with curl that
 *      agentRegistry is eip155:8453:<registry>.
 *
 * Prerequisites:
 *   - The services serve /.well-known/agent-registration.json on their origins (scw_js).
 *   - CONTRACT_OWNER_PRIVATE_KEY in the Hardhat keystore (accounts[1] in hardhat.config.ts).
 *     The agents are owned by it, so it must hold a little ETH on the target network (about
 *     0.0005 ETH covers all six transactions on Base).
 *
 * Per service: register(agentURI), then unsetAgentWallet(agentId), then a read-back of
 * ownerOf / tokenURI / getAgentWallet that must match. The registry sets agentWallet to the
 * owner at registration, and the owner key never receives payments, so the default would
 * advertise the wrong payee. Clearing it makes no payee claim; the x402 payTo (NFT_WALLET) is
 * untouched. Binding payTo instead is setAgentWallet, which needs an EIP-712 signature from
 * that hot key and is deliberately not done here.
 *
 * Safety: the signer is checked against CONTRACT_OWNER_ADDRESS, the chain id against the
 * network, and the registry for code, before anything is sent. The result file
 * scripts/deployments/erc8004-agents-<network>.json is written after every registration, and
 * a service already in it is verified, not registered again, so re-running is safe. If a run
 * dies between a confirmed register() and the file write, the agentId was printed first and is
 * also in the Registered event of the tx.
 *
 * Gas: estimated on the public client (with 30% margin) because Hardhat's automatic gas
 * handler over-estimates with custom(provider) on external HTTP networks (see
 * transfer-ownership.ts).
 *
 * Registries: erc-8004-contracts README. Spec: EIP-8004.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import hre from "hardhat";
import type { ResolvedConfigurationVariable } from "hardhat/types";
import {
  createWalletClient,
  custom,
  getAddress,
  parseAbi,
  parseEventLogs,
  zeroAddress,
  type Address,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONTRACT_OWNER_ADDRESS = getAddress("0x1af51D6D7E0926f42d3595cBA2eE4218af5fBB20");
const MIN_BALANCE_WEI = 500_000_000_000_000n; // 0.0005 ETH, ample for 6 tx on Base

/** Identity Registries from the erc-8004-contracts README. */
const NETWORKS: Record<string, { chainId: number; registry: `0x${string}` }> = {
  baseSepolia: { chainId: 84532, registry: "0x8004A818BFB912233c491871b3d84c89A494BD9e" },
  base: { chainId: 8453, registry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" },
};

/** One per x402 origin. The file is served by scw_js (agent_registration.ts). */
export const SERVICES = {
  genimg: "https://imagegen-agent.fretchen.eu",
  llm: "https://llm-agent.fretchen.eu",
  search: "https://web-agent.fretchen.eu",
} as const;
export type Service = keyof typeof SERVICES;

export const agentUri = (service: Service) => `${SERVICES[service]}/.well-known/agent-registration.json`;

const REGISTRY_ABI = parseAbi([
  "function register(string agentURI) returns (uint256 agentId)",
  "function unsetAgentWallet(uint256 agentId)",
  "function getAgentWallet(uint256 agentId) view returns (address)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "event Registered(uint256 indexed agentId, string agentURI, address indexed owner)",
]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Re-reads until `accept` passes. Retries reverts too, since a lagging node reverts on a token it has not seen yet. */
async function poll<T>(
  read: () => Promise<T>,
  accept: (v: T) => boolean,
  what: string,
  tries: number,
  delayMs: number,
): Promise<T> {
  let last = "";
  for (let i = 0; i < tries; i++) {
    try {
      const value = await read();
      if (accept(value)) return value;
      last = `unexpected value ${String(value)}`;
    } catch (e) {
      last = e instanceof Error ? (e.message.split("\n")[0] ?? "") : String(e);
    }
    await sleep(delayMs);
  }
  throw new Error(`${what}: not as expected after ${tries} tries (last: ${last})`);
}

export interface RegisterOptions {
  publicClient: PublicClient;
  /** Must carry the signing account. */
  walletClient: WalletClient;
  registry: Address;
  chainId: number;
  /** The signer must be this address, or nothing is sent. */
  expectedOwner: Address;
  /** false = simulate only. */
  execute: boolean;
  /** Where registered ids are recorded between runs. */
  resultFile: string;
  network: string;
  pollTries?: number;
  pollDelayMs?: number;
  log?: (message: string) => void;
}

export interface RegisterResult {
  registered: Service[];
  cleared: Service[];
}

export async function registerAgents(options: RegisterOptions): Promise<RegisterResult> {
  const { publicClient, walletClient, registry, expectedOwner, execute, resultFile, network } = options;
  const { pollTries = 15, pollDelayMs = 2000, log = console.log } = options;
  const account = walletClient.account;
  if (!account) throw new Error("walletClient has no account");

  const chainId = await publicClient.getChainId();
  if (chainId !== options.chainId) {
    throw new Error(`Chain id ${chainId}, expected ${options.chainId} for ${network}`);
  }
  const code = await publicClient.getCode({ address: registry });
  if (!code || code === "0x") throw new Error(`No contract at ${registry} on ${network}`);
  if (getAddress(account.address) !== getAddress(expectedOwner)) {
    throw new Error(`Wrong signer: expected ${expectedOwner}, got ${account.address}`);
  }

  const balance = await publicClient.getBalance({ address: account.address });
  log(`Network:  ${network} (chain ${chainId})`);
  log(`Registry: ${registry}`);
  log(`Owner:    ${account.address}  balance ${balance} wei`);
  log(`Mode:     ${execute ? "EXECUTE (sends transactions)" : "dry run (simulation only)"}`);
  if (execute && balance < MIN_BALANCE_WEI) {
    throw new Error(`Owner balance below ${MIN_BALANCE_WEI} wei; fund it first`);
  }

  const done: Record<string, { agentId: string; registerTx: string }> = fs.existsSync(resultFile)
    ? JSON.parse(fs.readFileSync(resultFile, "utf8")).agents
    : {};

  const send = async (
    functionName: "register" | "unsetAgentWallet",
    args: readonly [string] | readonly [bigint],
  ): Promise<`0x${string}`> => {
    const request = { address: registry, abi: REGISTRY_ABI, functionName, args, account } as never;
    const estimate = await publicClient.estimateContractGas(request);
    const hash = await walletClient.writeContract({ ...(request as object), gas: (estimate * 13n) / 10n } as never);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status === "reverted") throw new Error(`${functionName} reverted (tx ${hash})`);
    return hash;
  };

  const result: RegisterResult = { registered: [], cleared: [] };

  for (const service of Object.keys(SERVICES) as Service[]) {
    const uri = agentUri(service);
    log(`\n== ${service}: ${uri}`);

    if (!done[service]) {
      if (!execute) {
        // simulateContract runs the call against current state without a transaction.
        const simulation = await publicClient.simulateContract({
          address: registry,
          abi: REGISTRY_ABI,
          functionName: "register",
          args: [uri],
          account,
        });
        log(`   would register; next agentId would be ${simulation.result}`);
        continue;
      }
      const hash = await send("register", [uri]);
      const receipt = await publicClient.getTransactionReceipt({ hash });
      const [event] = parseEventLogs({ abi: REGISTRY_ABI, eventName: "Registered", logs: receipt.logs });
      if (!event) throw new Error(`No Registered event in tx ${hash}`);
      const agentId = event.args.agentId;
      log(`   registered agentId ${agentId} (tx ${hash})`);
      done[service] = { agentId: agentId.toString(), registerTx: hash };
      result.registered.push(service);
      fs.mkdirSync(path.dirname(resultFile), { recursive: true });
      fs.writeFileSync(
        resultFile,
        JSON.stringify({ network, registry, owner: account.address, agents: done }, null, 2) + "\n",
      );
    } else {
      log(`   already registered as agentId ${done[service].agentId}`);
    }

    const agentId = BigInt(done[service].agentId);
    const base = { address: registry, abi: REGISTRY_ABI, args: [agentId] } as const;
    const readOwner = () => publicClient.readContract({ ...base, functionName: "ownerOf" });
    const readWallet = () => publicClient.readContract({ ...base, functionName: "getAgentWallet" });
    const readUri = () => publicClient.readContract({ ...base, functionName: "tokenURI" });

    // Public RPCs sit behind load balancers, and a read right after a receipt can land on a node
    // that is a block behind: ownerOf reverts with ERC721NonexistentToken and getAgentWallet
    // returns zero for a token it has not seen yet. ownerOf succeeding proves the node has the
    // registration, so wait for it before trusting any other read.
    await poll(readOwner, (o) => getAddress(o) === getAddress(expectedOwner), "ownerOf", pollTries, pollDelayMs);

    if ((await readWallet()) !== zeroAddress) {
      if (!execute) {
        log("   would clear the default agentWallet");
        continue;
      }
      const hash = await send("unsetAgentWallet", [agentId]);
      log(`   cleared default agentWallet (tx ${hash})`);
      result.cleared.push(service);
    }

    // Verify against the chain, not against what we just wrote.
    const wallet = await poll(readWallet, (w) => w === zeroAddress, "agentWallet cleared", pollTries, pollDelayMs);
    const tokenUri = await poll(readUri, (u) => u === uri, "tokenURI", pollTries, pollDelayMs);
    log(`   verify: owner ${expectedOwner}, tokenURI ${tokenUri}, agentWallet ${wallet} -> OK`);
  }

  if (execute) {
    log(`\nResult written to ${resultFile}`);
    log(
      network === "base"
        ? "Next: put these agentIds into AGENT_IDS (scw_js/agent_registration.ts) and redeploy."
        : "Testnet ids are NOT for AGENT_IDS.",
    );
  }
  return result;
}

async function main() {
  const connection = await hre.network.getOrCreate();
  const network = connection.networkName;
  const target = NETWORKS[network];
  if (!target) throw new Error(`Unsupported network ${network}; use baseSepolia or base`);

  const publicClient = await connection.viem.getPublicClient();

  // accounts[0] is SEPOLIA_PRIVATE_KEY, accounts[1] is CONTRACT_OWNER_PRIVATE_KEY (hardhat.config.ts).
  const accounts = connection.networkConfig.accounts;
  if (!Array.isArray(accounts) || accounts.length < 2) {
    throw new Error("Expected CONTRACT_OWNER_PRIVATE_KEY as the second configured account");
  }
  const privateKey = (await (accounts[1] as ResolvedConfigurationVariable).getHexString()) as `0x${string}`;
  const walletClient = createWalletClient({
    account: privateKeyToAccount(privateKey),
    transport: custom(connection.provider),
    chain: publicClient.chain,
  });

  await registerAgents({
    publicClient,
    walletClient,
    registry: target.registry,
    chainId: target.chainId,
    expectedOwner: CONTRACT_OWNER_ADDRESS,
    execute: process.env.EXECUTE === "true",
    resultFile: path.join(__dirname, "deployments", `erc8004-agents-${network}.json`),
    network,
  });
}

// `hardhat run` imports this file from inside the hardhat process (see export-abi.ts), so run
// main() only when this file is the script Hardhat was told to run, not when a test imports it.
const isMainModule = process.argv.slice(2).some((arg) => path.resolve(process.cwd(), arg) === __filename);

if (isMainModule) {
  main()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e.message ?? e);
      process.exit(1);
    });
}
