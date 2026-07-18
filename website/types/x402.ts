/**
 * x402 Payment Types for GenImg Service
 */

export interface X402GenImgRequest {
  prompt: string;
  size?: "1024x1024" | "1792x1024";
  mode?: "generate" | "edit";
  referenceImage?: string; // base64 encoded
  /** CAIP-2 network identifier (e.g., "eip155:8453" for Base) */
  network: string;
  /** Expected chain ID for validation - prevents signing on wrong network */
  expectedChainId?: number;
  /** Whether to list the NFT in the public gallery (default: false) */
  isListed?: boolean;
}

export interface X402GenImgResponse {
  image_url: string;
  metadata_url: string;
  tokenId: number;
  contractAddress: string;
  mintTxHash: string;
  transferTxHash: string;
  /** Whether the NFT is listed in the public gallery */
  isListed?: boolean;
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

/** A single chat turn, matching the `data.prompt[]` contract of sc_llm_x402.ts. */
export interface X402ChatMessage {
  role: string;
  content: string;
}

/** Response body from sc_llm_x402.ts on a settled request. */
export interface X402ChatResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
}
