import React, { useState, useEffect } from "react";
import { css } from "../styled-system/css";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import MermaidDiagram from "../components/MermaidDiagram";
import { Link } from "../components/Link";

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

// Types for the interactive demos

// Export meta for blog post
export const meta = {
  title: " Merkle Trees for LLM Batching - The fundamentals",
  publishing_date: "2025-07-29",
  tokenID: 38,
  category: "blockchain",
  secondaryCategory: "ai",
  description:
    "I explore the fundamentals of Merkle trees for efficient LLM batching. Learn cryptographic proofs, batch verification, and AI service settlement optimization.",
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
const generateMerkleProof = (leafIndex: number): MerkleProof => {
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
      position: index % 2 === 0 ? "left" : "right",
    })),
    root: root,
  };
};

// Validate a Merkle Proof using OpenZeppelin StandardMerkleTree
const validateMerkleProof = (proof: MerkleProof): { isValid: boolean; message: string; steps: string[] } => {
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

  const handleGenerateProof = () => {
    try {
      const proof = generateMerkleProof(selectedUser);
      setGeneratedProof(proof);
    } catch (_error) {
      console.error("Error generating proof:", _error);
    }
  };

  const handleValidateProof = () => {
    try {
      const proof = JSON.parse(validationInput) as MerkleProof;
      const result = validateMerkleProof(proof);
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
        borderRadius: "lg",
        padding: "5",
        margin: "20px 0",
        backgroundColor: "codeBg",
      })}
    >
      <h3 className={css({ fontSize: "lg", fontWeight: "bold", marginBottom: "4" })}>
        🔍 Interactive Proof Demo: Alice&apos;s Story
      </h3>

      {/* Sample Batch Display */}
      <div
        className={css({
          marginBottom: "5",
          padding: "4",
          backgroundColor: "codeBg",
          borderRadius: "lg",
          border: "1px solid #d1d5db",
        })}
      >
        <h4 className={css({ fontSize: "md", fontWeight: "semibold", marginBottom: "3" })}>
          Sample Batch (Merkle Root: {sampleBatch.merkleRoot.substring(0, 20)}...)
        </h4>
        <div className={css({ display: "grid", gap: "2" })}>
          {sampleBatch.requests.map((req, index) => (
            <div
              key={req.id}
              className={css({
                padding: "8px 12px",
                backgroundColor: "white",
                borderRadius: "sm",
                border: "1px solid #d1d5db",
                fontSize: "sm",
              })}
            >
              <strong>{req.owner}</strong> (R<sub>{index + 1}</sub>): {req.prompt} - {req.leafData.tokenCount} tokens
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={css({ marginBottom: "4", borderBottom: "1px solid #e5e7eb" })}>
        <div className={css({ display: "flex", gap: "0" })}>
          <button
            onClick={() => setActiveTab("generate")}
            className={css({
              padding: "8px 16px",
              backgroundColor: activeTab === "generate" ? "codeBg" : "transparent",
              color: activeTab === "generate" ? "gray.700" : "gray.500",
              border: activeTab === "generate" ? "1px solid #d1d5db" : "1px solid transparent",
              borderBottom: activeTab === "generate" ? "1px solid #f9fafb" : "1px solid #e5e7eb",
              borderRadius: "4px 4px 0 0",
              cursor: "pointer",
              fontSize: "sm",
              fontWeight: activeTab === "generate" ? "medium" : "normal",
            })}
          >
            Generate Proof
          </button>
          <button
            onClick={() => setActiveTab("validate")}
            className={css({
              padding: "8px 16px",
              backgroundColor: activeTab === "validate" ? "codeBg" : "transparent",
              color: activeTab === "validate" ? "gray.700" : "gray.500",
              border: activeTab === "validate" ? "1px solid #d1d5db" : "1px solid transparent",
              borderBottom: activeTab === "validate" ? "1px solid #f9fafb" : "1px solid #e5e7eb",
              borderRadius: "4px 4px 0 0",
              cursor: "pointer",
              fontSize: "sm",
              fontWeight: activeTab === "validate" ? "medium" : "normal",
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
              marginBottom: "4",
              padding: "4",
              backgroundColor: "white",
              borderRadius: "sm",
              border: "1px solid #e5e7eb",
            })}
          >
            <h4 className={css({ fontSize: "md", fontWeight: "semibold", marginBottom: "3" })}>
              Step 1: Select User to Generate Proof
            </h4>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(Number(e.target.value))}
              className={css({
                width: "100%",
                padding: "2",
                border: "1px solid #d1d5db",
                borderRadius: "sm",
                marginBottom: "3",
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
                backgroundColor: "gray.700",
                color: "white",
                border: "1px solid #374151",
                borderRadius: "sm",
                cursor: "pointer",
                fontSize: "sm",
                "&:hover": {
                  backgroundColor: "gray.600",
                  borderColor: "gray.600",
                },
              })}
            >
              Generate Merkle Proof
            </button>
          </div>

          {generatedProof && (
            <div
              className={css({
                padding: "4",
                backgroundColor: "codeBg",
                borderRadius: "sm",
                border: "1px solid #e5e7eb",
              })}
            >
              <h4 className={css({ fontSize: "md", fontWeight: "semibold", marginBottom: "3", color: "gray.700" })}>
                Generated Proof for {sampleBatch.requests[selectedUser].owner}
              </h4>
              <div className={css({ marginBottom: "3" })}>
                <strong>Proof Path:</strong>
                <div className={css({ fontSize: "xs", fontFamily: "monospace", marginTop: "1" })}>
                  {generatedProof.proof.map((proofItem, index) => (
                    <div key={index}>
                      Level {index + 1}: {proofItem.data.substring(0, 20)}... ({proofItem.position})
                    </div>
                  ))}
                </div>
              </div>
              <div className={css({ marginBottom: "3" })}>
                <strong>Complete Proof JSON:</strong>
                <div className={css({ position: "relative" })}>
                  <pre
                    className={css({
                      fontSize: "xs",
                      fontFamily: "monospace",
                      backgroundColor: "white",
                      padding: "2",
                      borderRadius: "sm",
                      border: "1px solid #d1d5db",
                      overflow: "auto",
                      maxHeight: "200px",
                      marginTop: "1",
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
                      backgroundColor: "gray.500",
                      color: "white",
                      border: "none",
                      borderRadius: "sm",
                      fontSize: "xs",
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
              marginBottom: "4",
              padding: "4",
              backgroundColor: "white",
              borderRadius: "sm",
              border: "1px solid #e5e7eb",
            })}
          >
            <h4 className={css({ fontSize: "md", fontWeight: "semibold", marginBottom: "3" })}>
              Step 2: Validate a Proof
            </h4>
            <label className={css({ display: "block", fontSize: "sm", marginBottom: "2" })}>
              Paste Proof JSON:
            </label>
            <textarea
              value={validationInput}
              onChange={(e) => setValidationInput(e.target.value)}
              placeholder="Paste the complete proof JSON here..."
              className={css({
                width: "100%",
                height: "120px",
                padding: "2",
                border: "1px solid #d1d5db",
                borderRadius: "sm",
                fontSize: "xs",
                fontFamily: "monospace",
                marginBottom: "3",
                resize: "vertical",
              })}
            />
            <button
              onClick={handleValidateProof}
              disabled={!validationInput.trim()}
              className={css({
                padding: "8px 16px",
                backgroundColor: validationInput.trim() ? "gray.700" : "gray.400",
                color: "white",
                border: "none",
                borderRadius: "sm",
                cursor: validationInput.trim() ? "pointer" : "not-allowed",
                fontSize: "sm",
                "&:hover": validationInput.trim()
                  ? {
                      backgroundColor: "gray.600",
                    }
                  : {},
              })}
            >
              Validate Proof
            </button>
          </div>

          {validationResult && (
            <div
              className={css({
                padding: "4",
                backgroundColor: validationResult.isValid ? "codeBg" : "red.50",
                borderRadius: "sm",
                border: `1px solid ${validationResult.isValid ? "gray.300" : "red.200"}`,
              })}
            >
              <h4 className={css({ fontSize: "md", fontWeight: "semibold", marginBottom: "3" })}>
                Validation Result
              </h4>
              <div
                className={css({
                  fontSize: "sm",
                  fontWeight: "semibold",
                  marginBottom: "3",
                  color: validationResult.isValid ? "green.800" : "red.600",
                })}
              >
                {validationResult.message}
              </div>
              {validationResult.steps.length > 0 && (
                <div>
                  <strong>Verification Steps:</strong>
                  <div className={css({ marginTop: "2" })}>
                    {validationResult.steps.map((step, index) => (
                      <div
                        key={index}
                        className={css({
                          fontSize: "xs",
                          fontFamily: "monospace",
                          backgroundColor: "white",
                          padding: "4px 8px",
                          borderRadius: "sm",
                          border: "1px solid #e5e7eb",
                          marginBottom: "1",
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
const calculateMerkleRoot = (requests: LLMRequest[]): string => {
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
const visualizeMerkleTree = (requests: LLMRequest[]): string => {
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
  const sendLLMCall = (wallet: string, prompt: string) => {
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
    const createMerkleTree = () => {
      if (requests.length >= BATCH_SIZE_THRESHOLD && !batchRegistered) {
        const root = calculateMerkleRoot(requests);
        const treeVis = visualizeMerkleTree(requests);
        setMerkleRoot(root);
        setMerkleTreeVisualization(treeVis);
        setBatchRegistered(true);
      }
    };

    void createMerkleTree();
  }, [requests, batchRegistered]);

  const handleSendRequest = () => {
    if (!currentPrompt.trim()) return;
    sendLLMCall(currentWallet, currentPrompt);
  };

  const handleRandomRequest = () => {
    const randomPrompt = mockPrompts[Math.floor(Math.random() * mockPrompts.length)];
    const randomWallet = mockWallets[Math.floor(Math.random() * mockWallets.length)];
    setCurrentWallet(randomWallet);
    sendLLMCall(randomWallet, randomPrompt);
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
        borderRadius: "lg",
        padding: "5",
        margin: "20px 0",
        backgroundColor: "codeBg",
      })}
    >
      <h3 className={css({ fontSize: "lg", fontWeight: "bold", marginBottom: "4" })}>
        🧪 Interactive LLM Batch Processing Demo
      </h3>

      <div
        className={css({
          marginBottom: "5",
          padding: "4",
          backgroundColor: "blue.50",
          borderRadius: "lg",
          border: "1px solid #bfdbfe",
        })}
      >
        <p className={css({ fontSize: "sm", color: "blue.800", marginBottom: "2" })}>
          <strong>How it works:</strong> Send LLM requests and get immediate responses. After {BATCH_SIZE_THRESHOLD}{" "}
          requests, a Merkle tree is automatically created for cost-efficient blockchain settlement.
        </p>
      </div>

      {/* Request Input */}
      <div
        className={css({
          marginBottom: "6",
          padding: "4",
          backgroundColor: "white",
          borderRadius: "sm",
          border: "1px solid #e5e7eb",
        })}
      >
        <h4 className={css({ fontSize: "md", fontWeight: "semibold", marginBottom: "4" })}>Send LLM Request</h4>

        <div className={css({ marginBottom: "3" })}>
          <label className={css({ display: "block", fontSize: "sm", marginBottom: "1" })}>
            Wallet Address:
          </label>
          <select
            value={currentWallet}
            onChange={(e) => setCurrentWallet(e.target.value)}
            className={css({
              width: "100%",
              padding: "2",
              border: "1px solid #d1d5db",
              borderRadius: "sm",
              fontFamily: "monospace",
              fontSize: "sm",
            })}
          >
            {mockWallets.map((wallet) => (
              <option key={wallet} value={wallet}>
                {wallet}
              </option>
            ))}
          </select>
        </div>

        <div className={css({ marginBottom: "3" })}>
          <label className={css({ display: "block", fontSize: "sm", marginBottom: "1" })}>Prompt:</label>
          <input
            type="text"
            value={currentPrompt}
            onChange={(e) => setCurrentPrompt(e.target.value)}
            placeholder="Enter your LLM prompt..."
            className={css({
              width: "100%",
              padding: "2",
              border: "1px solid #d1d5db",
              borderRadius: "sm",
              fontSize: "sm",
            })}
            onKeyPress={(e) => e.key === "Enter" && handleSendRequest()}
          />
        </div>

        <div className={css({ display: "flex", gap: "2", fontSize: "sm" })}>
          <button
            onClick={handleSendRequest}
            disabled={!currentPrompt.trim()}
            className={css({
              padding: "8px 16px",
              backgroundColor: currentPrompt.trim() ? "gray.700" : "gray.400",
              color: "white",
              border: "none",
              borderRadius: "sm",
              cursor: currentPrompt.trim() ? "pointer" : "not-allowed",
              transition: "background-color {durations.normal} ease",
              "&:hover": { backgroundColor: currentPrompt.trim() ? "gray.600" : "gray.400" },
            })}
          >
            Send Request
          </button>

          <button
            onClick={handleRandomRequest}
            className={css({
              padding: "8px 16px",
              backgroundColor: "gray.700",
              color: "white",
              border: "none",
              borderRadius: "sm",
              cursor: "pointer",
              transition: "background-color {durations.normal} ease",
              "&:hover": { backgroundColor: "gray.600" },
            })}
          >
            Send Random Request
          </button>

          <button
            onClick={resetDemo}
            className={css({
              padding: "8px 16px",
              backgroundColor: "red.500",
              color: "white",
              border: "none",
              borderRadius: "sm",
              cursor: "pointer",
              transition: "background-color {durations.normal} ease",
              "&:hover": { backgroundColor: "red.600" },
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
            padding: "3",
            backgroundColor: "green.50",
            border: "1px solid #bbf7d0",
            borderRadius: "sm",
            marginBottom: "4",
          })}
        >
          <strong>🌳 Merkle Root:</strong> <code className={css({ fontSize: "sm" })}>{merkleRoot}</code>
          <div className={css({ fontSize: "sm", color: "green.800", marginTop: "1" })}>
            All requests can now be processed with a single blockchain transaction!
          </div>
          {/* Tree Visualization */}
          {merkleTreeVisualization && (
            <div className={css({ marginTop: "3" })}>
              <strong>Tree Structure:</strong>
              <pre
                className={css({
                  fontSize: "xs",
                  fontFamily: "monospace",
                  backgroundColor: "white",
                  padding: "2",
                  borderRadius: "sm",
                  border: "1px solid #bbf7d0",
                  marginTop: "1",
                  lineHeight: "normal",
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
              padding: "6",
              textAlign: "center",
              color: "gray.500",
              backgroundColor: "white",
              borderRadius: "sm",
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
                padding: "4",
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "sm",
                marginBottom: "3",
              })}
            >
              {/* Prompt & Response (not part of leaf/hash) */}
              <div className={css({ marginBottom: "2" })}>
                <div className={css({ fontWeight: 500, fontSize: "md", marginBottom: "0.5", color: "#444" })}>
                  Prompt (not part of Merkle-Leafs):
                </div>
                <div
                  className={css({
                    fontSize: "md",
                    fontFamily: "monospace",
                    backgroundColor: "#fafbfc",
                    padding: "6px 10px",
                    borderRadius: "sm",
                    border: "1px solid #e5e7eb",
                    marginBottom: "1",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  })}
                >
                  {request.prompt}
                </div>
                <div className={css({ fontWeight: 500, fontSize: "md", marginBottom: "0.5", color: "#444" })}>
                  Response (not part of Merkle-Leafs):
                </div>
                <div
                  className={css({
                    fontSize: "md",
                    fontFamily: "monospace",
                    backgroundColor: "#fafbfc",
                    padding: "6px 10px",
                    borderRadius: "sm",
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
                <div className={css({ marginBottom: "2" })}>
                  <div
                    className={css({
                      fontWeight: 500,
                      fontSize: "md",
                      marginBottom: "0.5",
                      color: "#222",
                    })}
                  >
                    Merkle Leaf Data R<sub>{index + 1}</sub> (used for hash):
                  </div>
                  <pre
                    className={css({
                      fontSize: "sm",
                      fontFamily: "monospace",
                      backgroundColor: "#fafbfc",
                      padding: "8px 10px",
                      borderRadius: "sm",
                      border: "1px solid #e5e7eb",
                      overflow: "auto",
                      lineHeight: "tight",
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
                      fontSize: "md",
                      marginBottom: "0.5",
                      color: "#222",
                    })}
                  >
                    Merkle Leaf Hash H<sub>{index + 1}</sub>:
                  </div>
                  <code
                    className={css({
                      fontSize: "sm",
                      fontFamily: "monospace",
                      backgroundColor: "gray.100",
                      padding: "4px 8px",
                      borderRadius: "sm",
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
          <strong>
            Update on 2025-08-26: I substantially overhauled this blog post to improve clarity and focus on the Merkle
            tree topic.
          </strong>
        </p>
      </section>
      <section>
        <p>
          The integration of Large Language Models (LLMs) into my website is an exciting possibility. But one problem
          remains: How can I reduce the blockchain transaction costs when users need multiple LLM API calls in an
          application? In this blog post, I will explore how it might become possible with Merkle trees.
        </p>
      </section>

      <section>
        <h2>From My Image Generator to LLM Batching</h2>

        <p>
          I&apos;ve already built an AI image generator that works on the blockchain - you can try it on my{" "}
          <Link href="/imagegen">image generation page</Link>. Users pay with their wallet, and my{" "}
          <a href="https://optimistic.etherscan.io/address/0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb#code">
            GenImNFT contract
          </a>{" "}
          handles the payment and delivery automatically. It works great for single images.
        </p>

        <p>
          But when I started thinking about LLM text generation, I run into trouble. If someone wants to analyze 10
          documents or generate multiple pieces of content, they&apos;d need 10 separate blockchain transactions. These
          are substantial gas fees, plus the hassle of confirming each transaction in their wallet.
        </p>

        <p>
          An interesting solution lies in a mathematical concept called <strong>Merkle trees</strong> - think of it like
          a business expense report system. When you travel for business, you don&apos;t submit a separate expense
          report for every coffee or taxi ride. Instead, you collect all your receipts and submit them together in one
          report. The accounting department can still verify each individual expense, but you only go through the
          submission process once.
        </p>

        <p>
          Merkle trees work similarly on the blockchain: you can bundle multiple LLM requests together and submit them
          as one transaction, while still maintaining cryptographic proof that each individual request is valid and
          accounted for.
        </p>

        <p>
          To see this in action, try the interactive demo below. Send a few LLM requests and watch how each one would
          normally require its own blockchain transaction. Once you reach 4 requests, you&apos;ll see how the Merkle
          tree automatically bundles everything into a single transaction:
        </p>

        <BatchCreator />
      </section>

      <section>
        <h2>How Merkle Trees Make This Magic Possible</h2>

        <p>
          In our expense report analogy, the accounting department needs to verify individual receipts. But how do they
          do this efficiently? Here&apos;s where Merkle Trees provide the mathematical solution.
        </p>

        <p>The mapping is straightforward:</p>
        <ul>
          <li>individual receipts become Merkle leaves (each LLM request gets its own cryptographic fingerprint)</li>
          <li>summary pages become internal nodes (groups of receipts get combined into summary fingerprints)</li>
          <li>the master receipt becomes the Merkle root (one final fingerprint represents the entire batch)</li>
          <li>proof of purchase becomes a Merkle proof (you can prove any receipt belongs without showing others)</li>
        </ul>

        <p>
          But what exactly is a &quot;cryptographic fingerprint&quot;? When we say each LLM request gets processed
          through a hash function, we mean it goes through a special mathematical algorithm called{" "}
          <a href="https://en.wikipedia.org/wiki/SHA-3">Keccak256</a> (the same one Ethereum uses). For example, if you
          input <code>{`{id: 1, timestamp: "2024-01-15T10:30:00Z", tokens: 150, wallet: "0xUser1..."}`}</code>, you get
          output like <code>0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b</code>.
        </p>

        <p>This process has four key properties that make it perfect for our use case:</p>
        <ul>
          <li>it&apos;s deterministic (same input always produces the same hash)</li>
          <li>collision resistant (nearly impossible for two different inputs to produce the same hash)</li>
          <li>fixed length (always 64 characters regardless of input size)</li>
          <li>irreversible (you cannot recreate the original data from the hash alone)</li>
        </ul>
        <h3>Building up the Merkle Tree</h3>

        <p>
          A Merkle tree is then built up step by step. Let&apos;s say we have 4 LLM requests from our batching example.
          We now build the tree in three steps:
        </p>
        <ol>
          <li>First, each request gets its own hash (H₁, H₂, H₃, H₄). </li>
          <li>Then we pair them up - combine H₁+H₂ into H₁₂, and H₃+H₄ into H₃₄.</li>
          <li>
            Finally, we create the root by combining H₁₂+H₃₄ into the final ROOT hash. This ROOT hash is like the master
            receipt number that represents all 4 requests.
          </li>
        </ol>

        <p>Here&apos;s what this tree-building process looks like visually:</p>

        <MermaidDiagram definition={MERKLE_TREE_MATH_DEFINITION} title="Merkle Tree Mathematical Foundation" />

        <p>
          As you can see in the diagram above, the ROOT hash represents all 4 requests in a single value. This means
          instead of needing 4 separate blockchain transactions (one for each request), we need just 1 transaction to
          register the entire batch. The ROOT hash enables us to register thousands of LLM requests with just one
          blockchain transaction while maintaining cryptographic proof of each individual request.
        </p>
      </section>

      <section>
        <h2>Proving Individual Transactions with Merkle Proofs</h2>

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
        <h2>From Problem to Solution</h2>

        <p>
          This brings us to the end of this blog post. We started this journey with a significant cost problem: someone
          wanting to send 10 LLM requests would face significant gas fees alone, plus the hassle of confirming 10
          separate transactions in their wallet. For any practical LLM application on the blockchain, this creates an
          immediate barrier to adoption.
        </p>

        <p>
          We saw how Merkle trees provide an elegant mathematical solution that transforms this experience entirely.
          Those same 10 LLM requests can now be bundled into a single blockchain transaction, reducing gas costs by 90%
          and eliminating the multi-transaction friction. Users get immediate LLM responses while cryptographic proofs
          ensure every request is verifiable and secure.
        </p>

        <p>
          This isn&apos;t just theory - it&apos;s the foundation for my new LLM assistant. In the next post, I&apos;ll
          show you how I built such a system with smart contracts, batching services, and the corresponding frontend
          integration. Stay tuned!
        </p>
      </section>
    </article>
  );
}
