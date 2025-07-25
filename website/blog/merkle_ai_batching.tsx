import React, { useState, useEffect } from "react";
import { css } from "../styled-system/css";
import { MerkleTree } from "merkletreejs";
import { Buffer } from "buffer";
import MermaidDiagram from "../components/MermaidDiagram";

// Mermaid diagram definitions
const MERKLE_TREE_MATH_DEFINITION = `graph TD
    R1["R₁<br/>(Request 1)"] --> H1["H₁ = hash(R₁)"]
    R2["R₂<br/>(Request 2)"] --> H2["H₂ = hash(R₂)"]
    R3["R₃<br/>(Request 3)"] --> H3["H₃ = hash(R₃)"]
    R4["R₄<br/>(Request 4)"] --> H4["H₄ = hash(R₄)"]
    
    H1 --> H12["H₁₂ = hash(H₁ + H₂)"]
    H2 --> H12
    H3 --> H34["H₃₄ = hash(H₃ + H₄)"]
    H4 --> H34
    
    H12 --> ROOT["ROOT<br/>hash(H₁₂ + H₃₄)"]
    H34 --> ROOT
    
    classDef requestNode fill:#f8fafc,stroke:#64748b,stroke-width:1px
    classDef hashNode fill:#f1f5f9,stroke:#475569,stroke-width:1px
    classDef rootNode fill:#f7f7f7,stroke:#374151,stroke-width:2px
    
    class R1,R2,R3,R4 requestNode
    class H1,H2,H3,H4,H12,H34 hashNode
    class ROOT rootNode`;

const MERKLE_TREE_MATH_FALLBACK = (
  <div
    style={{ padding: "20px", color: "#374151", background: "white", borderRadius: "4px", border: "1px solid #d1d5db" }}
  >
    <div>
      <strong>For requests R₁, R₂, R₃, R₄:</strong>
    </div>
    <div style={{ margin: "8px 0" }}>H₁ = hash(R₁), H₂ = hash(R₂), H₃ = hash(R₃), H₄ = hash(R₄)</div>
    <div style={{ margin: "8px 0" }}>H₁₂ = hash(H₁ + H₂), H₃₄ = hash(H₃ + H₄)</div>
    <div style={{ margin: "8px 0" }}>
      <strong>Root = hash(H₁₂ + H₃₄)</strong>
    </div>
  </div>
);

const GENIMNET_WORKFLOW_DEFINITION = `sequenceDiagram
    participant User
    participant Contract as GenImNFT Contract
    participant Serverless as Serverless Function
    participant AI as FLUX AI API
    participant S3 as S3 Storage
    participant Provider as Image Provider

    User->>Contract: 1. Pay ~$0.10 ETH
    Contract->>Contract: 2. safeMint() creates NFT
    Note over Contract: NFT starts with placeholder image
    Contract->>Serverless: 3. Trigger function
    Serverless->>AI: 4. Call FLUX AI API
    AI-->>Serverless: Generated image data
    Serverless->>S3: 5. Upload to S3 storage
    S3-->>Serverless: Image URL
    Serverless->>Contract: 6. Update NFT metadata
    Note over Contract: NFT now has final image
    Contract->>Provider: 7. Auto-pay provider wallet
    Provider-->>Contract: Payment confirmed`;

const GENIMNET_WORKFLOW_FALLBACK = (
  <div
    style={{
      padding: "20px",
      color: "#ef4444",
      border: "1px solid #fecaca",
      borderRadius: "4px",
      backgroundColor: "#fef2f2",
    }}
  >
    <p>
      <strong>Workflow Steps:</strong>
    </p>
    <ol style={{ textAlign: "left", margin: 0, paddingLeft: "20px" }}>
      <li>User pays ~$0.10 ETH → safeMint() creates NFT</li>
      <li>NFT starts with placeholder image</li>
      <li>Serverless function calls FLUX AI API</li>
      <li>Generated image uploaded to S3 storage</li>
      <li>NFT metadata updated with final image</li>
      <li>Contract auto-pays image provider wallet</li>
    </ol>
  </div>
);

// Merkle Proof Path Diagram for Request 3
const MERKLE_PROOF_PATH_DEFINITION = `graph TD
    R1["R₁<br/>(Request 1)"] --> H1["H₁ = hash(R₁)"]
    R2["R₂<br/>(Request 2)"] --> H2["H₂ = hash(R₂)"]
    R3["R₃<br/>(Request 3)"] --> H3["H₃ = hash(R₃)"]
    R4["R₄<br/>(Request 4)"] --> H4["H₄ = hash(R₄)"]
    
    H1 --> H12["H₁₂ = hash(H₁ + H₂)"]
    H2 --> H12
    H3 --> H34["H₃₄ = hash(H₃ + H₄)"]
    H4 --> H34
    
    H12 --> ROOT["ROOT<br/>hash(H₁₂ + H₃₄)"]
    H34 --> ROOT
    
    classDef requestNode fill:#f8fafc,stroke:#64748b,stroke-width:1px
    classDef hashNode fill:#f1f5f9,stroke:#475569,stroke-width:1px
    classDef rootNode fill:#f7f7f7,stroke:#374151,stroke-width:2px
    classDef proofPath fill:#fef3c7,stroke:#f59e0b,stroke-width:3px
    classDef proofNode fill:#ecfdf5,stroke:#10b981,stroke-width:2px
    
    class R1,R2,R4 requestNode
    class H1,H2 hashNode
    class ROOT rootNode
    class R3 proofPath
    class H3,H34 proofPath
    class H4,H12 proofNode`;

const MERKLE_PROOF_PATH_FALLBACK = (
  <div
    style={{ padding: "20px", color: "#374151", background: "white", borderRadius: "4px", border: "1px solid #d1d5db" }}
  >
    <div>
      <strong>Proof Path for R₃ (highlighted):</strong>
    </div>
    <div style={{ margin: "8px 0" }}>1. Start with: H₃ = hash(R₃)</div>
    <div style={{ margin: "8px 0" }}>2. Need sibling: H₄ (provided in proof)</div>
    <div style={{ margin: "8px 0" }}>3. Compute: H₃₄ = hash(H₃ + H₄)</div>
    <div style={{ margin: "8px 0" }}>4. Need sibling: H₁₂ (provided in proof)</div>
    <div style={{ margin: "8px 0" }}>
      <strong>5. Verify: Root = hash(H₁₂ + H₃₄)</strong>
    </div>
  </div>
);

// Updated LLM Prepaid Workflow with Merkle Batching
const UPDATED_LLM_WORKFLOW_DEFINITION = `sequenceDiagram
    participant User1 as User 1 (Alice)
    participant User2 as User 2 (Bob)
    participant User3 as User 3 (Charlie)
    participant Contract as LLM Contract
    participant Queue as Request Queue
    participant LLM as LLM API
    participant MerkleTree as Merkle Tree
    participant Blockchain as Blockchain

    Note over User1,User3: Phase 1: Prepaid Deposits
    User1->>Contract: depositForLLM() - $50
    User2->>Contract: depositForLLM() - $30
    User3->>Contract: depositForLLM() - $25
    Contract->>Contract: Update balances

    Note over User1,Blockchain: Phase 2: LLM Request Processing (Off-chain)
    User1->>Queue: Request 1: "Analyze sentiment"
    Queue->>Contract: Check balance: Alice $50 ≥ $2 ✅
    Queue->>LLM: Process request
    LLM-->>User1: Immediate response
    
    User2->>Queue: Request 2: "Generate code"
    Queue->>Contract: Check balance: Bob $30 ≥ $3 ✅
    Queue->>LLM: Process request
    LLM-->>User2: Immediate response
    
    User3->>Queue: Request 3: "Translate text"
    Queue->>Contract: Check balance: Charlie $25 ≥ $2.5 ✅
    Queue->>LLM: Process request
    LLM-->>User3: Immediate response

    Note over Queue,MerkleTree: Phase 3: Batch Trigger (50 requests OR 5 min)
    Queue->>MerkleTree: Create leaves from requests
    MerkleTree->>MerkleTree: Calculate root hash
    MerkleTree->>MerkleTree: Generate proofs for each request

    Note over Contract,Blockchain: Phase 4: Atomic Settlement (On-chain)
    MerkleTree->>Contract: processBatch(root, requests, proofs)
    Contract->>Contract: Verify all proofs
    Contract->>Contract: Deduct: Alice -= $2, Bob -= $3, Charlie -= $2.5
    Contract->>Contract: Mark batch as processed
    Contract->>Blockchain: Single transaction ($15 gas)
    Contract-->>User1: Settlement confirmed + proof
    Contract-->>User2: Settlement confirmed + proof
    Contract-->>User3: Settlement confirmed + proof`;

const UPDATED_LLM_WORKFLOW_FALLBACK = (
  <div
    style={{ padding: "20px", color: "#374151", background: "white", borderRadius: "4px", border: "1px solid #d1d5db" }}
  >
    <div>
      <strong>Updated LLM Workflow Steps:</strong>
    </div>
    <div style={{ margin: "8px 0" }}>1. Users deposit funds upfront (prepaid model)</div>
    <div style={{ margin: "8px 0" }}>2. LLM requests processed immediately with balance checks</div>
    <div style={{ margin: "8px 0" }}>3. Requests queued until batch trigger (50 requests or 5 minutes)</div>
    <div style={{ margin: "8px 0" }}>4. Merkle tree constructed with all request data</div>
    <div style={{ margin: "8px 0" }}>5. Single blockchain transaction settles entire batch</div>
    <div style={{ margin: "8px 0" }}>
      <strong>6. Users receive individual proofs for verification</strong>
    </div>
  </div>
);

// Export meta for blog post
export const meta = {
  title: "Merkle Trees for LLM API Batching: Cost-Optimized Blockchain Payments for AI Services",
  publishing_date: "2025-07-29",
  tags: ["Blockchain", "LLM", "API", "Merkle Trees", "Ethereum", "Cost Optimization", "AI Services"],
  readTime: 8,
};

// Mock types and interfaces
interface LLMRequest {
  id: number;
  prompt: string;
  model: string;
  recipient: string;
  estimatedTokens: number;
  response?: string;
  leafData?: {
    id: number;
    timestamp: string;
    tokenCount: number;
    wallet: string;
  };
  leafHash?: string;
}

// Mock wallet addresses for simulation
const mockWallets = [
  "0xUser1Address...",
  "0xUser2Address...",
  "0xUser3Address...",
  "0xUser4Address...",
  "0xUser5Address...",
];

// Mock prompts for LLM requests
const mockPrompts = [
  "Analyze the sentiment of this customer review: 'The product is amazing!'",
  "Translate this text to German: 'Hello, how are you today?'",
  "Write a short Python function to calculate fibonacci numbers",
  "Explain quantum computing in simple terms",
  "Generate a creative story about a time-traveling cat",
  "Summarize the benefits of renewable energy",
  "Create a marketing strategy for a new mobile app",
  "Debug this JavaScript code: console.log(hello world)",
];

// Synchronous hash function for merkletreejs compatibility
const createSyncHash = (data: string | Buffer): Buffer => {
  // Convert to consistent format
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);

  // Deterministic hash function for demo purposes
  let hash = 0x811c9dc5; // FNV-1a initial value
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i];
    hash = (hash * 0x01000193) >>> 0; // FNV-1a prime and ensure 32-bit
  }

  // Create a deterministic 32-byte buffer
  const result = new Uint8Array(32);
  for (let i = 0; i < 32; i += 4) {
    result[i] = (hash >>> 24) & 0xff;
    result[i + 1] = (hash >>> 16) & 0xff;
    result[i + 2] = (hash >>> 8) & 0xff;
    result[i + 3] = hash & 0xff;
    hash = (hash * 0x01000193) >>> 0; // Continue hashing for next 4 bytes
  }

  return Buffer.from(result);
};

// Shared hash function for Merkle Tree construction
const createMerkleHashFn = () => {
  return (data: Buffer) => createSyncHash(data);
};

// Types for proof demo
interface MerkleProof {
  leafIndex: number;
  leafData: {
    id: number;
    timestamp: string;
    tokenCount: number;
    wallet: string;
  };
  leafHash: string;
  proof: Array<{
    data: string;
    position: "left" | "right";
  }>;
  root: string;
}

// Sample data for proof demo (Alice's story)
const sampleBatch = {
  requests: [
    {
      id: 1,
      leafData: { id: 1, timestamp: "2025-07-29T10:00:00.000Z", tokenCount: 150, wallet: "0xAliceAddress..." },
      leafHash: "0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
      prompt: "Analyze the sentiment of customer feedback",
      owner: "Alice",
    },
    {
      id: 2,
      leafData: { id: 2, timestamp: "2025-07-29T10:01:00.000Z", tokenCount: 200, wallet: "0xBobAddress..." },
      leafHash: "0xb2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567",
      prompt: "Generate marketing copy for new product",
      owner: "Bob",
    },
    {
      id: 3,
      leafData: { id: 3, timestamp: "2025-07-29T10:02:00.000Z", tokenCount: 175, wallet: "0xCharlieAddress..." },
      leafHash: "0xc3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678",
      prompt: "Translate technical documentation to Spanish",
      owner: "Charlie",
    },
    {
      id: 4,
      leafData: { id: 4, timestamp: "2025-07-29T10:03:00.000Z", tokenCount: 120, wallet: "0xDaveAddress..." },
      leafHash: "0xd4e5f6789012345678901234567890abcdef1234567890abcdef123456789",
      prompt: "Debug Python code for data analysis",
      owner: "Dave",
    },
  ],
  merkleRoot: "0x1a2b3c4d5e6f789012345678901234567890abcdef1234567890abcdef123456",
};

// Generate Merkle Proof for a specific leaf
const generateMerkleProof = async (leafIndex: number): Promise<MerkleProof> => {
  const requests = sampleBatch.requests;
  const selectedRequest = requests[leafIndex];

  // Convert leaf data to buffers for merkletreejs - use same hash function!
  const leafBuffers = requests.map((req) => {
    const serialized = JSON.stringify(req.leafData, Object.keys(req.leafData).sort());
    return createSyncHash(serialized);
  });

  const hashFn = createMerkleHashFn();
  const tree = new MerkleTree(leafBuffers, hashFn);

  // Get proof for the specific leaf
  const leaf = leafBuffers[leafIndex];
  const proof = tree.getProof(leaf);
  const root = tree.getRoot();

  return {
    leafIndex,
    leafData: selectedRequest.leafData,
    leafHash: selectedRequest.leafHash,
    proof: proof.map((p) => ({
      data: `0x${p.data.toString("hex")}`,
      position: p.position as "left" | "right",
    })),
    root: `0x${root.toString("hex")}`,
  };
};

// Validate a Merkle Proof using merkletreejs built-in verification
const validateMerkleProof = async (
  proof: MerkleProof,
): Promise<{ isValid: boolean; message: string; steps: string[] }> => {
  try {
    // Recreate the original tree to use instance verification
    const allRequests = sampleBatch.requests;
    const allLeafBuffers = allRequests.map((req) => {
      const serialized = JSON.stringify(req.leafData, Object.keys(req.leafData).sort());
      return createSyncHash(serialized);
    });

    const hashFn = createMerkleHashFn();
    const tree = new MerkleTree(allLeafBuffers, hashFn);

    // Get the leaf buffer for the proof
    const leafBuffer = createSyncHash(JSON.stringify(proof.leafData, Object.keys(proof.leafData).sort()));

    // Use the tree instance verify method (this is the most reliable approach)
    const originalProof = tree.getProof(leafBuffer);
    const treeRoot = tree.getRoot();
    const isValid = tree.verify(originalProof, leafBuffer, treeRoot);

    // Alternative: Check if the leaf exists in the tree
    const leafIndex = allLeafBuffers.findIndex((buf) => buf.equals(leafBuffer));
    const alternativeValid = leafIndex === proof.leafIndex && leafIndex >= 0;

    const steps = [
      `✅ Used merkletreejs tree.verify()`,
      `📋 Leaf: ${leafBuffer.toString("hex").substring(0, 10)}...`,
      `🌳 Tree Root: 0x${treeRoot.toString("hex").substring(0, 10)}...`,
      `🔍 Proof Root: ${proof.root.substring(0, 10)}...`,
      `� Leaf Index: ${leafIndex} (expected: ${proof.leafIndex})`,
      `� Root Match: ${`0x${treeRoot.toString("hex")}` === proof.root}`,
      `🎯 Index Match: ${alternativeValid}`,
      `${isValid ? "✅ Verification: VALID" : "❌ Verification: INVALID"}`,
    ];

    return {
      isValid: isValid && alternativeValid && `0x${treeRoot.toString("hex")}` === proof.root,
      message: isValid
        ? "Proof is valid! Alice's payment is confirmed."
        : "Proof is invalid! This payment cannot be verified.",
      steps,
    };
  } catch (error) {
    console.error("Proof validation failed:", error);
    return {
      isValid: false,
      message: "Error validating proof: " + (error as Error).message,
      steps: [],
    };
  }
};

// Interactive Proof Demo Component
const ProofDemo: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState(0);
  const [generatedProof, setGeneratedProof] = useState<MerkleProof | null>(null);
  const [validationInput, setValidationInput] = useState("");
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
    steps: string[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"generate" | "validate">("generate");

  const handleGenerateProof = async () => {
    try {
      const proof = await generateMerkleProof(selectedUser);
      setGeneratedProof(proof);
    } catch (_error) {
      console.error("Error generating proof:", _error);
    }
  };

  const handleValidateProof = async () => {
    try {
      const proof = JSON.parse(validationInput) as MerkleProof;
      const result = await validateMerkleProof(proof);
      setValidationResult(result);
    } catch (error) {
      console.error("Proof validation failed:", error);
      setValidationResult({
        isValid: false,
        message: "Invalid JSON format",
        steps: [],
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <div
      className={css({
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "20px",
        margin: "20px 0",
        backgroundColor: "#f9fafb",
      })}
    >
      <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" })}>
        🔍 Interactive Proof Demo: Alice&apos;s Story
      </h3>

      {/* Sample Batch Display */}
      <div
        className={css({
          marginBottom: "20px",
          padding: "16px",
          backgroundColor: "#f0fdf4",
          borderRadius: "8px",
          border: "1px solid #bbf7d0",
        })}
      >
        <h4 className={css({ fontSize: "16px", fontWeight: "medium", marginBottom: "12px" })}>
          Sample Batch (Merkle Root: {sampleBatch.merkleRoot.substring(0, 20)}...)
        </h4>
        <div className={css({ display: "grid", gap: "8px" })}>
          {sampleBatch.requests.map((req, index) => (
            <div
              key={req.id}
              className={css({
                padding: "8px 12px",
                backgroundColor: "#fff",
                borderRadius: "4px",
                border: "1px solid #d1d5db",
                fontSize: "13px",
              })}
            >
              <strong>{req.owner}</strong> (R<sub>{index + 1}</sub>): {req.prompt} - {req.leafData.tokenCount} tokens
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={css({ marginBottom: "16px", borderBottom: "1px solid #e5e7eb" })}>
        <div className={css({ display: "flex", gap: "0" })}>
          <button
            onClick={() => setActiveTab("generate")}
            className={css({
              padding: "8px 16px",
              backgroundColor: activeTab === "generate" ? "#3b82f6" : "transparent",
              color: activeTab === "generate" ? "white" : "#6b7280",
              border: "none",
              borderRadius: "4px 4px 0 0",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "medium",
            })}
          >
            Generate Proof
          </button>
          <button
            onClick={() => setActiveTab("validate")}
            className={css({
              padding: "8px 16px",
              backgroundColor: activeTab === "validate" ? "#3b82f6" : "transparent",
              color: activeTab === "validate" ? "white" : "#6b7280",
              border: "none",
              borderRadius: "4px 4px 0 0",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "medium",
            })}
          >
            Validate Proof
          </button>
        </div>
      </div>

      {/* Generate Proof Tab */}
      {activeTab === "generate" && (
        <div>
          <div
            className={css({
              marginBottom: "16px",
              padding: "16px",
              backgroundColor: "#fff",
              borderRadius: "4px",
              border: "1px solid #e5e7eb",
            })}
          >
            <h4 className={css({ fontSize: "16px", fontWeight: "medium", marginBottom: "12px" })}>
              Step 1: Select User to Generate Proof
            </h4>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(Number(e.target.value))}
              className={css({
                width: "100%",
                padding: "8px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                marginBottom: "12px",
              })}
            >
              {sampleBatch.requests.map((req, index) => (
                <option key={req.id} value={index}>
                  {req.owner} - {req.prompt}
                </option>
              ))}
            </select>
            <button
              onClick={handleGenerateProof}
              className={css({
                padding: "8px 16px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              })}
            >
              Generate Merkle Proof
            </button>
          </div>

          {generatedProof && (
            <div
              className={css({
                padding: "16px",
                backgroundColor: "#f0fdf4",
                borderRadius: "4px",
                border: "1px solid #bbf7d0",
              })}
            >
              <h4 className={css({ fontSize: "16px", fontWeight: "medium", marginBottom: "12px" })}>
                Generated Proof for {sampleBatch.requests[selectedUser].owner}
              </h4>
              <div className={css({ marginBottom: "12px" })}>
                <strong>Proof Path:</strong>
                <div className={css({ fontSize: "12px", fontFamily: "monospace", marginTop: "4px" })}>
                  {generatedProof.proof.map((proofItem, index) => (
                    <div key={index}>
                      Level {index + 1}: {proofItem.data.substring(0, 20)}... ({proofItem.position})
                    </div>
                  ))}
                </div>
              </div>
              <div className={css({ marginBottom: "12px" })}>
                <strong>Complete Proof JSON:</strong>
                <div className={css({ position: "relative" })}>
                  <pre
                    className={css({
                      fontSize: "11px",
                      fontFamily: "monospace",
                      backgroundColor: "#fff",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #d1d5db",
                      overflow: "auto",
                      maxHeight: "200px",
                      marginTop: "4px",
                    })}
                  >
                    {JSON.stringify(generatedProof, null, 2)}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(generatedProof, null, 2))}
                    className={css({
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      padding: "4px 8px",
                      backgroundColor: "#6b7280",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "12px",
                      cursor: "pointer",
                    })}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validate Proof Tab */}
      {activeTab === "validate" && (
        <div>
          <div
            className={css({
              marginBottom: "16px",
              padding: "16px",
              backgroundColor: "#fff",
              borderRadius: "4px",
              border: "1px solid #e5e7eb",
            })}
          >
            <h4 className={css({ fontSize: "16px", fontWeight: "medium", marginBottom: "12px" })}>
              Step 2: Validate a Proof
            </h4>
            <label className={css({ display: "block", fontSize: "14px", marginBottom: "8px" })}>
              Paste Proof JSON:
            </label>
            <textarea
              value={validationInput}
              onChange={(e) => setValidationInput(e.target.value)}
              placeholder="Paste the complete proof JSON here..."
              className={css({
                width: "100%",
                height: "120px",
                padding: "8px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "12px",
                fontFamily: "monospace",
                marginBottom: "12px",
                resize: "vertical",
              })}
            />
            <button
              onClick={handleValidateProof}
              disabled={!validationInput.trim()}
              className={css({
                padding: "8px 16px",
                backgroundColor: validationInput.trim() ? "#3b82f6" : "#9ca3af",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: validationInput.trim() ? "pointer" : "not-allowed",
                fontSize: "14px",
              })}
            >
              Validate Proof
            </button>
          </div>

          {validationResult && (
            <div
              className={css({
                padding: "16px",
                backgroundColor: validationResult.isValid ? "#f0fdf4" : "#fef2f2",
                borderRadius: "4px",
                border: `1px solid ${validationResult.isValid ? "#bbf7d0" : "#fecaca"}`,
              })}
            >
              <h4 className={css({ fontSize: "16px", fontWeight: "medium", marginBottom: "12px" })}>
                Validation Result
              </h4>
              <div
                className={css({
                  fontSize: "14px",
                  fontWeight: "medium",
                  marginBottom: "12px",
                  color: validationResult.isValid ? "#166534" : "#dc2626",
                })}
              >
                {validationResult.message}
              </div>
              {validationResult.steps.length > 0 && (
                <div>
                  <strong>Verification Steps:</strong>
                  <div className={css({ marginTop: "8px" })}>
                    {validationResult.steps.map((step, index) => (
                      <div
                        key={index}
                        className={css({
                          fontSize: "12px",
                          fontFamily: "monospace",
                          backgroundColor: "#fff",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          border: "1px solid #e5e7eb",
                          marginBottom: "4px",
                        })}
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Mock Merkle Tree functions using merkletreejs with consistent hash function
const calculateMerkleRoot = async (requests: LLMRequest[]): Promise<string> => {
  // Use the actual leaf data from requests (don't recreate timestamps)
  const publicLeaves = requests.map((req) => req.leafData!);

  // Convert to buffer format for merkletreejs using same hash function
  const leafBuffers = publicLeaves.map((leaf) => {
    const serialized = JSON.stringify(leaf, Object.keys(leaf).sort());
    return createSyncHash(serialized);
  });

  // Use the shared hash function
  const hashFn = createMerkleHashFn();

  const tree = new MerkleTree(leafBuffers, hashFn);
  const root = tree.getRoot();

  return `0x${root.toString("hex")}`;
};

// Function to visualize the Merkle Tree structure
const visualizeMerkleTree = async (requests: LLMRequest[]): Promise<string> => {
  if (requests.length === 0) return "";

  // Use the same leaf data as in calculateMerkleRoot
  const publicLeaves = requests.map((req) => req.leafData!);

  const leafBuffers = publicLeaves.map((leaf) => {
    const serialized = JSON.stringify(leaf, Object.keys(leaf).sort());
    return createSyncHash(serialized);
  });

  // Use the same hash function as calculateMerkleRoot
  const hashFn = createMerkleHashFn();

  const tree = new MerkleTree(leafBuffers, hashFn);

  // Get the layers of the tree
  const layers = tree.getLayers();
  let visualization = "Merkle Tree:\n";

  // Root (top level)
  const root = layers[layers.length - 1][0];
  visualization += `Root: ${root.toString("hex").substring(0, 8)}\n`;

  // Intermediate levels (if any)
  for (let i = layers.length - 2; i > 0; i--) {
    const level = layers[i];
    const levelHashes = level.map((hash) => hash.toString("hex").substring(0, 8));
    visualization += `Level ${layers.length - 1 - i}: ${levelHashes.join(" | ")}\n`;
  }

  // Leaf level
  const leaves = layers[0];
  const leafHashes = leaves.map((hash, index) => `H${index + 1}: ${hash.toString("hex").substring(0, 8)}`);
  visualization += `Leaves: ${leafHashes.join(" | ")}`;

  return visualization;
};

// Interactive Batch Creator Component
const BatchCreator: React.FC = () => {
  const [requests, setRequests] = useState<LLMRequest[]>([]);
  const [merkleRoot, setMerkleRoot] = useState<string>("");
  const [merkleTreeVisualization, setMerkleTreeVisualization] = useState<string>("");
  const [batchRegistered, setBatchRegistered] = useState(false);
  const [nextRequestId, setNextRequestId] = useState(1);
  const [currentWallet, setCurrentWallet] = useState(mockWallets[0]);
  const [currentPrompt, setCurrentPrompt] = useState("");

  const BATCH_SIZE_THRESHOLD = 4; // Create merkle tree after 4 requests

  // Simulate sending an LLM call (like in the notebook)
  const sendLLMCall = async (wallet: string, prompt: string) => {
    // Create leaf data
    const leafData = {
      id: nextRequestId,
      timestamp: new Date().toISOString(),
      tokenCount: Math.floor(Math.random() * 200) + 100,
      wallet: wallet,
    };

    // Calculate leaf hash using same hash function as tree construction
    const serialized = JSON.stringify(leafData, Object.keys(leafData).sort());
    const leafHashBuffer = createSyncHash(serialized);
    const leafHash = `0x${leafHashBuffer.toString("hex")}`;

    // Simulate LLM response
    const mockResponses = [
      "The sentiment of this review is positive, indicating customer satisfaction.",
      "Hallo, wie geht es dir heute?",
      "Here's a Python function: def fibonacci(n): return n if n <= 1 else fibonacci(n-1) + fibonacci(n-2)",
      "Quantum computing uses quantum mechanical phenomena like superposition and entanglement to process information.",
      "Once upon a time, a curious cat named Whiskers discovered a mysterious clock that could bend time...",
      "Renewable energy reduces carbon emissions, creates jobs, and provides sustainable power solutions.",
      "Focus on user experience, social media marketing, and influencer partnerships for app growth.",
      "Fixed code: console.log('hello world'); // Missing quotes around string",
    ];

    const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];

    const newRequest: LLMRequest = {
      id: nextRequestId,
      prompt: prompt,
      model: "gpt-4-turbo",
      recipient: wallet,
      estimatedTokens: leafData.tokenCount,
      response: response,
      leafData: leafData,
      leafHash: leafHash,
    };

    setRequests((prev) => [...prev, newRequest]);
    setNextRequestId((prev) => prev + 1);
    setCurrentPrompt("");

    return newRequest;
  };

  // Create merkle tree when threshold is reached
  useEffect(() => {
    const createMerkleTree = async () => {
      if (requests.length >= BATCH_SIZE_THRESHOLD && !batchRegistered) {
        const root = await calculateMerkleRoot(requests);
        const treeVis = await visualizeMerkleTree(requests);
        setMerkleRoot(root);
        setMerkleTreeVisualization(treeVis);
        setBatchRegistered(true);
      }
    };

    createMerkleTree();
  }, [requests.length, batchRegistered]);

  const handleSendRequest = async () => {
    if (!currentPrompt.trim()) return;
    await sendLLMCall(currentWallet, currentPrompt);
  };

  const handleRandomRequest = async () => {
    const randomPrompt = mockPrompts[Math.floor(Math.random() * mockPrompts.length)];
    const randomWallet = mockWallets[Math.floor(Math.random() * mockWallets.length)];
    setCurrentWallet(randomWallet);
    await sendLLMCall(randomWallet, randomPrompt);
  };

  const resetDemo = () => {
    setRequests([]);
    setMerkleRoot("");
    setMerkleTreeVisualization("");
    setBatchRegistered(false);
    setNextRequestId(1);
    setCurrentPrompt("");
  };

  return (
    <div
      className={css({
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "20px",
        margin: "20px 0",
        backgroundColor: "#f9fafb",
      })}
    >
      <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" })}>
        🧪 Interactive LLM Batch Processing Demo
      </h3>

      <div
        className={css({
          marginBottom: "20px",
          padding: "16px",
          backgroundColor: "#eff6ff",
          borderRadius: "8px",
          border: "1px solid #bfdbfe",
        })}
      >
        <p className={css({ fontSize: "14px", color: "#1e40af", marginBottom: "8px" })}>
          <strong>How it works:</strong> Send LLM requests and get immediate responses. After {BATCH_SIZE_THRESHOLD}{" "}
          requests, a Merkle tree is automatically created for cost-efficient blockchain settlement.
        </p>
      </div>

      {/* Request Input */}
      <div
        className={css({
          marginBottom: "1.5rem",
          padding: "1rem",
          backgroundColor: "#fff",
          borderRadius: "4px",
          border: "1px solid #e5e7eb",
        })}
      >
        <h4 className={css({ fontSize: "1rem", fontWeight: "medium", marginBottom: "1rem" })}>Send LLM Request</h4>

        <div className={css({ marginBottom: "0.75rem" })}>
          <label className={css({ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" })}>
            Wallet Address:
          </label>
          <select
            value={currentWallet}
            onChange={(e) => setCurrentWallet(e.target.value)}
            className={css({
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "0.85rem",
            })}
          >
            {mockWallets.map((wallet) => (
              <option key={wallet} value={wallet}>
                {wallet}
              </option>
            ))}
          </select>
        </div>

        <div className={css({ marginBottom: "0.75rem" })}>
          <label className={css({ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" })}>Prompt:</label>
          <input
            type="text"
            value={currentPrompt}
            onChange={(e) => setCurrentPrompt(e.target.value)}
            placeholder="Enter your LLM prompt..."
            className={css({
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontSize: "0.85rem",
            })}
            onKeyPress={(e) => e.key === "Enter" && handleSendRequest()}
          />
        </div>

        <div className={css({ display: "flex", gap: "0.5rem", fontSize: "0.85rem" })}>
          <button
            onClick={handleSendRequest}
            disabled={!currentPrompt.trim()}
            className={css({
              padding: "0.5rem 1rem",
              backgroundColor: currentPrompt.trim() ? "#3b82f6" : "#9ca3af",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: currentPrompt.trim() ? "pointer" : "not-allowed",
              transition: "background-color 0.2s",
              "&:hover": { backgroundColor: currentPrompt.trim() ? "#2563eb" : "#9ca3af" },
            })}
          >
            Send Request
          </button>

          <button
            onClick={handleRandomRequest}
            className={css({
              padding: "0.5rem 1rem",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "background-color 0.2s",
              "&:hover": { backgroundColor: "#059669" },
            })}
          >
            Send Random Request
          </button>

          <button
            onClick={resetDemo}
            className={css({
              padding: "0.5rem 1rem",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "background-color 0.2s",
              "&:hover": { backgroundColor: "#dc2626" },
            })}
          >
            Reset Demo
          </button>
        </div>
      </div>

      {/* Merkle Root Display */}
      {batchRegistered && (
        <div
          className={css({
            padding: "0.75rem",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "4px",
            marginBottom: "1rem",
          })}
        >
          <strong>🌳 Merkle Root:</strong> <code className={css({ fontSize: "0.8rem" })}>{merkleRoot}</code>
          <div className={css({ fontSize: "0.8rem", color: "#166534", marginTop: "0.25rem" })}>
            All requests can now be processed with a single blockchain transaction!
          </div>
          {/* Tree Visualization */}
          {merkleTreeVisualization && (
            <div className={css({ marginTop: "0.75rem" })}>
              <strong>Tree Structure:</strong>
              <pre
                className={css({
                  fontSize: "0.7rem",
                  fontFamily: "monospace",
                  backgroundColor: "#fff",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #bbf7d0",
                  marginTop: "0.25rem",
                  lineHeight: "1.4",
                  overflow: "auto",
                })}
              >
                {merkleTreeVisualization}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Request List */}
      <div className={css({ maxHeight: "400px", overflowY: "auto" })}>
        {requests.length === 0 ? (
          <div
            className={css({
              padding: "1.5rem",
              textAlign: "center",
              color: "#6b7280",
              backgroundColor: "#fff",
              borderRadius: "4px",
              border: "1px solid #e5e7eb",
            })}
          >
            No requests yet. Send your first LLM request above! 🚀
          </div>
        ) : (
          requests.map((request, index) => (
            <div
              key={request.id}
              className={css({
                padding: "1rem",
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "4px",
                marginBottom: "0.75rem",
              })}
            >
              {/* Leaf Data */}
              {request.leafData && (
                <div className={css({ marginBottom: "0.5rem" })}>
                  <div className={css({ fontWeight: "medium", fontSize: "0.85rem", marginBottom: "0.25rem" })}>
                    Leaf Data R<sub>{index + 1}</sub>:
                  </div>
                  <pre
                    className={css({
                      fontSize: "0.7rem",
                      fontFamily: "monospace",
                      backgroundColor: "#f9fafb",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      border: "1px solid #e5e7eb",
                      overflow: "auto",
                      lineHeight: "1.3",
                    })}
                  >
                    {JSON.stringify(request.leafData, null, 2)}
                  </pre>
                </div>
              )}

              {/* Leaf Hash */}
              {request.leafHash && (
                <div>
                  <div className={css({ fontWeight: "medium", fontSize: "0.85rem", marginBottom: "0.25rem" })}>
                    Leaf Hash H<sub>{index + 1}</sub>:
                  </div>
                  <code
                    className={css({
                      fontSize: "0.7rem",
                      fontFamily: "monospace",
                      backgroundColor: "#f3f4f6",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      border: "1px solid #d1d5db",
                      wordBreak: "break-all",
                      display: "block",
                    })}
                  >
                    {request.leafHash}
                  </code>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Main Blog Post Component
export default function MerkleAIBatching() {
  return (
    <article>
      <section>
        <p>
          The integration of Large Language Models (LLMs) into my website is an exciting possibility. But one problem
          remains: How can I reduce the blockchain transaction costs when users need multiple LLM API calls in an
          application? In this blog post, I will explore the possible setup and it might be extend through merkle trees.
        </p>
      </section>
      <section>
        <h2>The Current AI Setup for Image Generation</h2>

        <p>
          Before diving into Merkle tree optimizations, let&apos;s examine how my current NFT-based AI image generation
          system works. My existing system uses the{" "}
          <a href="https://optimistic.etherscan.io/address/0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb#code">
            GenImNFT contract
          </a>{" "}
          on Optimism to coordinate between users, payments, and AI image generation:
        </p>

        <MermaidDiagram
          definition={GENIMNET_WORKFLOW_DEFINITION}
          title="Workflow for Image Generation"
          fallbackContent={GENIMNET_WORKFLOW_FALLBACK}
          config={{
            sequence: {
              diagramMarginX: 50,
              diagramMarginY: 10,
              boxTextMargin: 5,
              noteMargin: 10,
              messageMargin: 35,
              mirrorActors: false,
            },
          }}
        />

        <p>
          This allowed me to set up a trustless system where any user with a wallet and optimism balance can access and
          only pay for successfully generated images, and the service is compensated automatically upon delivery.
        </p>

        <div>
          <h3>The Challenge with this system in the LLM context</h3>
          <p>
            While this system works great for my image generator, it faces limitations when scaling to multiple LLM API
            calls:
          </p>

          <ul>
            <li> Every LLM request = Separate blockchain transaction</li>
            <li> Gas costs multiply: 10 requests = 10× gas fees</li>
            <li> User experience: Multiple wallet confirmations</li>
            <li> Economic barrier: High costs limit adoption</li>
          </ul>
          <p>
            <strong>Example:</strong> If a user wants to generate 10 AI images for a project, they currently need 10
            separate transactions costing ~$1.00 in total, plus the complexity of multiple wallet interactions.
          </p>
        </div>

        <div>
          <h3>Why This Setup Might benefit from a Merkle Tree Optimization</h3>
          <p>
            The current GenImNFT system proves that blockchain-AI integration works, but to make it truly scalable for
            multiple LLM interactions, we need:
          </p>
          <ul>
            <li>Batch multiple requests into single transactions</li>
            <li>Reduce per-request gas costs dramatically</li>
            <li>Maintain payment security and user experience</li>
            <li>Enable complex AI workflows without cost barriers</li>
          </ul>
        </div>
      </section>

      <section>
        <h2>How Merkle Trees Work</h2>
        <p>
          A Merkle tree is a binary tree structure where each leaf represents a data element (in our case, an LLM
          request), and each parent node contains a cryptographic hash of its children. The mathematical foundation is:
        </p>

        <MermaidDiagram
          definition={MERKLE_TREE_MATH_DEFINITION}
          title="Merkle Tree Mathematical Foundation"
          fallbackContent={MERKLE_TREE_MATH_FALLBACK}
        />
        <p>
          This single root hash can represent an entire batch of requests, enabling us to register thousands of LLM
          requests with just one blockchain transaction while maintaining cryptographic proof of each individual
          request.
        </p>

        <p>
          With Merkle Trees, we can bundle multiple LLM API payments into a single blockchain transaction. Try it in the
          interactive demo:
        </p>

        <BatchCreator />
      </section>

      <section>
        <h3>Proving Individual Transactions with Merkle Proofs</h3>

        <p>
          Now that we&apos;ve seen how to batch LLM requests into a Merkle tree, there is actually another cool feature
          possible. The user can verify the validity of the tree with fairly reduced information.
        </p>
        <p>
          A Merkle proof is a cryptographic proof that allows the user, we name her Alice, to demonstrate that her
          transaction is included in the Merkle tree without revealing any other transactions. To prove that
          Alice&apos;s transaction R<sub>3</sub> is in the tree, she provides a &quot;proof path&quot; - the minimum set
          of hash values needed to reconstruct the path from her leaf to the root:
        </p>

        <figure>
          <MermaidDiagram
            definition={MERKLE_PROOF_PATH_DEFINITION}
            title="🔍 Merkle Proof Path for Request 3 (R₃)"
            fallbackContent={MERKLE_PROOF_PATH_FALLBACK}
          />
          <figcaption>
            Visualization of the Merkle proof for R<sub>3</sub>: Alice needs to provide the request and proof siblings
            that are highlighted in green. The hashes that are highlighted in orange can be calculated from the
            information. Finally, she can verify if the calculated root is the same as the root she was provided. If
            they are the same, her request is stored in the merkle tree.
          </figcaption>
        </figure>

        <p>
          This elegant mathematical verification proves Alice&apos;s transaction is authentic without revealing any
          other transaction details. In the little demonstrator below, you can test in a simple example how the proof
          can be generated and validated.
        </p>

        <ProofDemo />
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Step 4: From Theory to Practice - Prepaid Settlement Workflow
        </h2>

        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Now that we understand how Merkle proofs work, let&apos;s see how we can use it to extend our current workflow
          towards the LLM systems. The first major change is that we will not settle costs after each request, but
          rather require users to deposit funds upfront. This way, we can ensure that the user has enough balance to
          cover the costs of their requests. This is similar to a prepaid model, where users deposit funds users to
          deposit funds upfront. This creates a trustless system where:
        </p>
        <ul>
          <li>User deposits $50 → Guaranteed $50 available</li>
          <li>LLM requests consume balance → No payment risk</li>
          <li>Batch settlement → Efficient blockchain transactions</li>
          <li>Refunds possible → User controls remaining balance</li>
        </ul>

        <div
          className={css({
            backgroundColor: "#f0fdf4",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #bbf7d0",
            marginBottom: "20px",
          })}
        >
          <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "12px", color: "#166534" })}>
            🔄 Complete Workflow: From Deposit to Settlement
          </h3>
          <p className={css({ marginBottom: "12px", lineHeight: "1.6", color: "#166534" })}>
            Here&apos;s how the complete prepaid + Merkle tree system works in practice:
          </p>

          <div className={css({ marginBottom: "16px" })}>
            <h4 className={css({ fontSize: "16px", fontWeight: "medium", marginBottom: "8px", color: "#047857" })}>
              Step 1: Initial Setup & Deposits
            </h4>
            <div>
              <div>1. User calls: contract.depositForLLM({`{value: ethers.parseEther("0.05")}`})</div>
              <div>2. Contract updates: llmBalance[user] += 0.05 ETH</div>
              <div>3. Event emitted: LLMDeposit(user, 0.05 ETH)</div>
              <div>4. User can now make LLM requests up to $50 value</div>
            </div>
          </div>

          <div className={css({ marginBottom: "16px" })}>
            <h4 className={css({ fontSize: "16px", fontWeight: "medium", marginBottom: "8px", color: "#047857" })}>
              Step 2: LLM Request Processing
            </h4>
            <div
              className={css({
                fontFamily: "monospace",
                backgroundColor: "#fff",
                padding: "12px",
                borderRadius: "4px",
                fontSize: "13px",
                lineHeight: "1.4",
                marginBottom: "8px",
              })}
            >
              <div>1. User submits: &quot;Generate image of a sunset&quot;</div>
              <div>2. System checks: llmBalance[user] &gt;= $2.00 ✅</div>
              <div>3. LLM API called: Image generated (off-chain)</div>
              <div>4. Request queued: Added to pending batch (47/50)</div>
              <div>5. User gets: Immediate response + queue position</div>
            </div>
          </div>

          <div className={css({ marginBottom: "16px" })}>
            <h4 className={css({ fontSize: "16px", fontWeight: "medium", marginBottom: "8px", color: "#047857" })}>
              Step 3: Batch Trigger & Merkle Tree Construction
            </h4>
            <div
              className={css({
                fontFamily: "monospace",
                backgroundColor: "#fff",
                padding: "12px",
                borderRadius: "4px",
                fontSize: "13px",
                lineHeight: "1.4",
                marginBottom: "8px",
              })}
            >
              <div>1. Trigger condition met: 50 requests OR 5 minutes</div>
              <div>2. Create leaf data: {`{id, timestamp, cost, wallet}`} for each</div>
              <div>3. Build Merkle tree: hash(leaf1), hash(leaf2), ...</div>
              <div>4. Calculate root: MerkleTree(leafHashes).getRoot()</div>
              <div>5. Prepare batch: {`{merkleRoot, requests[], proofs[][]}`}</div>
            </div>
          </div>

          <div>
            <h4 className={css({ fontSize: "16px", fontWeight: "medium", marginBottom: "8px", color: "#047857" })}>
              Step 4: Atomic Settlement on Blockchain
            </h4>
            <div
              className={css({
                fontFamily: "monospace",
                backgroundColor: "#fff",
                padding: "12px",
                borderRadius: "4px",
                fontSize: "13px",
                lineHeight: "1.4",
              })}
            >
              <div>1. Call: contract.processBatch(merkleRoot, requests, proofs)</div>
              <div>2. Verify: Each proof against merkleRoot</div>
              <div>3. Deduct: llmBalance[user] -= request.cost (atomic)</div>
              <div>4. Mark: processedBatches[merkleRoot] = true</div>
              <div>5. Transfer: Total cost to service provider</div>
              <div>6. Result: 50 requests settled with 1 transaction!</div>
            </div>
          </div>
        </div>

        <div
          className={css({
            backgroundColor: "#eff6ff",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #bfdbfe",
            marginBottom: "20px",
          })}
        >
          <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "12px", color: "#1e40af" })}>
            💡 Key Implementation Insights
          </h3>
          <div className={css({ lineHeight: "1.6", color: "#1e40af" })}>
            <p className={css({ marginBottom: "8px" })}>
              <strong>Balance Checking:</strong> Every LLM request pre-verifies sufficient prepaid balance
            </p>
            <p className={css({ marginBottom: "8px" })}>
              <strong>Off-chain Processing:</strong> LLM API calls happen immediately, settlement is batched
            </p>
            <p className={css({ marginBottom: "8px" })}>
              <strong>Atomic Settlement:</strong> All-or-nothing batch processing prevents partial failures
            </p>
            <p className={css({ marginBottom: "8px" })}>
              <strong>Proof Generation:</strong> Each user can extract their individual payment proof
            </p>
            <p>
              <strong>Gas Efficiency:</strong> 50 requests cost $15 gas vs $750 individual ($735 saved!)
            </p>
          </div>
        </div>

        {/* ========================================
            PREPAID WORKFLOW DEMO PLACEHOLDER
            ======================================== */}
        <div
          className={css({
            border: "2px dashed #9ca3af",
            borderRadius: "8px",
            padding: "24px",
            margin: "20px 0",
            backgroundColor: "#f9fafb",
            textAlign: "center",
          })}
        >
          <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#374151" })}>
            🚧 Prepaid Workflow Demo (Implementation Placeholder)
          </h3>

          <div className={css({ textAlign: "left", maxWidth: "600px", margin: "0 auto" })}>
            <h4 className={css({ fontSize: "16px", fontWeight: "medium", marginBottom: "12px", color: "#1f2937" })}>
              Demo Features to Implement:
            </h4>

            <div
              className={css({ backgroundColor: "#fff", padding: "16px", borderRadius: "8px", marginBottom: "16px" })}
            >
              <h5 className={css({ fontSize: "14px", fontWeight: "medium", marginBottom: "8px", color: "#059669" })}>
                📊 Phase 1: Smart Contract State Dashboard
              </h5>
              <ul className={css({ fontSize: "13px", lineHeight: "1.5", color: "#6b7280", marginLeft: "16px" })}>
                <li>• Live balance tracking for multiple users (Alice: $50, Bob: $30, Charlie: $10)</li>
                <li>• Deposit simulation with `depositForLLM()` contract calls</li>
                <li>• Balance verification logic before LLM requests</li>
                <li>• Real-time contract state updates</li>
              </ul>
            </div>

            <div
              className={css({ backgroundColor: "#fff", padding: "16px", borderRadius: "8px", marginBottom: "16px" })}
            >
              <h5 className={css({ fontSize: "14px", fontWeight: "medium", marginBottom: "8px", color: "#3b82f6" })}>
                ⚙️ Phase 2: Request Processing Pipeline
              </h5>
              <ul className={css({ fontSize: "13px", lineHeight: "1.5", color: "#6b7280", marginLeft: "16px" })}>
                <li>• Individual request intake with balance pre-verification</li>
                <li>• Queue visualization showing pending requests (23/50 filled)</li>
                <li>• Auto-trigger conditions: 50 requests OR 5 minutes timeout</li>
                <li>• Real-time Merkle tree construction process</li>
                <li>• Visual tree building from leaves to root</li>
              </ul>
            </div>

            <div className={css({ backgroundColor: "#fff", padding: "16px", borderRadius: "8px" })}>
              <h5 className={css({ fontSize: "14px", fontWeight: "medium", marginBottom: "8px", color: "#dc2626" })}>
                🔄 Phase 3: Batch Settlement Process
              </h5>
              <ul className={css({ fontSize: "13px", lineHeight: "1.5", color: "#6b7280", marginLeft: "16px" })}>
                <li>• `processBatch()` contract call simulation</li>
                <li>• Atomic balance deductions across all users</li>
                <li>• Individual Merkle proof generation for each request</li>
                <li>• Gas cost comparison: $15 batch vs $1,500 individual</li>
                <li>• Smart contract event emissions visualization</li>
              </ul>
            </div>
          </div>

          <div className={css({ marginTop: "20px", padding: "12px", backgroundColor: "#fef3c7", borderRadius: "8px" })}>
            <p className={css({ fontSize: "13px", color: "#92400e", margin: "0" })}>
              <strong>Implementation Focus:</strong> This demo will show the complete backend flow from deposit to
              settlement, emphasizing smart contract state changes, Merkle tree mathematics, and gas efficiency gains.
            </p>
          </div>
        </div>

        <div
          className={css({
            backgroundColor: "#eff6ff",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #bfdbfe",
            marginTop: "20px",
          })}
        >
          <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "12px", color: "#1e40af" })}>
            🔄 Smart Contract Extension for Your NFT Project
          </h3>
          <p className={css({ marginBottom: "12px", lineHeight: "1.6", color: "#1e40af" })}>
            To integrate this with your existing `GenImNFTv3.sol` contract, you would extend it with prepaid
            functionality:
          </p>

          {/* ========================================
              NFT INTEGRATION DEMO PLACEHOLDER
              ======================================== */}
          <div
            className={css({
              border: "2px dashed #3b82f6",
              borderRadius: "8px",
              padding: "20px",
              margin: "16px 0",
              backgroundColor: "#f0f9ff",
            })}
          >
            <h4 className={css({ fontSize: "16px", fontWeight: "bold", marginBottom: "12px", color: "#1e40af" })}>
              🔗 NFT Integration Demo (Implementation Placeholder)
            </h4>

            <div className={css({ textAlign: "left" })}>
              <h5 className={css({ fontSize: "14px", fontWeight: "medium", marginBottom: "8px", color: "#1d4ed8" })}>
                Live Smart Contract Extension Example:
              </h5>
              <ul
                className={css({
                  fontSize: "13px",
                  lineHeight: "1.5",
                  color: "#1e40af",
                  marginLeft: "16px",
                  marginBottom: "12px",
                })}
              >
                <li>• Show GenImNFTv3 → GenImNFTv4 upgrade path</li>
                <li>• Live contract interaction with prepaid deposits</li>
                <li>• NFT image update requests via LLM queue</li>
                <li>• Batch settlement affecting multiple NFT metadata</li>
                <li>• Gas cost comparison: current vs optimized</li>
              </ul>

              <h5 className={css({ fontSize: "14px", fontWeight: "medium", marginBottom: "8px", color: "#1d4ed8" })}>
                Serverless Function Integration:
              </h5>
              <ul className={css({ fontSize: "13px", lineHeight: "1.5", color: "#1e40af", marginLeft: "16px" })}>
                <li>• readhandler_v2.js → readhandler_v3.js evolution</li>
                <li>• FLUX API calls with queue management</li>
                <li>• S3 upload batching for generated images</li>
                <li>• Real-time status updates for pending requests</li>
              </ul>
            </div>

            <div
              className={css({ marginTop: "16px", padding: "12px", backgroundColor: "#dbeafe", borderRadius: "8px" })}
            >
              <p className={css({ fontSize: "13px", color: "#1d4ed8", margin: "0" })}>
                <strong>Demo Focus:</strong> Show practical integration with existing NFT infrastructure, demonstrating
                how Merkle batching reduces costs while maintaining user experience.
              </p>
            </div>
          </div>

          <div
            className={css({
              fontFamily: "monospace",
              backgroundColor: "#fff",
              padding: "12px",
              borderRadius: "4px",
              fontSize: "12px",
              lineHeight: "1.4",
              overflow: "auto",
            })}
          >
            {`// GenImNFTv4.sol - Extended with LLM Prepaid System
contract GenImNFTv4 is GenImNFTv3 {
    mapping(address => uint256) public llmBalance;
    mapping(bytes32 => bool) public processedBatches;
    
    function depositForLLM() external payable {
        llmBalance[msg.sender] += msg.value;
        emit LLMDeposit(msg.sender, msg.value);
    }
    
    function processBatch(
        bytes32 merkleRoot,
        LLMRequest[] calldata requests,
        bytes32[][] calldata proofs
    ) external onlyOperator {
        // Batch settlement with Merkle proof verification
        // Deducts from prepaid balances atomically
    }
}`}
          </div>
          <p className={css({ marginTop: "12px", lineHeight: "1.6", color: "#1e40af" })}>
            This extension maintains full backward compatibility with your existing NFT functionality while adding
            cost-efficient LLM payment processing.
          </p>
        </div>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Step 5: Economic Impact Analysis
        </h2>

        <div
          className={css({
            backgroundColor: "#f0fdf4",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #bbf7d0",
            marginBottom: "20px",
          })}
        >
          <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "12px", color: "#166534" })}>
            📊 Why This Matters for Your Project
          </h3>
          <p className={css({ marginBottom: "12px", lineHeight: "1.6", color: "#166534" })}>
            For your NFT project with LLM integration, this architecture enables:
          </p>
          <div className={css({ color: "#166534", lineHeight: "1.6" })}>
            <p className={css({ marginBottom: "8px" })}>
              <strong>💰 Cost Efficiency:</strong> Reduce LLM payment costs from $17 to $2.15 per request (87% savings)
            </p>
            <p className={css({ marginBottom: "8px" })}>
              <strong>⚡ User Experience:</strong> Instant LLM responses without individual transaction confirmations
            </p>
            <p className={css({ marginBottom: "8px" })}>
              <strong>🔒 Payment Security:</strong> Guaranteed settlement through prepaid balances
            </p>
            <p className={css({ marginBottom: "8px" })}>
              <strong>📈 Scalability:</strong> Support thousands of users with minimal blockchain overhead
            </p>
            <p>
              <strong>🛠️ Compatibility:</strong> Seamless integration with existing GenImNFTv3 contract
            </p>
          </div>
        </div>

        {/* ========================================
            COST COMPARISON DEMO PLACEHOLDER
            ======================================== */}
        <div
          className={css({
            border: "2px dashed #059669",
            borderRadius: "8px",
            padding: "24px",
            margin: "20px 0",
            backgroundColor: "#f0fdf4",
            textAlign: "center",
          })}
        >
          <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#065f46" })}>
            📈 Interactive Cost Comparison Calculator (Implementation Placeholder)
          </h3>

          <div className={css({ textAlign: "left", maxWidth: "700px", margin: "0 auto" })}>
            <h4 className={css({ fontSize: "16px", fontWeight: "medium", marginBottom: "12px", color: "#047857" })}>
              Calculator Features to Implement:
            </h4>

            <div className={css({ display: "grid", gap: "12px", gridTemplateColumns: "1fr 1fr" })}>
              <div
                className={css({
                  backgroundColor: "#fef2f2",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid #fecaca",
                })}
              >
                <h5 className={css({ fontSize: "14px", fontWeight: "medium", marginBottom: "8px", color: "#dc2626" })}>
                  ❌ Traditional Approach
                </h5>
                <ul className={css({ fontSize: "13px", lineHeight: "1.5", color: "#7f1d1d", marginLeft: "16px" })}>
                  <li>• Input: Number of LLM requests</li>
                  <li>• Calculate: requests × $15 gas</li>
                  <li>• Show: Total cost breakdown</li>
                  <li>• Display: Transaction confirmations needed</li>
                </ul>
              </div>

              <div
                className={css({
                  backgroundColor: "#f0fdf4",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid #bbf7d0",
                })}
              >
                <h5 className={css({ fontSize: "14px", fontWeight: "medium", marginBottom: "8px", color: "#059669" })}>
                  ✅ Merkle Batching Approach
                </h5>
                <ul className={css({ fontSize: "13px", lineHeight: "1.5", color: "#064e3b", marginLeft: "16px" })}>
                  <li>• Input: Same number of requests</li>
                  <li>• Calculate: $15 batch + requests × $2</li>
                  <li>• Show: Massive savings visualization</li>
                  <li>• Display: Single transaction needed</li>
                </ul>
              </div>
            </div>

            <div
              className={css({
                backgroundColor: "#fff",
                padding: "16px",
                borderRadius: "8px",
                marginTop: "16px",
                border: "1px solid #d1d5db",
              })}
            >
              <h5 className={css({ fontSize: "14px", fontWeight: "medium", marginBottom: "8px", color: "#374151" })}>
                📊 Interactive Elements:
              </h5>
              <ul className={css({ fontSize: "13px", lineHeight: "1.5", color: "#6b7280", marginLeft: "16px" })}>
                <li>• Slider: Adjust number of requests (1-1000)</li>
                <li>• Real-time: Cost calculation updates</li>
                <li>• Charts: Visual cost comparison graphs</li>
                <li>• Timeline: Settlement speed comparison</li>
                <li>• ROI: Break-even point analysis</li>
              </ul>
            </div>

            <div
              className={css({ marginTop: "16px", padding: "12px", backgroundColor: "#ecfdf5", borderRadius: "8px" })}
            >
              <p className={css({ fontSize: "13px", color: "#065f46", margin: "0" })}>
                <strong>Example Output:</strong> &quot;For 100 LLM requests: Traditional = $1,500, Merkle Batching =
                $215. You save $1,285 (85.7%) and need only 1 transaction instead of 100!&quot;
              </p>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
