import React, { useState, useEffect } from "react";
import { css } from "../styled-system/css";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import MermaidDiagram from "../components/MermaidDiagram";

// Mermaid diagram definitions for educational content
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

const COST_COMPARISON_DEFINITION = `graph LR
    subgraph "Without Batching"
        A1[Request 1] --> T1[Transaction 1<br/>~$2.10]
        A2[Request 2] --> T2[Transaction 2<br/>~$2.10]
        A3[Request 3] --> T3[Transaction 3<br/>~$2.10]
        A4[Request 4] --> T4[Transaction 4<br/>~$2.10]
        T1 --> Total1[Total: $8.40]
        T2 --> Total1
        T3 --> Total1
        T4 --> Total1
    end
    
    subgraph "With Merkle Batching"
        B1[Request 1] --> MT[Merkle Tree]
        B2[Request 2] --> MT
        B3[Request 3] --> MT
        B4[Request 4] --> MT
        MT --> BT[Single Batch Transaction<br/>~$2.38]
        BT --> Total2[Total: $2.38<br/>Savings: 72%]
    end
    
    classDef expensive fill:#fee2e2,stroke:#dc2626,stroke-width:2px
    classDef efficient fill:#d1fae5,stroke:#059669,stroke-width:2px
    
    class T1,T2,T3,T4,Total1 expensive
    class MT,BT,Total2 efficient`;

// Sample data for educational demos
const mockWallets = [
  "0x742d35Cc6532C8532cCc6532C85324242d35Cc65",
  "0x123456789abcdef123456789abcdef123456789a",
  "0x987654321fedcba987654321fedcba987654321f",
  "0xaabbccddeeaabbccddeeaabbccddeeaabbccddee",
];

const mockPrompts = [
  "Analyze the sentiment of this customer review",
  "Translate this text to German",
  "Explain quantum computing in simple terms",
  "Write a Python function for Fibonacci numbers",
  "Tell me a short creative story",
  "What are the benefits of renewable energy?",
  "Summarize the key points of blockchain technology",
  "Help me debug this JavaScript code",
];

interface LLMRequest {
  id: number;
  prompt: string;
  model: string;
  recipient: string;
  estimatedTokens: number;
  response: string;
  leafData?: {
    id: number;
    timestamp: string;
    tokenCount: number;
    wallet: string;
  };
  leafHash?: string;
}

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

// Educational sample batch for proof demonstrations
const sampleBatch = {
  merkleRoot: "0x742d35Cc6532C8532cCc6532C85324242d35Cc65abcdef123456789",
  requests: [
    {
      id: 1,
      owner: "Alice",
      prompt: "Analyze customer sentiment",
      leafData: { id: 1, timestamp: "2025-08-24T10:00:00Z", tokenCount: 120, wallet: mockWallets[0] },
      leafHash: "0xabc123...",
    },
    {
      id: 2,
      owner: "Bob",
      prompt: "Translate to German",
      leafData: { id: 2, timestamp: "2025-08-24T10:05:00Z", tokenCount: 85, wallet: mockWallets[1] },
      leafHash: "0xdef456...",
    },
    {
      id: 3,
      owner: "Charlie",
      prompt: "Explain quantum computing",
      leafData: { id: 3, timestamp: "2025-08-24T10:10:00Z", tokenCount: 150, wallet: mockWallets[2] },
      leafHash: "0x789xyz...",
    },
    {
      id: 4,
      owner: "Diana",
      prompt: "Write Python function",
      leafData: { id: 4, timestamp: "2025-08-24T10:15:00Z", tokenCount: 95, wallet: mockWallets[3] },
      leafHash: "0x456abc...",
    },
  ],
};

// Educational functions using StandardMerkleTree for consistency
const calculateMerkleRoot = async (requests: LLMRequest[]): Promise<string> => {
  if (requests.length === 0) return "";

  const treeData = requests.map((req) => [
    req.leafData!.id,
    req.leafData!.timestamp,
    req.leafData!.tokenCount,
    req.leafData!.wallet,
  ]);

  const demoTypes = ["uint256", "string", "uint256", "string"];
  const tree = StandardMerkleTree.of(treeData, demoTypes);

  return tree.root;
};

const visualizeMerkleTree = async (requests: LLMRequest[]): Promise<string> => {
  if (requests.length === 0) return "";

  const treeData = requests.map((req) => [
    req.leafData!.id,
    req.leafData!.timestamp,
    req.leafData!.tokenCount,
    req.leafData!.wallet,
  ]);

  const demoTypes = ["uint256", "string", "uint256", "string"];
  const tree = StandardMerkleTree.of(treeData, demoTypes);

  let visualization = "Merkle Tree Structure (educational demo):\n";
  visualization += `Root: ${tree.root.substring(0, 16)}...\n\n`;

  for (const [index, value] of tree.entries()) {
    const leafHash = tree.leafHash(value);
    visualization += `Leaf ${index + 1}: ${leafHash.substring(0, 16)}... (ID: ${value[0]}, Wallet: ${value[3].substring(0, 8)}...)\n`;
  }

  return visualization;
};

// Generate educational Merkle Proof
const generateMerkleProof = async (leafIndex: number): Promise<MerkleProof> => {
  const selectedRequest = sampleBatch.requests[leafIndex];

  const treeData = sampleBatch.requests.map((req) => [
    req.leafData.id,
    req.leafData.timestamp,
    req.leafData.tokenCount,
    req.leafData.wallet,
  ]);

  const demoTypes = ["uint256", "string", "uint256", "string"];
  const tree = StandardMerkleTree.of(treeData, demoTypes);
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

// Validate Merkle Proof for educational purposes
const validateMerkleProof = async (
  proof: MerkleProof,
): Promise<{ isValid: boolean; message: string; steps: string[] }> => {
  try {
    const treeData = sampleBatch.requests.map((req) => [
      req.leafData.id,
      req.leafData.timestamp,
      req.leafData.tokenCount,
      req.leafData.wallet,
    ]);

    const demoTypes = ["uint256", "string", "uint256", "string"];
    const tree = StandardMerkleTree.of(treeData, demoTypes);

    const leafData = [proof.leafData.id, proof.leafData.timestamp, proof.leafData.tokenCount, proof.leafData.wallet];
    const standardProof = proof.proof.map((p) => p.data);

    const isValid = StandardMerkleTree.verify(tree.root, demoTypes, leafData, standardProof);

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
      `✅ Educational verification using StandardMerkleTree`,
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
          ? "Proof is valid! This demonstrates how users can verify their transactions."
          : "Proof is invalid! This shows how invalid transactions are rejected.",
      steps,
    };
  } catch (error) {
    console.error("Educational proof validation failed:", error);
    return {
      isValid: false,
      message: "Error in educational validation: " + (error as Error).message,
      steps: [],
    };
  }
};

// Educational Proof Demo Component
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
    } catch (error) {
      console.error("Error generating educational proof:", error);
    }
  };

  const handleValidateProof = async () => {
    try {
      const proof = JSON.parse(validationInput) as MerkleProof;
      const result = await validateMerkleProof(proof);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        isValid: false,
        message: "Error parsing proof JSON: " + (error as Error).message,
        steps: [],
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
        🔍 Educational Merkle Proof Demonstration
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
          <strong>Learning Goal:</strong> Understand how users can cryptographically prove their transactions are 
          included in a Merkle tree without revealing other users' data.
        </p>
        <div
          className={css({
            padding: "16px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
          })}
        >
          <h4 className={css({ fontSize: "16px", fontWeight: "medium", marginBottom: "12px" })}>
            Sample Educational Batch (Root: {sampleBatch.merkleRoot.substring(0, 20)}...)
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
      </div>

      {/* Tab Navigation */}
      <div className={css({ display: "flex", marginBottom: "20px", borderBottom: "1px solid #e5e7eb" })}>
        <button
          onClick={() => setActiveTab("generate")}
          className={css({
            padding: "8px 16px",
            borderBottom: activeTab === "generate" ? "2px solid #3b82f6" : "2px solid transparent",
            color: activeTab === "generate" ? "#3b82f6" : "#6b7280",
            fontWeight: activeTab === "generate" ? "medium" : "normal",
          })}
        >
          Generate Proof
        </button>
        <button
          onClick={() => setActiveTab("validate")}
          className={css({
            padding: "8px 16px",
            borderBottom: activeTab === "validate" ? "2px solid #3b82f6" : "2px solid transparent",
            color: activeTab === "validate" ? "#3b82f6" : "#6b7280",
            fontWeight: activeTab === "validate" ? "medium" : "normal",
          })}
        >
          Validate Proof
        </button>
      </div>

      {/* Generate Proof Tab */}
      {activeTab === "generate" && (
        <div>
          <div className={css({ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "center" })}>
            <label className={css({ fontSize: "14px", fontWeight: "medium", color: "#374151" })}>
              Select User to Generate Proof For:
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(parseInt(e.target.value))}
              className={css({
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "14px",
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
                backgroundColor: "#374151",
                color: "white",
                border: "1px solid #374151",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                "&:hover": {
                  backgroundColor: "#4b5563",
                  borderColor: "#4b5563",
                },
              })}
            >
              Generate Merkle Proof
            </button>
          </div>

          {generatedProof && (
            <div
              className={css({
                padding: "16px",
                backgroundColor: "#f9fafb",
                borderRadius: "4px",
                border: "1px solid #e5e7eb",
              })}
            >
              <h4 className={css({ fontSize: "16px", fontWeight: "medium", marginBottom: "12px", color: "#374151" })}>
                Generated Educational Proof for {sampleBatch.requests[selectedUser].owner}
              </h4>
              <div className={css({ position: "relative" })}>
                <pre
                  className={css({
                    fontSize: "12px",
                    backgroundColor: "#1f2937",
                    color: "#f9fafb",
                    padding: "16px",
                    borderRadius: "4px",
                    overflow: "auto",
                    maxHeight: "400px",
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
            <label className={css({ display: "block", fontSize: "14px", fontWeight: "medium", marginBottom: "8px" })}>
              Paste Merkle Proof JSON (from Generate tab):
            </label>
            <textarea
              value={validationInput}
              onChange={(e) => setValidationInput(e.target.value)}
              placeholder="Paste the generated proof JSON here..."
              className={css({
                width: "100%",
                minHeight: "120px",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "13px",
                fontFamily: "monospace",
                resize: "vertical",
              })}
            />
            <button
              onClick={handleValidateProof}
              disabled={!validationInput.trim()}
              className={css({
                marginTop: "12px",
                padding: "8px 16px",
                backgroundColor: "#059669",
                color: "white",
                border: "1px solid #059669",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                "&:hover": {
                  backgroundColor: "#047857",
                  borderColor: "#047857",
                },
                "&:disabled": {
                  backgroundColor: "#9ca3af",
                  borderColor: "#9ca3af",
                  cursor: "not-allowed",
                },
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
                border: `1px solid ${validationResult.isValid ? "#bbf7d0" : "#fecaca"}`,
                borderRadius: "4px",
              })}
            >
              <h4
                className={css({
                  fontSize: "16px",
                  fontWeight: "medium",
                  marginBottom: "12px",
                  color: validationResult.isValid ? "#166534" : "#dc2626",
                })}
              >
                {validationResult.isValid ? "✅ Valid Proof" : "❌ Invalid Proof"}
              </h4>
              <p className={css({ marginBottom: "12px", fontSize: "14px" })}>{validationResult.message}</p>
              <div>
                <strong>Educational Verification Steps:</strong>
                <ul className={css({ marginTop: "8px", paddingLeft: "20px" })}>
                  {validationResult.steps.map((step, index) => (
                    <li key={index} className={css({ fontSize: "13px", marginBottom: "4px" })}>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Educational Batch Creator Component
const BATCH_SIZE_THRESHOLD = 4; // Educational threshold

const BatchCreator: React.FC = () => {
  const [requests, setRequests] = useState<LLMRequest[]>([]);
  const [merkleRoot, setMerkleRoot] = useState<string>("");
  const [merkleTreeVisualization, setMerkleTreeVisualization] = useState<string>("");
  const [batchRegistered, setBatchRegistered] = useState(false);
  const [nextRequestId, setNextRequestId] = useState(1);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [currentWallet, setCurrentWallet] = useState(mockWallets[0]);

  // Educational LLM call simulation
  const sendLLMCall = async (wallet: string, prompt: string) => {
    const leafData = {
      id: nextRequestId,
      timestamp: new Date().toISOString(),
      tokenCount: Math.floor(Math.random() * 200) + 100,
      wallet: wallet,
    };

    const leafArray = [leafData.id, leafData.timestamp, leafData.tokenCount, leafData.wallet];
    const demoTypes = ["uint256", "string", "uint256", "string"];

    const tempTree = StandardMerkleTree.of([leafArray], demoTypes);
    const leafHash = tempTree.leafHash(leafArray);

    const mockResponses = [
      "This text has a positive sentiment, indicating satisfaction.",
      "Hallo, wie geht es dir heute?",
      "Quantum computing uses quantum mechanical phenomena to process information.",
      "def fibonacci(n): return n if n <= 1 else fibonacci(n-1) + fibonacci(n-2)",
      "Once upon a time, there was a curious cat named Whiskers...",
      "Renewable energy reduces carbon emissions and creates sustainable power.",
    ];

    const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];

    const newRequest: LLMRequest = {
      id: nextRequestId,
      prompt: prompt,
      model: "educational-demo",
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

  // Create educational merkle tree when threshold is reached
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
        🧪 Educational Batch Creation Demo
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
          <strong>How it works:</strong> Send mock LLM requests to see how they get batched into a Merkle tree. 
          After {BATCH_SIZE_THRESHOLD} requests, a tree is automatically created to demonstrate the concept.
        </p>
      </div>

      {/* Request Input */}
      <div className={css({ marginBottom: "20px" })}>
        <div className={css({ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" })}>
          <select
            value={currentWallet}
            onChange={(e) => setCurrentWallet(e.target.value)}
            className={css({
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontSize: "14px",
              minWidth: "200px",
            })}
          >
            {mockWallets.map((wallet, index) => (
              <option key={wallet} value={wallet}>
                User {index + 1} ({wallet.substring(0, 10)}...)
              </option>
            ))}
          </select>
          <input
            type="text"
            value={currentPrompt}
            onChange={(e) => setCurrentPrompt(e.target.value)}
            placeholder="Enter your educational prompt..."
            className={css({
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontSize: "14px",
              minWidth: "200px",
            })}
          />
          <button
            onClick={handleSendRequest}
            disabled={!currentPrompt.trim()}
            className={css({
              padding: "8px 16px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              "&:hover": {
                backgroundColor: "#2563eb",
              },
              "&:disabled": {
                backgroundColor: "#9ca3af",
                cursor: "not-allowed",
              },
            })}
          >
            Send Request
          </button>
        </div>
        <div className={css({ display: "flex", gap: "12px" })}>
          <button
            onClick={handleRandomRequest}
            className={css({
              padding: "8px 16px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              "&:hover": {
                backgroundColor: "#059669",
              },
            })}
          >
            Add Random Request
          </button>
          <button
            onClick={resetDemo}
            className={css({
              padding: "8px 16px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              "&:hover": {
                backgroundColor: "#4b5563",
              },
            })}
          >
            Reset Demo
          </button>
        </div>
      </div>

      {/* Requests Display */}
      {requests.length > 0 && (
        <div className={css({ marginBottom: "20px" })}>
          <h4 className={css({ fontSize: "16px", fontWeight: "medium", marginBottom: "12px" })}>
            Educational Requests ({requests.length}/{BATCH_SIZE_THRESHOLD} for batching)
          </h4>
          <div className={css({ display: "grid", gap: "12px" })}>
            {requests.map((request, index) => (
              <div
                key={request.id}
                className={css({
                  padding: "12px",
                  backgroundColor: "#fff",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                })}
              >
                <div className={css({ display: "flex", justifyContent: "space-between", marginBottom: "8px" })}>
                  <span className={css({ fontWeight: "medium", fontSize: "14px" })}>
                    Request #{request.id} from {request.recipient.substring(0, 10)}...
                  </span>
                  <span className={css({ fontSize: "12px", color: "#6b7280" })}>
                    {request.estimatedTokens} tokens
                  </span>
                </div>
                <div className={css({ fontSize: "13px", color: "#374151", marginBottom: "8px" })}>
                  <strong>Prompt:</strong> {request.prompt}
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

                {request.leafData && (
                  <div className={css({ marginBottom: "0.5rem", marginTop: "8px" })}>
                    <div
                      className={css({
                        fontWeight: 500,
                        fontSize: "0.92rem",
                        marginBottom: "0.18rem",
                        color: "#222",
                      })}
                    >
                      Educational Leaf Data R<sub>{index + 1}</sub>:
                    </div>
                    <pre
                      className={css({
                        fontSize: "0.78rem",
                        fontFamily: "monospace",
                        backgroundColor: "#f8f9fa",
                        padding: "0.4rem",
                        borderRadius: "3px",
                        border: "1px solid #e9ecef",
                        margin: 0,
                      })}
                    >
                      {JSON.stringify(request.leafData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Merkle Tree Result */}
      {merkleRoot && (
        <div
          className={css({
            padding: "16px",
            backgroundColor: "#f0fdf4",
            borderRadius: "6px",
            border: "1px solid #bbf7d0",
          })}
        >
          <strong>🌳 Educational Merkle Root:</strong> <code className={css({ fontSize: "0.8rem" })}>{merkleRoot}</code>
          <div className={css({ fontSize: "0.8rem", color: "#166534", marginTop: "0.25rem" })}>
            All requests can now be processed with a single blockchain transaction! 
            (This demonstrates the core concept)
          </div>
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
    </div>
  );
};

// Main Blog Post Component
export default function MerkleTreesForAIBatchingFundamentals() {
  return (
    <article>
      <section>
        <h1>Merkle Trees für AI API Batching - Cryptographische Grundlagen verstehen</h1>
        <p>
          Large Language Models (LLMs) revolutionieren unser digitales Leben, aber die Integration in Blockchain-Anwendungen 
          bringt ein kostspieliges Problem mit sich: Jeder einzelne API-Aufruf erfordert eine separate Blockchain-Transaktion. 
          Die Lösung? <strong>Merkle Trees</strong> – eine elegante cryptographische Datenstruktur, die es ermöglicht, 
          hunderte von LLM-Anfragen in einer einzigen Transaktion abzuwickeln.
        </p>
        <p>
          In diesem Post erforschen wir die mathematischen Grundlagen von Merkle Trees und verstehen, 
          wie sie das Cost-Problem von AI-Blockchain-Integration lösen können – ohne in Implementation-Details zu versinken.
        </p>
      </section>

      <section>
        <h2>Das Problem: Explodierende Blockchain-Kosten für AI APIs</h2>

        <p>
          Stellen Sie sich vor, Sie entwickeln eine AI-unterstützte Anwendung, bei der Nutzer ihre Ethereum-Wallet 
          verwenden, um für LLM-API-Calls zu bezahlen. Das aktuelle System funktioniert folgendermaßen:
        </p>

        <div
          className={css({
            padding: "16px",
            backgroundColor: "#fef2f2",
            borderRadius: "8px",
            border: "1px solid #fecaca",
            marginBottom: "16px",
          })}
        >
          <h4>Problem: Einzeltransaktions-Modell</h4>
          <ul>
            <li>🔥 Jeder LLM Request = Separate Blockchain-Transaktion</li>
            <li>💰 Gas-Kosten multiplizieren sich: 10 Requests = 10× Gas Fees</li>
            <li>⏱️ User Experience: Multiple Wallet-Bestätigungen</li>
            <li>🚫 Ökonomische Barriere: Hohe Kosten limitieren Adoption</li>
          </ul>
          <p>
            <strong>Beispiel:</strong> Wenn ein Nutzer 10 AI-Texte für ein Projekt generieren möchte, 
            benötigt er aktuell 10 separate Transaktionen mit Kosten von ~$8.40 insgesamt.
          </p>
        </div>

        <MermaidDiagram
          definition={COST_COMPARISON_DEFINITION}
          title="💰 Cost Comparison: Individual vs. Batched Transactions"
        />

        <div>
          <h3>Warum dieses Setup von Merkle Tree Optimierung profitieren würde</h3>
          <p>
            Um AI-Blockchain-Integration wirklich skalierbar zu machen, benötigen wir:
          </p>
          <ul>
            <li>📦 Batch multiple Requests in einzelne Transaktionen</li>
            <li>💰 Drastische Reduktion der Per-Request Gas-Kosten</li>
            <li>🔒 Beibehaltung von Payment-Sicherheit und User Experience</li>
            <li>🚀 Ermöglichung komplexer AI-Workflows ohne Cost-Barrieren</li>
          </ul>
        </div>
      </section>

      <section>
        <h2>Die Lösung: Merkle Tree Mathematik</h2>
        <p>
          Ein Merkle Tree ist eine binäre Baumstruktur, in der jedes Blatt ein Datenelement 
          (in unserem Fall eine LLM-Anfrage) repräsentiert und jeder Parent-Node einen 
          cryptographischen Hash seiner Kinder enthält. Die mathematische Grundlage:
        </p>

        <MermaidDiagram definition={MERKLE_TREE_MATH_DEFINITION} title="🌳 Merkle Tree Mathematical Foundation" />
        
        <p>
          Dieser einzelne Root-Hash kann einen gesamten Batch von Requests repräsentieren und ermöglicht es uns, 
          tausende von LLM-Requests mit nur einer Blockchain-Transaktion zu registrieren, während wir 
          cryptographische Beweise für jede einzelne Anfrage beibehalten.
        </p>

        <div
          className={css({
            padding: "16px",
            backgroundColor: "#f0fdf4",
            borderRadius: "8px",
            border: "1px solid #bbf7d0",
            marginBottom: "16px",
          })}
        >
          <h4>🔬 Mathematische Eigenschaften</h4>
          <ul>
            <li><strong>Collision Resistance:</strong> Zwei verschiedene Datensätze können nicht denselben Hash erzeugen</li>
            <li><strong>Deterministic:</strong> Derselbe Input erzeugt immer denselben Hash</li>
            <li><strong>Efficient Verification:</strong> Proof-Größe wächst logarithmisch (O(log n))</li>
            <li><strong>Tamper Evidence:</strong> Jede Änderung verändert den Root-Hash</li>
          </ul>
        </div>

        <p>
          Mit Merkle Trees können wir multiple LLM API Payments in eine einzige Blockchain-Transaktion bündeln. 
          Probieren Sie es in der interaktiven Demo aus:
        </p>

        <BatchCreator />
      </section>

      <section>
        <h3>Proving Individual Transactions with Merkle Proofs</h3>

        <p>
          Nachdem wir gesehen haben, wie LLM-Requests in einen Merkle Tree gebatcht werden, gibt es noch ein weiteres 
          faszinierendes Feature: Nutzer können die Gültigkeit ihrer Transaktion mit drastisch reduzierter Information verifizieren.
        </p>
        <p>
          Ein Merkle Proof ist ein cryptographischer Beweis, der es einem Nutzer (nennen wir sie Alice) ermöglicht, 
          zu demonstrieren, dass ihre Transaktion im Merkle Tree enthalten ist, ohne andere Transaktionen preiszugeben. 
          Um zu beweisen, dass Alice's Transaktion R<sub>3</sub> im Tree ist, stellt sie einen "Proof Path" bereit - 
          das minimale Set von Hash-Werten, das benötigt wird, um den Pfad von ihrem Blatt zur Wurzel zu rekonstruieren:
        </p>

        <figure>
          <MermaidDiagram definition={MERKLE_PROOF_PATH_DEFINITION} title="🔍 Merkle Proof Path for Request 3 (R₃)" />
          <figcaption>
            Visualisierung des Merkle Proofs für R<sub>3</sub>: Alice muss nur die Request und die Proof-Siblings 
            bereitstellen, die grün hervorgehoben sind. Die orange hervorgehobenen Hashes können aus den Informationen 
            berechnet werden. Schließlich kann sie verifizieren, ob die berechnete Wurzel mit der bereitgestellten Wurzel übereinstimmt.
          </figcaption>
        </figure>

        <p>
          Diese elegante mathematische Verifikation beweist, dass Alice's Transaktion authentisch ist, 
          ohne Details anderer Transaktionen preiszugeben. In der Demo unten können Sie in einem einfachen Beispiel testen, 
          wie Proofs generiert und validiert werden.
        </p>

        <ProofDemo />
      </section>

      <section>
        <h2>Warum das funktioniert: Cryptographische Garantien</h2>
        
        <div className={css({ marginBottom: "20px" })}>
          <h3>🔒 Security Properties</h3>
          <p>
            Merkle Trees bieten starke cryptographische Garantien, die sie ideal für Blockchain-Anwendungen machen:
          </p>
          
          <div className={css({ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" })}>
            <div className={css({ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" })}>
              <h4>🛡️ Integrity Protection</h4>
              <p>Jede Manipulation eines Leafs verändert den Root-Hash und macht Tampering sofort erkennbar.</p>
            </div>
            
            <div className={css({ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" })}>
              <h4>🔍 Efficient Verification</h4>
              <p>Ein Proof benötigt nur O(log n) Hashes - für 1000 Requests nur ~10 Hash-Werte.</p>
            </div>
            
            <div className={css({ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" })}>
              <h4>🎭 Privacy Preservation</h4>
              <p>Proofs verraten nichts über andere Transaktionen im Tree - nur die eigene wird bewiesen.</p>
            </div>
            
            <div className={css({ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" })}>
              <h4>⚡ Gas Efficiency</h4>
              <p>Verification kostet konstant wenig Gas, unabhängig von der Batch-Größe.</p>
            </div>
          </div>
        </div>

        <h3>📊 Efficiency Analysis</h3>
        <p>
          Die mathematischen Eigenschaften von Merkle Trees machen sie besonders effizient für Batching:
        </p>
        
        <table className={css({ width: "100%", borderCollapse: "collapse", margin: "16px 0" })}>
          <thead>
            <tr className={css({ backgroundColor: "#f8fafc" })}>
              <th className={css({ padding: "12px", border: "1px solid #e2e8f0", textAlign: "left" })}>Batch Size</th>
              <th className={css({ padding: "12px", border: "1px solid #e2e8f0", textAlign: "left" })}>Tree Depth</th>
              <th className={css({ padding: "12px", border: "1px solid #e2e8f0", textAlign: "left" })}>Proof Size</th>
              <th className={css({ padding: "12px", border: "1px solid #e2e8f0", textAlign: "left" })}>Gas Savings</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={css({ padding: "12px", border: "1px solid #e2e8f0" })}>4 Requests</td>
              <td className={css({ padding: "12px", border: "1px solid #e2e8f0" })}>2 levels</td>
              <td className={css({ padding: "12px", border: "1px solid #e2e8f0" })}>2 hashes</td>
              <td className={css({ padding: "12px", border: "1px solid #e2e8f0" })}>72%</td>
            </tr>
            <tr>
              <td className={css({ padding: "12px", border: "1px solid #e2e8f0" })}>16 Requests</td>
              <td className={css({ padding: "12px", border: "1px solid #e2e8f0" })}>4 levels</td>
              <td className={css({ padding: "12px", border: "1px solid #e2e8f0" })}>4 hashes</td>
              <td className={css({ padding: "12px", border: "1px solid #e2e8f0" })}>89%</td>
            </tr>
            <tr>
              <td className={css({ padding: "12px", border: "1px solid #e2e8f0" })}>256 Requests</td>
              <td className={css({ padding: "12px", border: "1px solid #e2e8f0" })}>8 levels</td>
              <td className={css({ padding: "12px", border: "1px solid #e2e8f0" })}>8 hashes</td>
              <td className={css({ padding: "12px", border: "1px solid #e2e8f0" })}>98%</td>
            </tr>
            <tr>
              <td className={css({ padding: "12px", border: "1px solid #e2e8f0" })}>1024 Requests</td>
              <td className={css({ padding: "12px", border: "1px solid #e2e8f0" })}>10 levels</td>
              <td className={css({ padding: "12px", border: "1px solid #e2e8f0" })}>10 hashes</td>
              <td className={css({ padding: "12px", border: "1px solid #e2e8f0" })}>99%</td>
            </tr>
          </tbody>
        </table>

        <p>
          Die logarithmische Skalierung bedeutet, dass selbst bei sehr großen Batches die Proof-Größe minimal bleibt, 
          während die Gas-Savings dramatisch ansteigen.
        </p>
      </section>

      <section>
        <h2>Zusammenfassung: Die Power der Mathematik</h2>
        
        <p>
          Merkle Trees lösen das Cost-Problem von AI-Blockchain-Integration durch elegante Mathematik:
        </p>
        
        <div className={css({ display: "grid", gap: "16px", marginBottom: "20px" })}>
          <div className={css({ padding: "20px", backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" })}>
            <h3>🎯 Problem Solved</h3>
            <ul>
              <li>✅ Hunderte von LLM-Requests in einer Transaktion</li>
              <li>✅ 72-99% Gas-Cost-Reduktion je nach Batch-Größe</li>
              <li>✅ Cryptographische Beweise für jede einzelne Anfrage</li>
              <li>✅ Privacy-erhaltende Verification</li>
            </ul>
          </div>
          
          <div className={css({ padding: "20px", backgroundColor: "#eff6ff", borderRadius: "8px", border: "1px solid #bfdbfe" })}>
            <h3>🔬 Mathematical Foundation</h3>
            <ul>
              <li>🌳 Binäre Baumstruktur mit cryptographischen Hashes</li>
              <li>🔒 Collision-resistant und tamper-evident</li>
              <li>📏 Logarithmische Proof-Größe (O(log n))</li>
              <li>⚡ Konstante Verification-Kosten</li>
            </ul>
          </div>
        </div>

        <div
          className={css({
            padding: "20px",
            backgroundColor: "#fefce8",
            borderRadius: "8px",
            border: "1px solid #fde047",
            marginBottom: "20px",
          })}
        >
          <h3>🚀 Was Sie gelernt haben</h3>
          <p>
            Sie verstehen jetzt die mathematischen Grundlagen von Merkle Trees und wie sie das Cost-Problem 
            von AI-Blockchain-Integration lösen. Die interaktiven Demos haben gezeigt, wie Batching funktioniert 
            und wie cryptographische Proofs Sicherheit ohne Preisgabe von Privatsphäre ermöglichen.
          </p>
          <p>
            <strong>Möchten Sie sehen, wie das in der Praxis implementiert wird?</strong> 
            {" "}Der nächste Post zeigt eine vollständige Implementation mit echtem Solidity-Code, 
            Serverless Functions und einem production-ready System.
          </p>
        </div>
      </section>
    </article>
  );
}
