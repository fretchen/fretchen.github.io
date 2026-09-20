import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { buildUsdcAllowedAssets } from "../hooks/x402SpendControls";
// Type-only import — erased at compile time, so no @x402 runtime is pulled into SSR.
import type {
  ClientChannelStorage,
  BatchSettlementClientContext,
  BatchSettlementDepositStrategyContext,
} from "@x402/evm/batch-settlement/client";

/**
 * One x402 batch-settlement payment channel, as a `fetch`.
 *
 * Lifted out of `useX402Chat.ts`, which built all of this inline, because the chat is no longer
 * the only thing that spends: `/assistent`'s `search_web` and `fetch_url` tools bill onto the
 * **same channel** (`scw_js/search_api.ts` sells as the same receiver, and `computeChannelId`
 * hashes payer, payerAuthorizer, receiver, receiverAuthorizer, token, withdrawDelay and salt — so
 * same wallet plus same voucher signer plus same receiver means the same channel, already funded).
 *
 * React-free, so the tool modules can be handed a paid fetch without importing a hook.
 */

/**
 * Client-side `ClientChannelStorage` backed by the Web Storage API. Persists channel
 * state to `localStorage` so an open channel survives a page reload (the browser
 * equivalent of the notebook's file/localStorage storage). Channel context is all
 * strings, so plain JSON round-trips cleanly.
 */
export class WebStorageClientChannelStorage implements ClientChannelStorage {
  /**
   * `network` is ours, not the SDK's: every record is tagged with the chain it belongs to, because
   * without that a zero on-chain balance is ambiguous — see `resyncFromChain`. Optional so a caller
   * that only reads (and the storage's own unit tests) can leave it out.
   */
  constructor(
    private backend: Storage,
    private network?: string,
    private prefix = "x402-channel:",
  ) {}
  private keyFor(key: string) {
    return `${this.prefix}${key.toLowerCase()}`;
  }
  get(key: string): Promise<BatchSettlementClientContext | undefined> {
    const raw = this.backend.getItem(this.keyFor(key));
    if (!raw) {
      return Promise.resolve(undefined);
    }
    // The tag is stripped on the way out, so what the SDK sees is exactly the context it wrote.
    const stored = JSON.parse(raw) as Record<string, unknown>;
    delete stored.network;
    return Promise.resolve(stored as BatchSettlementClientContext);
  }
  set(key: string, context: BatchSettlementClientContext): Promise<void> {
    this.backend.setItem(this.keyFor(key), JSON.stringify({ ...context, network: this.network }));
    return Promise.resolve();
  }
  delete(key: string): Promise<void> {
    this.backend.removeItem(this.keyFor(key));
    return Promise.resolve();
  }
  /**
   * Re-read every cached channel's true state from the chain.
   *
   * This replaces a `forceDeposit()` that set `balance: "0"` to make the SDK deposit again.
   * That was a one-way door. `BatchSettlementEvmScheme.createPaymentPayload` decides from
   * `balance` on THIS record and never from the chain, and the SDK's only writer for it,
   * `updateChannelFromSettle`, is **additive** — `balance = previous.balance + depositAmount`.
   * The server's settle response carries a cumulative charge, never an absolute balance, so
   * nothing could ever restore a zeroed figure. Meanwhile `maxClaimableAmount` stayed
   * lifetime-absolute, so the zeroed record kept losing the comparison and every message
   * signed a fresh $0.50 deposit. That locked ~$7.40 of escrow across 15 deposits against
   * ~$0.10 of real usage.
   *
   * Reading the chain puts `balance` back in the same coordinate system as
   * `maxClaimableAmount`, which is the whole bug.
   *
   * `chargedCumulativeAmount` keeps the local value when it is ahead. This deliberately
   * differs from the SDK's `recoverChannel`, which resets it to the on-chain `totalClaimed`:
   * settlement here is batched by `scw_js/llm_x402_cron.ts`, so `totalClaimed` legitimately
   * lags the server's cumulative, and adopting the lagging figure makes the client sign a
   * voucher below the server's state and collect `cumulative_amount_mismatch`. Floor it at
   * the chain's `totalClaimed` regardless, since a cumulative below that is never valid.
   *
   * **A zero on-chain balance is left alone**, deliberately. It reads as "this channel was opened
   * on another chain", which every network's records sharing one localStorage namespace makes the
   * normal case — and overwriting it would strand that escrow. The network tag below narrows this
   * further: another chain's record is skipped before an RPC read is even spent on it.
   *
   * This briefly deleted such records instead, on the theory that a zero meant the record was
   * fiction. It was the wrong way round. The case that prompted it — a chat refusing every request
   * with `cumulative_exceeds_balance` — turned out to be the *server's* cached balance reading 0
   * while the chain held 544239 and this record said so correctly. The client has been right each
   * time it has been checked; `scw_js/x402_channel_sync.ts` documents why the server's copy drifts.
   */
  async resyncFromChain(read: (channelId: `0x${string}`) => Promise<readonly [bigint, bigint]>): Promise<void> {
    for (let i = 0; i < this.backend.length; i++) {
      const key = this.backend.key(i);
      if (!key?.startsWith(this.prefix)) continue;
      const raw = this.backend.getItem(key);
      if (!raw) continue;

      let context: BatchSettlementClientContext & { network?: string };
      try {
        context = JSON.parse(raw) as BatchSettlementClientContext & { network?: string };
      } catch {
        // Unparseable record: leave it alone. The SDK treats it as absent and recovers, which
        // is no worse than what we would write over it.
        continue;
      }

      // Another chain's record. Its escrow is real, just not visible from the chain being read —
      // and reading for it would only ever answer zero.
      if (context.network && context.network !== this.network) continue;

      const channelId = key.slice(this.prefix.length) as `0x${string}`;
      let chainBalance: bigint;
      let chainTotalClaimed: bigint;
      try {
        [chainBalance, chainTotalClaimed] = await read(channelId);
      } catch {
        // An RPC failure must not corrupt a good record — that was the old behaviour's sin.
        continue;
      }

      // Nothing on this chain for it, so there is nothing to correct from. See the note above on
      // why this is not treated as evidence that the record is wrong.
      if (chainBalance === 0n) continue;

      const localCumulative = BigInt(context.chargedCumulativeAmount ?? "0");
      const cumulative = localCumulative > chainTotalClaimed ? localCumulative : chainTotalClaimed;

      this.backend.setItem(
        key,
        JSON.stringify({
          ...context,
          // A non-zero balance on the chain just read is proof of which chain this record is for,
          // so an untagged one gets tagged here rather than waiting for the next settle.
          network: this.network ?? context.network,
          balance: chainBalance.toString(),
          totalClaimed: chainTotalClaimed.toString(),
          chargedCumulativeAmount: cumulative.toString(),
        }),
      );
    }
  }
}

/**
 * Returns a stable, locally-generated delegate signer for voucher signing, persisted to
 * `localStorage` and keyed by the connected wallet address. Passing this as `voucherSigner`
 * to `BatchSettlementEvmScheme` means only the channel deposit (and later top-ups) prompts
 * the real wallet — every off-chain voucher after that signs in-memory, with no wallet popup.
 *
 * IMPORTANT: this key's address is baked into the channel's `payerAuthorizer` field (part of
 * the EIP-712 struct hashed into `channelId`) at deposit time. It must stay stable for the
 * life of an open channel — rotating it independently of the channel storage below would make
 * the SDK compute a different channelId and silently open an unwanted new channel. Bounded
 * risk: this key can only sign vouchers up to the currently escrowed deposit (never pull in
 * additional funds) and can request a cooperative refund, which returns funds to the real
 * wallet, not an attacker — same plaintext-localStorage trust model as the channel state above.
 */
function getOrCreateVoucherSigner(walletAddress: string) {
  const storageKey = `x402-voucher-signer:${walletAddress.toLowerCase()}`;
  let privateKey = window.localStorage.getItem(storageKey) as `0x${string}` | null;
  if (!privateKey) {
    privateKey = generatePrivateKey();
    window.localStorage.setItem(storageKey, privateKey);
  }
  return privateKeyToAccount(privateKey);
}

// Floor for channel deposits/top-ups, in USDC atomic units (6 decimals) — $0.50.
// The SDK's own default (depositMultiplier x per-message ceiling) tracks whatever the
// ceiling happens to be, currently ~$0.003/message, so it sizes deposits at ~1-3 cents:
// enough for only ~5 messages worst-case before another on-chain top-up (a real tx, a
// real wallet-adjacent wait) is needed. $0.50 comfortably covers a full multi-message
// session (100s of messages even at worst-case per-message pricing) while keeping the
// number small on the two axes that actually matter for this app: it's the blast radius
// of the localStorage voucher-signer above if it ever leaks (bounded to this amount,
// never more), and the capital a user has locked up if the server stops cooperating and
// they have to wait out withdrawDelay to exit unilaterally. Both are trivial at $0.50;
// neither improves by going lower, so lower just buys more top-up friction for no benefit.
//
// The tool calls added in PR 2 do not move this: a search is $0.01 and a fetch $0.001
// against a $0.50 escrow.
export const MINIMUM_DEPOSIT_ATOMIC = 500_000n;

/**
 * Custom deposit sizing: always deposit/top-up to at least `MINIMUM_DEPOSIT_ATOMIC`,
 * regardless of the SDK's default multiplier-of-ceiling formula — see the constant's
 * comment for why a fixed floor is the right lever here, not `depositPolicy.depositMultiplier`
 * (which would still scale with the ceiling rather than decoupling from it).
 * `minimumDepositAmount` is the true minimum the SDK needs for the top-up in progress; the
 * SDK requires the returned amount be >= it, so it's respected as a floor of its own.
 */
function depositStrategy(context: BatchSettlementDepositStrategyContext): string {
  const required = BigInt(context.minimumDepositAmount);
  return (required > MINIMUM_DEPOSIT_ATOMIC ? required : MINIMUM_DEPOSIT_ATOMIC).toString();
}

/** The `error` code in a non-OK payment response body, or undefined when there is none. */
function errorCodeOf(body: string): string | undefined {
  try {
    return (JSON.parse(body) as { error?: string }).error;
  } catch {
    // Non-JSON body — the caller falls through to a generic message.
    return undefined;
  }
}

/**
 * Turn a non-OK payment response into a user-facing message. Batch-settlement's
 * `channel_busy` is a transient, self-healing per-channel lock — the server holds it across
 * a single message's verify→settle to serialize requests on one channel, and the x402 client
 * SDK does NOT auto-recover from it — so it warrants an actionable "wait and retry" line
 * rather than dumping the raw reason code. Any other reason keeps the informative default.
 */
function describePaymentError(status: number, body: string): string {
  const errorCode = errorCodeOf(body);
  if (errorCode?.includes("channel_busy")) {
    return "Your previous message is still being settled on-chain. Please wait a few seconds and send it again.";
  }
  // The facilitator has a separate code for an underfunded wallet (see below), so reaching this
  // one means the money is there and the deposit itself did not go through — realistically a
  // declined or dismissed signature prompt. Saying "check you have USDC" here, as this used to,
  // sends people to look at the one thing already known to be fine.
  if (errorCode?.includes("cumulative_exceeds_balance")) {
    return "Your payment channel needs topping up. Approve the wallet signature when it appears, then send again.";
  }
  if (errorCode?.includes("insufficient_balance")) {
    return "Not enough USDC in your wallet to fund the payment channel. Note that only native USDC works — a bridged variant such as USDC.e cannot be used.";
  }
  return `Request failed: ${status} - ${body}`;
}

/**
 * A request that could not be paid for.
 *
 * Carries the status and body rather than only a message because the two callers need different
 * things from them: the chat shows `message` to the user, while a tool maps the failure to a
 * result status the *model* reads (`tools/failure.ts`). Deriving both from one thrown value is
 * what keeps the two readings of a 402 from drifting apart.
 */
export class PaymentError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(describePaymentError(status, body));
    this.name = "PaymentError";
    this.status = status;
    this.body = body;
  }

  /** The per-channel lock, held across one request's verify→settle. Transient by construction,
   *  so this is the one payment failure worth retrying rather than reporting. */
  get isChannelBusy(): boolean {
    return errorCodeOf(this.body)?.includes("channel_busy") ?? false;
  }

  /** The escrow cannot cover another call. Survives the retry in `createPaidFetch` only when the
   *  channel is genuinely out of funds, so by the time a caller sees it, it is the real thing. */
  get isDrainedChannel(): boolean {
    return isDrainedChannel(this.body);
  }
}

/**
 * Whether a 402 body says the channel's deposit can no longer cover another message's ceiling.
 *
 * Worth singling out because the SDK *can* fix it and doesn't: `BatchSettlementEvmScheme` tops up
 * inside `createPaymentPayload`, but decides whether to from the `balance` on our own cached
 * record, so a stale record suppresses it — and its corrective-402 recovery explicitly handles
 * only `cumulative_amount_mismatch` and `cumulative_amount_below_claimed`, not this.
 */
function isDrainedChannel(body: string): boolean {
  return errorCodeOf(body)?.includes("cumulative_exceeds_balance") ?? false;
}

/** A `fetch` that pays. Throws `PaymentError` when the payment itself fails; an HTTP error from
 *  the resource behind it comes back as a non-OK `Response` for the caller to read. */
export type PaidFetch = (input: string, init?: RequestInit) => Promise<Response>;

export interface PaidFetchOptions {
  /** wagmi `WalletClient` — the real wallet, which signs deposits and nothing else. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- viem/x402 signer interfaces differ slightly
  walletClient: { account: { address: string }; signTypedData: (args: any) => Promise<`0x${string}`> };
  /** A readContract-capable client for `network`. Required, not optional — see below. */
  publicClient: unknown;
  /** CAIP-2 id of the network to pay on. Already negotiated by the caller: registering the wrong
   *  one opens a second channel on a chain the user did not mean to fund. */
  network: string;
  /** Called when a drained channel is being resynced and topped up, so a UI can say so. */
  onTopUp?: () => void;
}

export interface PaidFetchClient {
  paidFetch: PaidFetch;
  /** The settlement receipt on a paid response: a deposit tx on the call that opened the channel,
   *  `transaction: ""` for every voucher after it. Null when there is none to read. */
  readReceipt: (response: Response) => { transaction: string; network: string } | null;
}

/**
 * Build a `fetch` that pays for what it requests, on one batch-settlement channel.
 *
 * Every caller gets the drained-channel recovery below, which is why this is one function rather
 * than a bag of parts each caller assembles: the chat had it and a tool call would not have.
 */
export async function createPaidFetch({
  walletClient,
  publicClient,
  network,
  onTopUp,
}: PaidFetchOptions): Promise<PaidFetchClient> {
  // Dynamic, browser-only: keeps the @x402 runtime out of SSR.
  const { x402Client, wrapFetchWithPayment, x402HTTPClient } = await import("@x402/fetch");
  const { toClientEvmSigner } = await import("@x402/evm");
  const { BatchSettlementEvmScheme, readChannelBalanceAndTotalClaimed } = await import(
    "@x402/evm/batch-settlement/client"
  );

  // readContract is documented as "optional" on ClientEvmSigner (only "required for extension
  // enrichment" per the SDK's own JSDoc), but batch-settlement's corrective-402 recovery
  // (processCorrectivePaymentRequired, triggered on cumulative_amount_mismatch and
  // _below_claimed) unconditionally needs it too — both recoverFromSignature and
  // recoverFromOnChainState bail out immediately with `if (!deps.signer.readContract) return
  // false`. Without it, a client/server cumulative desync surfaces as a hard 402 instead of
  // self-healing.
  // Bound: a viem client action is a closure today, but reading the method off the object and
  // calling it elsewhere is exactly the shape that breaks if that ever stops being true.
  const signerInput = {
    address: walletClient.account.address,
    signTypedData: walletClient.signTypedData.bind(walletClient),
  };
  const signer = toClientEvmSigner(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument -- viem/x402 signer interfaces differ slightly
    signerInput as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument -- wagmi public client satisfies the readContract dep
    publicClient as any,
  );

  // Tagged with the network so a zero on-chain balance can be read as "this channel is fiction"
  // rather than "this channel is on another chain" — see resyncFromChain.
  const storage = new WebStorageClientChannelStorage(window.localStorage, network);
  // Delegate voucher signing to a persisted local key so only the deposit/top-up prompts the
  // real wallet — see getOrCreateVoucherSigner's doc comment.
  const voucherSigner = getOrCreateVoucherSigner(walletClient.account.address);
  const scheme = new BatchSettlementEvmScheme(signer, { storage, voucherSigner, depositStrategy });

  const client = new x402Client();
  // Explicitly allowlist USDC on every network this site pays on — the SDK's default spend
  // controls reject Optimism USDC otherwise. See x402SpendControls.ts.
  client.setSpendControls({ allowedAssets: buildUsdcAllowedAssets() });
  // `network` is a CAIP-2 id (e.g. "eip155:10"); register's type wants the literal
  // `${string}:${string}` shape, which every CAIP-2 value satisfies.
  client.register(network as `${string}:${string}`, scheme);

  const fetchWithPayment = wrapFetchWithPayment(fetch, client);

  const readReceipt = (response: Response) => {
    try {
      const httpClient = new x402HTTPClient(client);
      const receipt = httpClient.getPaymentSettleResponse((name: string) => response.headers.get(name));
      return receipt?.transaction ? { transaction: receipt.transaction, network: receipt.network } : null;
    } catch {
      // Receipt extraction is optional — the payment already succeeded.
      return null;
    }
  };

  const paidFetch: PaidFetch = async (input, init) => {
    // First bare request → 402 → SDK opens the channel (deposit) or signs a voucher → retries.
    let response = await fetchWithPayment(input, init);
    if (response.ok) {
      return response;
    }

    // A Response body is single-use, so read it once here and once more after any retry.
    const errorText = await response.text();

    if (isDrainedChannel(errorText)) {
      // The SDK would have topped up on its own, but decides from the `balance` on our cached
      // record, which had drifted from the chain. Re-read the truth and let the SDK decide: if
      // the channel really is short, its own `needsTopUp` fires and the retry carries a deposit;
      // if it is not, no deposit is signed and the retry fails honestly. The predecessor zeroed
      // `balance` instead, which forced a $0.50 deposit whether one was needed or not — see
      // resyncFromChain().
      //
      // Once only: looping here would re-read on every pass if the true problem were something
      // else.
      await storage.resyncFromChain((id) => readChannelBalanceAndTotalClaimed(signer, id));
      onTopUp?.();
      response = await fetchWithPayment(input, init);
      if (!response.ok) {
        throw new PaymentError(response.status, await response.text());
      }
      return response;
    }

    throw new PaymentError(response.status, errorText);
  };

  return { paidFetch, readReceipt };
}
