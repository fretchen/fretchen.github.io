/**
 * Repräsentiert eine Ethereum-Transaktionsquittung
 */
export interface TransactionReceipt {
  blockHash: string;
  blockNumber: string;
  contractAddress: string | null;
  cumulativeGasUsed: string;
  effectiveGasPrice: string;
  from: string;
  gasUsed: string;
  logs: Array<{
    address: string;
    topics: string[];
    data: string;
    blockNumber: string;
    transactionHash: string;
    transactionIndex: string;
    blockHash: string;
    logIndex: string;
    removed: boolean;
  }>;
  logsBloom: string;
  status: string;
  to: string;
  transactionHash: string;
  transactionIndex: string;
  type: string;
}

/**
 * Mögliche Status während des NFT-Minting und Bildgenerierungsprozesses
 */
export type MintingStatus = "idle" | "minting" | "generating" | "error";
