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
 *
 * `image_url` / `metadata_url` / `tokenId` are the pre-envelope flat shape, kept optional only to
 * survive the window where the website is deployed ahead of the function. Delete them, and the
 * fallbacks in `hooks/x402ImageResponse.ts`, once the function deploy is confirmed live.
 */
export interface X402GenImgResponse {
  created: number;
  data: Array<{ url: string; revised_prompt: string | null }>;
  model: string;
  x_nft?: X402NftReceipt;

  /** @deprecated pre-envelope shape; see the note above. */
  image_url?: string;
  /** @deprecated pre-envelope shape; see the note above. */
  metadata_url?: string;
  /** @deprecated pre-envelope shape; see the note above. */
  tokenId?: number;
}

export interface X402PaymentReceipt {
  transaction: string;
  network: string;
}

export type X402GenerationStatus = "idle" | "awaiting-signature" | "processing" | "success" | "error";

/**
 * x402 Payment Types for the batch-settlement LLM chat service (sc_llm_x402).
 *
 * Unlike the exact scheme above, chat uses batch-settlement payment channels:
 * the first message opens a channel (one on-chain deposit), later messages are
 * off-chain voucher signatures. See hooks/useX402Chat.ts.
 */

/** A single chat turn, matching the OpenAI `messages[]` contract of sc_llm_x402.ts. */
export interface X402ChatMessage {
  role: string;
  content: string;
}

/**
 * OpenAI chat.completion response from sc_llm_x402.ts on a settled request. The reply text is
 * `choices[0].message.content`; `usage` is what the endpoint settled the charge from.
 */
export interface X402ChatResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices: Array<{
    index?: number;
    message: { role: string; content: string };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
