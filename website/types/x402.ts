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
