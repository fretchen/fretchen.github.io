/**
 * x402 Payment Types for GenImg Service
 */

export interface X402GenImgRequest {
  prompt: string;
  size?: "1024x1024" | "1792x1024";
  /** Model id the endpoint advertises. Omit for its default (`flux-kontext-pro`). */
  model?: string;
  mode?: "generate" | "edit";
  referenceImage?: string; // base64 encoded
  /**
   * CAIP-2 network identifier (e.g., "eip155:8453" for Base).
   *
   * NOT optional in practice: the backend picks which networks its 402 offers from this field,
   * and with no value it offers every *mainnet* it accepts. The `exact` scheme then signs for
   * whatever it is offered, so omitting this is how you accidentally pay real money.
   */
  network: string;
  /** Expected chain ID for validation - prevents signing on wrong network */
  expectedChainId?: number;
  /** Whether to list the NFT in the public gallery (default: false) */
  isListed?: boolean;
}

/** The NFT receipt. Absent-safe: on a failed mint only `status` and `reason` are set. */
export interface X402NftReceipt {
  status: "minted" | "mint_failed";
  token_id?: number;
  contract?: string;
  network?: string;
  metadata_url?: string;
  mint_tx?: string;
  transfer_tx?: string;
  listed?: boolean;
  mint_price?: string;
  owner?: string;
  /** Why the mint failed. Only set when status is "mint_failed". */
  reason?: string;
}

/**
 * The `images/v1` response envelope from `scw_js/genimg_x402_token.ts`.
 *
 * Hand-written rather than derived from `scw_js/genimg_schemas.ts` — the two packages share no
 * build — so the compiler cannot tell us when it drifts. It already did once: `contractAddress`
 * was declared here and never sent by the backend at all. Treat a change to the endpoint's
 * schema as requiring a manual edit here, and prefer `normalizeImageResponse` over reading these
 * fields directly.
 */
export interface X402GenImgResponse {
  created: number;
  data: Array<{ url: string; revised_prompt: string | null }>;
  model: string;
  x_nft?: X402NftReceipt;
}

export interface X402PaymentReceipt {
  transaction: string;
  network: string;
}

/**
 * `topping-up` is batch-settlement only (see useX402Chat): the channel's deposit ran out and the
 * SDK is depositing again before the message can go through. The exact-scheme image hook never
 * sets it.
 */
export type X402GenerationStatus = "idle" | "awaiting-signature" | "processing" | "topping-up" | "success" | "error";

/**
 * x402 Payment Types for the batch-settlement LLM chat service (sc_llm_x402).
 *
 * Unlike the exact scheme above, chat uses batch-settlement payment channels:
 * the first message opens a channel (one on-chain deposit), later messages are
 * off-chain voucher signatures. See hooks/useX402Chat.ts.
 */

/** One tool call the model wants made. `arguments` is a JSON *string*, per OpenAI. */
export interface X402ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

/** A tool definition offered to the model, OpenAI shape. Mirrors `scw_js/llm_schemas.ts`. */
export interface X402Tool {
  type: "function";
  function: { name: string; description?: string; parameters: Record<string, unknown> };
}

/**
 * A single chat turn, matching the OpenAI `messages[]` contract of sc_llm_x402.ts.
 *
 * `content` is nullable/optional because an assistant turn requesting a tool call has none, and
 * `tool_calls`/`tool_call_id` only appear on those turns and their `role: "tool"` results
 * respectively. See `scw_js/llm_service.ts`'s `LLMMessage` — this is the wire shape it validates.
 */
export interface X402ChatMessage {
  role: string;
  content?: string | null;
  tool_calls?: X402ToolCall[];
  tool_call_id?: string;
}

/**
 * OpenAI chat.completion response from sc_llm_x402.ts on a settled request. The reply text is
 * `choices[0].message.content`; `usage` is what the endpoint settled the charge from.
 *
 * `content` is nullable and `tool_calls` present exactly when `finish_reason` is `"tool_calls"`.
 */
export interface X402ChatResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices: Array<{
    index?: number;
    message: { role: string; content: string | null; tool_calls?: X402ToolCall[] };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
