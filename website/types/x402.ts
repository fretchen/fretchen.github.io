/**
 * x402 Payment Types for GenImg Service
 */

export interface X402GenImgRequest {
  prompt: string;
  size?: "1024x1024" | "1792x1024";
  mode?: "generate" | "edit";
  referenceImage?: string; // base64 encoded
  sepoliaTest?: boolean;
  /** Expected chain ID for validation - prevents signing on wrong network */
  expectedChainId?: number;
}

export interface X402GenImgResponse {
  image_url: string;
  metadata_url: string;
  tokenId: number;
  contractAddress: string;
  mintTxHash: string;
  transferTxHash: string;
}

export interface X402PaymentReceipt {
  transaction: string;
  network: string;
}

export type X402GenerationStatus = "idle" | "awaiting-signature" | "processing" | "success" | "error";
