/**
 * An in-memory EVM chain for hermetic tests that run the REAL code path.
 *
 * The mock boundary sits at the RPC client, not at our modules: `fakeViem()` keeps every
 * real viem export and replaces only `createPublicClient` / `createWalletClient`. So
 * x402_verify → facilitator_instance → @x402/evm's real verify/settle → x402_fee all execute
 * unmodified, and only the questions they ask the chain (getCode, eth_call, send, receipt)
 * are answered from `chain` below. Signature checks are real too: for an EOA payer the SDK
 * recovers the signer offline (ECDSA), so a forged or mismatched signature still fails.
 *
 * The fake models exactly the calls the SDK and x402_fee make — mapped by reading
 * @x402/evm's exact/eip3009 facilitator (verifyEIP3009, simulateEip3009TransferResult,
 * diagnoseEip3009SimulationFailure, executeTransferWithAuthorization,
 * verifyEip3009TransferEvent), its exact/permit2 facilitator (verifyPermit2,
 * simulatePermit2Settle[WithPermit], diagnosePermit2SimulationFailure, settlePermit2Direct,
 * settlePermit2WithEIP2612) and x402_fee's getContract reads/writes. A call it does not
 * model throws, so an SDK upgrade that starts asking the chain something new fails loudly
 * instead of being answered with a guess.
 *
 * Usage (vi.mock is hoisted, so the factory must import this module dynamically):
 *
 *     vi.mock("viem", async (importOriginal) => {
 *       const { fakeViem } = await import("./helpers/fakeChain");
 *       return fakeViem(await importOriginal<typeof import("viem")>());
 *     });
 *
 * This module deliberately has no runtime `import ... from "viem"`: it is loaded from inside
 * the viem mock factory, and a static import would resolve to the mock being built. Real viem
 * functions come in through `fakeViem(actual)` instead.
 */

import type * as Viem from "viem";
import {
  PERMIT2_ADDRESS,
  resetAssetContractCache,
  x402ExactPermit2ProxyABI,
  x402ExactPermit2ProxyAddress,
} from "@x402/evm";

type Address = `0x${string}`;
type Hex = `0x${string}`;

const MULTICALL3 = "0xca11bde05977b3631167028862be2a173976ca11";
const PERMIT2_PROXY = x402ExactPermit2ProxyAddress.toLowerCase();
// Any non-empty bytecode satisfies the SDK's asset-is-a-contract precheck.
const TOKEN_BYTECODE = "0x60806040";

/** The token surface the SDK and x402_fee touch, as one ABI for encoding/decoding. */
const TOKEN_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "version",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "nonces",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "authorizationState",
    stateMutability: "view",
    inputs: [
      { name: "authorizer", type: "address" },
      { name: "nonce", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

export interface WriteCall {
  address: Address;
  functionName: string;
  args: readonly unknown[];
  /** The wallet that sent it — lets tests tell the settlement from the fee pull. */
  from: Address;
}

interface TokenState {
  name: string;
  version: string;
  /** Set only for EIP-2612 tokens: the chain id their permit() domain is bound to. */
  permitChainId?: number;
}

/** The decoded arguments of the Permit2 proxy's settle / settleWithPermit. */
interface ProxySettle {
  permit: { permitted: { token: Address; amount: bigint }; nonce: bigint; deadline: bigint };
  owner: Address;
  witness: { to: Address; validAfter: bigint };
  permit2612?: { value: bigint; deadline: bigint; r: Hex; s: Hex; v: number };
}

interface Log {
  address: Address;
  topics: Hex[];
  data: Hex;
}

type Failure = "revert" | "revertOnChain" | "receiptTimeout" | "underpriced" | "rpcError";

const lc = (a: string) => a.toLowerCase();

/** Shared state. Reset it in `beforeEach` with `chain.reset()`. */
export const chain = {
  tokens: new Map<string, TokenState>(),
  balances: new Map<string, bigint>(),
  allowances: new Map<string, bigint>(),
  usedNonces: new Set<string>(),
  /** EIP-2612 nonces, per token and owner. */
  permitNonces: new Map<string, bigint>(),
  /** Permit2's signature-transfer nonces — per owner, across all tokens. */
  usedPermit2Nonces: new Set<string>(),
  receipts: new Map<string, Log[]>(),
  writes: [] as WriteCall[],
  failures: new Map<string, { failure: Failure; remaining: number }>(),
  timedOut: new Set<string>(),
  reverted: new Set<string>(),
  /** Every account a wallet client was created with — lets tests check how signers are built. */
  walletAccounts: [] as { address: Address; nonceManager?: unknown }[],

  reset() {
    this.tokens.clear();
    this.balances.clear();
    this.allowances.clear();
    this.usedNonces.clear();
    this.permitNonces.clear();
    this.usedPermit2Nonces.clear();
    this.receipts.clear();
    this.writes = [];
    this.walletAccounts = [];
    this.failures.clear();
    this.timedOut.clear();
    this.reverted.clear();
    // The SDK caches "this asset is a deployed contract" process-wide for 15 minutes, so
    // without this a token deployed in one test stays "deployed" in the next.
    resetAssetContractCache();
  },

  /**
   * Make the next `times` writes of `functionName` fail:
   * - "revert": `writeContract` throws, as viem does when gas estimation reverts — nothing
   *   is broadcast and no state changes.
   * - "revertOnChain": the tx is broadcast and mined but reverts — a hash exists, the receipt
   *   says `status: "reverted"`, and no state changes.
   * - "receiptTimeout": the tx is sent and takes effect, but waiting for its receipt throws
   *   viem's real `WaitForTransactionReceiptTimeoutError` — the "broadcast, outcome unknown"
   *   case.
   * - "underpriced": the node refuses the tx before it enters the mempool, as a load-balanced
   *   RPC did when a node that lagged behind handed out a nonce already in use — nothing is
   *   broadcast and no state changes.
   * - "rpcError": a transport failure with no word on whether the node took the tx. Nothing
   *   happens here, but the caller cannot know that — the case that must not be retried.
   *
   * `times` separates a transient failure (1) from one that holds on every attempt.
   */
  failNext(functionName: string, failure: Failure, times = 1) {
    this.failures.set(functionName, { failure, remaining: times });
  },

  /** Deploy a token: after this, getCode reports bytecode and name()/version() answer. */
  addToken(address: string, name: string, version = "2") {
    this.tokens.set(lc(address), { name, version });
  },
  /** Deploy an EIP-2612 token (EURe): permit() works, bound to `chainId`'s domain. */
  addPermitToken(address: string, name: string, version: string, chainId: number) {
    this.tokens.set(lc(address), { name, version, permitChainId: chainId });
  },
  permitNonce(token: string, owner: string) {
    return this.permitNonces.get(`${lc(token)}:${lc(owner)}`) ?? 0n;
  },
  setBalance(token: string, holder: string, amount: bigint) {
    this.balances.set(`${lc(token)}:${lc(holder)}`, amount);
  },
  balanceOf(token: string, holder: string) {
    return this.balances.get(`${lc(token)}:${lc(holder)}`) ?? 0n;
  },
  setAllowance(token: string, owner: string, spender: string, amount: bigint) {
    this.allowances.set(`${lc(token)}:${lc(owner)}:${lc(spender)}`, amount);
  },
  allowance(token: string, owner: string, spender: string) {
    return this.allowances.get(`${lc(token)}:${lc(owner)}:${lc(spender)}`) ?? 0n;
  },
  markNonceUsed(token: string, from: string, nonce: string) {
    this.usedNonces.add(`${lc(token)}:${lc(from)}:${lc(nonce)}`);
  },
  isNonceUsed(token: string, from: string, nonce: string) {
    return this.usedNonces.has(`${lc(token)}:${lc(from)}:${lc(nonce)}`);
  },
};

class Revert extends Error {
  constructor(reason: string) {
    super(`execution reverted: ${reason}`);
  }
}

function requireToken(address: string): TokenState {
  const token = chain.tokens.get(lc(address));
  if (!token) {
    throw new Revert(`no contract at ${address}`);
  }
  return token;
}

/** Answer a read-only call against a token. Throws `Revert` the way eth_call would. */
function readToken(address: string, functionName: string, args: readonly unknown[]): unknown {
  const token = requireToken(address);
  switch (functionName) {
    case "balanceOf":
      return chain.balanceOf(address, args[0] as string);
    case "allowance":
      return chain.allowance(address, args[0] as string, args[1] as string);
    case "name":
      return token.name;
    case "version":
      return token.version;
    case "nonces":
      return chain.permitNonce(address, args[0] as string);
    case "authorizationState":
      return chain.isNonceUsed(address, args[0] as string, args[1] as string);
    case "transferWithAuthorization": {
      // eth_call simulation — the SDK has already recovered the signature, so model the
      // state checks the real FiatToken makes.
      const [from, , value, , , nonce] = args as [string, string, bigint, bigint, bigint, string];
      if (chain.isNonceUsed(address, from, nonce)) {
        throw new Revert("FiatTokenV2: authorization is used or canceled");
      }
      if (chain.balanceOf(address, from) < value) {
        throw new Revert("ERC20: transfer amount exceeds balance");
      }
      return undefined;
    }
    default:
      throw new Error(`fakeChain: unmodelled read ${functionName} on ${address}`);
  }
}

export function fakeViem(actual: typeof Viem) {
  const {
    decodeFunctionData,
    encodeFunctionResult,
    encodeEventTopics,
    encodeAbiParameters,
    recoverTypedDataAddress,
    serializeSignature,
    WaitForTransactionReceiptTimeoutError,
  } = actual;

  let txCounter = 0;
  const nextHash = (): Hex => `0x${(++txCounter).toString(16).padStart(64, "0")}`;

  function transferLog(token: Address, from: string, to: string, value: bigint): Log {
    return {
      address: token,
      topics: encodeEventTopics({
        abi: TOKEN_ABI,
        eventName: "Transfer",
        args: { from: from as Address, to: to as Address },
      }) as Hex[],
      data: encodeAbiParameters([{ type: "uint256" }], [value]),
    };
  }

  /** Multicall3 tryAggregate — used by the SDK to diagnose a failed simulation. */
  function tryAggregate(calls: readonly { target: Address; callData: Hex }[]) {
    return calls.map(({ target, callData }) => {
      try {
        // The Permit2 diagnosis asks the proxy which Permit2 it uses — "is it deployed?".
        if (lc(target) === PERMIT2_PROXY) {
          const { functionName } = decodeFunctionData({
            abi: x402ExactPermit2ProxyABI,
            data: callData,
          });
          if (functionName !== "PERMIT2") {
            throw new Error(`fakeChain: unmodelled multicall ${functionName} on the proxy`);
          }
          return {
            success: true,
            returnData: encodeFunctionResult({
              abi: x402ExactPermit2ProxyABI,
              functionName: "PERMIT2",
              result: PERMIT2_ADDRESS,
            }),
          };
        }
        const { functionName, args } = decodeFunctionData({ abi: TOKEN_ABI, data: callData });
        const result = readToken(target, functionName, args ?? []);
        return {
          success: true,
          returnData: encodeFunctionResult({
            abi: TOKEN_ABI,
            functionName,
            // readToken answers every TOKEN_ABI view function with one of these.
            result: result as string | bigint | boolean,
          }),
        };
      } catch {
        return { success: false, returnData: "0x" };
      }
    });
  }

  function decodeProxySettle(functionName: string, args: readonly unknown[]): ProxySettle {
    if (functionName === "settle") {
      const [permit, owner, witness] = args as [
        ProxySettle["permit"],
        Address,
        ProxySettle["witness"],
      ];
      return { permit, owner, witness };
    }
    if (functionName === "settleWithPermit") {
      const [permit2612, permit, owner, witness] = args as [
        ProxySettle["permit2612"],
        ProxySettle["permit"],
        Address,
        ProxySettle["witness"],
      ];
      return { permit2612, permit, owner, witness };
    }
    throw new Error(`fakeChain: unmodelled proxy call ${functionName}`);
  }

  /**
   * The token's EIP-2612 permit(owner, Permit2, value, deadline, v, r, s): true when it would
   * succeed. The signature is recovered for real, against the token's own domain, so a permit
   * signed for the wrong name, version, chain or nonce fails here as it would on-chain.
   */
  async function permitSucceeds(
    token: Address,
    owner: Address,
    p: NonNullable<ProxySettle["permit2612"]>,
  ) {
    const state = chain.tokens.get(lc(token));
    if (!state?.permitChainId || p.deadline < BigInt(Math.floor(Date.now() / 1000))) {
      return false;
    }
    try {
      const signer = await recoverTypedDataAddress({
        domain: {
          name: state.name,
          version: state.version,
          chainId: state.permitChainId,
          verifyingContract: token,
        },
        types: {
          Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
          ],
        },
        primaryType: "Permit",
        message: {
          owner,
          spender: PERMIT2_ADDRESS,
          value: p.value,
          nonce: chain.permitNonce(token, owner),
          deadline: p.deadline,
        },
        signature: serializeSignature({ r: p.r, s: p.s, v: BigInt(p.v) }),
      });
      return lc(signer) === lc(owner);
    } catch {
      return false;
    }
  }

  /**
   * x402ExactPermit2Proxy.settle / settleWithPermit, modelled on the contract source
   * (coinbase/x402 contracts/evm/src/x402BasePermit2Proxy.sol): settleWithPermit first checks
   * the permit's value against the permitted amount, then TRIES the token's permit() and
   * carries on if it fails; _settle checks destination and validAfter, then Permit2's
   * permitWitnessTransferFrom checks deadline and nonce and pulls the tokens with its ERC-20
   * allowance. The Permit2 signature itself is not re-checked here: the SDK recovers it offline
   * before every simulation and write, exactly as for EIP-3009.
   *
   * `apply` false is the eth_call simulation: same checks, no state change.
   */
  async function proxySettle(functionName: string, args: readonly unknown[], apply: boolean) {
    const { permit, owner, witness, permit2612 } = decodeProxySettle(functionName, args);
    const token = permit.permitted.token;
    const amount = permit.permitted.amount;
    requireToken(token);

    let allowance = chain.allowance(token, owner, PERMIT2_ADDRESS);
    if (permit2612) {
      if (permit2612.value !== amount) {
        throw new Revert("Permit2612AmountMismatch()");
      }
      if (await permitSucceeds(token, owner, permit2612)) {
        allowance = permit2612.value;
        if (apply) {
          chain.permitNonces.set(`${lc(token)}:${lc(owner)}`, chain.permitNonce(token, owner) + 1n);
        }
      }
    }

    const now = BigInt(Math.floor(Date.now() / 1000));
    const nonceKey = `${lc(owner)}:${permit.nonce}`;
    if (witness.to === "0x0000000000000000000000000000000000000000") {
      throw new Revert("InvalidDestination()");
    }
    if (now < witness.validAfter) {
      throw new Revert("PaymentTooEarly()");
    }
    if (now > permit.deadline) {
      throw new Revert("SignatureExpired()");
    }
    if (chain.usedPermit2Nonces.has(nonceKey)) {
      throw new Revert("InvalidNonce()");
    }
    if (allowance < amount) {
      throw new Revert("TRANSFER_FROM_FAILED"); // Permit2's SafeTransferLib on a short allowance
    }
    if (chain.balanceOf(token, owner) < amount) {
      throw new Revert("TRANSFER_FROM_FAILED");
    }

    if (!apply) {
      return [];
    }
    chain.usedPermit2Nonces.add(nonceKey);
    chain.setAllowance(token, owner, PERMIT2_ADDRESS, allowance - amount);
    chain.setBalance(token, owner, chain.balanceOf(token, owner) - amount);
    chain.setBalance(token, witness.to, chain.balanceOf(token, witness.to) + amount);
    return [transferLog(token, owner, witness.to, amount)];
  }

  function createPublicClient() {
    return {
      async getCode({ address }: { address: Address }) {
        return chain.tokens.has(lc(address)) ? TOKEN_BYTECODE : "0x";
      },
      async readContract({
        address,
        functionName,
        args = [],
      }: {
        address: Address;
        functionName: string;
        args?: readonly unknown[];
      }) {
        if (lc(address) === MULTICALL3 && functionName === "tryAggregate") {
          return tryAggregate(args[1] as { target: Address; callData: Hex }[]);
        }
        if (lc(address) === PERMIT2_PROXY) {
          return proxySettle(functionName, args, false);
        }
        return readToken(address, functionName, args);
      },
      async verifyTypedData(): Promise<boolean> {
        // Only reached for contract (ERC-1271) payers; EOA payers are verified offline.
        throw new Error("fakeChain: ERC-1271 signature verification is not modelled");
      },
      async waitForTransactionReceipt({ hash }: { hash: Hex }) {
        if (chain.timedOut.has(hash)) {
          throw new WaitForTransactionReceiptTimeoutError({ hash });
        }
        if (chain.reverted.has(hash)) {
          return { status: "reverted" as const, transactionHash: hash, blockNumber: 1n, logs: [] };
        }
        const logs = chain.receipts.get(hash);
        if (!logs) {
          throw new Error(`fakeChain: unknown transaction ${hash}`);
        }
        return { status: "success" as const, transactionHash: hash, blockNumber: 1n, logs };
      },
    };
  }

  function createWalletClient({
    account,
  }: {
    account: { address: Address; nonceManager?: unknown };
  }) {
    chain.walletAccounts.push(account);
    return {
      account,
      async writeContract({
        address,
        functionName,
        args = [],
      }: {
        address: Address;
        functionName: string;
        args?: readonly unknown[];
      }) {
        if (lc(address) !== PERMIT2_PROXY) {
          requireToken(address);
        }
        const sender = account.address;
        const pending = chain.failures.get(functionName);
        if (pending && --pending.remaining <= 0) {
          chain.failures.delete(functionName);
        }
        const failure = pending?.failure;
        if (failure === "revert") {
          throw new Revert(`${functionName} (injected by chain.failNext)`);
        }
        if (failure === "underpriced") {
          throw new Error("replacement transaction underpriced");
        }
        if (failure === "rpcError") {
          throw new Error("fetch failed");
        }
        if (failure === "revertOnChain") {
          // Mined, but nothing happened: record the attempt, change no state.
          chain.writes.push({ address, functionName, args, from: sender });
          const hash = nextHash();
          chain.reverted.add(hash);
          return hash;
        }
        let logs: Log[];

        if (lc(address) === PERMIT2_PROXY) {
          logs = await proxySettle(functionName, args, true);
        } else if (functionName === "transferWithAuthorization") {
          readToken(address, functionName, args); // same checks as the simulation
          const [from, to, value, , , nonce] = args as [
            string,
            string,
            bigint,
            bigint,
            bigint,
            string,
          ];
          chain.markNonceUsed(address, from, nonce);
          chain.setBalance(address, from, chain.balanceOf(address, from) - value);
          chain.setBalance(address, to, chain.balanceOf(address, to) + value);
          logs = [transferLog(address, from, to, value)];
        } else if (functionName === "transferFrom") {
          const [from, to, value] = args as [string, string, bigint];
          const allowed = chain.allowance(address, from, sender);
          if (allowed < value) {
            throw new Revert("ERC20: insufficient allowance");
          }
          if (chain.balanceOf(address, from) < value) {
            throw new Revert("ERC20: transfer amount exceeds balance");
          }
          chain.setAllowance(address, from, sender, allowed - value);
          chain.setBalance(address, from, chain.balanceOf(address, from) - value);
          chain.setBalance(address, to, chain.balanceOf(address, to) + value);
          logs = [transferLog(address, from, to, value)];
        } else {
          throw new Error(`fakeChain: unmodelled write ${functionName} on ${address}`);
        }

        chain.writes.push({ address, functionName, args, from: sender });
        const hash = nextHash();
        chain.receipts.set(hash, logs);
        if (failure === "receiptTimeout") {
          chain.timedOut.add(hash);
        }
        return hash;
      },
      async sendTransaction(): Promise<Hex> {
        throw new Error("fakeChain: raw sendTransaction is not modelled");
      },
    };
  }

  return { ...actual, createPublicClient, createWalletClient };
}
