import React, { useState, useEffect } from "react";
import { css } from "../styled-system/css";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
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

const GENIMNET_WORKFLOW_DEFINITION = `sequenceDiagram
    Actor User
    participant Contract as GenImNFT Contract
    
    participant Serverless as Serverless Function
    participant AI as FLUX AI API
    participant S3 as S3 Storage
    Actor ServiceProvider as Image Creator Wallet

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
    Contract->>ServiceProvider: 7. Auto-pay service provider
    ServiceProvider-->>Contract: Payment confirmed`;

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

// Updated LLM Prepaid Workflow with Merkle Batching
const UPDATED_LLM_WORKFLOW_DEFINITION = `sequenceDiagram
    Actor Alice as Alice
    participant Contract as LLM Contract
    participant Serverless as Serverless Function
    participant LLM as LLM API
    participant MerkleTree as Merkle Tree on S3 Storage
    Actor Blockchain as LLM Wallet

    Note over Alice,Contract: Phase 1: Prepaid Deposit
    Alice->>Contract: depositForLLM() - $50
    Contract->>Contract: Update balance[Alice] = $50

    Note over Alice,Blockchain: Phase 2: LLM Request Processing (Off-chain)
    Alice->>Serverless: Request: "Analyze sentiment"
    Serverless->>Contract: Check balance: Alice $50 ≥ $2 ✅
    Serverless->>LLM: Call LLM API
    LLM-->>Serverless: Generated response
    Serverless-->>Alice: LLM Response
    Serverless->>MerkleTree: Create leaf from call

    Note over Serverless,MerkleTree: Phase 3: Batch Trigger (Once the Merkle tree is ready)
    MerkleTree->>MerkleTree: Calculate root hash
    MerkleTree->>MerkleTree: Generate proof for Alice's request

    Note over Contract,Blockchain: Phase 4: Atomic Settlement (On-chain)
    MerkleTree->>Contract: processBatch(root, requests, proofs)
    Contract->>Contract: Verify Alice's proof
    Contract->>Contract: Deduct: Alice -= $2
    Contract->>Contract: Mark batch as processed
    Contract->>Blockchain: Single transaction ($15 gas for entire batch)
    Contract-->>Alice: Settlement confirmed + individual proof`;

// Export meta for blog post
export const meta = {
  title: "Merkle Trees for LLM API Batching: Cost-Optimized Blockchain Payments for AI Services",
  publishing_date: "2025-07-29",
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

// Sample data for demonstrations
const sampleBatch = {
  merkleRoot: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
  requests: [
    {
      id: 1,
      owner: "0xUser1Address...",
      prompt: "Analyze the sentiment of this customer review: 'The product is amazing!'",
      leafData: {
        id: 1,
        timestamp: "2024-01-15T10:30:00.000Z",
        tokenCount: 150,
        wallet: "0xUser1Address...",
      },
      leafHash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    },
    {
      id: 2,
      owner: "0xUser2Address...",
      prompt: "Translate this text to German: 'Hello, how are you today?'",
      leafData: {
        id: 2,
        timestamp: "2024-01-15T10:32:00.000Z",
        tokenCount: 120,
        wallet: "0xUser2Address...",
      },
      leafHash: "0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c",
    },
    {
      id: 3,
      owner: "0xUser3Address...",
      prompt: "Write a short Python function to calculate fibonacci numbers",
      leafData: {
        id: 3,
        timestamp: "2024-01-15T10:35:00.000Z",
        tokenCount: 180,
        wallet: "0xUser3Address...",
      },
      leafHash: "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d",
    },
  ],
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
  proof: { data: string; position: "left" | "right" }[];
  root: string;
}

// Generate a Merkle Proof using OpenZeppelin StandardMerkleTree
const generateMerkleProof = async (leafIndex: number): Promise<MerkleProof> => {
  const selectedRequest = sampleBatch.requests[leafIndex];

  // Prepare tree data in the same format as calculateMerkleRoot
  const treeData = sampleBatch.requests.map((req) => [
    req.leafData.id,
    req.leafData.timestamp,
    req.leafData.tokenCount,
    req.leafData.wallet,
  ]);

  // Define types for demo (simplified version of production REQUEST_TYPES)
  const demoTypes = ["uint256", "string", "uint256", "string"];

  // Create StandardMerkleTree
  const tree = StandardMerkleTree.of(treeData, demoTypes);

  // Get proof for the specific leaf
  const proof = tree.getProof(leafIndex);
  const root = tree.root;

  return {
    leafIndex,
    leafData: selectedRequest.leafData,
    leafHash: selectedRequest.leafHash,
    proof: proof.map((hash, index) => ({
      data: hash,
      position: (index % 2 === 0 ? "left" : "right") as "left" | "right",
    })),
    root: root,
  };
};

// Validate a Merkle Proof using OpenZeppelin StandardMerkleTree
const validateMerkleProof = async (
  proof: MerkleProof,
): Promise<{ isValid: boolean; message: string; steps: string[] }> => {
  try {
    // Recreate the tree using StandardMerkleTree for validation
    const allRequests = sampleBatch.requests;

    // Convert to the same format used in generation
    const treeData = allRequests.map((req) => [
      req.leafData.id,
      req.leafData.timestamp,
      req.leafData.tokenCount,
      req.leafData.wallet,
    ]);

    const demoTypes = ["uint256", "string", "uint256", "string"];
    const tree = StandardMerkleTree.of(treeData, demoTypes);

    // Get the specific leaf data for verification
    const leafData = [proof.leafData.id, proof.leafData.timestamp, proof.leafData.tokenCount, proof.leafData.wallet];

    // Convert proof format from our custom format back to StandardMerkleTree format
    const standardProof = proof.proof.map((p) => p.data);

    // Use StandardMerkleTree's built-in verification
    const isValid = StandardMerkleTree.verify(tree.root, demoTypes, leafData, standardProof);

    // Additional check: verify the leaf exists in the tree
    let leafExists = false;
    let foundIndex = -1;
    for (const [index, value] of tree.entries()) {
      if (JSON.stringify(value) === JSON.stringify(leafData)) {
        leafExists = true;
        foundIndex = index;
        break;
      }
    }

    const steps = [
      `✅ Used OpenZeppelin StandardMerkleTree.verify()`,
      `📋 Leaf Data: [${leafData.join(", ")}]`,
      `🌳 Tree Root: ${tree.root.substring(0, 16)}...`,
      `🔍 Proof Root: ${proof.root.substring(0, 16)}...`,
      `📍 Leaf Index: ${foundIndex} (expected: ${proof.leafIndex})`,
      `🎯 Root Match: ${tree.root === proof.root}`,
      `🔍 Leaf Exists: ${leafExists}`,
      `${isValid ? "✅ Verification: VALID" : "❌ Verification: INVALID"}`,
    ];

    return {
      isValid: isValid && leafExists && tree.root === proof.root,
      message:
        isValid && leafExists
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

// Calculate Merkle Root using OpenZeppelin StandardMerkleTree
const calculateMerkleRoot = async (requests: LLMRequest[]): Promise<string> => {
  if (requests.length === 0) return "";

  // Use the actual leaf data from requests
  const treeData = requests.map((req) => [
    req.leafData!.id,
    req.leafData!.timestamp,
    req.leafData!.tokenCount,
    req.leafData!.wallet,
  ]);

  // Define types for the tree
  const demoTypes = ["uint256", "string", "uint256", "string"];

  // Create StandardMerkleTree
  const tree = StandardMerkleTree.of(treeData, demoTypes);

  return tree.root;
};

// Function to visualize the Merkle Tree structure using StandardMerkleTree
const visualizeMerkleTree = async (requests: LLMRequest[]): Promise<string> => {
  if (requests.length === 0) return "";

  // Use the same leaf data format as calculateMerkleRoot
  const treeData = requests.map((req) => [
    req.leafData!.id,
    req.leafData!.timestamp,
    req.leafData!.tokenCount,
    req.leafData!.wallet,
  ]);

  const demoTypes = ["uint256", "string", "uint256", "string"];
  const tree = StandardMerkleTree.of(treeData, demoTypes);

  let visualization = "Merkle Tree (OpenZeppelin StandardMerkleTree):\n";
  visualization += `Root: ${tree.root.substring(0, 16)}...\n`;

  // Display tree structure
  visualization += "\nTree Structure:\n";
  for (const [index, value] of tree.entries()) {
    const leafHash = tree.leafHash(value);
    visualization += `Leaf ${index + 1}: ${leafHash.substring(0, 16)}... (${value[0]}, ${value[3]})\n`;
  }

  return visualization;
};

// Interactive Batch Creator Component
const BATCH_SIZE_THRESHOLD = 4; // Small threshold for demo purposes

const BatchCreator: React.FC = () => {
  const [requests, setRequests] = useState<LLMRequest[]>([]);
  const [merkleRoot, setMerkleRoot] = useState<string>("");
  const [merkleTreeVisualization, setMerkleTreeVisualization] = useState<string>("");
  const [batchRegistered, setBatchRegistered] = useState(false);
  const [nextRequestId, setNextRequestId] = useState(1);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [currentWallet, setCurrentWallet] = useState(mockWallets[0]);
  // Simulate sending an LLM call (using StandardMerkleTree for consistency)
  const sendLLMCall = async (wallet: string, prompt: string) => {
    // Create leaf data
    const leafData = {
      id: nextRequestId,
      timestamp: new Date().toISOString(),
      tokenCount: Math.floor(Math.random() * 200) + 100,
      wallet: wallet,
    };

    // Calculate leaf hash using StandardMerkleTree for consistency
    const leafArray = [leafData.id, leafData.timestamp, leafData.tokenCount, leafData.wallet];
    const demoTypes = ["uint256", "string", "uint256", "string"];

    // Create a temporary tree to get the leaf hash
    const tempTree = StandardMerkleTree.of([leafArray], demoTypes);
    const leafHash = tempTree.leafHash(leafArray);

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
              {/* Prompt & Response (not part of leaf/hash) */}
              <div className={css({ marginBottom: "0.5rem" })}>
                <div className={css({ fontWeight: 500, fontSize: "0.92rem", marginBottom: "0.15rem", color: "#444" })}>
                  Prompt (not part of Merkle-Leafs):
                </div>
                <div
                  className={css({
                    fontSize: "0.92rem",
                    fontFamily: "monospace",
                    backgroundColor: "#fafbfc",
                    padding: "0.35rem 0.6rem",
                    borderRadius: "3px",
                    border: "1px solid #e5e7eb",
                    marginBottom: "0.3rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  })}
                >
                  {request.prompt}
                </div>
                <div className={css({ fontWeight: 500, fontSize: "0.92rem", marginBottom: "0.15rem", color: "#444" })}>
                  Response (not part of Merkle-Leafs):
                </div>
                <div
                  className={css({
                    fontSize: "0.92rem",
                    fontFamily: "monospace",
                    backgroundColor: "#fafbfc",
                    padding: "0.35rem 0.6rem",
                    borderRadius: "3px",
                    border: "1px solid #e5e7eb",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  })}
                >
                  {request.response}
                </div>
              </div>

              {/* Leaf Data */}
              {request.leafData && (
                <div className={css({ marginBottom: "0.5rem" })}>
                  <div
                    className={css({
                      fontWeight: 500,
                      fontSize: "0.92rem",
                      marginBottom: "0.18rem",
                      color: "#222",
                    })}
                  >
                    Merkle Leaf Data R<sub>{index + 1}</sub> (used for hash):
                  </div>
                  <pre
                    className={css({
                      fontSize: "0.78rem",
                      fontFamily: "monospace",
                      backgroundColor: "#fafbfc",
                      padding: "0.45rem 0.6rem",
                      borderRadius: "3px",
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
                  <div
                    className={css({
                      fontWeight: 500,
                      fontSize: "0.92rem",
                      marginBottom: "0.18rem",
                      color: "#222",
                    })}
                  >
                    Merkle Leaf Hash H<sub>{index + 1}</sub>:
                  </div>
                  <code
                    className={css({
                      fontSize: "0.78rem",
                      fontFamily: "monospace",
                      backgroundColor: "#f3f4f6",
                      padding: "0.22rem 0.5rem",
                      borderRadius: "3px",
                      border: "1px solid #e5e7eb",
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

        <MermaidDiagram definition={MERKLE_TREE_MATH_DEFINITION} title="Merkle Tree Mathematical Foundation" />
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
          <MermaidDiagram definition={MERKLE_PROOF_PATH_DEFINITION} title="🔍 Merkle Proof Path for Request 3 (R₃)" />
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

      <section>
        <h2>From Theory to Practice - Prepaid Settlement Workflow</h2>

        <p>
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

        <MermaidDiagram
          definition={UPDATED_LLM_WORKFLOW_DEFINITION}
          title="LLM Workflow with Merkle Tree Batching"
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

        <h3>Required features from each participant</h3>
        <p>
          The workflow diagram above shows Alice&apos;s complete journey through our Merkle tree batching system.
          Let&apos;s break down what is required from each participant in the system:
        </p>

        <h4>Alice (User) and similiar the LLM Wallet</h4>
        <p>
          The requirements on the two wallets to not really change compare to the image generation. So this is straight
          forward.
        </p>
        <p>
          <strong>Role of Alice:</strong> End user who wants to use LLM services with blockchain payments
        </p>
        <p>
          <strong>Role of the LLM Wallet:</strong> Receives payments for providing LLM services
        </p>
        <p>
          <strong>Required Functions:</strong>
        </p>
        <ul>
          <li>Alice&apos; Wallet with ETH balance for initial deposit</li>
          <li>Web3 connection to interact with smart contract</li>
          <li>UI to send LLM requests and view responses</li>
          <li>Ability to check balance and request history</li>
        </ul>

        <h4>LLM API (AI Service)</h4>
        <p>
          The requirements on the LLM API also does not really change compared to the case of generating images. It it
          simple really nice if it is OpenAI compatible but thiat is. wallets to not really change compare to the image
          generation. So this is straight forward.
        </p>
        <p>
          <strong>Role:</strong> External AI service provider (OpenAI, Anthropic, etc.)
        </p>
        <p>
          <strong>Required Features:</strong>
        </p>
        <ul>
          <li>RESTful API endpoint for completions</li>
          <li>Authentication via API keys</li>
          <li>Token counting for cost calculation</li>
          <li>Consistent response format</li>
        </ul>

        <h4>LLM Contract (Smart Contract)</h4>
        <p>
          <strong>Role:</strong> Central coordinator for deposits, balance tracking, and batch settlement
        </p>
        <p>
          <strong>Key Difference to GenImNFT:</strong> While the GenImNFT contract handles immediate payments and
          minting for each request, the LLM contract uses a prepaid model with batch settlement. This makes it simpler
          in terms of individual transaction processing but more complex in batch verification logic.
        </p>
        <p>
          <strong>Required Functions:</strong>
        </p>
        <ul>
          <li>
            <code>depositForLLM()</code> - Accept user deposits
          </li>
          <li>
            <code>checkBalance(address user)</code> - Return user&apos;s available balance
          </li>
          <li>
            <code>processBatch(bytes32 root, Request[] requests, bytes32[][] proofs)</code> - Verify and settle batches
          </li>
          <li>
            <code>verifyMerkleProof()</code> - Validate individual transaction proofs
          </li>
          <li>
            <code>withdrawBalance()</code> - Allow users to withdraw remaining funds
          </li>
        </ul>
        <div
          className={css({
            fontSize: "13px",
            fontFamily: "monospace",
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            marginBottom: "16px",
          })}
        >
          {/* Smart Contract Dependencies */}
          <br />
          import &quot;@openzeppelin/contracts/utils/cryptography/MerkleProof.sol&quot;;
          <br />
          import &quot;@openzeppelin/contracts/access/Ownable.sol&quot;;
          <br />
          <br />
          {/* Request struct definition - Simplified for efficient Merkle tree processing */}
          <br />
          struct Request {`{`}
          <br />
          &nbsp;&nbsp;bytes32 id; // Unique request identifier
          <br />
          &nbsp;&nbsp;string timestamp; // ISO timestamp string
          <br />
          &nbsp;&nbsp;uint256 tokenCount; // Number of tokens consumed
          <br />
          &nbsp;&nbsp;address wallet; // User's wallet address
          <br />
          {`}`}
          <br />
          <br />
          mapping(address =&gt; uint256) public llmBalance;
          <br />
          mapping(bytes32 =&gt; bool) public processedBatches;
          <br />
          event LLMDeposit(address user, uint256 amount);
          <br />
          event BatchProcessed(bytes32 root, uint256 totalCost);
        </div>

        <h5>🔍 Detailed Function Analysis</h5>

        <p>
          <strong>1. checkBalance(address user) → uint256</strong>
        </p>
        <p>
          <strong>Return Value:</strong> The user&apos;s <em>currently available</em> balance (funds deposited minus
          already processed batches).
          <br />
          <strong>Important:</strong> This does NOT account for pending requests in unprocessed Merkle trees. This means
          users could theoretically spend more than their balance if multiple requests are made before batch processing.
        </p>
        <div
          className={css({
            fontSize: "13px",
            fontFamily: "monospace",
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            marginBottom: "16px",
          })}
        >
          function checkBalance(address user) public view returns (uint256) {`{`}
          <br />
          &nbsp;&nbsp;return llmBalance[user]; // Only settled balance
          <br />
          &nbsp;&nbsp;// Does NOT subtract pending requests!
          <br />
          {`}`}
          <br />
          <br />
          {/* Off-chain check needed for pending requests: */}
          <br />
          {/* actualAvailable = onChainBalance - pendingRequestsCost */}
        </div>

        <p>
          <strong>2. verifyMerkleProof()</strong>
        </p>
        <p>
          <strong>Gas Cost Clarification:</strong> The <code>verifyMerkleProof()</code> function is marked as{" "}
          <code>pure</code> and only performs computations without state changes, so it costs{" "}
          <strong>no gas when called directly</strong>. Gas is only consumed when it&apos;s called within{" "}
          <code>processBatch()</code> as part of a transaction.
        </p>
        <div
          className={css({
            fontSize: "13px",
            fontFamily: "monospace",
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            marginBottom: "16px",
          })}
        >
          {/* Recommended: Use OpenZeppelin's MerkleProof library */}
          <br />
          import &quot;@openzeppelin/contracts/utils/cryptography/MerkleProof.sol&quot;;
          <br />
          <br />
          function verifyMerkleProof(
          <br />
          &nbsp;&nbsp;bytes32[] memory proof,
          <br />
          &nbsp;&nbsp;bytes32 root,
          <br />
          &nbsp;&nbsp;bytes32 leaf) public pure returns (bool) {`{`}
          <br />
          &nbsp;&nbsp;return MerkleProof.verify(proof, root, leaf);
          <br />
          {`}`}
          <br />
          <br />
          {/* Alternative: Custom implementation (not recommended) */}
          <br />
          {/* function verifyMerkleProofCustom(...) { ... } */}
        </div>

        <p>
          <strong>3. processBatch() - The Core Settlement Function</strong>
        </p>
        <p>
          This function processes an entire batch of LLM requests in a single transaction. It verifies each proof,
          deducts costs from user balances, and pays the service provider.
        </p>
        <div
          className={css({
            fontSize: "13px",
            fontFamily: "monospace",
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            marginBottom: "32px",
          })}
        >
          function processBatch(
          <br />
          &nbsp;&nbsp;bytes32 merkleRoot,
          <br />
          &nbsp;&nbsp;Request[] memory requests,
          <br />
          &nbsp;&nbsp;bytes32[][] memory proofs) external onlyAuthorized {`{`}
          <br />
          &nbsp;&nbsp;require(!processedBatches[merkleRoot], &quot;Batch already processed&quot;);
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;uint256 totalCost = 0;
          <br />
          &nbsp;&nbsp;for (uint256 i = 0; i &lt; requests.length; i++) {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;// 1. Create leaf hash from request data
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;bytes32 leaf = keccak256(abi.encode(requests[i]));
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;// 2. Verify proof against merkle root
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;require(verifyMerkleProof(proofs[i], merkleRoot, leaf), &quot;Invalid proof&quot;);
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;// 3. Deduct cost from user balance
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;require(llmBalance[requests[i].user] &gt;= requests[i].cost, &quot;Insufficient
          balance&quot;);
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;llmBalance[requests[i].user] -= requests[i].cost;
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;totalCost += requests[i].cost;
          <br />
          &nbsp;&nbsp;{`}`}
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;// 4. Pay service provider
          <br />
          &nbsp;&nbsp;payable(serviceProvider).transfer(totalCost);
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;// 5. Mark batch as processed
          <br />
          &nbsp;&nbsp;processedBatches[merkleRoot] = true;
          <br />
          &nbsp;&nbsp;emit BatchProcessed(merkleRoot, totalCost);
          <br />
          {`}`}
        </div>

        <h4>⚡ Serverless Functions (Backend Services)</h4>
        <p>
          <strong>Role:</strong> Request handler and coordinator between users, blockchain, and AI services
        </p>
        <p>
          Based on the existing image generation functions ( <code>scw_js/image_service.js</code> and{" "}
          <code>scw_js/readhandler_v2.js</code>), the LLM system requires two main serverless functions with enhanced
          capabilities for batch processing:
        </p>

        <h5>
          🔧 Function 1: LLM Request Handler (<code>llm_handler.js</code>)
        </h5>
        <p>
          <strong>Comparison to Image Handler:</strong> Similar to <code>readhandler_v2.js</code> but with instant
          response capability and batch queuing instead of immediate blockchain settlement.
        </p>

        <div
          className={css({
            fontSize: "13px",
            fontFamily: "monospace",
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            marginBottom: "16px",
          })}
        >
          import {`{`} getContract, createPublicClient, http {`}`} from &quot;viem&quot;;
          <br />
          import {`{`} optimism {`}`} from "viem/chains";
          <br />
          import {`{`} llmContractAbi {`}`} from "./llm_abi.js";
          <br />
          import {`{`} callLLMAPI, createLeafData, queueForBatch {`}`} from "./llm_service.js";
          <br />
          <br />
          export async function handle(event, context, cb) {`{`}
          <br />
          &nbsp;&nbsp;// 1. Extract parameters (similar to image handler)
          <br />
          &nbsp;&nbsp;const prompt = event.queryStringParameters.prompt;
          <br />
          &nbsp;&nbsp;const userAddress = event.queryStringParameters.userAddress;
          <br />
          &nbsp;&nbsp;const model = event.queryStringParameters.model || "gpt-4-turbo";
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;if (!prompt || !userAddress) {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;return errorResponse("Missing prompt or userAddress", 400);
          <br />
          &nbsp;&nbsp;{`}`}
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;// 2. Check user balance on-chain (like mint price check)
          <br />
          &nbsp;&nbsp;const publicClient = createPublicClient({`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;chain: optimism,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;transport: http(),
          <br />
          &nbsp;&nbsp;{`}`});
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;const contract = getContract({`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;address: "0x[LLM_CONTRACT_ADDRESS]",
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;abi: llmContractAbi,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;client: {`{`} public: publicClient {`}`},
          <br />
          &nbsp;&nbsp;{`}`});
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;const userBalance = await contract.read.checkBalance([userAddress]);
          <br />
          &nbsp;&nbsp;const estimatedCost = estimateTokenCost(prompt, model);
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;if (userBalance &lt; estimatedCost) {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;return errorResponse("Insufficient balance", 402);
          <br />
          &nbsp;&nbsp;{`}`}
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;// 3. Call LLM API immediately (unlike delayed image generation)
          <br />
          &nbsp;&nbsp;const llmResponse = await callLLMAPI(prompt, model);
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;// 4. Create leaf data for Merkle tree
          <br />
          &nbsp;&nbsp;const leafData = createLeafData({`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;userAddress,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;prompt,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;response: llmResponse.content,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;tokenCount: llmResponse.usage.total_tokens,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;cost: estimatedCost,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;timestamp: new Date().toISOString(),
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;model
          <br />
          &nbsp;&nbsp;{`}`});
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;// 5. Queue for batch processing (new functionality)
          <br />
          &nbsp;&nbsp;await queueForBatch(leafData);
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;// 6. Return immediate response (unlike image generation)
          <br />
          &nbsp;&nbsp;return {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;statusCode: 200,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;headers: {`{`} "Content-Type": "application/json" {`}`},
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;body: JSON.stringify({`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;response: llmResponse.content,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;tokenCount: llmResponse.usage.total_tokens,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;cost: estimatedCost,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;leafId: leafData.id,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;userBalance: userBalance.toString(),
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;message: "Request processed, queued for batch settlement"
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;{`}`})
          <br />
          &nbsp;&nbsp;{`}`};
          <br />
          {`}`}
        </div>

        <h5>
          🔧 Function 2: LLM Service Module (<code>llm_service.js</code>)
        </h5>
        <p>
          <strong>Comparison to Image Service:</strong> Enhanced version of <code>image_service.js</code> with LLM API
          integration and Merkle tree batch management instead of S3 image uploads.
        </p>

        <div
          className={css({
            fontSize: "13px",
            fontFamily: "monospace",
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            marginBottom: "16px",
          })}
        >
          import {`{`} S3Client, PutObjectCommand, GetObjectCommand {`}`} from &quot;@aws-sdk/client-s3&quot;;
          <br />
          import {`{`} randomBytes {`}`} from &quot;crypto&quot;;
          <br />
          import {`{`} StandardMerkleTree {`}`} from &quot;@openzeppelin/merkle-tree&quot;;
          <br />
          <br />
          {/* Configuration (similar to image_service.js) */}
          <br />
          const LLM_ENDPOINT = &quot;https://api.openai.com/v1/chat/completions&quot;;
          <br />
          const BATCH_BUCKET = &quot;llm-batches&quot;;
          <br />
          const BATCH_THRESHOLD = 50; {/* Trigger batch after 50 requests */}
          <br />
          const BATCH_TIMEOUT = 5 * 60 * 1000; {/* Or 5 minutes */}
          <br />
          <br />
          {/* Request data types for OpenZeppelin StandardMerkleTree */}
          <br />
          const REQUEST_TYPES = [
          <br />
          &nbsp;&nbsp;&quot;address&quot;, &quot;string&quot;, &quot;uint256&quot;, &quot;uint256&quot;,
          &quot;uint256&quot;, &quot;string&quot;
          <br />
          ];
          <br />
          <br />
          {/*
          <br />
          &nbsp;* Calls LLM API (enhanced with OpenZeppelin compatibility)
          <br />
          &nbsp;*/}
          <br />
          export async function callLLMAPI(prompt, model = &quot;gpt-4-turbo&quot;) {`{`}
          <br />
          &nbsp;&nbsp;const apiKey = process.env.OPENAI_API_KEY; {/* Or other LLM provider */}
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;const response = await fetch(LLM_ENDPOINT, {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;method: &quot;POST&quot;,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;headers: {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Authorization: `Bearer $${`{`}apiKey{`}`}`,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&quot;Content-Type&quot;: &quot;application/json&quot;,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;{`}`},
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;body: JSON.stringify({`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;model,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;messages: [{`{`} role: &quot;user&quot;, content: prompt {`}`}],
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;max_tokens: 2000,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;{`}`}),
          <br />
          &nbsp;&nbsp;{`}`});
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;if (!response.ok) {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;throw new Error(`LLM API Error: $${`{`}response.status{`}`}`);
          <br />
          &nbsp;&nbsp;{`}`}
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;const data = await response.json();
          <br />
          &nbsp;&nbsp;return {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;content: data.choices[0].message.content,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;usage: data.usage,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;model: data.model
          <br />
          &nbsp;&nbsp;{`}`};
          <br />
          {`}`}
          <br />
          <br />
          {/*
          <br />
          &nbsp;* Creates leaf data for OpenZeppelin StandardMerkleTree (enhanced functionality)
          <br />
          &nbsp;*/}
          <br />
          &nbsp;* Creates leaf data for Merkle tree (new functionality)
          <br />
          &nbsp;*/
          <br />
          export function createLeafData(requestData) {`{`}
          <br />
          &nbsp;&nbsp;// Return simplified leaf data structure optimized for Merkle tree
          <br />
          &nbsp;&nbsp;// This matches the format used in the proof demo: (id, timestamp, tokenCount, wallet)
          <br />
          &nbsp;&nbsp;return {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;id: randomBytes(16).toString("hex"),
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;timestamp: requestData.timestamp,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;tokenCount: requestData.tokenCount,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;wallet: requestData.userAddress
          <br />
          &nbsp;&nbsp;{`}`};
          <br />
          {`}`}
          <br />
          <br />
          /**
          <br />
          &nbsp;* Queues leaf data for batch processing (replaces uploadToS3 for metadata)
          <br />
          &nbsp;*/
          <br />
          export async function queueForBatch(leafData) {`{`}
          <br />
          &nbsp;&nbsp;// Upload to S3 pending batch folder (similar to uploadToS3)
          <br />
          &nbsp;&nbsp;const fileName = `pending/$${`{`}leafData.id{`}`}.json`;
          <br />
          &nbsp;&nbsp;await uploadToS3(leafData, fileName);
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;// Check if batch threshold reached
          <br />
          &nbsp;&nbsp;const pendingCount = await getPendingRequestCount();
          <br />
          &nbsp;&nbsp;if (pendingCount &gt;= BATCH_THRESHOLD) {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;await triggerBatchProcessing();
          <br />
          &nbsp;&nbsp;{`}`}
          <br />
          {`}`}
        </div>

        <h5>
          🔧 Function 3: Batch Processor (<code>batch_processor.js</code>)
        </h5>
        <p>
          <strong>New Functionality:</strong> This function has no equivalent in the image generation system. It handles
          the batch aggregation and Merkle tree construction that enables cost-efficient blockchain settlement.
        </p>

        <div
          className={css({
            fontSize: "13px",
            fontFamily: "monospace",
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            marginBottom: "16px",
          })}
        >
          {/* Processes pending requests into a Merkle tree batch */}
          <br />
          {/* UPDATED: Now uses @openzeppelin/merkle-tree for guaranteed contract compatibility */}
          <br />
          export async function triggerBatchProcessing() {`{`}
          <br />
          &nbsp;&nbsp;{/* 1. Collect all pending requests from S3 */}
          <br />
          &nbsp;&nbsp;const pendingRequests = await getAllPendingRequests();
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;{/* 2. Prepare data for StandardMerkleTree */}
          <br />
          &nbsp;&nbsp;const treeData = pendingRequests.map(req =&gt; [
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;req.userAddress, {/* user: address */}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;req.prompt, {/* prompt: string */}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;req.tokenCount, {/* tokenCount: uint256 */}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;req.cost, {/* cost: uint256 */}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;Math.floor(new Date(req.timestamp).getTime() / 1000), {/* timestamp: uint256 */}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;req.model {/* model: string */}
          <br />
          &nbsp;&nbsp;]);
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;{/* 3. Build StandardMerkleTree with exact type matching */}
          <br />
          &nbsp;&nbsp;const tree = StandardMerkleTree.of(treeData, REQUEST_TYPES);
          <br />
          &nbsp;&nbsp;const merkleRoot = tree.root;
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;{/* 4. Generate proofs in OpenZeppelin format */}
          <br />
          &nbsp;&nbsp;const proofs = [];
          <br />
          &nbsp;&nbsp;const contractRequests = [];
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;for (const [index, value] of tree.entries()) {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;const proof = tree.getProof(index);
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;proofs.push(proof);
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;{/* Convert array back to Request struct format */}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;contractRequests.push({`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;user: value[0],
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;prompt: value[1],
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;tokenCount: value[2],
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;cost: value[3],
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;timestamp: value[4],
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;model: value[5]
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;{`}`});
          <br />
          &nbsp;&nbsp;{`}`}
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;{/* 5. Submit to smart contract with OpenZeppelin-compatible format */}
          <br />
          &nbsp;&nbsp;const txHash = await submitBatchToContract(
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;merkleRoot, {/* Root as hex string */}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;contractRequests, {/* Request[] format */}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;proofs {/* bytes32[][] format (OpenZeppelin standard) */}
          <br />
          &nbsp;&nbsp;);
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;{/* 6. Archive processed batch */}
          <br />
          &nbsp;&nbsp;await archiveBatch(contractRequests, txHash);
          <br />
          <br />
          &nbsp;&nbsp;return {`{`} root: merkleRoot, txHash, processedCount: contractRequests.length {`}`};
          <br />
          {`}`}
          <br />
          <br />
          {/*
          <br />
          &nbsp;* Submits batch to smart contract (similar to updateTokenWithImage)
          <br />
          {/* Smart contract submission with OpenZeppelin compatibility */}
          <br />
          async function submitBatchToContract(merkleRoot, requests, proofs) {`{`}
          <br />
          &nbsp;&nbsp;const walletClient = createWalletClient({`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;account: privateKeyToAccount(process.env.LLM_WALLET_PRIVATE_KEY),
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;chain: optimism,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;transport: http(),
          <br />
          &nbsp;&nbsp;{`}`});
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;const contract = getContract({`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;address: process.env.LLM_CONTRACT_ADDRESS,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;abi: llmContractAbi,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;client: {`{`} wallet: walletClient {`}`},
          <br />
          &nbsp;&nbsp;{`}`});
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;{/* Call processBatch with OpenZeppelin-compatible format */}
          <br />
          &nbsp;&nbsp;const txHash = await contract.write.processBatch([
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;merkleRoot, {/* bytes32 root from StandardMerkleTree */}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;requests, {/* Request[] matching struct format */}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;proofs {/* bytes32[][] OpenZeppelin proof format */}
          <br />
          &nbsp;&nbsp;]);
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;return txHash;
          <br />
          {`}`}
        </div>

        <h5>📋 Key Differences from Image Generation Functions</h5>
        <table
          className={css({
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "16px",
            fontSize: "14px",
          })}
        >
          <thead>
            <tr className={css({ backgroundColor: "#f3f4f6" })}>
              <th className={css({ border: "1px solid #d1d5db", padding: "8px", textAlign: "left" })}>Aspect</th>
              <th className={css({ border: "1px solid #d1d5db", padding: "8px", textAlign: "left" })}>
                Image Generation
              </th>
              <th className={css({ border: "1px solid #d1d5db", padding: "8px", textAlign: "left" })}>
                LLM Processing
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px", fontWeight: "medium" })}>
                Response Time
              </td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>
                Delayed (async via blockchain update)
              </td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>Immediate (instant API response)</td>
            </tr>
            <tr>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px", fontWeight: "medium" })}>
                Payment Model
              </td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>
                Pay-per-transaction (immediate settlement)
              </td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>
                Prepaid balance (batch settlement)
              </td>
            </tr>
            <tr>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px", fontWeight: "medium" })}>
                Blockchain Interaction
              </td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>One transaction per image</td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>
                One transaction per batch (50+ requests)
              </td>
            </tr>
            <tr>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px", fontWeight: "medium" })}>
                Data Storage
              </td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>S3: Images + ERC-721 metadata</td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>
                S3: Request queue + Merkle proofs
              </td>
            </tr>
            <tr>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px", fontWeight: "medium" })}>
                Error Handling
              </td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>Blockchain revert on failure</td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>Individual request isolation</td>
            </tr>
            <tr>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px", fontWeight: "medium" })}>
                Scalability
              </td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>Limited by gas costs</td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>Scales with batch size</td>
            </tr>
          </tbody>
        </table>

        <h5>⚙️ Environment Configuration (serverless.yml)</h5>
        <div
          className={css({
            fontSize: "13px",
            fontFamily: "monospace",
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            marginBottom: "16px",
          })}
        >
          # Extended from existing serverless.yml
          <br />
          provider:
          <br />
          &nbsp;&nbsp;name: scaleway
          <br />
          &nbsp;&nbsp;runtime: node22
          <br />
          &nbsp;&nbsp;secret:
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;# Existing secrets
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;SCW_SECRET_KEY: $${`{`}env:SCW_SECRET_KEY{`}`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;SCW_ACCESS_KEY: $${`{`}env:SCW_ACCESS_KEY{`}`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;NFT_WALLET_PRIVATE_KEY: $${`{`}env:NFT_WALLET_PRIVATE_KEY{`}`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;# New LLM secrets
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;OPENAI_API_KEY: $${`{`}env:OPENAI_API_KEY{`}`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;LLM_WALLET_PRIVATE_KEY: $${`{`}env:LLM_WALLET_PRIVATE_KEY{`}`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;LLM_CONTRACT_ADDRESS: $${`{`}env:LLM_CONTRACT_ADDRESS{`}`}
          <br />
          <br />
          functions:
          <br />
          &nbsp;&nbsp;# Existing functions
          <br />
          &nbsp;&nbsp;readnftv2:
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;handler: readhandler_v2.handle
          <br />
          &nbsp;&nbsp;classicai:
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;handler: dec_ai.handle
          <br />
          &nbsp;&nbsp;# New LLM functions
          <br />
          &nbsp;&nbsp;llmhandler:
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;handler: llm_handler.handle
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;timeout: 30s # Longer timeout for LLM API calls
          <br />
          &nbsp;&nbsp;batchprocessor:
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;handler: batch_processor.handle
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;timeout: 60s # Longer timeout for batch processing
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;events:
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- schedule: rate(5 minutes) # Auto-trigger batches
        </div>
      </section>
    </article>
  );
}
