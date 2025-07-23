import React, { useState, useEffect } from "react";
import { css } from "../styled-system/css";
import { MerkleTree } from "merkletreejs";
import { Buffer } from "buffer";

// Real SHA-256 hash using Web Crypto API with Buffer compatibility
const createHashSync = async (data: string | Buffer): Promise<Buffer> => {
  // Convert string data to Uint8Array if needed
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);

  // Use Web Crypto API for real SHA-256
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);

  // Convert to Buffer for merkletreejs compatibility
  return Buffer.from(hashBuffer);
};

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

interface BatchInfo {
  merkleRoot: string;
  creator: string;
  size: number;
  timestamp: number;
  claimed: number;
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

// Response type for LLM calls
interface LLMResponse {
  leaf: {
    id: number;
    timestamp: string;
    tokenCount: number;
    wallet: string;
  };
  hash: string;
  status: string;
  promptProcessed?: string; // LLM response, not stored in leaf
}

// Mock Merkle Tree functions using merkletreejs with Web Crypto API
const calculateMerkleRoot = async (requests: LLMRequest[]): Promise<string> => {
  // Create public leaf data (only id, timestamp, tokenCount, wallet)
  const publicLeaves = requests.map((req) => ({
    id: req.id,
    timestamp: new Date().toISOString(), // In real implementation, this would be from the request
    tokenCount: req.estimatedTokens,
    wallet: req.recipient,
  }));

  // Convert to buffer format for merkletreejs
  const leafBuffers = await Promise.all(
    publicLeaves.map(async (leaf) => {
      const serialized = JSON.stringify(leaf, Object.keys(leaf).sort());
      return await createHashSync(serialized);
    }),
  );

  // Create Merkle Tree using merkletreejs with async hash function
  // We need to provide a synchronous wrapper for the async hash function
  const hashFn = (data: Buffer) => {
    // For the tree construction, we'll use a synchronous hash
    // In a real implementation, you'd want to pre-compute all hashes
    const encoder = new TextEncoder();
    const bytes = typeof data === "string" ? encoder.encode(data) : new Uint8Array(data);

    // Simple synchronous hash for tree construction (not cryptographically secure)
    let hash = 0;
    for (let i = 0; i < bytes.length; i++) {
      const char = bytes[i];
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Create a 32-byte buffer to simulate hash output
    const hashHex = Math.abs(hash).toString(16).padStart(8, "0");
    const fullHash = hashHex.repeat(8); // Simulate 256 bits (64 hex chars)

    return Buffer.from(fullHash, "hex");
  };

  const tree = new MerkleTree(leafBuffers, hashFn);
  const root = tree.getRoot();

  return `0x${root.toString("hex")}`;
};

const generateMerkleProof = async (requestId: number, requests: LLMRequest[]): Promise<string[]> => {
  // Create the same leaf data structure
  const publicLeaves = requests.map((req) => ({
    id: req.id,
    timestamp: new Date().toISOString(),
    tokenCount: req.estimatedTokens,
    wallet: req.recipient,
  }));

  const leafBuffers = await Promise.all(
    publicLeaves.map(async (leaf) => {
      const serialized = JSON.stringify(leaf, Object.keys(leaf).sort());
      return await createHashSync(serialized);
    }),
  );

  // Use the same synchronous hash function for consistency
  const hashFn = (data: Buffer) => {
    const encoder = new TextEncoder();
    const bytes = typeof data === "string" ? encoder.encode(data) : new Uint8Array(data);

    let hash = 0;
    for (let i = 0; i < bytes.length; i++) {
      const char = bytes[i];
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    const hashHex = Math.abs(hash).toString(16).padStart(8, "0");
    const fullHash = hashHex.repeat(8);

    return Buffer.from(fullHash, "hex");
  };

  const tree = new MerkleTree(leafBuffers, hashFn);
  const targetLeaf = leafBuffers[requestId - 1]; // Assuming 1-based ID
  const proof = tree.getProof(targetLeaf);

  return proof.map((p) => `0x${p.data.toString("hex")}`);
};

// Component to display Merkle proof (handles async loading)
const MerkleProofDisplay: React.FC<{ requestId: number; requests: LLMRequest[]; merkleRoot: string }> = ({
  requestId,
  requests,
  merkleRoot,
}) => {
  const [proof, setProof] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProof = async () => {
    setLoading(true);
    try {
      const proofData = await generateMerkleProof(requestId, requests);
      setProof(proofData);
    } catch (error) {
      console.error("Error generating proof:", error);
      setProof([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (requests.length > 0) {
      loadProof();
    }
  }, [requestId, requests.length]);

  if (loading) {
    return <div>Loading proof...</div>;
  }

  return (
    <div
      className={css({
        marginTop: "8px",
        padding: "8px",
        backgroundColor: "#f9fafb",
        borderRadius: "4px",
        fontFamily: "monospace",
        fontSize: "10px",
        maxWidth: "300px",
        wordBreak: "break-all",
      })}
    >
      <div>
        <strong>Leaf Data:</strong>
      </div>
      <pre>
        {JSON.stringify(
          {
            id: requestId,
            timestamp: new Date().toISOString(),
            tokenCount: requests.find((r) => r.id === requestId)?.estimatedTokens || 0,
            wallet: requests.find((r) => r.id === requestId)?.recipient || "",
          },
          null,
          2,
        )}
      </pre>
      <div>
        <strong>Merkle Proof:</strong>
      </div>
      {proof.map((proofItem, i) => (
        <div key={i}>{proofItem}</div>
      ))}
      <div>
        <strong>Root:</strong> {merkleRoot}
      </div>
    </div>
  );
};

// Interactive Batch Creator Component
const BatchCreator: React.FC = () => {
  const [requests, setRequests] = useState<LLMRequest[]>([]);
  const [merkleRoot, setMerkleRoot] = useState<string>("");
  const [batchRegistered, setBatchRegistered] = useState(false);
  const [nextRequestId, setNextRequestId] = useState(1);
  const [currentWallet, setCurrentWallet] = useState(mockWallets[0]);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [lastResponse, setLastResponse] = useState<LLMResponse | null>(null);

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

    // Calculate leaf hash
    const serialized = JSON.stringify(leafData, Object.keys(leafData).sort());
    const leafHashBuffer = await createHashSync(serialized);
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

    // Update last response for the response display
    const responseObj: LLMResponse = {
      leaf: leafData,
      hash: leafHash,
      status: "Request processed successfully",
      promptProcessed: response,
    };

    setLastResponse(responseObj);
    setCurrentPrompt("");

    return responseObj;
  };

  // Create merkle tree when threshold is reached
  useEffect(() => {
    const createMerkleTree = async () => {
      if (requests.length >= BATCH_SIZE_THRESHOLD && !batchRegistered) {
        const root = await calculateMerkleRoot(requests);
        setMerkleRoot(root);
        setBatchRegistered(true);

        // Update all request statuses to registered
        setRequests((prev) => prev.map((req) => ({ ...req, status: "registered" })));
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

  const claimRequest = (requestId: number) => {
    setRequests((prev) =>
      prev.map((request) => (request.id === requestId ? { ...request, status: "claimed" } : request)),
    );
  };

  const resetDemo = () => {
    setRequests([]);
    setMerkleRoot("");
    setBatchRegistered(false);
    setNextRequestId(1);
    setLastResponse(null);
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
          marginBottom: "20px",
          padding: "16px",
          backgroundColor: "#fff",
          borderRadius: "8px",
          border: "1px solid #d1d5db",
        })}
      >
        <h4 className={css({ fontWeight: "bold", marginBottom: "12px" })}>Send LLM Request</h4>

        <div className={css({ marginBottom: "12px" })}>
          <label className={css({ display: "block", fontSize: "14px", marginBottom: "4px" })}>Wallet Address:</label>
          <select
            value={currentWallet}
            onChange={(e) => setCurrentWallet(e.target.value)}
            className={css({
              width: "100%",
              padding: "8px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "14px",
            })}
          >
            {mockWallets.map((wallet) => (
              <option key={wallet} value={wallet}>
                {wallet}
              </option>
            ))}
          </select>
        </div>

        <div className={css({ marginBottom: "12px" })}>
          <label className={css({ display: "block", fontSize: "14px", marginBottom: "4px" })}>Prompt:</label>
          <input
            type="text"
            value={currentPrompt}
            onChange={(e) => setCurrentPrompt(e.target.value)}
            placeholder="Enter your LLM prompt..."
            className={css({
              width: "100%",
              padding: "8px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontSize: "14px",
            })}
            onKeyPress={(e) => e.key === "Enter" && handleSendRequest()}
          />
        </div>

        <div className={css({ display: "flex", gap: "8px" })}>
          <button
            onClick={handleSendRequest}
            disabled={!currentPrompt.trim()}
            className={css({
              padding: "8px 16px",
              backgroundColor: currentPrompt.trim() ? "#3b82f6" : "#9ca3af",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: currentPrompt.trim() ? "pointer" : "not-allowed",
              "&:hover": { backgroundColor: currentPrompt.trim() ? "#2563eb" : "#9ca3af" },
            })}
          >
            Send Request
          </button>

          <button
            onClick={handleRandomRequest}
            className={css({
              padding: "8px 16px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              "&:hover": { backgroundColor: "#059669" },
            })}
          >
            Send Random Request
          </button>

          <button
            onClick={resetDemo}
            className={css({
              padding: "8px 16px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              "&:hover": { backgroundColor: "#dc2626" },
            })}
          >
            Reset Demo
          </button>
        </div>
      </div>

      {/* Last Response */}
      {lastResponse && (
        <div
          className={css({
            marginBottom: "20px",
            padding: "16px",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
          })}
        >
          <h4 className={css({ fontWeight: "bold", marginBottom: "8px", color: "#166534" })}>✅ Response Received</h4>
          <pre
            className={css({
              fontSize: "12px",
              fontFamily: "monospace",
              backgroundColor: "#fff",
              padding: "12px",
              borderRadius: "4px",
              border: "1px solid #d1d5db",
              overflow: "auto",
            })}
          >
            {JSON.stringify(lastResponse, null, 2)}
          </pre>
        </div>
      )}

      {/* Batch Status */}
      <div className={css({ marginBottom: "16px" })}>
        <div
          className={css({
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "16px",
          })}
        >
          <div
            className={css({
              padding: "12px",
              backgroundColor: "#fff",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
            })}
          >
            <div className={css({ fontSize: "14px", color: "#6b7280" })}>Requests in Batch</div>
            <div className={css({ fontSize: "24px", fontWeight: "bold" })}>
              {requests.length} / {BATCH_SIZE_THRESHOLD}
            </div>
          </div>

          <div
            className={css({
              padding: "12px",
              backgroundColor: "#fff",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
            })}
          >
            <div className={css({ fontSize: "14px", color: "#6b7280" })}>Batch Status</div>
            <div
              className={css({
                fontSize: "16px",
                fontWeight: "bold",
                color: batchRegistered ? "#10b981" : "#f59e0b",
              })}
            >
              {batchRegistered ? "✅ Registered" : "⏳ Pending"}
            </div>
          </div>

          <div
            className={css({
              padding: "12px",
              backgroundColor: "#fff",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
            })}
          >
            <div className={css({ fontSize: "14px", color: "#6b7280" })}>Gas Savings</div>
            <div className={css({ fontSize: "24px", fontWeight: "bold", color: "#10b981" })}>
              {requests.length > 1 ? Math.round((1 - 15 / (requests.length * 15)) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Merkle Root Display */}
      {batchRegistered && (
        <div
          className={css({
            padding: "12px",
            backgroundColor: "#d1fae5",
            border: "1px solid #10b981",
            borderRadius: "6px",
            marginBottom: "16px",
          })}
        >
          <strong>🌳 Merkle Root Created:</strong> <code>{merkleRoot}</code>
          <div className={css({ fontSize: "14px", color: "#166534", marginTop: "4px" })}>
            All requests can now be processed with a single blockchain transaction!
          </div>
        </div>
      )}

      {/* Request List */}
      <div className={css({ maxHeight: "300px", overflowY: "auto" })}>
        {requests.length === 0 ? (
          <div
            className={css({
              padding: "20px",
              textAlign: "center",
              color: "#6b7280",
              backgroundColor: "#fff",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
            })}
          >
            No requests yet. Send your first LLM request above! 🚀
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request.id}
              className={css({
                padding: "12px",
                backgroundColor: "#fff",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                marginBottom: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              })}
            >
              <div>
                <div className={css({ fontWeight: "bold" })}>Request #{request.id}</div>
                <div className={css({ fontSize: "14px", color: "#6b7280", marginBottom: "4px" })}>{request.prompt}</div>
                <div className={css({ fontSize: "12px", fontFamily: "monospace", color: "#9ca3af" })}>
                  {request.recipient} • {request.model} • {request.estimatedTokens} tokens
                </div>
              </div>
              <div className={css({ display: "flex", alignItems: "center", gap: "8px" })}>
                <span
                  className={css({
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    backgroundColor:
                      request.status === "claimed"
                        ? "#d1fae5"
                        : request.status === "registered"
                          ? "#fef3c7"
                          : "#f3f4f6",
                    color:
                      request.status === "claimed"
                        ? "#065f46"
                        : request.status === "registered"
                          ? "#92400e"
                          : "#374151",
                  })}
                >
                  {request.status === "claimed"
                    ? "Processed"
                    : request.status === "registered"
                      ? "Ready to Process"
                      : "Pending"}
                </span>
                {request.status === "registered" && (
                  <>
                    <button
                      onClick={() => claimRequest(request.id)}
                      className={css({
                        padding: "4px 8px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "12px",
                        cursor: "pointer",
                        marginRight: "8px",
                        "&:hover": { backgroundColor: "#2563eb" },
                      })}
                    >
                      Process
                    </button>
                    <details className={css({ fontSize: "12px" })}>
                      <summary className={css({ cursor: "pointer", color: "#6b7280" })}>View Merkle Proof</summary>
                      <MerkleProofDisplay requestId={request.id} requests={requests} merkleRoot={merkleRoot} />
                    </details>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Cost Comparison Component
const CostComparison: React.FC = () => {
  const [requestCount, setRequestCount] = useState(10);

  const individualCost = requestCount * 15;
  const batchCost = 15;
  const processingCost = requestCount * 2; // Estimated processing cost
  const totalBatchCost = batchCost + processingCost;
  const savings = Math.round((1 - totalBatchCost / individualCost) * 100);

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
        💰 Cost Comparison Calculator
      </h3>

      <div className={css({ marginBottom: "20px" })}>
        <label className={css({ display: "block", marginBottom: "8px", fontWeight: "bold" })}>
          Number of LLM Requests: {requestCount}
        </label>
        <input
          type="range"
          min="1"
          max="100"
          value={requestCount}
          onChange={(e) => setRequestCount(parseInt(e.target.value))}
          className={css({ width: "100%" })}
        />
      </div>

      <div
        className={css({
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "16px",
        })}
      >
        <div
          className={css({
            padding: "16px",
            backgroundColor: "#fef2f2",
            borderRadius: "8px",
            border: "1px solid #fecaca",
          })}
        >
          <div className={css({ fontSize: "14px", color: "#991b1b", fontWeight: "bold" })}>Individual Transactions</div>
          <div className={css({ fontSize: "24px", fontWeight: "bold", color: "#dc2626" })}>${individualCost}</div>
          <div className={css({ fontSize: "12px", color: "#6b7280" })}>{requestCount} × $15</div>
        </div>

        <div
          className={css({
            padding: "16px",
            backgroundColor: "#f0f9ff",
            borderRadius: "8px",
            border: "1px solid #bfdbfe",
          })}
        >
          <div className={css({ fontSize: "14px", color: "#1d4ed8", fontWeight: "bold" })}>Batch Registration</div>
          <div className={css({ fontSize: "24px", fontWeight: "bold", color: "#2563eb" })}>${batchCost}</div>
          <div className={css({ fontSize: "12px", color: "#6b7280" })}>One-time</div>
        </div>

        <div
          className={css({
            padding: "16px",
            backgroundColor: "#ecfdf5",
            borderRadius: "8px",
            border: "1px solid #bbf7d0",
          })}
        >
          <div className={css({ fontSize: "14px", color: "#166534", fontWeight: "bold" })}>Processing Costs</div>
          <div className={css({ fontSize: "24px", fontWeight: "bold", color: "#16a34a" })}>${processingCost}</div>
          <div className={css({ fontSize: "12px", color: "#6b7280" })}>{requestCount} × $2</div>
        </div>

        <div
          className={css({
            padding: "16px",
            backgroundColor: "#f0fdf4",
            borderRadius: "8px",
            border: "1px solid #bbf7d0",
          })}
        >
          <div className={css({ fontSize: "14px", color: "#166534", fontWeight: "bold" })}>Savings</div>
          <div className={css({ fontSize: "24px", fontWeight: "bold", color: "#16a34a" })}>{savings}%</div>
          <div className={css({ fontSize: "12px", color: "#6b7280" })}>${individualCost - totalBatchCost} saved</div>
        </div>
      </div>
    </div>
  );
};

// Mock Smart Contract Interaction
const SmartContractDemo: React.FC = () => {
  const [contractState, setContractState] = useState({
    merkleRoot: "",
    batchSize: 0,
    claimed: 0,
    isRegistered: false,
  });

  const mockContractCall = async (action: string) => {
    // Simulate async contract interaction
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (action === "register") {
      setContractState({
        merkleRoot: "0x7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c...",
        batchSize: 5,
        claimed: 0,
        isRegistered: true,
      });
    } else if (action === "claim") {
      setContractState((prev) => ({
        ...prev,
        claimed: prev.claimed + 1,
      }));
    }
  };

  return (
    <div
      className={css({
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "20px",
        margin: "20px 0",
        backgroundColor: "#1f2937",
        color: "#f9fafb",
      })}
    >
      <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#fff" })}>
        🔗 Smart Contract Demo
      </h3>

      <div
        className={css({
          backgroundColor: "#111827",
          padding: "16px",
          borderRadius: "6px",
          fontFamily: "monospace",
          fontSize: "14px",
          marginBottom: "16px",
        })}
      >
        <div className={css({ color: "#10b981" })}>// Mock Smart Contract State</div>
        <div>merkleRoot: "{contractState.merkleRoot || "Not set"}"</div>
        <div>batchSize: {contractState.batchSize}</div>
        <div>claimed: {contractState.claimed}</div>
        <div>isRegistered: {contractState.isRegistered.toString()}</div>
      </div>

      <div className={css({ display: "flex", gap: "8px", flexWrap: "wrap" })}>
        <button
          onClick={() => mockContractCall("register")}
          disabled={contractState.isRegistered}
          className={css({
            padding: "8px 16px",
            backgroundColor: contractState.isRegistered ? "#374151" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: contractState.isRegistered ? "not-allowed" : "pointer",
            "&:hover": {
              backgroundColor: contractState.isRegistered ? "#374151" : "#2563eb",
            },
          })}
        >
          {contractState.isRegistered ? "Already Registered" : "Register Batch"}
        </button>

        <button
          onClick={() => mockContractCall("claim")}
          disabled={!contractState.isRegistered || contractState.claimed >= contractState.batchSize}
          className={css({
            padding: "8px 16px",
            backgroundColor:
              !contractState.isRegistered || contractState.claimed >= contractState.batchSize ? "#374151" : "#10b981",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor:
              !contractState.isRegistered || contractState.claimed >= contractState.batchSize
                ? "not-allowed"
                : "pointer",
            "&:hover": {
              backgroundColor:
                !contractState.isRegistered || contractState.claimed >= contractState.batchSize ? "#374151" : "#059669",
            },
          })}
        >
          Process LLM Request
        </button>
      </div>
    </div>
  );
};

// Main Blog Post Component
export default function MerkleAIBatching() {
  return (
    <article className={css({ maxWidth: "800px", margin: "0 auto", padding: "20px" })}>
      <section className={css({ marginBottom: "32px" })}>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          The integration of Large Language Models (LLMs) into my website is an exciting possibility. But one problem
          remains: How can I reduce the blockchain transaction costs when users need multiple LLM API calls in an
          application? One possible answer lies in an elegant data structure: <strong>Merkle Trees</strong>.
        </p>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          The Problem: High Gas Costs for Individual LLM Payments
        </h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Imagine a dApp wants to process 10 different LLM API requests for its users. With the traditional approach,
          each LLM payment would require a separate blockchain transaction:
        </p>

        <div
          className={css({
            backgroundColor: "#f3f4f6",
            padding: "16px",
            borderRadius: "8px",
            fontFamily: "monospace",
            marginBottom: "16px",
          })}
        >
          <div>Individual Transactions:</div>
          <div>- LLM Request #1: ~$15 Gas Costs</div>
          <div>- LLM Request #2: ~$15 Gas Costs</div>
          <div>- LLM Request #3: ~$15 Gas Costs</div>
          <div>...</div>
          <div>
            <strong>Total: ~$150 for 10 LLM Requests</strong>
          </div>
        </div>

        <p className={css({ lineHeight: "1.6" })}>
          This is not only expensive, but also inefficient for the network and makes AI services unaffordable.
        </p>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          The Solution: Merkle Tree Batching for LLM Payments
        </h2>

        <div
          className={css({
            backgroundColor: "#f8fafc",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            marginBottom: "20px",
          })}
        >
          <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "12px", color: "#1e293b" })}>
            📊 How Merkle Trees Work
          </h3>
          <p className={css({ marginBottom: "12px", lineHeight: "1.6" })}>
            A Merkle tree is a binary tree structure where each leaf represents a data element (in our case, an LLM
            request), and each parent node contains a cryptographic hash of its children. The mathematical foundation
            is:
          </p>
          <div
            className={css({
              fontFamily: "monospace",
              backgroundColor: "#fff",
              padding: "12px",
              borderRadius: "4px",
              fontSize: "14px",
              lineHeight: "1.4",
            })}
          >
            <div>
              <strong>For requests R₁, R₂, R₃, R₄:</strong>
            </div>
            <div>H₁ = hash(R₁), H₂ = hash(R₂), H₃ = hash(R₃), H₄ = hash(R₄)</div>
            <div>H₁₂ = hash(H₁ + H₂), H₃₄ = hash(H₃ + H₄)</div>
            <div>
              <strong>Root = hash(H₁₂ + H₃₄)</strong>
            </div>
          </div>
          <p className={css({ marginTop: "12px", lineHeight: "1.6" })}>
            This single root hash can represent an entire batch of requests, enabling us to register thousands of LLM
            requests with just one blockchain transaction while maintaining cryptographic proof of each individual
            request.
          </p>
        </div>

        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          With Merkle Trees, we can bundle multiple LLM API payments into a single blockchain transaction. Try it in the
          interactive demo:
        </p>

        <BatchCreator />

        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          <strong>Cost:</strong> Only ~$15 for the entire batch + $2 per LLM request instead of $150!
        </p>
      </section>
    </article>
  );
}
